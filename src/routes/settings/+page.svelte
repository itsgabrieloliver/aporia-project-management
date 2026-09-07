<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import Avatar from '$lib/components/Avatar.svelte';
	import { currentUser } from '$lib/data/seed';

	const shortcuts = [
		{ keys: ['⌘', 'K'], action: 'Open the command palette' },
		{ keys: ['/'], action: 'Search issues, projects and releases' },
		{ keys: ['C'], action: 'Create an issue' },
		{ keys: ['G', 'I'], action: 'Go to issues' },
		{ keys: ['G', 'P'], action: 'Go to projects' },
		{ keys: ['G', 'R'], action: 'Go to releases' },
		{ keys: ['B'], action: 'Toggle list and board view' },
		{ keys: ['Esc'], action: 'Close the palette or dialog' }
	];
</script>

<div class="page settings">
	<header class="page-head">
		<div>
			<h1 class="page-title">Settings</h1>
			<p class="page-sub">
				Your account, workspace defaults and the keyboard map. Theme is stored per user and applied
				before first paint.
			</p>
		</div>
	</header>

	<section class="card">
		<div class="card-head"><h2 class="card-title">Account</h2></div>
		<div class="account-row">
			<Avatar
				initials={currentUser.initials}
				color={currentUser.avatarColor}
				name={currentUser.name}
				size={40}
			/>
			<div>
				<p class="account-name">{currentUser.name}</p>
				<p class="subtle">{currentUser.email} · {currentUser.role === 'admin' ? 'Admin' : 'Member'}</p>
			</div>
		</div>
		<div class="form-grid">
			<div class="field">
				<label for="name">Display name</label>
				<input id="name" class="input" type="text" value={currentUser.name} />
			</div>
			<div class="field">
				<label for="handle">Handle</label>
				<input id="handle" class="input" type="text" value={currentUser.handle} />
			</div>
			<div class="field">
				<label for="email">Email</label>
				<input id="email" class="input" type="email" value={currentUser.email} />
			</div>
			<div class="field">
				<label for="prefix">Issue prefix</label>
				<input id="prefix" class="input" type="text" value="APO" />
			</div>
		</div>
		<div class="actions">
			<button class="btn btn-primary" type="button">
				<Icon name="check" size={14} />
				Save changes
			</button>
			<button class="btn" type="button">Sign out</button>
		</div>
		<p class="subtle">
			Profile edits are stored locally in this preview. They persist to MongoDB once the database
			connection is wired.
		</p>
	</section>

	<section class="card">
		<div class="card-head"><h2 class="card-title">Keyboard shortcuts</h2></div>
		<ul class="shortcuts">
			{#each shortcuts as shortcut}
				<li>
					<span class="keys">
						{#each shortcut.keys as key}<span class="kbd">{key}</span>{/each}
					</span>
					<span class="muted">{shortcut.action}</span>
				</li>
			{/each}
		</ul>
	</section>
</div>

<style>
	.settings {
		max-width: 820px;
	}

	.account-row {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding-bottom: var(--space-3);
		border-bottom: 1px solid var(--border-subtle);
	}

	.account-name {
		font-weight: var(--weight-medium);
	}

	.form-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: var(--space-3);
	}

	.actions {
		display: flex;
		gap: var(--space-2);
	}

	.shortcuts {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: var(--space-2);
	}

	.shortcuts li {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-2);
		border-radius: var(--radius-sm);
	}

	.shortcuts li:hover {
		background: var(--bg-hover);
	}

	.keys {
		display: inline-flex;
		gap: var(--space-1);
		width: 76px;
		flex: none;
	}
</style>
