import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	createIssue,
	listIssues,
	listLabels,
	listMembers,
	listProjects,
	updateIssueAssignee,
	updateIssueStatus
} from '$lib/server/queries';
import { seedWorkspace } from '$lib/server/seed';
import type { IssuePriority, IssueStatus } from '$lib/types';

const STATUSES: IssueStatus[] = [
	'backlog',
	'todo',
	'in_progress',
	'in_review',
	'done',
	'canceled'
];
const PRIORITIES: IssuePriority[] = ['urgent', 'high', 'medium', 'low', 'none'];

function asStatus(value: string): IssueStatus | null {
	return (STATUSES as string[]).includes(value) ? (value as IssueStatus) : null;
}

function asPriority(value: string): IssuePriority {
	return (PRIORITIES as string[]).includes(value) ? (value as IssuePriority) : 'none';
}

export const load: PageServerLoad = async ({ locals, url }) => {
	try {
		await seedWorkspace(locals.user!.id);
		const [issues, projects, members, labels] = await Promise.all([
			listIssues({ limit: 500 }),
			listProjects(),
			listMembers(),
			listLabels()
		]);
		return {
			issues,
			projects,
			members,
			labels,
			view: url.searchParams.get('view') === 'board' ? 'board' : 'list',
			openCreate: url.searchParams.get('new') === '1'
		};
	} catch (err) {
		console.error('[aporia] issues load failed:', (err as Error).message);
		error(503, {
			message: 'Could not read the issue list. It will load once the store responds.',
			code: 'store-unavailable'
		});
	}
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const form = await request.formData();
		const title = String(form.get('title') ?? '').trim();
		if (title.length < 3) {
			return fail(400, { createError: 'Give the issue a title of at least 3 characters.' });
		}
		try {
			const issue = await createIssue(locals.user!, {
				title,
				description: String(form.get('description') ?? ''),
				status: asStatus(String(form.get('status') ?? 'backlog')) ?? 'backlog',
				priority: asPriority(String(form.get('priority') ?? 'none')),
				assigneeId: String(form.get('assigneeId') ?? '') || null,
				projectId: String(form.get('projectId') ?? '') || null,
				labelIds: form.getAll('labelIds').map(String)
			});
			return { created: issue.key };
		} catch (err) {
			console.error('[aporia] issue create failed:', (err as Error).message);
			return fail(503, { createError: 'The database did not accept the write. Try again.' });
		}
	},

	setStatus: async ({ request, locals }) => {
		const form = await request.formData();
		const id = String(form.get('id') ?? '');
		const status = asStatus(String(form.get('status') ?? ''));
		if (!id || !status) return fail(400, { statusError: 'Unknown issue or status.' });
		try {
			await updateIssueStatus(locals.user!, id, status);
			return { statusChanged: id };
		} catch (err) {
			console.error('[aporia] status change failed:', (err as Error).message);
			return fail(503, { statusError: 'Could not save the status change.' });
		}
	},

	setAssignee: async ({ request, locals }) => {
		const form = await request.formData();
		const id = String(form.get('id') ?? '');
		const assigneeId = String(form.get('assigneeId') ?? '') || null;
		if (!id) return fail(400, { statusError: 'Unknown issue.' });
		try {
			await updateIssueAssignee(locals.user!, id, assigneeId);
			return { assigned: id };
		} catch (err) {
			console.error('[aporia] assignee change failed:', (err as Error).message);
			return fail(503, { statusError: 'Could not save the assignee.' });
		}
	}
};
