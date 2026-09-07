import { error } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	listIssues,
	listLabels,
	listProjects,
	updateIssueStatus
} from '$lib/server/queries';
import { seedWorkspace } from '$lib/server/seed';
import type { IssueStatus } from '$lib/types';

const STATUSES: IssueStatus[] = [
	'backlog',
	'todo',
	'in_progress',
	'in_review',
	'done',
	'canceled'
];

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user!;
	try {
		await seedWorkspace(user.id);
		const [issues, projects, labels] = await Promise.all([
			listIssues({ assigneeId: user.id, limit: 200 }),
			listProjects(),
			listLabels()
		]);
		return { issues, projects, labels };
	} catch (err) {
		console.error('[aporia] my issues load failed:', (err as Error).message);
		error(503, {
			message: 'Could not read your assigned issues. They will load once the store responds.',
			code: 'store-unavailable'
		});
	}
};

export const actions: Actions = {
	setStatus: async ({ request, locals }) => {
		const form = await request.formData();
		const id = String(form.get('id') ?? '');
		const raw = String(form.get('status') ?? '');
		if (!id || !(STATUSES as string[]).includes(raw)) {
			return { statusError: 'Unknown issue or status.' };
		}
		await updateIssueStatus(locals.user!, id, raw as IssueStatus);
		return { statusChanged: id };
	}
};
