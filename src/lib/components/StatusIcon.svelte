<script lang="ts">
	import { ISSUE_STATUS_LABEL, ISSUE_STATUS_TOKEN, type IssueStatus } from '$lib/types';

	interface Props {
		status: IssueStatus;
		size?: number;
	}

	let { status, size = 14 }: Props = $props();

	const color = $derived(ISSUE_STATUS_TOKEN[status]);
	const title = $derived(ISSUE_STATUS_LABEL[status]);
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 16 16"
	fill="none"
	stroke={color}
	stroke-width="1.6"
	stroke-linecap="round"
	role="img"
	aria-label={title}
>
	<title>{title}</title>
	{#if status === 'backlog'}
		<circle cx="8" cy="8" r="6" stroke-dasharray="2 2.2" />
	{:else if status === 'todo'}
		<circle cx="8" cy="8" r="6" />
	{:else if status === 'in_progress'}
		<circle cx="8" cy="8" r="6" />
		<path d="M8 8V3.2A4.8 4.8 0 0 1 12.8 8z" fill={color} stroke="none" />
	{:else if status === 'in_review'}
		<circle cx="8" cy="8" r="6" />
		<path d="M8 8V3.2A4.8 4.8 0 0 1 8 12.8z" fill={color} stroke="none" />
	{:else if status === 'done'}
		<circle cx="8" cy="8" r="6" fill={color} stroke="none" />
		<path d="M5.2 8.2 7.2 10.3 10.9 6" stroke="var(--bg-base)" stroke-width="1.7" />
	{:else}
		<circle cx="8" cy="8" r="6" />
		<path d="M5.8 5.8 10.2 10.2" />
	{/if}
</svg>
