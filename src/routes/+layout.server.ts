import type { LayoutServerLoad } from './$types';
import { isDatabaseConfigured } from '$lib/server/db';
import { listIssues, listProjects, listReleases } from '$lib/server/queries';

/** Lightweight index for the command palette, plus the signed-in user. */
export const load: LayoutServerLoad = async ({ locals, url }) => {
	const base = {
		user: locals.user,
		pathname: url.pathname,
		palette: { issues: [], projects: [], releases: [] } as {
			issues: { id: string; key: string; title: string }[];
			projects: { id: string; key: string; name: string }[];
			releases: { id: string; version: string; name: string }[];
		}
	};

	if (!locals.user || !isDatabaseConfigured()) return base;

	try {
		const [issues, projects, releases] = await Promise.all([
			listIssues({ limit: 40 }),
			listProjects(),
			listReleases()
		]);
		base.palette = {
			issues: issues.map((i) => ({ id: i.id, key: i.key, title: i.title })),
			projects: projects.map((p) => ({ id: p.id, key: p.key, name: p.name })),
			releases: releases.map((r) => ({ id: r.id, version: r.version, name: r.name }))
		};
	} catch (err) {
		console.error('[aporia] palette index unavailable:', (err as Error).message);
	}

	return base;
};
