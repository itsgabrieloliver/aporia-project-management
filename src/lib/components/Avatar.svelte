<script lang="ts">
	interface Props {
		initials?: string | null;
		color?: string;
		name?: string;
		size?: number;
	}

	let { initials = null, color = 'var(--border-strong)', name = 'Unassigned', size = 22 }: Props =
		$props();
</script>

{#if initials}
	<span
		class="avatar"
		style="--avatar-size: {size}px; --avatar-color: {color}"
		title={name}
		aria-label={name}
		role="img">{initials}</span
	>
{:else}
	<span
		class="avatar avatar-empty"
		style="--avatar-size: {size}px"
		title="Unassigned"
		aria-label="Unassigned"
		role="img"
	>
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
			<circle cx="12" cy="9" r="3.2" />
			<path d="M5.5 19.5a6.5 6.5 0 0 1 13 0" stroke-linecap="round" />
		</svg>
	</span>
{/if}

<style>
	.avatar {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: var(--avatar-size);
		height: var(--avatar-size);
		border-radius: var(--radius-full);
		background: color-mix(in srgb, var(--avatar-color) 24%, var(--bg-surface));
		color: var(--avatar-color);
		border: 1px solid color-mix(in srgb, var(--avatar-color) 42%, transparent);
		font-size: var(--text-2xs);
		font-weight: var(--weight-semibold);
		letter-spacing: 0.02em;
		flex: none;
		user-select: none;
	}

	.avatar-empty {
		background: transparent;
		color: var(--text-tertiary);
		border: 1px dashed var(--border-default);
	}

	.avatar-empty svg {
		width: 68%;
		height: 68%;
	}
</style>
