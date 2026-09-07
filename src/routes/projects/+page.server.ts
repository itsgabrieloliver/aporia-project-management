import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { createProject, listIssues, listMembers, listProjects } from '$lib/server/queries';
import { seedWorkspace } from '$lib/server/seed';
import type { ProjectStatus } from '$lib/types';

const STATUSES: ProjectStatus[] = ['planned', 'in_progress', 'paused', 'completed', 'canceled'];

export const load: PageServerLoad = async ({ locals }) => {
	try {
		await seedWorkspace(locals.user!.id);
		const [projects, members, issues] = await Promise.all([
			listProjects(),
			listMembers(),
			listIssues({ limit: 500 })
		]);
		return { projects, members, issues };
	} catch (err) {
		console.error('[aporia] projects load failed:', (err as Error).message);
		error(503, {
			message: 'Could not read the project list. It will load once the store responds.',
			code: 'store-unavailable'
		});
	}
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const form = await request.formData();
		const name = String(form.get('name') ?? '').trim();
		const key = String(form.get('key') ?? '').trim();
		const statusRaw = String(form.get('status') ?? 'planned');

		if (name.length < 3) {
			return fail(400, { createError: 'Name the project, at least 3 characters.' });
		}
		if (!/^[A-Za-z]{2,6}$/.test(key)) {
			return fail(400, { createError: 'The key is 2 to 6 letters, for example CORE.' });
		}

		try {
			const project = await createProject(locals.user!, {
				name,
				key,
				summary: String(form.get('summary') ?? ''),
				status: (STATUSES as string[]).includes(statusRaw)
					? (statusRaw as ProjectStatus)
					: 'planned',
				leadId: String(form.get('leadId') ?? '') || locals.user!.id,
				targetDate: String(form.get('targetDate') ?? '') || null
			});
			return { created: project.key };
		} catch (err) {
			console.error('[aporia] project create failed:', (err as Error).message);
			return fail(503, { createError: 'The write was not accepted. Try again.' });
		}
	}
};
