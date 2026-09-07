import { redirect, type Handle } from '@sveltejs/kit';
import { SESSION_COOKIE, resolveSession } from '$lib/server/auth';
import { dataMode } from '$lib/server/db';
import { sessionMode } from '$lib/server/redis';
import { seedWorkspace } from '$lib/server/seed';

/** Routes reachable without a session. */
const PUBLIC_PATHS = new Set(['/login', '/signup', '/logout']);

function isPublic(pathname: string): boolean {
	if (PUBLIC_PATHS.has(pathname)) return true;
	return pathname.startsWith('/api/health');
}

let announced = false;

/**
 * Resolves the data backend once and seeds the workspace so the demo account
 * exists before the first sign in attempt, in either data mode.
 */
async function bootstrap() {
	if (announced) return;
	announced = true;
	const [data, sessions] = await Promise.all([dataMode(), sessionMode()]);
	console.info(`[aporia] ready: data=${data} sessions=${sessions}`);
	try {
		await seedWorkspace();
	} catch (err) {
		announced = false;
		console.error('[aporia] seeding failed:', (err as Error).message);
	}
}

export const handle: Handle = async ({ event, resolve }) => {
	await bootstrap();

	const sessionId = event.cookies.get(SESSION_COOKIE) ?? null;
	event.locals.sessionId = sessionId;
	event.locals.user = null;

	if (sessionId) {
		try {
			event.locals.user = await resolveSession(sessionId);
		} catch (err) {
			console.error('[aporia] session resolve failed:', (err as Error).message);
		}
	}

	const path = event.url.pathname;

	if (event.locals.user && (path === '/login' || path === '/signup')) {
		redirect(303, '/');
	}

	if (!event.locals.user && !isPublic(path)) {
		const target = path === '/' ? '/login' : `/login?redirectTo=${encodeURIComponent(path)}`;
		redirect(303, target);
	}

	return resolve(event);
};
