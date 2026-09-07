/**
 * Workspace seeding.
 *
 * Runs once per process against whichever data backend is active (MongoDB or
 * the in-memory fallback) so the app always has real content: a demo account,
 * teammates, labels, projects, issues, releases, comments and activity.
 *
 * The demo account exists so the workspace can be explored immediately; its
 * password comes from DEMO_PASSWORD when set, otherwise a documented default.
 */
import { randomUUID } from 'node:crypto';
import { env } from '$env/dynamic/private';
import { collections, onceSeeded } from './db';
import { hashPassword, colorFor, initialsFor } from './auth';
import type { Issue, Label, Project, Release, User } from '$lib/types';

const DAY = 86400000;

/** Credentials shown as a hint on the sign in page. */
export const DEMO_ACCOUNT = {
	email: env.DEMO_EMAIL || 'demo@aporia.dev',
	password: env.DEMO_PASSWORD || 'aporia-demo',
	name: 'Avery Quinn'
};

function iso(offsetDays: number): string {
	return new Date(Date.now() + offsetDays * DAY).toISOString();
}

function date(offsetDays: number): string {
	return new Date(Date.now() + offsetDays * DAY).toISOString().slice(0, 10);
}

const LABELS: Label[] = [
	{ id: 'l_bug', name: 'bug', colorToken: 'var(--label-bug)' },
	{ id: 'l_feature', name: 'feature', colorToken: 'var(--label-feature)' },
	{ id: 'l_infra', name: 'infra', colorToken: 'var(--label-infra)' },
	{ id: 'l_design', name: 'design', colorToken: 'var(--label-design)' },
	{ id: 'l_docs', name: 'docs', colorToken: 'var(--label-docs)' },
	{ id: 'l_perf', name: 'performance', colorToken: 'var(--label-perf)' }
];

const TEAMMATES = [
	{ name: 'Nadia Reyes', email: 'nadia@aporia.dev' },
	{ name: 'Ilya Novak', email: 'ilya@aporia.dev' },
	{ name: 'Mei Tanaka', email: 'mei@aporia.dev' },
	{ name: 'Samir Haddad', email: 'samir@aporia.dev' }
];

/** True when the workspace has no projects yet. */
export async function isWorkspaceEmpty(): Promise<boolean> {
	const projects = await collections.projects();
	return (await projects.countDocuments({}, { limit: 1 })) === 0;
}

async function upsertUser(input: {
	email: string;
	name: string;
	password: string;
	role: 'admin' | 'member';
	createdAt: string;
}): Promise<User> {
	const users = await collections.users();
	const existing = (await users.findOne({ email: input.email })) as User | null;
	if (existing) return existing;
	const user: User = {
		id: randomUUID(),
		email: input.email,
		name: input.name,
		handle: input.email.split('@')[0],
		role: input.role,
		initials: initialsFor(input.name),
		avatarColor: colorFor(input.email),
		passwordHash: await hashPassword(input.password),
		theme: 'dark',
		createdAt: input.createdAt
	};
	await users.insertOne({ ...user });
	return user;
}

/** Creates the demo account if it is missing and returns it. */
export async function ensureDemoUser(): Promise<User> {
	return upsertUser({
		email: DEMO_ACCOUNT.email,
		name: DEMO_ACCOUNT.name,
		password: DEMO_ACCOUNT.password,
		role: 'admin',
		createdAt: iso(-120)
	});
}

async function ensureTeammates(): Promise<User[]> {
	const created: User[] = [];
	for (const person of TEAMMATES) {
		created.push(
			await upsertUser({
				email: person.email,
				name: person.name,
				password: randomUUID(),
				role: 'member',
				createdAt: iso(-90)
			})
		);
	}
	return created;
}

/**
 * Seeds the workspace. Safe to call on every load: it resolves once per
 * process and exits early when any project already exists.
 *
 * @param ownerId lead for the owner-held projects; defaults to the demo user.
 */
export async function seedWorkspace(ownerId?: string): Promise<boolean> {
	let seeded = false;
	await onceSeeded(async () => {
		const demo = await ensureDemoUser();
		await ensureTeammates();
		seeded = await populate(ownerId ?? demo.id);
	});
	if (!ownerId) return seeded;
	return seeded;
}

async function populate(ownerId: string): Promise<boolean> {
	if (!(await isWorkspaceEmpty())) return false;

	const team = await ensureTeammates();
	const [nadia, ilya, mei, samir] = team;

	const labels = await collections.labels();
	for (const label of LABELS) {
		await labels.updateOne({ id: label.id }, { $set: label }, { upsert: true });
	}

	const projectDefs: Project[] = [
		{
			id: randomUUID(),
			key: 'CORE',
			name: 'Issue graph rewrite',
			summary:
				'Replace the flat issue table with a relation graph so blockers, duplicates and sub-issues resolve in one query.',
			status: 'in_progress',
			leadId: ownerId,
			memberIds: [ownerId, nadia.id, samir.id],
			startDate: date(-40),
			targetDate: date(30),
			issueCount: 0,
			completedCount: 0,
			createdAt: iso(-47),
			updatedAt: iso(-1)
		},
		{
			id: randomUUID(),
			key: 'SYNC',
			name: 'Realtime sync engine',
			summary:
				'Local-first document store with an operation log over websockets, so two people editing one issue never clobber each other.',
			status: 'in_progress',
			leadId: nadia.id,
			memberIds: [nadia.id, ilya.id],
			startDate: date(-26),
			targetDate: date(52),
			issueCount: 0,
			completedCount: 0,
			createdAt: iso(-33),
			updatedAt: iso(-1)
		},
		{
			id: randomUUID(),
			key: 'PAL',
			name: 'Command palette v2',
			summary:
				'Fuzzy command index over issues, projects and releases with keyboard-only issue creation and recent-action ranking.',
			status: 'planned',
			leadId: mei.id,
			memberIds: [mei.id, ownerId],
			startDate: null,
			targetDate: date(74),
			issueCount: 0,
			completedCount: 0,
			createdAt: iso(-17),
			updatedAt: iso(-2)
		},
		{
			id: randomUUID(),
			key: 'OBS',
			name: 'Queue observability',
			summary:
				'Dashboards and alerting for the Redis worker queues: depth, retry rate, dead letters and per-job latency.',
			status: 'paused',
			leadId: samir.id,
			memberIds: [samir.id, ilya.id],
			startDate: date(-61),
			targetDate: date(11),
			issueCount: 0,
			completedCount: 0,
			createdAt: iso(-68),
			updatedAt: iso(-15)
		},
		{
			id: randomUUID(),
			key: 'API',
			name: 'Public REST and webhooks',
			summary:
				'Documented API keys, cursor pagination and signed webhooks so teams can drive Aporia from CI.',
			status: 'completed',
			leadId: ilya.id,
			memberIds: [ilya.id, ownerId, mei.id],
			startDate: date(-145),
			targetDate: date(-29),
			issueCount: 0,
			completedCount: 0,
			createdAt: iso(-152),
			updatedAt: iso(-29)
		}
	];

	const [core, sync, pal, obs, api] = projectDefs;

	const releaseDefs: Release[] = [
		{
			id: randomUUID(),
			version: '0.9.0',
			name: 'Relation graph beta',
			status: 'code_freeze',
			targetDate: date(8),
			shippedAt: null,
			ownerId,
			issueIds: [],
			changelog: [
				'Sub-issues and blocking relations resolve in a single traversal.',
				'Issue search now indexes description bodies.',
				'Bulk status change from the board keeps keyboard focus in place.'
			]
		},
		{
			id: randomUUID(),
			version: '0.10.0',
			name: 'Realtime cursors',
			status: 'in_development',
			targetDate: date(36),
			shippedAt: null,
			ownerId: nadia.id,
			issueIds: [],
			changelog: [
				'Presence indicators on issues and projects.',
				'Offline edits replay from the local operation log on reconnect.'
			]
		},
		{
			id: randomUUID(),
			version: '0.11.0',
			name: 'Palette and shortcuts',
			status: 'planned',
			targetDate: date(78),
			shippedAt: null,
			ownerId: mei.id,
			issueIds: [],
			changelog: ['Command palette rewrite with recent-action ranking.']
		},
		{
			id: randomUUID(),
			version: '0.8.2',
			name: 'Queue hardening',
			status: 'shipped',
			targetDate: date(-18),
			shippedAt: iso(-18),
			ownerId: samir.id,
			issueIds: [],
			changelog: [
				'Dead-letter queue with a replay action for failed jobs.',
				'Session cache reads fall back to MongoDB when Redis is unreachable.',
				'Notification digests batch per workspace instead of per issue.'
			]
		}
	];

	const [rGraph, rCursors, rPalette, rQueue] = releaseDefs;

	type IssueSeed = Omit<Issue, 'id' | 'key' | 'createdAt' | 'updatedAt'> & {
		ageDays: number;
		touchedDays: number;
	};

	const issueSeeds: IssueSeed[] = [
		{
			title: 'Resolve sub-issue depth without N+1 lookups',
			description:
				'The graph traversal issues one query per level. Collapse it into a single aggregation with $graphLookup and cache the result per issue in Redis.',
			status: 'in_progress',
			priority: 'urgent',
			assigneeId: ownerId,
			creatorId: ownerId,
			projectId: core.id,
			releaseId: rGraph.id,
			labelIds: ['l_perf', 'l_infra'],
			estimate: 5,
			cycle: 14,
			ageDays: -11,
			touchedDays: -1
		},
		{
			title: 'Replay offline operation log on reconnect',
			description:
				'Queued operations must apply in author order and skip operations already acknowledged by the server.',
			status: 'in_progress',
			priority: 'high',
			assigneeId: nadia.id,
			creatorId: nadia.id,
			projectId: sync.id,
			releaseId: rCursors.id,
			labelIds: ['l_feature'],
			estimate: 8,
			cycle: 14,
			ageDays: -9,
			touchedDays: -1
		},
		{
			title: 'Board drag drops the issue on rapid status change',
			description:
				'Dragging a card twice inside 200ms sends both mutations with the same version, and the second write is rejected silently.',
			status: 'in_review',
			priority: 'urgent',
			assigneeId: samir.id,
			creatorId: mei.id,
			projectId: core.id,
			releaseId: rGraph.id,
			labelIds: ['l_bug'],
			estimate: 3,
			cycle: 14,
			ageDays: -14,
			touchedDays: -2
		},
		{
			title: 'Dead-letter replay action for failed jobs',
			description:
				'Operators need a one-click replay for jobs that exhausted retries, with the failure reason kept on the job record.',
			status: 'done',
			priority: 'medium',
			assigneeId: samir.id,
			creatorId: samir.id,
			projectId: obs.id,
			releaseId: rQueue.id,
			labelIds: ['l_infra'],
			estimate: 3,
			cycle: 13,
			ageDays: -32,
			touchedDays: -18
		},
		{
			title: 'Presence avatars flicker on route change',
			description:
				'The websocket disconnects during client navigation, so presence drops and re-joins on every route change.',
			status: 'todo',
			priority: 'medium',
			assigneeId: ilya.id,
			creatorId: nadia.id,
			projectId: sync.id,
			releaseId: rCursors.id,
			labelIds: ['l_bug', 'l_design'],
			estimate: 2,
			cycle: 14,
			ageDays: -5,
			touchedDays: -2
		},
		{
			title: 'Rank palette results by recent actions',
			description:
				'Score each command by last use and frequency, held in a Redis sorted set per user, and blend it with the fuzzy match score.',
			status: 'todo',
			priority: 'high',
			assigneeId: mei.id,
			creatorId: ownerId,
			projectId: pal.id,
			releaseId: rPalette.id,
			labelIds: ['l_feature', 'l_perf'],
			estimate: 5,
			cycle: 15,
			ageDays: -3,
			touchedDays: -1
		},
		{
			title: 'Index issue descriptions for full text search',
			description:
				'Add a text index across title and description and expose a relevance-sorted search endpoint.',
			status: 'done',
			priority: 'high',
			assigneeId: ownerId,
			creatorId: ilya.id,
			projectId: core.id,
			releaseId: rGraph.id,
			labelIds: ['l_feature'],
			estimate: 3,
			cycle: 13,
			ageDays: -19,
			touchedDays: -4
		},
		{
			title: 'Keyboard shortcut sheet is missing new bindings',
			description:
				'Document the new board bindings and generate the sheet from the shortcut registry.',
			status: 'backlog',
			priority: 'low',
			assigneeId: null,
			creatorId: mei.id,
			projectId: pal.id,
			releaseId: null,
			labelIds: ['l_docs'],
			estimate: 1,
			cycle: null,
			ageDays: -2,
			touchedDays: -2
		},
		{
			title: 'Conflict banner when two edits diverge',
			description:
				'Show the competing version inline with a keep-mine or keep-theirs choice instead of a toast that disappears.',
			status: 'backlog',
			priority: 'medium',
			assigneeId: nadia.id,
			creatorId: nadia.id,
			projectId: sync.id,
			releaseId: rCursors.id,
			labelIds: ['l_design', 'l_feature'],
			estimate: 5,
			cycle: 15,
			ageDays: -4,
			touchedDays: -3
		},
		{
			title: 'Session lookups fall back to MongoDB when Redis is down',
			description:
				'Sessions are authoritative in MongoDB and cached in Redis. A cache miss or connection error must degrade, not sign the user out.',
			status: 'done',
			priority: 'urgent',
			assigneeId: ilya.id,
			creatorId: ownerId,
			projectId: obs.id,
			releaseId: rQueue.id,
			labelIds: ['l_infra'],
			estimate: 5,
			cycle: 13,
			ageDays: -38,
			touchedDays: -20
		},
		{
			title: 'Bulk status change keeps focus on the selected rows',
			description:
				'After a bulk mutation the list re-renders and focus jumps to the top. Preserve the selection and the focused row key.',
			status: 'in_review',
			priority: 'low',
			assigneeId: mei.id,
			creatorId: samir.id,
			projectId: core.id,
			releaseId: rGraph.id,
			labelIds: ['l_design'],
			estimate: 2,
			cycle: 14,
			ageDays: -12,
			touchedDays: -2
		},
		{
			title: 'Create an issue from the palette without leaving the page',
			description:
				'Typing a title after the create command should post the issue and show an undo affordance in place.',
			status: 'backlog',
			priority: 'high',
			assigneeId: null,
			creatorId: ownerId,
			projectId: pal.id,
			releaseId: rPalette.id,
			labelIds: ['l_feature'],
			estimate: 3,
			cycle: null,
			ageDays: -1,
			touchedDays: -1
		},
		{
			title: 'Webhook signatures rotate without downtime',
			description: 'Accept two active signing secrets during a rotation window.',
			status: 'canceled',
			priority: 'none',
			assigneeId: ilya.id,
			creatorId: ilya.id,
			projectId: api.id,
			releaseId: null,
			labelIds: ['l_infra', 'l_docs'],
			estimate: 2,
			cycle: null,
			ageDays: -58,
			touchedDays: -44
		},
		{
			title: 'Cycle burndown chart reads the wrong week boundary',
			description:
				'The chart buckets by ISO week but the cycle starts on Wednesday, so day one is empty.',
			status: 'todo',
			priority: 'medium',
			assigneeId: samir.id,
			creatorId: nadia.id,
			projectId: obs.id,
			releaseId: null,
			labelIds: ['l_bug'],
			estimate: 2,
			cycle: 14,
			ageDays: -3,
			touchedDays: -2
		}
	];

	const issues: Issue[] = issueSeeds.map((seed, index) => {
		const { ageDays, touchedDays, ...rest } = seed;
		return {
			...rest,
			id: randomUUID(),
			key: `APO-${109 + index * 2}`,
			createdAt: iso(ageDays),
			updatedAt: iso(touchedDays)
		};
	});

	for (const issue of issues) {
		if (!issue.releaseId) continue;
		const release = releaseDefs.find((r) => r.id === issue.releaseId);
		release?.issueIds.push(issue.id);
	}

	for (const project of projectDefs) {
		const own = issues.filter((i) => i.projectId === project.id);
		project.issueCount = own.length;
		project.completedCount = own.filter((i) => i.status === 'done').length;
	}

	const projectsCol = await collections.projects();
	const releasesCol = await collections.releases();
	const issuesCol = await collections.issues();
	const activityCol = await collections.activity();
	const commentsCol = await collections.comments();

	await projectsCol.insertMany(projectDefs.map((p) => ({ ...p })));
	await releasesCol.insertMany(releaseDefs.map((r) => ({ ...r })));
	await issuesCol.insertMany(issues.map((i) => ({ ...i })));

	await commentsCol.insertMany([
		{
			id: randomUUID(),
			issueId: issues[0].id,
			authorId: nadia.id,
			body: 'The aggregation works, but depth above six blows the 16MB document limit. Cap it and paginate.',
			createdAt: iso(-1)
		},
		{
			id: randomUUID(),
			issueId: issues[2].id,
			authorId: mei.id,
			body: 'Reproduced on a trackpad with a fast double drag. The version check needs to be optimistic, not silent.',
			createdAt: iso(-2)
		}
	]);

	await activityCol.insertMany([
		{
			id: randomUUID(),
			actorId: nadia.id,
			verb: 'commented on',
			targetKey: issues[0].key,
			targetTitle: issues[0].title,
			at: iso(-1)
		},
		{
			id: randomUUID(),
			actorId: ownerId,
			verb: 'moved to in progress',
			targetKey: issues[1].key,
			targetTitle: issues[1].title,
			at: iso(-1)
		},
		{
			id: randomUUID(),
			actorId: mei.id,
			verb: 'opened',
			targetKey: issues[7].key,
			targetTitle: issues[7].title,
			at: iso(-2)
		},
		{
			id: randomUUID(),
			actorId: samir.id,
			verb: 'requested review on',
			targetKey: issues[2].key,
			targetTitle: issues[2].title,
			at: iso(-2)
		},
		{
			id: randomUUID(),
			actorId: ilya.id,
			verb: 'shipped release',
			targetKey: rQueue.version,
			targetTitle: rQueue.name,
			at: iso(-18)
		}
	]);

	console.info(
		`[aporia] seeded workspace: ${projectDefs.length} projects, ${issues.length} issues, ${releaseDefs.length} releases.`
	);
	return true;
}
