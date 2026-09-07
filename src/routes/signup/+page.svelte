<script lang="ts">
	import { enhance } from '$app/forms';
	import Icon from '$lib/components/Icon.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let submitting = $state(false);
	const errors = $derived((form?.errors ?? {}) as Record<string, string>);
</script>

<svelte:head>
	<title>Create your Aporia workspace</title>
</svelte:head>

<div class="auth">
	<div class="panel">
		<div class="mark" aria-hidden="true"><Icon name="release" size={18} /></div>
		<h1>Create your workspace</h1>
		<p class="muted lede">
			The first account becomes the workspace admin and starts with a demo cycle, projects and
			issues you can rename or delete.
		</p>

		{#if errors.form}
			<p class="banner" role="alert">{errors.form}</p>
		{/if}
		{#if !data.dbConfigured}
			<p class="banner" role="status">
				The workspace database is not attached yet, so sign up is unavailable. Set DATABASE_URL on
				this deployment.
			</p>
		{/if}

		<form
			method="POST"
			use:enhance={() => {
				submitting = true;
				return async ({ update }) => {
					await update();
					submitting = false;
				};
			}}
		>
			<div class="field">
				<label for="name">Full name</label>
				<input
					class="input"
					id="name"
					name="name"
					type="text"
					autocomplete="name"
					required
					value={form?.name ?? ''}
					aria-invalid={errors.name ? 'true' : undefined}
					aria-describedby={errors.name ? 'name-error' : undefined}
				/>
				{#if errors.name}<p class="hint-error" id="name-error">{errors.name}</p>{/if}
			</div>

			<div class="field">
				<label for="email">Work email</label>
				<input
					class="input"
					id="email"
					name="email"
					type="email"
					autocomplete="email"
					required
					value={form?.email ?? ''}
					aria-invalid={errors.email ? 'true' : undefined}
					aria-describedby={errors.email ? 'email-error' : undefined}
				/>
				{#if errors.email}<p class="hint-error" id="email-error">{errors.email}</p>{/if}
			</div>

			<div class="field">
				<label for="password">Password</label>
				<input
					class="input"
					id="password"
					name="password"
					type="password"
					autocomplete="new-password"
					required
					minlength="8"
					aria-invalid={errors.password ? 'true' : undefined}
					aria-describedby={errors.password ? 'password-error' : 'password-hint'}
				/>
				{#if errors.password}
					<p class="hint-error" id="password-error">{errors.password}</p>
				{:else}
					<p class="hint" id="password-hint">At least 8 characters. Stored hashed, never in clear.</p>
				{/if}
			</div>

			<button class="btn btn-primary submit" type="submit" disabled={submitting}>
				{submitting ? 'Creating workspace' : 'Create workspace'}
			</button>
		</form>

		<p class="alt">Already have an account? <a href="/login">Sign in</a></p>
	</div>

	<aside class="aside">
		<p class="eyebrow">What you get on day one</p>
		<ul class="points">
			<li>
				<span class="tick" aria-hidden="true"><Icon name="check" size={13} /></span>
				A seeded workspace with projects, issues and a release so nothing starts blank
			</li>
			<li>
				<span class="tick" aria-hidden="true"><Icon name="check" size={13} /></span>
				List and board views that share the same status and priority model
			</li>
			<li>
				<span class="tick" aria-hidden="true"><Icon name="check" size={13} /></span>
				Sessions held server side, so signing out ends them everywhere
			</li>
		</ul>
		<p class="shortcut">
			Press <span class="kbd">⌘</span><span class="kbd">K</span> anywhere once you are in.
		</p>
	</aside>
</div>

<style>
	.auth {
		min-height: 100vh;
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		align-items: center;
		gap: var(--space-10);
		padding: var(--space-8) var(--space-6);
		max-width: 1120px;
		margin: 0 auto;
	}

	.panel {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		width: 100%;
		max-width: 380px;
		margin-left: auto;
		background: var(--bg-surface);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-lg);
		padding: var(--space-6);
		box-shadow: var(--shadow-md);
	}

	.mark {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border-radius: var(--radius-sm);
		background: var(--accent-soft);
		color: var(--accent);
		border: 1px solid color-mix(in srgb, var(--accent) 32%, transparent);
	}

	h1 {
		font-size: var(--text-xl);
		letter-spacing: var(--tracking-tight);
	}

	.lede {
		font-size: var(--text-base);
		margin-bottom: var(--space-2);
	}

	form {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.submit {
		min-height: 36px;
		margin-top: var(--space-1);
	}

	.hint-error {
		font-size: var(--text-sm);
		color: var(--danger);
	}

	.hint {
		font-size: var(--text-sm);
		color: var(--text-tertiary);
	}

	input[aria-invalid='true'] {
		border-color: var(--danger);
	}

	.banner {
		font-size: var(--text-sm);
		color: var(--danger);
		background: color-mix(in srgb, var(--danger) 12%, transparent);
		border: 1px solid color-mix(in srgb, var(--danger) 36%, transparent);
		border-radius: var(--radius-sm);
		padding: var(--space-2) var(--space-3);
	}

	.alt {
		font-size: var(--text-sm);
		color: var(--text-tertiary);
		margin-top: var(--space-2);
	}

	.alt a {
		color: var(--accent);
		font-weight: var(--weight-medium);
	}

	.alt a:hover {
		text-decoration: underline;
	}

	.aside {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		max-width: 360px;
	}

	.points {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		color: var(--text-secondary);
	}

	.points li {
		display: flex;
		align-items: flex-start;
		gap: var(--space-2);
		line-height: var(--leading-normal);
	}

	.tick {
		color: var(--accent);
		margin-top: 2px;
		flex: none;
	}

	.shortcut {
		font-size: var(--text-sm);
		color: var(--text-tertiary);
		display: flex;
		align-items: center;
		gap: var(--space-1);
	}

	@media (max-width: 860px) {
		.auth {
			grid-template-columns: minmax(0, 1fr);
			gap: var(--space-6);
			align-content: center;
		}
		.panel,
		.aside {
			margin: 0 auto;
		}
	}
</style>
