<script lang="ts">
	import { enhance } from '$app/forms';
	import Icon from '$lib/components/Icon.svelte';
	import Avatar from '$lib/components/Avatar.svelte';
	import { formatFullDate, percent, daysUntil } from '$lib/format';
	import { PROJECT_STATUS_LABEL, type ProjectStatus } from '$lib/types';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let createOpen = $state(false);
	let submitting = $state(false);
	let statusFilter = $state<ProjectStatus | 'all'>('all');

	const memberById = $derived(new Map(data.members.map((m) => [m.id, m])));
	const filtered = $derived(
		statusFilter === 'all'
			? data.projects
			: data.projects.filter((p) => p.status === statusFilter)
	);

	const statuses: ProjectStatus[] = ['planned', 'in_progress', 'paused', 'completed', 'canceled'];

	function openCount(projectId: string) {
		return data.issues.filter(
			(i) => i.projectId === projectId && i.status !== 'done' && i.status !== 'canceled'
		).length;
	}

	function dueLabel(target: string | null) {
		const days = daysUntil(target);
		if (days === null) return 'No target date';
		if (days < 0) return `${Math.abs(days)} days past target`;
		if (days === 0) return 'Due today';
		return `${days} days to target`;
	}
</script>

<svelte:head>
	<title>Projects · Aporia</title>
</svelte:head>

<div class="page">
	<header class="page-head">
		<div>
			<h1 class="page-title">Projects</h1>
			<p class="page-sub">
				Every project carries a lead, a target date and the issues counted against it.
			</p>
		</div>
		<div class="head-actions">
			<label class="filter">
				<span class="visually-hidden">Filter by status</span>
				<select class="input" bind:value={statusFilter}>
					<option value="all">All statuses</option>
					{#each statuses as status}
						<option value={status}>{PROJECT_STATUS_LABEL[status]}</option>
					{/each}
				</select>
			</label>
			<button class="btn btn-primary" type="button" onclick={() => (createOpen = !createOpen)}>
				<Icon name="plus" size={14} />
				New project
			</button>
		</div>
	</header>

	{#if form?.created}
		<p class="notice" role="status">Created project {form.created}.</p>
	{/if}
	{#if form?.createError}
		<p class="notice notice-error" role="alert">{form.createError}</p>
	{/if}

	{#if createOpen}
		<section class="card">
			<h2 class="card-title">New project</h2>
			<form
				method="POST"
				action="?/create"
				class="create-form"
				use:enhance={() => {
					submitting = true;
					return async ({ update }) => {
						await update();
						submitting = false;
						createOpen = false;
					};
				}}
			>
				<div class="field wide">
					<label for="p-name">Name</label>
					<input class="input" id="p-name" name="name" type="text" required minlength="3" />
				</div>
				<div class="field">
					<label for="p-key">Key</label>
					<input
						class="input"
						id="p-key"
						name="key"
						type="text"
						required
						maxlength="6"
						placeholder="CORE"
					/>
				</div>
				<div class="field">
					<label for="p-status">Status</label>
					<select class="input" id="p-status" name="status">
						{#each statuses as status}
							<option value={status}>{PROJECT_STATUS_LABEL[status]}</option>
						{/each}
					</select>
				</div>
				<div class="field">
					<label for="p-lead">Lead</label>
					<select class="input" id="p-lead" name="leadId">
						{#each data.members as member}
							<option value={member.id}>{member.name}</option>
						{/each}
					</select>
				</div>
				<div class="field">
					<label for="p-target">Target date</label>
					<input class="input" id="p-target" name="targetDate" type="date" />
				</div>
				<div class="field wide">
					<label for="p-summary">Summary</label>
					<textarea class="input textarea" id="p-summary" name="summary" rows="2"></textarea>
				</div>
				<div class="form-actions wide">
					<button class="btn btn-primary" type="submit" disabled={submitting}>
						{submitting ? 'Creating' : 'Create project'}
					</button>
					<button class="btn" type="button" onclick={() => (createOpen = false)}>Cancel</button>
				</div>
			</form>
		</section>
	{/if}

	{#if filtered.length === 0}
		<div class="empty">
			<Icon name="project" size={20} />
			<p>No projects match this filter.</p>
			<button class="btn btn-primary" type="button" onclick={() => (createOpen = true)}>
				Create a project
			</button>
		</div>
	{:else}
		<section class="grid projects">
			{#each filtered as project (project.id)}
				{@const lead = memberById.get(project.leadId)}
				{@const done = percent(project.completedCount, project.issueCount)}
				<article class="card project">
					<div class="project-head">
						<span class="mono project-key">{project.key}</span>
						<span class="pill">{PROJECT_STATUS_LABEL[project.status]}</span>
					</div>
					<h2 class="project-name">{project.name}</h2>
					<p class="muted project-summary">{project.summary}</p>

					<div class="meter" aria-hidden="true"><span style="width: {done}%"></span></div>
					<p class="subtle">
						{project.completedCount} of {project.issueCount} issues done · {openCount(project.id)} still
						open
					</p>

					<footer class="project-foot">
						<span class="lead">
							<Avatar
								initials={lead?.initials ?? null}
								color={lead?.avatarColor}
								name={lead?.name}
								size={20}
							/>
							{lead?.name ?? 'No lead'}
						</span>
						<span class="subtle target">
							<Icon name="calendar" size={13} />
							{formatFullDate(project.targetDate)}
						</span>
					</footer>
					<p class="subtle">{dueLabel(project.targetDate)}</p>
				</article>
			{/each}
		</section>
	{/if}
</div>

<style>
	.head-actions {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.notice {
		font-size: var(--text-sm);
		padding: var(--space-2) var(--space-3);
		border-radius: var(--radius-sm);
		border: 1px solid var(--border-default);
		background: var(--bg-surface);
		color: var(--text-secondary);
	}

	.notice-error {
		color: var(--danger);
		border-color: color-mix(in srgb, var(--danger) 36%, transparent);
		background: color-mix(in srgb, var(--danger) 12%, transparent);
	}

	.create-form {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: var(--space-3);
	}

	.wide {
		grid-column: span 3;
	}

	.textarea {
		min-height: 60px;
		padding: var(--space-2) var(--space-3);
		resize: vertical;
		font-family: inherit;
	}

	.form-actions {
		display: flex;
		gap: var(--space-2);
	}

	.projects {
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
	}

	.project-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-2);
	}

	.project-key {
		color: var(--accent);
		font-weight: var(--weight-medium);
	}

	.project-name {
		font-size: var(--text-lg);
	}

	.project-summary {
		font-size: var(--text-base);
		line-height: var(--leading-normal);
	}

	.project-foot {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-2);
		flex-wrap: wrap;
	}

	.lead {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		font-size: var(--text-sm);
		color: var(--text-secondary);
	}

	.target {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
	}

	@media (max-width: 760px) {
		.create-form {
			grid-template-columns: minmax(0, 1fr);
		}
		.wide {
			grid-column: span 1;
		}
	}
</style>
