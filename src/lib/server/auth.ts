/**
 * Password hashing, session creation and revocation.
 *
 * Sessions live in Redis (session id to user id, with a TTL) and are mirrored
 * into MongoDB so the team can audit and revoke them. The cookie is httpOnly,
 * sameSite=lax and secure outside development.
 */
import { randomBytes, randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { dev } from '$app/environment';
import type { Cookies } from '@sveltejs/kit';
import { collections, plain } from './db';
import { SESSION_TTL_SECONDS, dropSession, putSession, readSession } from './redis';
import type { SessionUser, User } from '$lib/types';

export const SESSION_COOKIE = 'aporia_session';

const AVATAR_COLORS = [
	'var(--accent)',
	'var(--label-feature)',
	'var(--label-improvement)',
	'var(--label-design)',
	'var(--label-docs)',
	'var(--label-bug)'
];

export async function hashPassword(password: string): Promise<string> {
	return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
	if (!hash) return false;
	try {
		return await bcrypt.compare(password, hash);
	} catch {
		return false;
	}
}

export function toSessionUser(user: User): SessionUser {
	return {
		id: user.id,
		email: user.email,
		name: user.name,
		handle: user.handle,
		role: user.role,
		initials: user.initials,
		avatarColor: user.avatarColor,
		theme: user.theme
	};
}

export function initialsFor(name: string): string {
	const parts = name.trim().split(/\s+/).filter(Boolean);
	if (parts.length === 0) return 'AP';
	if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
	return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function handleFor(email: string): string {
	return email.split('@')[0].replace(/[^a-z0-9._-]/gi, '').toLowerCase() || 'member';
}

export function colorFor(seed: string): string {
	let sum = 0;
	for (const ch of seed) sum += ch.charCodeAt(0);
	return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

export async function findUserByEmail(email: string): Promise<User | null> {
	const users = await collections.users();
	return plain<User>(await users.findOne({ email: email.toLowerCase().trim() }));
}

export async function findUserById(id: string): Promise<User | null> {
	const users = await collections.users();
	return plain<User>(await users.findOne({ id }));
}

export interface CreateUserInput {
	email: string;
	name: string;
	password: string;
	role?: 'admin' | 'member';
}

export async function createUser(input: CreateUserInput): Promise<User> {
	const users = await collections.users();
	const email = input.email.toLowerCase().trim();
	const user: User = {
		id: randomUUID(),
		email,
		name: input.name.trim(),
		handle: handleFor(email),
		role: input.role ?? 'member',
		initials: initialsFor(input.name),
		avatarColor: colorFor(email),
		passwordHash: await hashPassword(input.password),
		theme: 'dark',
		createdAt: new Date().toISOString()
	};
	await users.insertOne({ ...user });
	return user;
}

export async function createSession(
	userId: string,
	cookies: Cookies,
	meta: { userAgent?: string; ip?: string } = {}
): Promise<string> {
	const sessionId = randomBytes(24).toString('base64url');
	const now = new Date();
	const expiresAt = new Date(now.getTime() + SESSION_TTL_SECONDS * 1000);

	await putSession(sessionId, userId);

	try {
		const sessions = await collections.sessions();
		await sessions.insertOne({
			id: sessionId,
			userId,
			createdAt: now.toISOString(),
			expiresAt: expiresAt.toISOString(),
			userAgent: meta.userAgent,
			ip: meta.ip
		});
	} catch (err) {
		console.error('[aporia] session mirror write failed:', (err as Error).message);
	}

	cookies.set(SESSION_COOKIE, sessionId, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: !dev,
		maxAge: SESSION_TTL_SECONDS
	});

	return sessionId;
}

export async function revokeSession(sessionId: string | null, cookies: Cookies) {
	cookies.delete(SESSION_COOKIE, { path: '/' });
	if (!sessionId) return;
	await dropSession(sessionId);
	try {
		const sessions = await collections.sessions();
		await sessions.deleteOne({ id: sessionId });
	} catch (err) {
		console.error('[aporia] session mirror delete failed:', (err as Error).message);
	}
}

/** Resolves a cookie value into a safe session user, or null. */
export async function resolveSession(sessionId: string): Promise<SessionUser | null> {
	const userId = await readSession(sessionId);
	if (!userId) return null;
	const user = await findUserById(userId);
	return user ? toSessionUser(user) : null;
}

export async function setThemePreference(userId: string, theme: 'dark' | 'light') {
	const users = await collections.users();
	await users.updateOne({ id: userId }, { $set: { theme } });
}

/* ---------- validation ---------- */

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateSignup(fields: { email: string; name: string; password: string }) {
	const errors: Record<string, string> = {};
	if (!fields.name || fields.name.trim().length < 2) {
		errors.name = 'Enter your full name, at least 2 characters.';
	}
	if (!EMAIL_RE.test(fields.email.trim())) {
		errors.email = 'Enter a valid work email address.';
	}
	if (!fields.password || fields.password.length < 8) {
		errors.password = 'Use at least 8 characters.';
	}
	return errors;
}

export function validateLogin(fields: { email: string; password: string }) {
	const errors: Record<string, string> = {};
	if (!EMAIL_RE.test(fields.email.trim())) errors.email = 'Enter a valid email address.';
	if (!fields.password) errors.password = 'Enter your password.';
	return errors;
}
