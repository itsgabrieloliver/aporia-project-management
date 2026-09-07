import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { listIssues, listMembers, listReleases } from '$lib/server/queries';
import { seedWorkspace } from '$lib/server/seed';

export const load: PageServerLoad = async ({ locals }) => {
	try {
		await seedWorkspace(locals.user!.id);
		const [releases, issues, members] = await Promise.all([
			listReleases(),
			listIssues({ limit: 500 }),
			listMembers()
		]);
		return { releases, issues, members };
	} catch (err) {
		console.error('[aporia] releases load failed:', (err as Error).message);
		error(503, {
			message: 'Could not read the release list. It will load once the store responds.',
			code: 'store-unavailable'
		});
	}
};
