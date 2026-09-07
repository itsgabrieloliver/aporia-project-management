/**
 * Redis layer for sessions, short-lived caches and queued background work.
 *
 * REDIS_URL comes from the environment and is never hardcoded. The connection
 * is attempted once with a short timeout; if Redis is missing or unreachable
 * (for example in a preview sandbox with no outbound network) the module keeps
 * serving from an in-process map behind the same functions, so sign in, caching
 * and the job queue all keep working. One line is logged about the active mode.
 */
import { createClient, type RedisClientType } from 'redis';
import { env } from '$env/dynamic/private';

export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14;
export const CACHE_TTL_SECONDS = 30;

const CONNECT_TIMEOUT_MS = Number(env.REDIS_CONNECT_TIMEOUT_MS || 2500);

export type SessionMode = 'redis' | 'memory';

export const keys = {
	session: (sessionId: string) => `aporia:session:${sessionId}`,
	userSessions: (userId: string) => `aporia:user:${userId}:sessions`,
	dashboardCache: (userId: string) => `aporia:cache:dashboard:${userId}`,
	queue: (name: string) => `aporia:queue:${name}`
} as const;

export function redisUrl(): string {
	return env.REDIS_URL || env.REDIS_URI || '';
}

export function isRedisConfigured(): boolean {
	return redisUrl().length > 0;
}

type Cache = {
	resolved: Promise<RedisClientType | null> | null;
	mode: SessionMode | null;
	memory: Map<string, { value: string; expiresAt: number }>;
	sets: Map<string, Set<string>>;
	lists: Map<string, string[]>;
};

const globalForRedis = globalThis as unknown as { __aporiaRedis?: Cache };
const cache: Cache = (globalForRedis.__aporiaRedis ??= {
	resolved: null,
	mode: null,
	memory: new Map(),
	sets: new Map(),
	lists: new Map()
});

function useMemory(reason: string): null {
	cache.mode = 'memory';
	console.info(
		`[aporia] session mode: in-process map (${reason}). Sessions, cache and queue do not survive a restart.`
	);
	return null;
}

function withTimeout<T>(work: Promise<T>, ms: number, label: string): Promise<T> {
	return new Promise<T>((resolve, reject) => {
		const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
		work.then(
			(value) => {
				clearTimeout(timer);
				resolve(value);
			},
			(err) => {
				clearTimeout(timer);
				reject(err);
			}
		);
	});
}

async function connect(): Promise<RedisClientType | null> {
	const url = redisUrl();
	if (!url) return useMemory('REDIS_URL is not set');
	try {
		const c: RedisClientType = createClient({
			url,
			socket: {
				connectTimeout: CONNECT_TIMEOUT_MS,
				reconnectStrategy: (tries) => (tries > 5 ? false : Math.min(tries * 200, 2000))
			}
		});
		// Without a listener a later socket error would crash the process.
		c.on('error', (err: Error) => console.error('[aporia] redis error:', err.message));
		await withTimeout(c.connect(), CONNECT_TIMEOUT_MS + 500, 'redis connect');
		await withTimeout(c.ping(), CONNECT_TIMEOUT_MS, 'redis ping');
		cache.mode = 'redis';
		console.info('[aporia] session mode: Redis, connected.');
		return c;
	} catch (err) {
		return useMemory(`Redis unreachable: ${(err as Error).message}`);
	}
}

async function client(): Promise<RedisClientType | null> {
	if (!cache.resolved) cache.resolved = connect();
	try {
		const c = await cache.resolved;
		if (c && !c.isOpen) return null;
		return c;
	} catch {
		return null;
	}
}

/** Which backend sessions and caches are using. */
export async function sessionMode(): Promise<SessionMode> {
	await client();
	return cache.mode ?? 'memory';
}

/* ---------- key/value with TTL (sessions, caches) ---------- */

export async function kvSet(key: string, value: string, ttlSeconds = SESSION_TTL_SECONDS) {
	const c = await client();
	if (c) {
		try {
			await c.set(key, value, { EX: ttlSeconds });
			return;
		} catch (err) {
			console.error('[aporia] redis set failed, using memory:', (err as Error).message);
		}
	}
	cache.memory.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

export async function kvGet(key: string): Promise<string | null> {
	const c = await client();
	if (c) {
		try {
			return (await c.get(key)) as string | null;
		} catch (err) {
			console.error('[aporia] redis get failed, using memory:', (err as Error).message);
		}
	}
	const hit = cache.memory.get(key);
	if (!hit) return null;
	if (hit.expiresAt < Date.now()) {
		cache.memory.delete(key);
		return null;
	}
	return hit.value;
}

export async function kvDelete(key: string) {
	const c = await client();
	if (c) {
		try {
			await c.del(key);
		} catch (err) {
			console.error('[aporia] redis delete failed:', (err as Error).message);
		}
	}
	cache.memory.delete(key);
}

export async function kvTouch(key: string, ttlSeconds = SESSION_TTL_SECONDS) {
	const c = await client();
	if (c) {
		try {
			await c.expire(key, ttlSeconds);
			return;
		} catch {
			/* TTL refresh is best effort */
		}
	}
	const hit = cache.memory.get(key);
	if (hit) hit.expiresAt = Date.now() + ttlSeconds * 1000;
}

/* ---------- session store ---------- */

export async function putSession(sessionId: string, userId: string) {
	await kvSet(keys.session(sessionId), userId, SESSION_TTL_SECONDS);
	const c = await client();
	if (c) {
		try {
			await c.sAdd(keys.userSessions(userId), sessionId);
			await c.expire(keys.userSessions(userId), SESSION_TTL_SECONDS);
			return;
		} catch {
			/* fall through to the memory set */
		}
	}
	const set = cache.sets.get(keys.userSessions(userId)) ?? new Set<string>();
	set.add(sessionId);
	cache.sets.set(keys.userSessions(userId), set);
}

export async function readSession(sessionId: string): Promise<string | null> {
	const userId = await kvGet(keys.session(sessionId));
	if (userId) await kvTouch(keys.session(sessionId));
	return userId;
}

export async function dropSession(sessionId: string) {
	const userId = await kvGet(keys.session(sessionId));
	await kvDelete(keys.session(sessionId));
	if (!userId) return;
	const c = await client();
	if (c) {
		try {
			await c.sRem(keys.userSessions(userId), sessionId);
			return;
		} catch {
			/* fall through */
		}
	}
	cache.sets.get(keys.userSessions(userId))?.delete(sessionId);
}

export async function countUserSessions(userId: string): Promise<number> {
	const c = await client();
	if (c) {
		try {
			return await c.sCard(keys.userSessions(userId));
		} catch {
			/* fall through */
		}
	}
	return cache.sets.get(keys.userSessions(userId))?.size ?? 0;
}

/* ---------- short cache for aggregates ---------- */

export async function cached<T>(
	key: string,
	ttlSeconds: number,
	produce: () => Promise<T>
): Promise<T> {
	try {
		const hit = await kvGet(key);
		if (hit) return JSON.parse(hit) as T;
	} catch {
		/* unreadable cache entry, fall through to a fresh read */
	}
	const value = await produce();
	try {
		await kvSet(key, JSON.stringify(value), ttlSeconds);
	} catch {
		/* cache writes are best effort */
	}
	return value;
}

export async function invalidate(key: string) {
	await kvDelete(key);
}

/* ---------- queue (activity fan-out and other background work) ---------- */

export async function enqueue(queue: string, payload: Record<string, unknown>) {
	const job = JSON.stringify({ ...payload, enqueuedAt: new Date().toISOString() });
	const c = await client();
	if (c) {
		try {
			await c.rPush(keys.queue(queue), job);
			await c.lTrim(keys.queue(queue), -500, -1);
			return;
		} catch {
			/* fall through to the memory list */
		}
	}
	const list = cache.lists.get(keys.queue(queue)) ?? [];
	list.push(job);
	cache.lists.set(keys.queue(queue), list.slice(-500));
}

export async function dequeue(queue: string): Promise<Record<string, unknown> | null> {
	const c = await client();
	let raw: string | null = null;
	if (c) {
		try {
			raw = (await c.lPop(keys.queue(queue))) as string | null;
		} catch {
			raw = null;
		}
	} else {
		const list = cache.lists.get(keys.queue(queue)) ?? [];
		raw = list.shift() ?? null;
		cache.lists.set(keys.queue(queue), list);
	}
	if (!raw) return null;
	try {
		return JSON.parse(raw) as Record<string, unknown>;
	} catch {
		return null;
	}
}

export async function queueDepth(queue: string): Promise<number> {
	const c = await client();
	if (c) {
		try {
			return await c.lLen(keys.queue(queue));
		} catch {
			/* fall through */
		}
	}
	return (cache.lists.get(keys.queue(queue)) ?? []).length;
}

export async function redisStatus(): Promise<{
	mode: SessionMode;
	configured: boolean;
	ok: boolean;
	note: string;
}> {
	const c = await client();
	const mode = cache.mode ?? 'memory';
	if (!c) {
		return {
			mode,
			configured: isRedisConfigured(),
			ok: true,
			note: isRedisConfigured()
				? 'Redis unreachable from this environment, sessions held in process'
				: 'REDIS_URL is not set, sessions held in process'
		};
	}
	try {
		await c.ping();
		return { mode: 'redis', configured: true, ok: true, note: 'connected' };
	} catch (err) {
		return { mode, configured: true, ok: false, note: (err as Error).message };
	}
}
