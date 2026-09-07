<script lang="ts">
	import { enhance } from '$app/forms';
	import Icon from '$lib/components/Icon.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let submitting = $state(false);
	const errors = $derived((form?.errors ?? {}) as Record<string, string>);

	function fillDemo() {
		const email = document.getElementById('email') as HTMLInputElement | null;
		const password = document.getElementById('password') as HTMLInputElement | null;
		if (email) email.value = data.demo.email;
		if (password) password.value = data.demo.password;
		password?.focus();
	}
</script>

<svelte:head>
	<title>Sign in to Aporia</title>
</svelte:head>

<div class="auth">
	<div class="panel">
		<div class="mark" aria-hidden="true"><Icon name="release" size={18} /></div>
		<h1>Sign in to Aporia</h1>
		<p class="muted lede">Pick up your cycle, releases and assigned issues where you left them.</p>

		{#if errors.form}
			<p class="banner" role="alert">{errors.form}</p>
		{/if}
		<div class="demo">
			<p class="demo-title">Demo account</p>
			<p class="demo-row">
				<span class="mono">{data.demo.email}</span>
				<span class="mono">{data.demo.password}</span>
			</p>
			<button class="btn demo-fill" type="button" onclick={fillDemo}>Use demo credentials</button>
		</div>

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
			<input type="hidden" name="redirectTo" value={data.redirectTo} />

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
					autocomplete="current-password"
					required
					aria-invalid={errors.password ? 'true' : undefined}
					aria-describedby={errors.password ? 'password-error' : undefined}
				/>
				{#if errors.password}<p class="hint-error" id="password-error">{errors.password}</p>{/if}
			</div>

			<button class="btn btn-primary submit" type="submit" disabled={submitting}>
				{submitting ? 'Signing in' : 'Sign in'}
			</button>
		</form>

		<p class="alt">
			No account yet? <a href="/signup">Create a workspace</a>
		</p>
	</div>

	<aside class="aside">
		<p class="eyebrow">Built for engineering teams</p>
		<ul class="points">
			<li><span class="tick" aria-hidden="true"><Icon name="check" size={13} /></span> Issue list and board views with keyboard-first navigation</li>
			<li><span class="tick" aria-hidden="true"><Icon name="check" size={13} /></span> Releases with linked issues and a written changelog</li>
			<li><span class="tick" aria-hidden="true"><Icon name="check" size={13} /></span> Cycle progress and project targets on one dashboard</li>
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

	.demo {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		align-items: flex-start;
		background: var(--bg-subtle, var(--accent-soft));
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-sm);
		padding: var(--space-3);
	}

	.demo-title {
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		color: var(--text-secondary);
	}

	.demo-row {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-1) var(--space-3);
	}

	.mono {
		font-family: var(--font-mono);
		font-size: var(--text-sm);
		color: var(--text-primary);
	}

	.demo-fill {
		min-height: 28px;
		font-size: var(--text-sm);
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
		.panel {
			margin: 0 auto;
		}
		.aside {
			margin: 0 auto;
		}
	}
</style>
