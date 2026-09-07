/** Presentation helpers shared by client and server. No data access here. */

export function formatDate(value: string | null | undefined): string {
	if (!value) return 'No date';
	const d = new Date(value);
	if (Number.isNaN(d.getTime())) return 'No date';
	return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatFullDate(value: string | null | undefined): string {
	if (!value) return 'No date';
	const d = new Date(value);
	if (Number.isNaN(d.getTime())) return 'No date';
	return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function relativeTime(value: string | null | undefined): string {
	if (!value) return '';
	const then = new Date(value).getTime();
	if (Number.isNaN(then)) return '';
	const minutes = Math.round((Date.now() - then) / 60000);
	if (minutes < 1) return 'just now';
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.round(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.round(hours / 24);
	if (days < 30) return `${days}d ago`;
	return formatDate(value);
}

export function daysUntil(value: string | null | undefined): number | null {
	if (!value) return null;
	const target = new Date(value).getTime();
	if (Number.isNaN(target)) return null;
	return Math.ceil((target - Date.now()) / 86400000);
}

export function percent(part: number, whole: number): number {
	if (!whole) return 0;
	return Math.round((part / whole) * 100);
}
