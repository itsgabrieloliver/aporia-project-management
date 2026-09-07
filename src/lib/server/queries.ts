/**
 * Read and write queries for the workspace. Every route load goes through this
 * module so the shapes handed to Svelte components stay stable and _id never
 * crosses the SSR boundary.
 */
import { randomUUID } from 'node:crypto';
import { collections, plainAll } from './db';
import { CACHE_TTL_SECONDS, cached, enqueue, invalidate, keys } from './redis';
import type {
	ActivityEvent,
	Comment,
	Cycle,
	Issue,
	IssuePriority,
	IssueStatus,
	Label,
	Project,
	Release,
	SessionUser,
	User
} from '$lib/types';

/** Team member shape safe for the client (no password hash). */
export type Member = Omit<User, 'passwordHash'>;

function stripUser(user: User): Member {
	const { passwordHash, ...rest } = user;
	void passwordHash;
	return rest;
}

export async function listMembers(): Promise<Member[]> {
	const users = await collections.users();
	const docs = await users.find({}, { projection: { _id: 0, passwordHash: 0 } }).toArray();
	return (docs as unknown as User[]).map(stripUser).sort((a, b) => a.name.localeCompare(b.name));
}

export async function listLabels(): Promise<Label[]> {
	const labels = await collections.labels();
	return plainAll<Label>((await labels.find({}, { projection: { _id: 0 } }).toArray()) as Label[]);
}

export async function listProjects(): Promise<Project[]> {
	const projects = await collections.projects();
	const docs = (await projects
		.find({}, { projection: { _id: 0 } })
		.sort({ updatedAt: -1 })
		.toArray()) as Project[];
	return plainAll<Project>(docs);
}

export interface IssueFilter {
	status?: IssueStatus;
	projectId?: string;
	assigneeId?: string;
	limit?: number;
}

export async function listIssues(filter: IssueFilter = {}): Promise<Issue[]> {
	const issues = await collections.issues();
	const query: Record<string, unknown> = {};
	if (filter.status) query.status = filter.status;
	if (filter.projectId) query.projectId = filter.projectId;
	if (filter.assigneeId) query.assigneeId = filter.assigneeId;
	const docs = (await issues
		.find(query, { projection: { _id: 0 } })
		.sort({ updatedAt: -1 })
		.limit(filter.limit ?? 500)
		.toArray()) as Issue[];
	return plainAll<Issue>(docs);
}

export async function listReleases(): Promise<Release[]> {
	const releases = await collections.releases();
	const docs = (await releases
		.find({}, { projection: { _id: 0 } })
		.sort({ targetDate: 1 })
		.toArray()) as Release[];
	return plainAll<Release>(docs);
}

export async function listActivity(limit = 12): Promise<ActivityEvent[]> {
	const activity = await collections.activity();
	const docs = (await activity
		.find({}, { projection: { _id: 0 } })
		.sort({ at: -1 })
		.limit(limit)
		.toArray()) as ActivityEvent[];
	return plainAll<ActivityEvent>(docs);
}

export async function listComments(issueId: string): Promise<Comment[]> {
	const comments = await collections.comments();
	const docs = (await comments
		.find({ issueId }, { projection: { _id: 0 } })
		.sort({ createdAt: -1 })
		.toArray()) as Comment[];
	return plainAll<Comment>(docs);
}

export async function countsByStatus(): Promise<Record<IssueStatus, number>> {
	const issues = await collections.issues();
	const rows = await issues
		.aggregate<{ _id: IssueStatus; n: number }>([{ $group: { _id: '$status', n: { $sum: 1 } } }])
		.toArray();
	const base: Record<IssueStatus, number> = {
		backlog: 0,
		todo: 0,
		in_progress: 0,
		in_review: 0,
		done: 0,
		canceled: 0
	};
	for (const row of rows) {
		if (row._id in base) base[row._id] = row.n;
	}
	return base;
}

export function currentCycle(): Cycle {
	const now = new Date();
	const start = new Date(now.getTime() - 10 * 86400000);
	const end = new Date(now.getTime() + 4 * 86400000);
	return {
		number: 14,
		name: 'Cycle 14',
		startsAt: start.toISOString().slice(0, 10),
		endsAt: end.toISOString().slice(0, 10),
		scope: 0,
		completed: 0,
		started: 0
	};
}

export interface DashboardData {
	counts: Record<IssueStatus, number>;
	cycle: Cycle;
	activity: ActivityEvent[];
	projects: Project[];
	releases: Release[];
	assigned: Issue[];
	members: Member[];
	totalIssues: number;
}

/** Dashboard aggregates, cached in Redis for a short window per user. */
export async function dashboard(user: SessionUser): Promise<DashboardData> {
	return cached(keys.dashboardCache(user.id), CACHE_TTL_SECONDS, async () => {
		const [counts, activity, projects, releases, assigned, members, cycleIssues] =
			await Promise.all([
				countsByStatus(),
				listActivity(8),
				listProjects(),
				listReleases(),
				listIssues({ assigneeId: user.id, limit: 8 }),
				listMembers(),
				listIssues({ limit: 500 })
			]);

		const inCycle = cycleIssues.filter((i) => i.cycle === 14);
		const cycle = currentCycle();
		cycle.scope = inCycle.length;
		cycle.completed = inCycle.filter((i) => i.status === 'done').length;
		cycle.started = inCycle.filter(
			(i) => i.status === 'in_progress' || i.status === 'in_review'
		).length;

		const totalIssues = Object.values(counts).reduce((a, b) => a + b, 0);

		return { counts, cycle, activity, projects, releases, assigned, members, totalIssues };
	});
}

/* ------------------------------------------------------------------- inbox */

export type InboxKind = 'comment' | 'review' | 'assignment' | 'release';

export interface InboxItem {
	id: string;
	kind: InboxKind;
	actorId: Id;
	issueKey: string;
	issueTitle: string;
	status: IssueStatus;
	body: string;
	at: string;
}

/**
 * Builds the notification feed for one user: comments on issues they touch,
 * reviews waiting on them and issues assigned to them by someone else.
 */
export async function inboxFor(user: SessionUser): Promise<InboxItem[]> {
	const [issues, comments] = await Promise.all([listIssues({ limit: 500 }), listAllComments()]);
	const byId = new Map(issues.map((issue) => [issue.id, issue]));
	const items: InboxItem[] = [];

	for (const comment of comments) {
		const issue = byId.get(comment.issueId);
		if (!issue) continue;
		if (comment.authorId === user.id) continue;
		if (issue.assigneeId !== user.id && issue.creatorId !== user.id) continue;
		items.push({
			id: `c_${comment.id}`,
			kind: 'comment',
			actorId: comment.authorId,
			issueKey: issue.key,
			issueTitle: issue.title,
			status: issue.status,
			body: comment.body,
			at: comment.createdAt
		});
	}

	for (const issue of issues) {
		if (issue.status === 'in_review' && issue.creatorId === user.id && issue.assigneeId) {
			items.push({
				id: `r_${issue.id}`,
				kind: 'review',
				actorId: issue.assigneeId,
				issueKey: issue.key,
				issueTitle: issue.title,
				status: issue.status,
				body: 'Moved this into review and is waiting on your read of the change.',
				at: issue.updatedAt
			});
		}
		if (issue.assigneeId === user.id && issue.creatorId !== user.id) {
			items.push({
				id: `a_${issue.id}`,
				kind: 'assignment',
				actorId: issue.creatorId,
				issueKey: issue.key,
				issueTitle: issue.title,
				status: issue.status,
				body: 'Assigned this to you.',
				at: issue.updatedAt
			});
		}
	}

	return items.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 25);
}

async function listAllComments(): Promise<Comment[]> {
	const comments = await collections.comments();
	const docs = (await comments
		.find({}, { projection: { _id: 0 } })
		.sort({ createdAt: -1 })
		.limit(200)
		.toArray()) as Comment[];
	return plainAll<Comment>(docs);
}

export async function bustDashboardCaches() {
	const members = await listMembers();
	await Promise.all(members.map((m) => invalidate(keys.dashboardCache(m.id))));
}

/* ---------------------------------------------------------------- mutations */

async function nextIssueKey(): Promise<string> {
	const issues = await collections.issues();
	const latest = (await issues
		.find({}, { projection: { _id: 0, key: 1 } })
		.sort({ key: -1 })
		.limit(1)
		.toArray()) as { key: string }[];
	const highest = latest[0]?.key?.match(/(\d+)$/);
	const next = highest ? Number(highest[1]) + 1 : 101;
	return `APO-${next}`;
}

export interface CreateIssueInput {
	title: string;
	description?: string;
	status?: IssueStatus;
	priority?: IssuePriority;
	assigneeId?: string | null;
	projectId?: string | null;
	labelIds?: string[];
	estimate?: number | null;
}

export async function createIssue(actor: SessionUser, input: CreateIssueInput): Promise<Issue> {
	const issues = await collections.issues();
	const now = new Date().toISOString();
	const issue: Issue = {
		id: randomUUID(),
		key: await nextIssueKey(),
		title: input.title.trim(),
		description: (input.description ?? '').trim(),
		status: input.status ?? 'backlog',
		priority: input.priority ?? 'none',
		assigneeId: input.assigneeId || null,
		creatorId: actor.id,
		projectId: input.projectId || null,
		releaseId: null,
		labelIds: input.labelIds ?? [],
		estimate: input.estimate ?? null,
		cycle: input.status === 'in_progress' ? 14 : null,
		createdAt: now,
		updatedAt: now
	};
	await issues.insertOne({ ...issue });
	await refreshProjectCounts(issue.projectId);
	await recordActivity(actor.id, 'opened', issue.key, issue.title);
	await bustDashboardCaches();
	return issue;
}

export async function updateIssueStatus(
	actor: SessionUser,
	issueId: string,
	status: IssueStatus
): Promise<Issue | null> {
	const issues = await collections.issues();
	const result = await issues.findOneAndUpdate(
		{ id: issueId },
		{ $set: { status, updatedAt: new Date().toISOString() } },
		{ returnDocument: 'after', projection: { _id: 0 } }
	);
	const issue = result as unknown as Issue | null;
	if (!issue) return null;
	await refreshProjectCounts(issue.projectId);
	await recordActivity(actor.id, `moved to ${status.replace('_', ' ')}`, issue.key, issue.title);
	await bustDashboardCaches();
	return issue;
}

export async function updateIssueAssignee(
	actor: SessionUser,
	issueId: string,
	assigneeId: string | null
): Promise<void> {
	const issues = await collections.issues();
	const result = await issues.findOneAndUpdate(
		{ id: issueId },
		{ $set: { assigneeId, updatedAt: new Date().toISOString() } },
		{ returnDocument: 'after', projection: { _id: 0 } }
	);
	const issue = result as unknown as Issue | null;
	if (!issue) return;
	await recordActivity(actor.id, 'reassigned', issue.key, issue.title);
	await bustDashboardCaches();
}

export interface CreateProjectInput {
	name: string;
	key: string;
	summary?: string;
	status?: Project['status'];
	leadId?: string;
	targetDate?: string | null;
}

export async function createProject(
	actor: SessionUser,
	input: CreateProjectInput
): Promise<Project> {
	const projects = await collections.projects();
	const now = new Date().toISOString();
	const project: Project = {
		id: randomUUID(),
		key: input.key.trim().toUpperCase().slice(0, 6),
		name: input.name.trim(),
		summary: (input.summary ?? '').trim(),
		status: input.status ?? 'planned',
		leadId: input.leadId || actor.id,
		memberIds: [input.leadId || actor.id],
		startDate: input.status === 'in_progress' ? now.slice(0, 10) : null,
		targetDate: input.targetDate || null,
		issueCount: 0,
		completedCount: 0,
		createdAt: now,
		updatedAt: now
	};
	await projects.insertOne({ ...project });
	await recordActivity(actor.id, 'created project', project.key, project.name);
	await bustDashboardCaches();
	return project;
}

export async function refreshProjectCounts(projectId: string | null) {
	if (!projectId) return;
	const issues = await collections.issues();
	const projects = await collections.projects();
	const [total, done] = await Promise.all([
		issues.countDocuments({ projectId }),
		issues.countDocuments({ projectId, status: 'done' })
	]);
	await projects.updateOne(
		{ id: projectId },
		{ $set: { issueCount: total, completedCount: done, updatedAt: new Date().toISOString() } }
	);
}

/**
 * Writes the activity row and pushes a fan-out job onto the Redis queue for
 * notifications and digests to pick up.
 */
export async function recordActivity(
	actorId: string,
	verb: string,
	targetKey: string,
	targetTitle: string
) {
	const activity = await collections.activity();
	const event: ActivityEvent = {
		id: randomUUID(),
		actorId,
		verb,
		targetKey,
		targetTitle,
		at: new Date().toISOString()
	};
	await activity.insertOne({ ...event });
	await enqueue('activity-fanout', { ...event });
}
