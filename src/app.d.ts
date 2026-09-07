import type { SessionUser } from '$lib/types';

declare global {
	namespace App {
		interface Error {
			message: string;
			code?: string;
		}
		interface Locals {
			/** Populated by the auth hook once a valid Redis session cookie is present. */
			user: SessionUser | null;
			sessionId: string | null;
		}
		interface PageData {
			user?: SessionUser | null;
		}
		interface Platform {}
	}
}

export {};
