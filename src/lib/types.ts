/** Shared domain types for Aporia. These mirror the MongoDB documents. */

export type Id = string;

export type IssueStatus = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done' | 'canceled';

export type IssuePriority = 'urgent' | 'high' | 'medium' | 'low' | 'none';

export type ProjectStatus = 'planned' | 'in_progress' | 'paused' | 'completed' | 'canceled';

export type ReleaseStatus = 'planned' | 'in_development' | 'code_freeze' | 'shipped';

export type ThemePreference = 'dark' | 'light';

export interface User {
	id: Id;
	email: string;
	name: string;
	handle: string;
	role: 'admin' | 'member';
	initials: string;
	avatarColor: string;
	/** Argon2/bcrypt hash. Never returned to the client. */
	passwordHash?: string;
	theme: ThemePreference;
	createdAt: string;
}

/** The trimmed user shape that is safe to put on locals and page data. */
export type SessionUser = Pick<
	User,
	'id' | 'email' | 'name' | 'handle' | 'role' | 'initials' | 'avatarColor' | 'theme'
>;

export interface Session {
	id: Id;
	userId: Id;
	createdAt: string;
	expiresAt: string;
	userAgent?: string;
	ip?: string;
}

export interface Label {
	id: Id;
	name: string;
	/** Token name in tokens.css, e.g. "label-bug". */
	colorToken: string;
}

export interface Project {
	id: Id;
	key: string;
	name: string;
	summary: string;
	status: ProjectStatus;
	leadId: Id;
	memberIds: Id[];
	targetDate: string | null;
	startDate: string | null;
	issueCount: number;
	completedCount: number;
	createdAt: string;
	updatedAt: string;
}

export interface Issue {
	id: Id;
	/** Human key, e.g. APO-128. */
	key: string;
	title: string;
	description: string;
	status: IssueStatus;
	priority: IssuePriority;
	assigneeId: Id | null;
	creatorId: Id;
	projectId: Id | null;
	releaseId: Id | null;
	labelIds: Id[];
	estimate: number | null;
	cycle: number | null;
	createdAt: string;
	updatedAt: string;
}

export interface Release {
	id: Id;
	version: string;
	name: string;
	status: ReleaseStatus;
	targetDate: string;
	shippedAt: string | null;
	ownerId: Id;
	issueIds: Id[];
	changelog: string[];
}

export interface Comment {
	id: Id;
	issueId: Id;
	authorId: Id;
	body: string;
	createdAt: string;
}

export interface Cycle {
	number: number;
	name: string;
	startsAt: string;
	endsAt: string;
	scope: number;
	completed: number;
	started: number;
}

export interface ActivityEvent {
	id: Id;
	actorId: Id;
	verb: string;
	targetKey: string;
	targetTitle: string;
	at: string;
}

export const ISSUE_STATUS_LABEL: Record<IssueStatus, string> = {
	backlog: 'Backlog',
	todo: 'Todo',
	in_progress: 'In progress',
	in_review: 'In review',
	done: 'Done',
	canceled: 'Canceled'
};

export const ISSUE_STATUS_TOKEN: Record<IssueStatus, string> = {
	backlog: 'var(--status-backlog)',
	todo: 'var(--status-todo)',
	in_progress: 'var(--status-progress)',
	in_review: 'var(--status-review)',
	done: 'var(--status-done)',
	canceled: 'var(--status-canceled)'
};

export const PRIORITY_LABEL: Record<IssuePriority, string> = {
	urgent: 'Urgent',
	high: 'High',
	medium: 'Medium',
	low: 'Low',
	none: 'No priority'
};

export const PRIORITY_TOKEN: Record<IssuePriority, string> = {
	urgent: 'var(--priority-urgent)',
	high: 'var(--priority-high)',
	medium: 'var(--priority-medium)',
	low: 'var(--priority-low)',
	none: 'var(--priority-none)'
};

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
	planned: 'Planned',
	in_progress: 'In progress',
	paused: 'Paused',
	completed: 'Completed',
	canceled: 'Canceled'
};

export const RELEASE_STATUS_LABEL: Record<ReleaseStatus, string> = {
	planned: 'Planned',
	in_development: 'In development',
	code_freeze: 'Code freeze',
	shipped: 'Shipped'
};

export const BOARD_COLUMNS: IssueStatus[] = [
	'backlog',
	'todo',
	'in_progress',
	'in_review',
	'done'
];
