import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { createSession, createUser, findUserByEmail, validateSignup } from '$lib/server/auth';
import { collections, isDatabaseConfigured } from '$lib/server/db';
import { seedWorkspace } from '$lib/server/seed';

export const load: PageServerLoad = async () => {
	return { dbConfigured: isDatabaseConfigured() };
};

export const actions: Actions = {
	default: async ({ request, cookies, getClientAddress }) => {
		const form = await request.formData();
		const name = String(form.get('name') ?? '');
		const email = String(form.get('email') ?? '');
		const password = String(form.get('password') ?? '');

		const errors = validateSignup({ name, email, password });
		if (Object.keys(errors).length > 0) {
			return fail(400, { name, email, errors });
		}

		if (!isDatabaseConfigured()) {
			return fail(503, {
				name,
				email,
				errors: {
					form: 'The workspace database is not reachable. DATABASE_URL is not set on this deployment.'
				}
			});
		}

		try {
			if (await findUserByEmail(email)) {
				return fail(400, {
					name,
					email,
					errors: { email: 'An account already uses that email. Sign in instead.' }
				});
			}

			const users = await collections.users();
			const first = (await users.countDocuments({}, { limit: 1 })) === 0;

			const user = await createUser({ name, email, password, role: first ? 'admin' : 'member' });

			try {
				await seedWorkspace(user.id);
			} catch (err) {
				console.error('[aporia] workspace seeding failed:', (err as Error).message);
			}

			await createSession(user.id, cookies, {
				userAgent: request.headers.get('user-agent') ?? undefined,
				ip: getClientAddress()
			});
		} catch (err) {
			console.error('[aporia] sign up failed:', (err as Error).message);
			return fail(500, {
				name,
				email,
				errors: { form: 'Could not create the account. The workspace database did not respond.' }
			});
		}

		throw redirect(303, '/');
	}
};
