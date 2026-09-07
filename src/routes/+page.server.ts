import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { dashboard } from '$lib/server/queries';
import { seedWorkspace } from '$lib/server/seed';

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user!;
	try {
		await seedWorkspace(user.id);
		const data = await dashboard(user);
		return { ...data, user };
	} catch (err) {
		console.error('[aporia] dashboard load failed:', (err as Error).message);
		error(503, {
			message: 'Could not read the workspace. The dashboard will load once the store responds.',
			code: 'store-unavailable'
		});
	}
};
