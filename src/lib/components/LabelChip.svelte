<script lang="ts">
	import type { Label } from '$lib/types';

	interface Props {
		label: Label;
	}

	let { label }: Props = $props();
</script>

<span class="chip" style="--chip-color: {label.colorToken}">
	<span class="chip-dot" aria-hidden="true"></span>{label.name}
</span>

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
