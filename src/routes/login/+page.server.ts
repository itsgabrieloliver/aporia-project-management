import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { createSession, findUserByEmail, validateLogin, verifyPassword } from '$lib/server/auth';
import { dataMode } from '$lib/server/db';
import { DEMO_ACCOUNT } from '$lib/server/seed';

export const load: PageServerLoad = async ({ url }) => {
	return {
		redirectTo: url.searchParams.get('redirectTo') ?? '/',
		mode: await dataMode(),
		demo: { email: DEMO_ACCOUNT.email, password: DEMO_ACCOUNT.password }
	};
};

export const actions: Actions = {
	default: async ({ request, cookies, getClientAddress }) => {
		const form = await request.formData();
		const email = String(form.get('email') ?? '');
		const password = String(form.get('password') ?? '');
		const redirectTo = String(form.get('redirectTo') ?? '/') || '/';

		const errors = validateLogin({ email, password });
		if (Object.keys(errors).length > 0) {
			return fail(400, { email, errors });
		}

		try {
			const user = await findUserByEmail(email);
			if (!user || !(await verifyPassword(password, user.passwordHash ?? ''))) {
				return fail(400, { email, errors: { form: 'That email and password do not match.' } });
			}

			await createSession(user.id, cookies, {
				userAgent: request.headers.get('user-agent') ?? undefined,
				ip: getClientAddress()
			});
		} catch (err) {
			console.error('[aporia] sign in failed:', (err as Error).message);
			return fail(500, {
				email,
				errors: { form: 'Could not reach the workspace database. Try again in a moment.' }
			});
		}

		throw redirect(303, redirectTo.startsWith('/') ? redirectTo : '/');
	}
};
