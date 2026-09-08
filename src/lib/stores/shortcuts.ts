import { writable } from 'svelte/store';

/**
 * Cross-route signal bus for global keyboard shortcuts that need to reach a
 * page component that may already be mounted (so a full navigation would be
 * wasteful) — e.g. pressing "C" or "B" while already on /issues.
 * Each store is a monotonically increasing counter; consumers watch for the
 * value changing rather than caring about the value itself.
 */
export const createIssueRequest = writable(0);
export const boardToggleRequest = writable(0);
export const closeRequest = writable(0);
