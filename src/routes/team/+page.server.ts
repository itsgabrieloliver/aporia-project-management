import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { listIssues, listMembers, listProjects, updateIssueAssignee } from '$lib/server/queries';
import { seedWorkspace } from '$lib/server/seed';

export const load: PageServerLoad = async ({ locals }) => {
	try {
		await seedWorkspace(locals.user!.id);
		const [members, issues, projects] = await Promise.all([
			listMembers(),
			listIssues({ limit: 500 }),
			listProjects()
		]);
		return { members, issues, projects };
	} catch (err) {
		console.error('[aporia] team load failed:', (err as Error).message);
		error(503, {
			message: 'Could not read the team list. It will load once the store responds.',
			code: 'store-unavailable'
		});
	}
};

export const actions: Actions = {
	assign: async ({ request, locals }) => {
		const form = await request.formData();
		const issueId = String(form.get('issueId') ?? '');
		const assigneeId = String(form.get('assigneeId') ?? '') || null;
		if (!issueId) return fail(400, { assignError: 'Pick an issue to assign.' });
		try {
			await updateIssueAssignee(locals.user!, issueId, assigneeId);
			return { assigned: true };
		} catch (err) {
			console.error('[aporia] assignment failed:', (err as Error).message);
			return fail(503, { assignError: 'Could not save the assignment.' });
		}
	}
};
