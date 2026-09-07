/**
 * Data access layer.
 *
 * Aporia stores everything in MongoDB. The connection string arrives as
 * DATABASE_URL from the environment and is never hardcoded.
 *
 * Because some environments (the in-browser preview sandbox, an offline dev
 * machine) have no outbound network, the module attempts the real connection
 * with a short timeout and, on failure, falls back to an in-process document
 * store that implements the same collection interface. Every query, write and
 * the seeding code above it run unchanged in both modes, so the deployed build
 * uses real MongoDB with no code change.
 */
import { MongoClient, type Db } from 'mongodb';
import { env } from '$env/dynamic/private';
import { memoryCollection, type DataCollection } from './memstore';
import type {
	ActivityEvent,
	Comment,
	Issue,
	Label,
	Project,
	Release,
	Session,
	User
} from '$lib/types';

export const DATABASE_NAME = env.DATABASE_NAME || 'aporia';

/** How long we wait for MongoDB before switching to the in-memory store. */
const CONNECT_TIMEOUT_MS = Number(env.DATABASE_CONNECT_TIMEOUT_MS || 3000);

export const COLLECTIONS = {
	users: 'users',
	sessions: 'sessions',
	projects: 'projects',
	issues: 'issues',
	releases: 'releases',
	comments: 'comments',
	labels: 'labels',
	activity: 'activity'
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];

export type DataMode = 'mongodb' | 'memory';

export function databaseUrl(): string {
	return env.DATABASE_URL || env.MONGODB_URL || env.MONGO_URL || '';
}

/** True when a connection string is present in the environment. */
export function isDatabaseConfigured(): boolean {
	return databaseUrl().length > 0;
}

type Store = {
	mode: DataMode;
	db: Db | null;
	collection: <T>(name: CollectionName) => DataCollection<T>;
};

type Cache = {
	store: Promise<Store> | null;
	client: MongoClient | null;
	mode: DataMode | null;
	seeded: Promise<void> | null;
};

const globalForData = globalThis as unknown as { __aporiaData?: Cache };
const cache: Cache = (globalForData.__aporiaData ??= {
	store: null,
	client: null,
	mode: null,
	seeded: null
});

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

function memoryStore(reason: string): Store {
	cache.mode = 'memory';
	console.info(`[aporia] data mode: in-memory store (${reason}). Writes last until restart.`);
	return {
		mode: 'memory',
		db: null,
		collection: <T>(name: CollectionName) => memoryCollection<T>(name)
	};
}

async function mongoStore(url: string): Promise<Store> {
	const client = new MongoClient(url, {
		serverSelectionTimeoutMS: CONNECT_TIMEOUT_MS,
		connectTimeoutMS: CONNECT_TIMEOUT_MS,
		maxPoolSize: 10,
		retryWrites: true
	});
	await withTimeout(client.connect(), CONNECT_TIMEOUT_MS + 500, 'mongodb connect');
	const db = client.db(DATABASE_NAME);
	await withTimeout(db.command({ ping: 1 }), CONNECT_TIMEOUT_MS, 'mongodb ping');
	cache.client = client;
	cache.mode = 'mongodb';
	console.info(`[aporia] data mode: MongoDB, database "${DATABASE_NAME}".`);
	void ensureIndexes(db);
	return {
		mode: 'mongodb',
		db,
		collection: <T>(name: CollectionName) =>
			db.collection(name) as unknown as DataCollection<T>
	};
}

async function resolveStore(): Promise<Store> {
	const url = databaseUrl();
	if (!url) return memoryStore('DATABASE_URL is not set');
	try {
		return await mongoStore(url);
	} catch (err) {
		return memoryStore(`MongoDB unreachable: ${(err as Error).message}`);
	}
}

function getStore(): Promise<Store> {
	if (!cache.store) cache.store = resolveStore();
	return cache.store;
}

async function ensureIndexes(db: Db) {
	try {
		await Promise.all([
			db.collection(COLLECTIONS.users).createIndex({ email: 1 }, { unique: true }),
			db.collection(COLLECTIONS.users).createIndex({ id: 1 }, { unique: true }),
			db.collection(COLLECTIONS.sessions).createIndex({ id: 1 }, { unique: true }),
			db.collection(COLLECTIONS.sessions).createIndex({ userId: 1 }),
			db.collection(COLLECTIONS.projects).createIndex({ id: 1 }, { unique: true }),
			db.collection(COLLECTIONS.issues).createIndex({ key: 1 }, { unique: true }),
			db.collection(COLLECTIONS.issues).createIndex({ id: 1 }, { unique: true }),
			db.collection(COLLECTIONS.issues).createIndex({ projectId: 1, status: 1 }),
			db.collection(COLLECTIONS.issues).createIndex({ assigneeId: 1, status: 1 }),
			db.collection(COLLECTIONS.releases).createIndex({ targetDate: 1 }),
			db.collection(COLLECTIONS.releases).createIndex({ id: 1 }, { unique: true }),
			db.collection(COLLECTIONS.comments).createIndex({ issueId: 1, createdAt: -1 }),
			db.collection(COLLECTIONS.labels).createIndex({ id: 1 }, { unique: true }),
			db.collection(COLLECTIONS.activity).createIndex({ at: -1 })
		]);
	} catch (err) {
		console.error('[aporia] index creation failed:', (err as Error).message);
	}
}

/** Which backend the running process settled on. Resolves the store if needed. */
export async function dataMode(): Promise<DataMode> {
	return (await getStore()).mode;
}

/** Synchronous best guess, for logging only. Null before the first query. */
export function knownDataMode(): DataMode | null {
	return cache.mode;
}

async function collection<T>(name: CollectionName): Promise<DataCollection<T>> {
	const store = await getStore();
	return store.collection<T>(name);
}

/** Typed collection accessors. Identical shape in both data modes. */
export const collections = {
	users: () => collection<User>(COLLECTIONS.users),
	sessions: () => collection<Session>(COLLECTIONS.sessions),
	projects: () => collection<Project>(COLLECTIONS.projects),
	issues: () => collection<Issue>(COLLECTIONS.issues),
	releases: () => collection<Release>(COLLECTIONS.releases),
	comments: () => collection<Comment>(COLLECTIONS.comments),
	labels: () => collection<Label>(COLLECTIONS.labels),
	activity: () => collection<ActivityEvent>(COLLECTIONS.activity)
};

/** Strips Mongo's _id so documents can cross the SSR boundary. */
export function plain<T>(doc: (T & { _id?: unknown }) | null): T | null {
	if (!doc) return null;
	const { _id, ...rest } = doc as T & { _id?: unknown };
	void _id;
	return rest as T;
}

export function plainAll<T>(docs: (T & { _id?: unknown })[]): T[] {
	return docs.map((d) => plain<T>(d) as T);
}

export async function databaseStatus(): Promise<{
	mode: DataMode;
	configured: boolean;
	ok: boolean;
	note: string;
}> {
	const store = await getStore();
	if (store.mode === 'memory') {
		return {
			mode: 'memory',
			configured: isDatabaseConfigured(),
			ok: true,
			note: isDatabaseConfigured()
				? 'MongoDB unreachable from this environment, running on the in-memory store'
				: 'DATABASE_URL is not set, running on the in-memory store'
		};
	}
	try {
		await store.db!.command({ ping: 1 });
		return { mode: 'mongodb', configured: true, ok: true, note: DATABASE_NAME };
	} catch (err) {
		return { mode: 'mongodb', configured: true, ok: false, note: (err as Error).message };
	}
}

/** Guards the one-time seed so concurrent loads do not duplicate rows. */
export function onceSeeded(work: () => Promise<void>): Promise<void> {
	if (!cache.seeded) {
		cache.seeded = work().catch((err) => {
			cache.seeded = null;
			throw err;
		});
	}
	return cache.seeded;
}
