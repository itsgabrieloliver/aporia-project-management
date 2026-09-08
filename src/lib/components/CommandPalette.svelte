<script lang="ts">
	import { goto } from '$app/navigation';
	import Icon from '$lib/components/Icon.svelte';
	import type { IconName } from '$lib/icons';

	export interface PaletteIndex {
		issues: { id: string; key: string; title: string }[];
		projects: { id: string; key: string; name: string }[];
		releases: { id: string; version: string; name: string }[];
	}

	interface Props {
		open: boolean;
		index?: PaletteIndex;
	}

	let {
		open = $bindable(false),
		index = { issues: [], projects: [], releases: [] }
	}: Props = $props();

	interface Command {
		id: string;
		title: string;
		hint: string;
		icon: IconName;
		href: string;
		group: string;
	}

	const navCommands: Command[] = [
		{ id: 'n-dash', title: 'Go to dashboard', hint: 'G then D', icon: 'dashboard', href: '/', group: 'Navigate' },
		{ id: 'n-issues', title: 'Go to issues', hint: 'G then I', icon: 'issue', href: '/issues', group: 'Navigate' },
		{ id: 'n-projects', title: 'Go to projects', hint: 'G then P', icon: 'project', href: '/projects', group: 'Navigate' },
		{ id: 'n-releases', title: 'Go to releases', hint: 'G then R', icon: 'release', href: '/releases', group: 'Navigate' },
		{ id: 'n-team', title: 'Go to team', hint: 'G then T', icon: 'team', href: '/team', group: 'Navigate' },
		{ id: 'n-board', title: 'Toggle list / board view', hint: 'B', icon: 'board', href: '/issues?view=board', group: 'Navigate' },
		{ id: 'n-create', title: 'Create issue', hint: 'C', icon: 'plus', href: '/issues?new=1', group: 'Navigate' }
	];

	const all = $derived([
		...navCommands,
		...index.issues.slice(0, 12).map((issue) => ({
			id: `i-${issue.id}`,
			title: issue.title,
			hint: issue.key,
			icon: 'issue' as IconName,
			href: `/issues?focus=${issue.id}`,
			group: 'Issues'
		})),
		...index.projects.map((project) => ({
			id: `p-${project.id}`,
			title: project.name,
			hint: project.key,
			icon: 'project' as IconName,
			href: '/projects',
			group: 'Projects'
		})),
		...index.releases.map((release) => ({
			id: `r-${release.id}`,
			title: `${release.version} ${release.name}`,
			hint: 'Release',
			icon: 'release' as IconName,
			href: '/releases',
			group: 'Releases'
		}))
	]);

	let query = $state('');
	let active = $state(0);
	let input = $state<HTMLInputElement | null>(null);

	const results = $derived.by(() => {
		const q = query.trim().toLowerCase();
		const matched = q
			? all.filter(
					(c) => c.title.toLowerCase().includes(q) || c.hint.toLowerCase().includes(q)
				)
			: all.slice(0, 10);
		return matched.slice(0, 12);
	});

	const groups = $derived.by(() => {
		const map = new Map<string, Command[]>();
		for (const command of results) {
			const list = map.get(command.group) ?? [];
			list.push(command);
			map.set(command.group, list);
		}
		return [...map.entries()];
	});

	$effect(() => {
		if (open) {
			query = '';
			active = 0;
			requestAnimationFrame(() => input?.focus());
		}
	});

	$effect(() => {
		results;
		if (active >= results.length) active = 0;
	});

	function run(command: Command) {
		open = false;
		goto(command.href);
	}

	function onKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			open = false;
			return;
		}
		if (event.key === 'ArrowDown') {
			event.preventDefault();
			active = results.length ? (active + 1) % results.length : 0;
		} else if (event.key === 'ArrowUp') {
			event.preventDefault();
			active = results.length ? (active - 1 + results.length) % results.length : 0;
		} else if (event.key === 'Enter') {
			event.preventDefault();
			const command = results[active];
			if (command) run(command);
		}
	}

	function indexOf(command: Command) {
		return results.findIndex((c) => c.id === command.id);
	}
</script>

{#if open}
	<div class="overlay" role="presentation">
		<button class="overlay-scrim" type="button" aria-label="Close command palette" onclick={() => (open = false)}
		></button>
		<div class="palette" role="dialog" aria-modal="true" aria-label="Command palette">
			<div class="palette-input">
				<Icon name="search" size={15} />
				<!-- svelte-ignore a11y_autofocus -->
				<input
					bind:this={input}
					bind:value={query}
					onkeydown={onKeydown}
					type="text"
					placeholder="Search issues, projects and releases"
					aria-label="Search issues, projects and releases"
					autocomplete="off"
				/>
				<span class="kbd">Esc</span>
			</div>

			{#if results.length === 0}
				<div class="palette-empty">
					<p>No matches for "{query}".</p>
					<p class="subtle">Try an issue key such as APO-128, a project name or a version.</p>
				</div>
			{:else}
				<div class="palette-results" role="listbox" aria-label="Results">
					{#each groups as [group, commands]}
						<p class="palette-group">{group}</p>
						{#each commands as command}
							<button
								class="palette-row"
								class:active={indexOf(command) === active}
								type="button"
								role="option"
								aria-selected={indexOf(command) === active}
								onmouseenter={() => (active = indexOf(command))}
								onclick={() => run(command)}
							>
								<Icon name={command.icon} size={15} />
								<span class="palette-title">{command.title}</span>
								<span class="palette-hint">{command.hint}</span>
							</button>
						{/each}
					{/each}
				</div>
			{/if}

			<footer class="palette-foot">
				<span><span class="kbd">↑</span><span class="kbd">↓</span> to move</span>
				<span><span class="kbd">↵</span> to open</span>
				<span><span class="kbd">⌘</span><span class="kbd">K</span> to toggle</span>
			</footer>
		</div>
	</div>
{/if}

<style>
	.overlay {
		position: fixed;
		inset: 0;
		z-index: 40;
		display: flex;
		justify-content: center;
		padding: var(--space-16) var(--space-4) var(--space-4);
	}

	.overlay-scrim {
		position: absolute;
		inset: 0;
		border: 0;
		background: var(--bg-scrim);
		cursor: default;
	}

	.palette {
		position: relative;
		width: min(560px, 100%);
		max-height: 60vh;
		display: flex;
		flex-direction: column;
		background: var(--bg-elevated);
		border: 1px solid var(--border-default);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-lg);
		overflow: hidden;
		animation: rise var(--dur-base) var(--ease-out);
	}

	@keyframes rise {
		from {
			opacity: 0;
			transform: translateY(6px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.palette-input {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-3);
		border-bottom: 1px solid var(--border-subtle);
		color: var(--text-tertiary);
	}

	.palette-input input {
		flex: 1;
		min-width: 0;
		background: transparent;
		border: 0;
		outline: none;
		font-size: var(--text-md);
		color: var(--text-primary);
	}

	.palette-input input::placeholder {
		color: var(--text-tertiary);
	}

	.palette-results {
		overflow-y: auto;
		padding: var(--space-2);
	}

	.palette-group {
		font-size: var(--text-xs);
		text-transform: uppercase;
		letter-spacing: var(--tracking-wide);
		color: var(--text-tertiary);
		padding: var(--space-2) var(--space-2) var(--space-1);
	}

	.palette-row {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		width: 100%;
		min-height: 34px;
		padding: 0 var(--space-2);
		border: 0;
		border-radius: var(--radius-sm);
		background: transparent;
		color: var(--text-secondary);
		text-align: left;
		cursor: pointer;
	}

	.palette-row.active {
		background: var(--bg-hover);
		color: var(--text-primary);
	}

	.palette-title {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: var(--text-base);
	}

	.palette-hint {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		color: var(--text-tertiary);
	}

	.palette-empty {
		padding: var(--space-6) var(--space-4);
		text-align: center;
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		color: var(--text-secondary);
	}

	.palette-foot {
		display: flex;
		gap: var(--space-4);
		padding: var(--space-2) var(--space-3);
		border-top: 1px solid var(--border-subtle);
		background: var(--bg-surface);
		font-size: var(--text-xs);
		color: var(--text-tertiary);
	}

	.palette-foot span {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
	}
</style>
