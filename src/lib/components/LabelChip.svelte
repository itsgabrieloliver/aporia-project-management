<script lang="ts">
	import type { Label } from '$lib/types';

	interface Props {
		label?: Label | null;
		name?: string;
		color?: string;
	}

	let { label, name, color }: Props = $props();

	// Support both the label object and individual name/color props
	const displayName = label?.name ?? name;
	const displayColor = label?.colorToken ?? color ?? 'var(--brown-500)';
</script>

{#if displayName}
	<span class="chip" style="--chip-color: {displayColor}">
		<span class="chip-dot" aria-hidden="true"></span>{displayName}
	</span>
{/if}

<style>
	.chip {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		height: 20px;
		padding: 0 var(--space-2);
		border-radius: var(--radius-full);
		border: 1px solid color-mix(in srgb, var(--chip-color) 38%, transparent);
		background: color-mix(in srgb, var(--chip-color) 12%, transparent);
		color: var(--text-secondary);
		font-size: var(--text-xs);
		white-space: nowrap;
	}

	.chip-dot {
		width: 6px;
		height: 6px;
		border-radius: var(--radius-full);
		background: var(--chip-color);
	}
</style>
