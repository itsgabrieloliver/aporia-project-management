<script lang="ts">
	import { page } from '$app/stores';
	import Icon from '$lib/components/Icon.svelte';
</script>

<div class="page error">
	<p class="eyebrow">Error {$page.status}</p>
	<h1 class="page-title">{$page.error?.message ?? 'Something went wrong'}</h1>
	<p class="page-sub">
		{#if $page.status === 404}
			That route does not exist in this workspace. Check the issue key or use the command palette to
			jump somewhere else.
		{:else}
			The request failed on the server. Retrying usually works; if it does not, the details are in
			the runtime logs.
		{/if}
	</p>
	<div class="error-actions">
		<a class="btn btn-primary" href="/">
			<Icon name="dashboard" size={14} />
			Back to dashboard
		</a>
		<a class="btn" href="/issues">Open issues</a>
	</div>
</div>

<style>
	.error {
		max-width: 560px;
		padding-top: var(--space-20);
		gap: var(--space-3);
	}

	.error-actions {
		display: flex;
		gap: var(--space-2);
	}
</style>
