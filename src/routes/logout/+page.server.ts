import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { revokeSession } from '$lib/server/auth';

/** Visiting /logout directly just bounces to sign in. */
export const load: PageServerLoad = async () => {
	throw redirect(303, '/login');
};

export const actions: Actions = {
	default: async ({ cookies, locals }) => {
		try {
			await revokeSession(locals.sessionId, cookies);
		} catch (err) {
			console.error('[aporia] sign out cleanup failed:', (err as Error).message);
			cookies.delete('aporia_session', { path: '/' });
		}
		locals.user = null;
		locals.sessionId = null;
		throw redirect(303, '/login');
	}
};
