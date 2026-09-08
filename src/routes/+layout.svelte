<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import Icon from '$lib/components/Icon.svelte';
	import Avatar from '$lib/components/Avatar.svelte';
	import CommandPalette from '$lib/components/CommandPalette.svelte';
	import { goto } from '$app/navigation';
	import { createIssueRequest, boardToggleRequest, closeRequest } from '$lib/stores/shortcuts';
	import type { NavItem } from '$lib/icons';
	import type { LayoutData } from './$types';

	let { children, data }: { children: import('svelte').Snippet; data: LayoutData } = $props();

	/** Auth screens render bare, with no sidebar or top bar. */
	const BARE_ROUTES = ['/login', '/signup', '/logout'];

	const primaryNav: NavItem[] = [
		{ href: '/inbox', label: 'Inbox', icon: 'inbox', count: 3 },
		{ href: '/my-issues', label: 'My issues', icon: 'user', count: 4 },
		{ href: '/', label: 'Dashboard', icon: 'dashboard' }
	];

	const workspaceNav: NavItem[] = [
		{ href: '/projects', label: 'Projects', icon: 'project' },
		{ href: '/issues', label: 'Issues', icon: 'issue' },
		{ href: '/releases', label: 'Releases', icon: 'release' },
		{ href: '/team', label: 'Team', icon: 'team' },
		{ href: '/settings', label: 'Settings', icon: 'settings' }
	];

	const crumbs: Record<string, string> = {
		'/': 'Dashboard',
		'/inbox': 'Inbox',
		'/my-issues': 'My issues',
		'/projects': 'Projects',
		'/issues': 'Issues',
		'/releases': 'Releases',
		'/team': 'Team',
		'/settings': 'Settings'
	};

	let theme = $state<'dark' | 'light'>('dark');
	let paletteOpen = $state(false);
	let sidebarOpen = $state(false);
	let railed = $state(false);

	function toggleRail() {
		railed = !railed;
		try {
			localStorage.setItem('aporia:rail', railed ? '1' : '0');
		} catch {
			/* storage blocked, rail state stays for this session only */
		}
	}

	const currentPath = $derived($page.url.pathname);
	const crumb = $derived(crumbs[currentPath] ?? 'Workspace');
	const bare = $derived(BARE_ROUTES.includes(currentPath) || !data.user);
	const user = $derived(data.user);

	function isActive(href: string): boolean {
		return href === '/' ? currentPath === '/' : currentPath.startsWith(href);
	}

	function applyTheme(next: 'dark' | 'light') {
		theme = next;
		document.documentElement.dataset.theme = next;
		try {
			localStorage.setItem('aporia:theme', next);
		} catch {
			/* storage blocked, theme stays for this session only */
		}
	}

	function toggleTheme() {
		applyTheme(theme === 'dark' ? 'light' : 'dark');
	}

	/** "g" prefix state for two-key nav shortcuts (g then d/i/p/r/t). */
	let gPending = $state(false);
	let gTimer: ReturnType<typeof setTimeout> | undefined;

	const GO_ROUTES: Record<string, string> = {
		d: '/',
		i: '/issues',
		p: '/projects',
		r: '/releases',
		t: '/team'
	};

	function clearGPending() {
		gPending = false;
		if (gTimer) clearTimeout(gTimer);
		gTimer = undefined;
	}

	function onKeydown(event: KeyboardEvent) {
		const target = event.target as HTMLElement | null;
		const typing =
			target instanceof HTMLInputElement ||
			target instanceof HTMLTextAreaElement ||
			target instanceof HTMLSelectElement ||
			target?.isContentEditable === true;

		if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
			event.preventDefault();
			paletteOpen = true;
			return;
		}

		if (event.key === 'Escape') {
			clearGPending();
			if (paletteOpen) {
				paletteOpen = false;
				return;
			}
			if (sidebarOpen) {
				sidebarOpen = false;
				return;
			}
			closeRequest.update((n) => n + 1);
			return;
		}

		if (typing || event.metaKey || event.ctrlKey || event.altKey) return;

		if (event.key === '/') {
			event.preventDefault();
			paletteOpen = true;
			return;
		}

		if (gPending) {
			const key = event.key.toLowerCase();
			const href = GO_ROUTES[key];
			clearGPending();
			if (href) {
				event.preventDefault();
				goto(href);
			}
			return;
		}

		if (event.key.toLowerCase() === 'g') {
			gPending = true;
			gTimer = setTimeout(clearGPending, 800);
			return;
		}

		if (event.key.toLowerCase() === 'c') {
			event.preventDefault();
			if (currentPath === '/issues') {
				createIssueRequest.update((n) => n + 1);
			} else {
				goto('/issues?new=1');
			}
			return;
		}

		if (event.key.toLowerCase() === 'b') {
			if (currentPath === '/issues') {
				event.preventDefault();
				boardToggleRequest.update((n) => n + 1);
			}
			return;
		}
	}

	onMount(() => {
		const stored = localStorage.getItem('aporia:theme');
		theme = stored === 'light' ? 'light' : 'dark';
		document.documentElement.dataset.theme = theme;
		railed = localStorage.getItem('aporia:rail') === '1';
	});

	$effect(() => {
		currentPath;
		sidebarOpen = false;
	});
</script>

<svelte:window on:keydown={onKeydown} />

<svelte:head>
	<title>Aporia</title>
</svelte:head>

{#if bare}
	<main class="bare">
		{@render children?.()}
	</main>
{:else}
<div class="shell" class:sidebar-open={sidebarOpen} class:railed>
	<aside class="sidebar" aria-label="Workspace navigation">
		<div class="workspace">
			<span class="workspace-mark" aria-hidden="true">
				<Icon name="release" size={15} />
			</span>
			<span class="workspace-name rail-hide">Aporia</span>
			<span class="workspace-plan rail-hide">beta</span>
			<button
				class="btn btn-ghost btn-icon rail-toggle"
				type="button"
				onclick={toggleRail}
				aria-label={railed ? 'Expand sidebar' : 'Collapse sidebar to icons'}
				title={railed ? 'Expand sidebar' : 'Collapse sidebar'}
			>
				<Icon name="chevron-right" size={14} />
			</button>
		</div>

		<button class="new-issue btn btn-primary" type="button" onclick={() => (paletteOpen = true)}>
			<Icon name="plus" size={14} />
			<span class="rail-hide">New issue</span>
			<span class="kbd new-issue-kbd rail-hide">C</span>
		</button>

		<nav class="nav">
			<ul>
				{#each primaryNav as item}
					<li>
						<a
							href={item.href}
							class="nav-link"
							class:active={isActive(item.href)}
							title={item.label}
						>
							<Icon name={item.icon} size={15} />
							<span class="rail-hide">{item.label}</span>
							{#if item.count}<span class="nav-count rail-hide">{item.count}</span>{/if}
						</a>
					</li>
				{/each}
			</ul>

			<p class="nav-heading rail-hide">Workspace</p>
			<ul>
				{#each workspaceNav as item}
					<li>
						<a
							href={item.href}
							class="nav-link"
							class:active={isActive(item.href)}
							title={item.label}
						>
							<Icon name={item.icon} size={15} />
							<span class="rail-hide">{item.label}</span>
						</a>
					</li>
				{/each}
			</ul>
		</nav>

		<div class="sidebar-foot">
			<a class="account" href="/settings">
				<Avatar
					initials={user?.initials ?? 'AP'}
					color={user?.avatarColor}
					name={user?.name}
					size={24}
				/>
				<span class="account-text rail-hide">
					<span class="account-name">{user?.name ?? 'Signed out'}</span>
					<span class="account-mail">{user?.email ?? ''}</span>
				</span>
			</a>
			<form method="POST" action="/logout" class="signout-form rail-hide">
				<button class="btn btn-ghost signout" type="submit">Sign out</button>
			</form>
		</div>
	</aside>

	<div class="main">
		<header class="topbar">
			<button
				class="btn btn-ghost btn-icon menu-toggle"
				type="button"
				aria-label="Toggle navigation"
				aria-expanded={sidebarOpen}
				onclick={() => (sidebarOpen = !sidebarOpen)}
			>
				<Icon name="list" size={16} />
			</button>

			<nav class="breadcrumb" aria-label="Breadcrumb">
				<a href="/">Aporia</a>
				<Icon name="chevron-right" size={13} />
				<span aria-current="page">{crumb}</span>
			</nav>

			<div class="topbar-actions">
				<button class="search-trigger" type="button" onclick={() => (paletteOpen = true)}>
					<Icon name="search" size={14} />
					<span>Search or jump to</span>
					<span class="kbd">⌘</span><span class="kbd">K</span>
				</button>
				<button
					class="btn btn-ghost btn-icon"
					type="button"
					onclick={toggleTheme}
					aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
					title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
				>
					<Icon name={theme === 'dark' ? 'sun' : 'moon'} size={16} />
				</button>
			</div>
		</header>

		<main class="content">
			{@render children?.()}
		</main>
	</div>

	{#if sidebarOpen}
		<button
			class="scrim"
			type="button"
			aria-label="Close navigation"
			onclick={() => (sidebarOpen = false)}
		></button>
	{/if}
</div>

<CommandPalette bind:open={paletteOpen} index={data.palette} />
{/if}

<style>
	.bare {
		display: block;
		min-height: 100vh;
	}

	.signout-form {
		margin-top: var(--space-1);
	}

	.signout {
		width: 100%;
		justify-content: flex-start;
		min-height: 30px;
		font-size: var(--text-sm);
		color: var(--text-tertiary);
	}

	.shell {
		display: grid;
		grid-template-columns: var(--sidebar-width) minmax(0, 1fr);
		min-height: 100vh;
		transition: grid-template-columns var(--dur-base) var(--ease-out);
	}

	.shell.railed {
		grid-template-columns: var(--sidebar-rail) minmax(0, 1fr);
	}

	.rail-toggle {
		margin-left: auto;
		min-width: 24px;
		min-height: 24px;
		color: var(--text-tertiary);
		transition: transform var(--dur-hover) var(--ease-out);
		transform: rotate(180deg);
	}

	.shell.railed .rail-toggle {
		transform: rotate(0deg);
		margin-left: 0;
	}

	.shell.railed .rail-hide {
		display: none;
	}

	.shell.railed .sidebar {
		padding: var(--space-3) var(--space-2);
		align-items: center;
	}

	.shell.railed .workspace {
		flex-direction: column;
		gap: var(--space-2);
		padding: var(--space-1) 0;
	}

	.shell.railed .nav-link,
	.shell.railed .new-issue,
	.shell.railed .account {
		justify-content: center;
		padding: 0;
	}

	.shell.railed .nav ul {
		width: 100%;
	}

	.sidebar {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		padding: var(--space-3);
		background: var(--bg-sidebar);
		border-right: 1px solid var(--border-subtle);
		position: sticky;
		top: 0;
		height: 100vh;
	}

	.workspace {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-1) var(--space-2);
	}

	.workspace-mark {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 22px;
		height: 22px;
		border-radius: var(--radius-sm);
		background: var(--accent-soft);
		color: var(--accent);
		border: 1px solid color-mix(in srgb, var(--accent) 32%, transparent);
	}

	.workspace-name {
		font-size: var(--text-md);
		font-weight: var(--weight-semibold);
	}

	.workspace-plan {
		font-size: var(--text-2xs);
		text-transform: uppercase;
		letter-spacing: var(--tracking-wide);
		color: var(--text-tertiary);
		border: 1px solid var(--border-default);
		border-radius: var(--radius-xs);
		padding: 0 var(--space-1);
	}

	.new-issue {
		justify-content: flex-start;
		min-height: 34px;
	}

	.new-issue-kbd {
		margin-left: auto;
		color: var(--accent-fg);
		border-color: color-mix(in srgb, var(--accent-fg) 30%, transparent);
		background: color-mix(in srgb, var(--accent-fg) 12%, transparent);
	}

	.nav {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		overflow-y: auto;
	}

	.nav ul {
		display: flex;
		flex-direction: column;
		gap: var(--space-0-5);
	}

	.nav-heading {
		font-size: var(--text-xs);
		text-transform: uppercase;
		letter-spacing: var(--tracking-wide);
		color: var(--text-tertiary);
		padding: 0 var(--space-2);
		margin-bottom: var(--space-1);
	}

	.nav-link {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		min-height: 30px;
		padding: 0 var(--space-2);
		border-radius: var(--radius-sm);
		color: var(--text-secondary);
		font-size: var(--text-base);
		font-weight: var(--weight-medium);
		transition:
			background var(--dur-fast) var(--ease-out),
			color var(--dur-fast) var(--ease-out);
	}

	.nav-link:hover {
		background: var(--bg-hover);
		color: var(--text-primary);
	}

	.nav-link.active {
		background: var(--bg-active);
		color: var(--text-primary);
	}

	.nav-count {
		margin-left: auto;
		font-size: var(--text-xs);
		font-family: var(--font-mono);
		color: var(--text-tertiary);
	}

	.sidebar-foot {
		margin-top: auto;
	}

	.account {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2);
		border-radius: var(--radius-md);
		transition: background var(--dur-fast) var(--ease-out);
	}

	.account:hover {
		background: var(--bg-hover);
	}

	.account-text {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.account-name {
		font-size: var(--text-base);
		font-weight: var(--weight-medium);
	}

	.account-mail {
		font-size: var(--text-xs);
		color: var(--text-tertiary);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.main {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.topbar {
		position: sticky;
		top: 0;
		z-index: 5;
		display: flex;
		align-items: center;
		gap: var(--space-3);
		height: var(--topbar-height);
		padding: 0 var(--space-4);
		background: color-mix(in srgb, var(--bg-base) 88%, transparent);
		backdrop-filter: blur(8px);
		border-bottom: 1px solid var(--border-subtle);
	}

	.breadcrumb {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		color: var(--text-tertiary);
		font-size: var(--text-base);
		min-width: 0;
	}

	.breadcrumb a:hover {
		color: var(--text-primary);
	}

	.breadcrumb span[aria-current] {
		color: var(--text-primary);
		font-weight: var(--weight-medium);
	}

	.topbar-actions {
		margin-left: auto;
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.search-trigger {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		min-height: 30px;
		width: 260px;
		padding: 0 var(--space-2);
		background: var(--bg-inset);
		border: 1px solid var(--border-default);
		border-radius: var(--radius-sm);
		color: var(--text-tertiary);
		font-size: var(--text-base);
		cursor: pointer;
		transition: border-color var(--dur-fast) var(--ease-out);
	}

	.search-trigger:hover {
		border-color: var(--border-strong);
		color: var(--text-secondary);
	}

	.search-trigger span:first-of-type {
		margin-right: auto;
	}

	.menu-toggle {
		display: none;
	}

	.content {
		flex: 1;
		min-width: 0;
	}

	.scrim {
		display: none;
	}

	@media (max-width: 900px) {
		.search-trigger {
			width: 180px;
		}
		.search-trigger span:first-of-type {
			display: none;
		}
	}

	@media (max-width: 760px) {
		.shell,
		.shell.railed {
			grid-template-columns: minmax(0, 1fr);
		}

		.shell.railed .sidebar {
			padding: var(--space-3);
			align-items: stretch;
		}

		.shell.railed .rail-hide {
			display: revert;
		}

		.rail-toggle {
			display: none;
		}

		.sidebar {
			position: fixed;
			z-index: 20;
			top: 0;
			left: 0;
			width: var(--sidebar-width);
			transform: translateX(-100%);
			transition: transform var(--dur-base) var(--ease-out);
			box-shadow: var(--shadow-lg);
		}

		.shell.sidebar-open .sidebar {
			transform: translateX(0);
		}

		.menu-toggle {
			display: inline-flex;
		}

		.scrim {
			display: block;
			position: fixed;
			inset: 0;
			z-index: 10;
			border: 0;
			background: var(--bg-scrim);
		}
	}
</style>
