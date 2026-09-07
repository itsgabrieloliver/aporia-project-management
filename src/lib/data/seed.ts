/**
 * In-memory sample workspace. This module is the single source of placeholder
 * content until the MongoDB layer in $lib/server/db.ts is wired up; every route
 * reads from here through plain functions so swapping in real queries is local.
 */
import type {
	ActivityEvent,
	Comment,
	Cycle,
	Issue,
	IssueStatus,
	Label,
	Project,
	Release,
	User
} from '$lib/types';

export const users: User[] = [
	{
		id: 'u_1',
		email: 'gabriel@aporia.dev',
		name: 'Gabriel Oliver',
		handle: 'gabriel',
		role: 'admin',
		initials: 'GO',
		avatarColor: 'var(--accent)',
		theme: 'dark',
		createdAt: '2025-01-14T09:12:00Z'
	},
	{
		id: 'u_2',
		email: 'nadia@aporia.dev',
		name: 'Nadia Reyes',
		handle: 'nadia',
		role: 'member',
		initials: 'NR',
		avatarColor: 'var(--label-feature)',
		theme: 'dark',
		createdAt: '2025-01-20T10:02:00Z'
	},
	{
		id: 'u_3',
		email: 'ilya@aporia.dev',
		name: 'Ilya Novak',
		handle: 'ilya',
		role: 'member',
		initials: 'IN',
		avatarColor: 'var(--label-docs)',
		theme: 'light',
		createdAt: '2025-02-03T14:40:00Z'
	},
	{
		id: 'u_4',
		email: 'mei@aporia.dev',
		name: 'Mei Tanaka',
		handle: 'mei',
		role: 'member',
		initials: 'MT',
		avatarColor: 'var(--label-design)',
		theme: 'dark',
		createdAt: '2025-02-11T08:25:00Z'
	},
	{
		id: 'u_5',
		email: 'samir@aporia.dev',
		name: 'Samir Haddad',
		handle: 'samir',
		role: 'member',
		initials: 'SH',
		avatarColor: 'var(--priority-urgent)',
		theme: 'dark',
		createdAt: '2025-03-01T16:05:00Z'
	}
];

export const labels: Label[] = [
	{ id: 'l_bug', name: 'bug', colorToken: 'var(--label-bug)' },
	{ id: 'l_feature', name: 'feature', colorToken: 'var(--label-feature)' },
	{ id: 'l_infra', name: 'infra', colorToken: 'var(--label-infra)' },
	{ id: 'l_design', name: 'design', colorToken: 'var(--label-design)' },
	{ id: 'l_docs', name: 'docs', colorToken: 'var(--label-docs)' },
	{ id: 'l_perf', name: 'performance', colorToken: 'var(--label-perf)' }
];

export const projects: Project[] = [
	{
		id: 'p_1',
		key: 'CORE',
		name: 'Issue graph rewrite',
		summary:
			'Replace the flat issue table with a relation graph so blockers, duplicates and sub-issues resolve in one query.',
		status: 'in_progress',
		leadId: 'u_1',
		memberIds: ['u_1', 'u_2', 'u_5'],
		startDate: '2025-02-17',
		targetDate: '2025-04-30',
		issueCount: 34,
		completedCount: 21,
		createdAt: '2025-02-10T09:00:00Z',
		updatedAt: '2025-03-28T11:20:00Z'
	},
	{
		id: 'p_2',
		key: 'SYNC',
		name: 'Realtime sync engine',
		summary:
			'Local-first document store with an operation log over websockets, so two people editing one issue never clobber each other.',
		status: 'in_progress',
		leadId: 'u_2',
		memberIds: ['u_2', 'u_3'],
		startDate: '2025-03-03',
		targetDate: '2025-05-21',
		issueCount: 27,
		completedCount: 9,
		createdAt: '2025-02-24T13:15:00Z',
		updatedAt: '2025-03-29T08:44:00Z'
	},
	{
		id: 'p_3',
		key: 'PAL',
		name: 'Command palette v2',
		summary:
			'Fuzzy command index over issues, projects and releases with keyboard-only issue creation and recent-action ranking.',
		status: 'planned',
		leadId: 'u_4',
		memberIds: ['u_4', 'u_1'],
		startDate: null,
		targetDate: '2025-06-12',
		issueCount: 12,
		completedCount: 1,
		createdAt: '2025-03-12T15:30:00Z',
		updatedAt: '2025-03-27T17:02:00Z'
	},
	{
		id: 'p_4',
		key: 'OBS',
		name: 'Queue observability',
		summary:
			'Dashboards and alerting for the Redis worker queues: depth, retry rate, dead letters and per-job latency.',
		status: 'paused',
		leadId: 'u_5',
		memberIds: ['u_5', 'u_3'],
		startDate: '2025-01-27',
		targetDate: '2025-04-11',
		issueCount: 18,
		completedCount: 11,
		createdAt: '2025-01-20T10:00:00Z',
		updatedAt: '2025-03-14T12:10:00Z'
	},
	{
		id: 'p_5',
		key: 'API',
		name: 'Public REST and webhooks',
		summary:
			'Documented API keys, cursor pagination and signed webhooks so teams can drive Aporia from CI.',
		status: 'completed',
		leadId: 'u_3',
		memberIds: ['u_3', 'u_1', 'u_4'],
		startDate: '2024-11-04',
		targetDate: '2025-02-28',
		issueCount: 41,
		completedCount: 41,
		createdAt: '2024-10-28T09:30:00Z',
		updatedAt: '2025-02-28T18:00:00Z'
	}
];

export const releases: Release[] = [
	{
		id: 'r_1',
		version: '0.9.0',
		name: 'Relation graph beta',
		status: 'code_freeze',
		targetDate: '2025-04-08',
		shippedAt: null,
		ownerId: 'u_1',
		issueIds: ['i_1', 'i_3', 'i_7', 'i_11'],
		changelog: [
			'Sub-issues and blocking relations resolve in a single traversal.',
			'Issue search now indexes description bodies.',
			'Bulk status change from the board keeps keyboard focus in place.'
		]
	},
	{
		id: 'r_2',
		version: '0.10.0',
		name: 'Realtime cursors',
		status: 'in_development',
		targetDate: '2025-05-06',
		shippedAt: null,
		ownerId: 'u_2',
		issueIds: ['i_2', 'i_5', 'i_9'],
		changelog: [
			'Presence indicators on issues and projects.',
			'Offline edits replay from the local operation log on reconnect.'
		]
	},
	{
		id: 'r_3',
		version: '0.11.0',
		name: 'Palette and shortcuts',
		status: 'planned',
		targetDate: '2025-06-17',
		shippedAt: null,
		ownerId: 'u_4',
		issueIds: ['i_6', 'i_12'],
		changelog: ['Command palette rewrite with recent-action ranking.']
	},
	{
		id: 'r_4',
		version: '0.8.2',
		name: 'Queue hardening',
		status: 'shipped',
		targetDate: '2025-03-11',
		shippedAt: '2025-03-11',
		ownerId: 'u_5',
		issueIds: ['i_4', 'i_10'],
		changelog: [
			'Dead-letter queue with a replay action for failed jobs.',
			'Session cache reads fall back to MongoDB when Redis is unreachable.',
			'Notification digests batch per workspace instead of per issue.'
		]
	}
];

export const issues: Issue[] = [
	{
		id: 'i_1',
		key: 'APO-128',
		title: 'Resolve sub-issue depth without N+1 lookups',
		description:
			'The graph traversal issues one query per level. Collapse it into a single aggregation with a $graphLookup and cache the result per issue in Redis.',
		status: 'in_progress',
		priority: 'urgent',
		assigneeId: 'u_1',
		creatorId: 'u_1',
		projectId: 'p_1',
		releaseId: 'r_1',
		labelIds: ['l_perf', 'l_infra'],
		estimate: 5,
		cycle: 14,
		createdAt: '2025-03-18T09:10:00Z',
		updatedAt: '2025-03-29T10:04:00Z'
	},
	{
		id: 'i_2',
		key: 'APO-131',
		title: 'Replay offline operation log on reconnect',
		description:
			'Queued operations must apply in author order and skip operations already acknowledged by the server.',
		status: 'in_progress',
		priority: 'high',
		assigneeId: 'u_2',
		creatorId: 'u_2',
		projectId: 'p_2',
		releaseId: 'r_2',
		labelIds: ['l_feature'],
		estimate: 8,
		cycle: 14,
		createdAt: '2025-03-20T11:45:00Z',
		updatedAt: '2025-03-29T09:15:00Z'
	},
	{
		id: 'i_3',
		key: 'APO-124',
		title: 'Board drag drops the issue on rapid status change',
		description:
			'Dragging a card twice inside 200ms sends both mutations with the same version, and the second write is rejected silently.',
		status: 'in_review',
		priority: 'urgent',
		assigneeId: 'u_5',
		creatorId: 'u_4',
		projectId: 'p_1',
		releaseId: 'r_1',
		labelIds: ['l_bug'],
		estimate: 3,
		cycle: 14,
		createdAt: '2025-03-15T16:20:00Z',
		updatedAt: '2025-03-28T14:52:00Z'
	},
	{
		id: 'i_4',
		key: 'APO-117',
		title: 'Dead-letter replay action for failed jobs',
		description:
			'Operators need a one-click replay for jobs that exhausted retries, with the failure reason kept on the job record.',
		status: 'done',
		priority: 'medium',
		assigneeId: 'u_5',
		creatorId: 'u_5',
		projectId: 'p_4',
		releaseId: 'r_4',
		labelIds: ['l_infra'],
		estimate: 3,
		cycle: 13,
		createdAt: '2025-02-26T10:00:00Z',
		updatedAt: '2025-03-11T12:00:00Z'
	},
	{
		id: 'i_5',
		key: 'APO-133',
		title: 'Presence avatars flicker on route change',
		description:
			'The websocket disconnects during client navigation, so presence drops and re-joins on every route change.',
		status: 'todo',
		priority: 'medium',
		assigneeId: 'u_3',
		creatorId: 'u_2',
		projectId: 'p_2',
		releaseId: 'r_2',
		labelIds: ['l_bug', 'l_design'],
		estimate: 2,
		cycle: 14,
		createdAt: '2025-03-24T08:30:00Z',
		updatedAt: '2025-03-27T13:10:00Z'
	},
	{
		id: 'i_6',
		key: 'APO-136',
		title: 'Rank palette results by recent actions',
		description:
			'Score each command by last use and frequency, held in a Redis sorted set per user, and blend it with the fuzzy match score.',
		status: 'todo',
		priority: 'high',
		assigneeId: 'u_4',
		creatorId: 'u_1',
		projectId: 'p_3',
		releaseId: 'r_3',
		labelIds: ['l_feature', 'l_perf'],
		estimate: 5,
		cycle: 15,
		createdAt: '2025-03-26T15:05:00Z',
		updatedAt: '2025-03-28T09:40:00Z'
	},
	{
		id: 'i_7',
		key: 'APO-122',
		title: 'Index issue descriptions for full text search',
		description:
			'Add a text index across title and description and expose a relevance-sorted search endpoint.',
		status: 'done',
		priority: 'high',
		assigneeId: 'u_1',
		creatorId: 'u_3',
		projectId: 'p_1',
		releaseId: 'r_1',
		labelIds: ['l_feature'],
		estimate: 3,
		cycle: 13,
		createdAt: '2025-03-10T09:55:00Z',
		updatedAt: '2025-03-25T17:30:00Z'
	},
	{
		id: 'i_8',
		key: 'APO-139',
		title: 'Keyboard shortcut sheet is missing new bindings',
		description: 'Document the new board bindings and generate the sheet from the shortcut registry.',
		status: 'backlog',
		priority: 'low',
		assigneeId: null,
		creatorId: 'u_4',
		projectId: 'p_3',
		releaseId: null,
		labelIds: ['l_docs'],
		estimate: 1,
		cycle: null,
		createdAt: '2025-03-28T12:00:00Z',
		updatedAt: '2025-03-28T12:00:00Z'
	},
	{
		id: 'i_9',
		key: 'APO-134',
		title: 'Conflict banner when two edits diverge',
		description:
			'Show the competing version inline with a keep-mine or keep-theirs choice instead of a toast that disappears.',
		status: 'backlog',
		priority: 'medium',
		assigneeId: 'u_2',
		creatorId: 'u_2',
		projectId: 'p_2',
		releaseId: 'r_2',
		labelIds: ['l_design', 'l_feature'],
		estimate: 5,
		cycle: 15,
		createdAt: '2025-03-25T10:20:00Z',
		updatedAt: '2025-03-26T11:00:00Z'
	},
	{
		id: 'i_10',
		key: 'APO-115',
		title: 'Session lookups fall back to MongoDB when Redis is down',
		description:
			'Sessions are authoritative in MongoDB and cached in Redis. A cache miss or connection error must degrade, not sign the user out.',
		status: 'done',
		priority: 'urgent',
		assigneeId: 'u_3',
		creatorId: 'u_1',
		projectId: 'p_4',
		releaseId: 'r_4',
		labelIds: ['l_infra'],
		estimate: 5,
		cycle: 13,
		createdAt: '2025-02-20T09:00:00Z',
		updatedAt: '2025-03-09T16:45:00Z'
	},
	{
		id: 'i_11',
		key: 'APO-127',
		title: 'Bulk status change keeps focus on the selected rows',
		description:
			'After a bulk mutation the list re-renders and focus jumps to the top. Preserve the selection and the focused row key.',
		status: 'in_review',
		priority: 'low',
		assigneeId: 'u_4',
		creatorId: 'u_5',
		projectId: 'p_1',
		releaseId: 'r_1',
		labelIds: ['l_design'],
		estimate: 2,
		cycle: 14,
		createdAt: '2025-03-17T14:35:00Z',
		updatedAt: '2025-03-28T08:05:00Z'
	},
	{
		id: 'i_12',
		key: 'APO-141',
		title: 'Create an issue from the palette without leaving the page',
		description:
			'Typing a title after the create command should post the issue and show an undo affordance in place.',
		status: 'backlog',
		priority: 'high',
		assigneeId: null,
		creatorId: 'u_1',
		projectId: 'p_3',
		releaseId: 'r_3',
		labelIds: ['l_feature'],
		estimate: 3,
		cycle: null,
		createdAt: '2025-03-29T07:40:00Z',
		updatedAt: '2025-03-29T07:40:00Z'
	},
	{
		id: 'i_13',
		key: 'APO-109',
		title: 'Webhook signatures rotate without downtime',
		description: 'Accept two active signing secrets during a rotation window.',
		status: 'canceled',
		priority: 'none',
		assigneeId: 'u_3',
		creatorId: 'u_3',
		projectId: 'p_5',
		releaseId: null,
		labelIds: ['l_infra', 'l_docs'],
		estimate: 2,
		cycle: null,
		createdAt: '2025-01-30T10:15:00Z',
		updatedAt: '2025-02-14T09:00:00Z'
	},
	{
		id: 'i_14',
		key: 'APO-137',
		title: 'Cycle burndown chart reads the wrong week boundary',
		description: 'The chart buckets by ISO week but the cycle starts on Wednesday, so day one is empty.',
		status: 'todo',
		priority: 'medium',
		assigneeId: 'u_5',
		creatorId: 'u_2',
		projectId: 'p_4',
		releaseId: null,
		labelIds: ['l_bug'],
		estimate: 2,
		cycle: 14,
		createdAt: '2025-03-27T09:25:00Z',
		updatedAt: '2025-03-28T15:20:00Z'
	}
];

export const comments: Comment[] = [
	{
		id: 'c_1',
		issueId: 'i_1',
		authorId: 'u_2',
		body: 'The aggregation works, but depth above six blows the 16MB document limit. Cap it and paginate.',
		createdAt: '2025-03-28T13:12:00Z'
	},
	{
		id: 'c_2',
		issueId: 'i_3',
		authorId: 'u_4',
		body: 'Reproduced on a trackpad with a fast double drag. Version check needs to be optimistic, not silent.',
		createdAt: '2025-03-27T10:45:00Z'
	}
];

export const currentCycle: Cycle = {
	number: 14,
	name: 'Cycle 14',
	startsAt: '2025-03-19',
	endsAt: '2025-04-02',
	scope: 24,
	completed: 13,
	started: 6
};

export const activity: ActivityEvent[] = [
	{
		id: 'a_1',
		actorId: 'u_2',
		verb: 'commented on',
		targetKey: 'APO-128',
		targetTitle: 'Resolve sub-issue depth without N+1 lookups',
		at: '2025-03-29T10:04:00Z'
	},
	{
		id: 'a_2',
		actorId: 'u_1',
		verb: 'moved to in progress',
		targetKey: 'APO-131',
		targetTitle: 'Replay offline operation log on reconnect',
		at: '2025-03-29T09:15:00Z'
	},
	{
		id: 'a_3',
		actorId: 'u_4',
		verb: 'opened',
		targetKey: 'APO-139',
		targetTitle: 'Keyboard shortcut sheet is missing new bindings',
		at: '2025-03-28T12:00:00Z'
	},
	{
		id: 'a_4',
		actorId: 'u_5',
		verb: 'requested review on',
		targetKey: 'APO-124',
		targetTitle: 'Board drag drops the issue on rapid status change',
		at: '2025-03-28T14:52:00Z'
	},
	{
		id: 'a_5',
		actorId: 'u_3',
		verb: 'shipped release',
		targetKey: '0.8.2',
		targetTitle: 'Queue hardening',
		at: '2025-03-11T12:00:00Z'
	}
];

/* ------------------------------------------------------------------ helpers */

export const currentUser = users[0];

export function userById(id: string | null): User | null {
	if (!id) return null;
	return users.find((u) => u.id === id) ?? null;
}

export function projectById(id: string | null): Project | null {
	if (!id) return null;
	return projects.find((p) => p.id === id) ?? null;
}

export function releaseById(id: string | null): Release | null {
	if (!id) return null;
	return releases.find((r) => r.id === id) ?? null;
}

export function labelsByIds(ids: string[]): Label[] {
	return ids.map((id) => labels.find((l) => l.id === id)).filter((l): l is Label => Boolean(l));
}

export function issuesByStatus(status: IssueStatus): Issue[] {
	return issues.filter((issue) => issue.status === status);
}

export function countByStatus(): Record<IssueStatus, number> {
	return issues.reduce(
		(acc, issue) => {
			acc[issue.status] += 1;
			return acc;
		},
		{
			backlog: 0,
			todo: 0,
			in_progress: 0,
			in_review: 0,
			done: 0,
			canceled: 0
		} as Record<IssueStatus, number>
	);
}

export function formatDate(value: string | null): string {
	if (!value) return 'No date';
	return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function relativeTime(value: string): string {
	const then = new Date(value).getTime();
	const now = new Date('2025-03-29T12:00:00Z').getTime();
	const minutes = Math.round((now - then) / 60000);
	if (minutes < 60) return `${Math.max(minutes, 1)}m ago`;
	const hours = Math.round(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.round(hours / 24);
	if (days < 30) return `${days}d ago`;
	return formatDate(value);
}
