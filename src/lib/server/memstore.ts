/**
 * In-memory document store used when MongoDB cannot be reached.
 *
 * It implements the small slice of the MongoDB collection API that
 * `queries.ts`, `auth.ts` and `seed.ts` actually use, so the rest of the app
 * is identical in both modes: the same seeding code, the same reads and the
 * same writes run against either backend.
 *
 * Documents live in a process-global Map so hot reloads keep the workspace.
 */

export type Doc = Record<string, unknown>;
export type Filter = Doc;
export type SortSpec = Record<string, 1 | -1>;

export interface FindOptions {
	projection?: Record<string, 0 | 1>;
	limit?: number;
	sort?: SortSpec;
}

export interface DataCursor<T> {
	sort(spec: SortSpec): DataCursor<T>;
	limit(count: number): DataCursor<T>;
	toArray(): Promise<T[]>;
}

export interface DataCollection<T> {
	find(filter?: Filter, options?: FindOptions): DataCursor<T>;
	findOne(filter: Filter, options?: FindOptions): Promise<T | null>;
	insertOne(doc: Doc): Promise<{ insertedId: string }>;
	insertMany(docs: Doc[]): Promise<{ insertedCount: number }>;
	updateOne(
		filter: Filter,
		update: Doc,
		options?: { upsert?: boolean }
	): Promise<{ matchedCount: number; modifiedCount: number }>;
	deleteOne(filter: Filter): Promise<{ deletedCount: number }>;
	countDocuments(filter?: Filter, options?: { limit?: number }): Promise<number>;
	findOneAndUpdate(
		filter: Filter,
		update: Doc,
		options?: { returnDocument?: 'before' | 'after'; projection?: Record<string, 0 | 1> }
	): Promise<T | null>;
	aggregate<R>(pipeline: Doc[]): { toArray(): Promise<R[]> };
	createIndex(spec: Doc, options?: Doc): Promise<string>;
}

const globalForMem = globalThis as unknown as { __aporiaMem?: Map<string, Doc[]> };
const store: Map<string, Doc[]> = (globalForMem.__aporiaMem ??= new Map());

function bucket(name: string): Doc[] {
	let rows = store.get(name);
	if (!rows) {
		rows = [];
		store.set(name, rows);
	}
	return rows;
}

function clone<T>(value: T): T {
	return JSON.parse(JSON.stringify(value)) as T;
}

function compareValues(a: unknown, b: unknown): number {
	if (a === b) return 0;
	if (a === undefined || a === null) return -1;
	if (b === undefined || b === null) return 1;
	if (typeof a === 'number' && typeof b === 'number') return a - b;
	return String(a).localeCompare(String(b));
}

function matchesOperators(value: unknown, ops: Doc): boolean {
	for (const [op, expected] of Object.entries(ops)) {
		switch (op) {
			case '$in':
				if (!Array.isArray(expected) || !expected.includes(value)) return false;
				break;
			case '$nin':
				if (Array.isArray(expected) && expected.includes(value)) return false;
				break;
			case '$ne':
				if (value === expected) return false;
				break;
			case '$exists':
				if ((value !== undefined) !== Boolean(expected)) return false;
				break;
			case '$gte':
				if (compareValues(value, expected) < 0) return false;
				break;
			case '$lte':
				if (compareValues(value, expected) > 0) return false;
				break;
			default:
				if (value !== expected) return false;
		}
	}
	return true;
}

function matches(doc: Doc, filter: Filter): boolean {
	for (const [key, expected] of Object.entries(filter)) {
		const actual = doc[key];
		if (expected && typeof expected === 'object' && !Array.isArray(expected)) {
			const ops = expected as Doc;
			const isOperator = Object.keys(ops).some((k) => k.startsWith('$'));
			if (isOperator) {
				if (!matchesOperators(actual, ops)) return false;
				continue;
			}
		}
		if (Array.isArray(actual)) {
			if (!actual.includes(expected)) return false;
			continue;
		}
		if (actual !== expected) return false;
	}
	return true;
}

function project<T>(doc: Doc, projection?: Record<string, 0 | 1>): T {
	const copy = clone(doc);
	if (!projection) return copy as T;
	const included = Object.entries(projection).filter(([key, v]) => v === 1 && key !== '_id');
	if (included.length > 0) {
		const keep = new Set(included.map(([key]) => key));
		for (const key of Object.keys(copy)) {
			if (!keep.has(key)) delete copy[key];
		}
		return copy as T;
	}
	for (const [key, v] of Object.entries(projection)) {
		if (v === 0) delete copy[key];
	}
	return copy as T;
}

function sortRows(rows: Doc[], spec: SortSpec): Doc[] {
	const entries = Object.entries(spec);
	if (entries.length === 0) return rows;
	return [...rows].sort((a, b) => {
		for (const [key, dir] of entries) {
			const result = compareValues(a[key], b[key]);
			if (result !== 0) return dir === -1 ? -result : result;
		}
		return 0;
	});
}

function applyUpdate(doc: Doc, update: Doc) {
	const set = update.$set as Doc | undefined;
	if (set) for (const [key, value] of Object.entries(set)) doc[key] = value;
	const unset = update.$unset as Doc | undefined;
	if (unset) for (const key of Object.keys(unset)) delete doc[key];
	const inc = update.$inc as Record<string, number> | undefined;
	if (inc) {
		for (const [key, delta] of Object.entries(inc)) {
			doc[key] = (typeof doc[key] === 'number' ? (doc[key] as number) : 0) + delta;
		}
	}
	const push = update.$push as Doc | undefined;
	if (push) {
		for (const [key, value] of Object.entries(push)) {
			const list = Array.isArray(doc[key]) ? (doc[key] as unknown[]) : [];
			list.push(value);
			doc[key] = list;
		}
	}
	const addToSet = update.$addToSet as Doc | undefined;
	if (addToSet) {
		for (const [key, value] of Object.entries(addToSet)) {
			const list = Array.isArray(doc[key]) ? (doc[key] as unknown[]) : [];
			if (!list.includes(value)) list.push(value);
			doc[key] = list;
		}
	}
}

/** Narrow `$group` support: `_id` as a field reference plus `$sum` accumulators. */
function runAggregate<R>(rows: Doc[], pipeline: Doc[]): R[] {
	let current = rows.map((row) => clone(row));
	for (const stage of pipeline) {
		if (stage.$match) {
			current = current.filter((row) => matches(row, stage.$match as Filter));
		} else if (stage.$sort) {
			current = sortRows(current, stage.$sort as SortSpec);
		} else if (stage.$limit) {
			current = current.slice(0, Number(stage.$limit));
		} else if (stage.$group) {
			const group = stage.$group as Doc;
			const idSpec = group._id;
			const buckets = new Map<string, Doc>();
			for (const row of current) {
				const key =
					typeof idSpec === 'string' && idSpec.startsWith('$')
						? String(row[idSpec.slice(1)])
						: String(idSpec);
				let target = buckets.get(key);
				if (!target) {
					target = { _id: typeof idSpec === 'string' && idSpec.startsWith('$') ? row[idSpec.slice(1)] : idSpec };
					buckets.set(key, target);
				}
				for (const [field, accumulator] of Object.entries(group)) {
					if (field === '_id') continue;
					const acc = accumulator as Doc;
					if ('$sum' in acc) {
						const raw = acc.$sum;
						const delta =
							typeof raw === 'string' && raw.startsWith('$') ? Number(row[raw.slice(1)] ?? 0) : Number(raw);
						target[field] = (Number(target[field]) || 0) + (Number.isFinite(delta) ? delta : 0);
					}
				}
			}
			current = [...buckets.values()];
		}
	}
	return current as R[];
}

function cursorFor<T>(name: string, filter: Filter, options: FindOptions): DataCursor<T> {
	let sortSpec: SortSpec = options.sort ?? {};
	let take = options.limit ?? Infinity;

	const cursor: DataCursor<T> = {
		sort(spec) {
			sortSpec = spec;
			return cursor;
		},
		limit(count) {
			take = count;
			return cursor;
		},
		async toArray() {
			let rows = bucket(name).filter((row) => matches(row, filter));
			rows = sortRows(rows, sortSpec);
			if (Number.isFinite(take)) rows = rows.slice(0, take);
			return rows.map((row) => project<T>(row, options.projection));
		}
	};
	return cursor;
}

export function memoryCollection<T>(name: string): DataCollection<T> {
	return {
		find(filter = {}, options = {}) {
			return cursorFor<T>(name, filter, options);
		},
		async findOne(filter, options = {}) {
			const row = bucket(name).find((candidate) => matches(candidate, filter));
			return row ? project<T>(row, options.projection) : null;
		},
		async insertOne(doc) {
			bucket(name).push(clone(doc));
			return { insertedId: String(doc.id ?? '') };
		},
		async insertMany(docs) {
			for (const doc of docs) bucket(name).push(clone(doc));
			return { insertedCount: docs.length };
		},
		async updateOne(filter, update, options = {}) {
			const rows = bucket(name);
			const row = rows.find((candidate) => matches(candidate, filter));
			if (row) {
				applyUpdate(row, update);
				return { matchedCount: 1, modifiedCount: 1 };
			}
			if (options.upsert) {
				const created: Doc = { ...clone(filter) };
				applyUpdate(created, update);
				rows.push(created);
			}
			return { matchedCount: 0, modifiedCount: 0 };
		},
		async deleteOne(filter) {
			const rows = bucket(name);
			const index = rows.findIndex((candidate) => matches(candidate, filter));
			if (index === -1) return { deletedCount: 0 };
			rows.splice(index, 1);
			return { deletedCount: 1 };
		},
		async countDocuments(filter = {}, options = {}) {
			const rows = bucket(name).filter((row) => matches(row, filter));
			return options.limit ? Math.min(rows.length, options.limit) : rows.length;
		},
		async findOneAndUpdate(filter, update, options = {}) {
			const row = bucket(name).find((candidate) => matches(candidate, filter));
			if (!row) return null;
			const before = clone(row);
			applyUpdate(row, update);
			const result = options.returnDocument === 'before' ? before : row;
			return project<T>(result, options.projection);
		},
		aggregate<R>(pipeline: Doc[]) {
			return {
				async toArray() {
					return runAggregate<R>(bucket(name), pipeline);
				}
			};
		},
		async createIndex() {
			return 'memory-index';
		}
	};
}

/** True when nothing has been written yet in this process. */
export function memoryIsEmpty(): boolean {
	for (const rows of store.values()) if (rows.length > 0) return false;
	return true;
}

export function memorySnapshot(): Record<string, number> {
	const out: Record<string, number> = {};
	for (const [name, rows] of store.entries()) out[name] = rows.length;
	return out;
}
