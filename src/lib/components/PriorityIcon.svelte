<script lang="ts">
	import { PRIORITY_LABEL, PRIORITY_TOKEN, type IssuePriority } from '$lib/types';

	interface Props {
		priority: IssuePriority;
		size?: number;
	}

	let { priority, size = 14 }: Props = $props();

	const color = $derived(PRIORITY_TOKEN[priority]);
	const title = $derived(PRIORITY_LABEL[priority]);
	const bars = $derived(
		priority === 'high' ? 3 : priority === 'medium' ? 2 : priority === 'low' ? 1 : 0
	);
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
	{#if priority === 'urgent'}
		<rect x="2.4" y="2.4" width="11.2" height="11.2" rx="2.4" />
		<path d="M8 5v4.2" />
		<path d="M8 11.4h.01" stroke-width="1.9" />
	{:else if priority === 'none'}
		<path d="M3.5 8h9" stroke-dasharray="2 2" />
	{:else}
		<path d="M3.4 13V10" stroke-width="2" opacity={bars >= 1 ? 1 : 0.28} />
		<path d="M8 13V7.4" stroke-width="2" opacity={bars >= 2 ? 1 : 0.28} />
		<path d="M12.6 13V4.6" stroke-width="2" opacity={bars >= 3 ? 1 : 0.28} />
	{/if}
</svg>
