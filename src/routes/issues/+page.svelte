<script lang="ts">
	import { enhance } from '$app/forms';
	import Icon from '$lib/components/Icon.svelte';
	import StatusIcon from '$lib/components/StatusIcon.svelte';
	import PriorityIcon from '$lib/components/PriorityIcon.svelte';
	import Avatar from '$lib/components/Avatar.svelte';
	import LabelChip from '$lib/components/LabelChip.svelte';
	import { relativeTime } from '$lib/format';
	import {
		BOARD_COLUMNS,
		ISSUE_STATUS_LABEL,
		PRIORITY_LABEL,
		type IssuePriority,
		type IssueStatus
	} from '$lib/types';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let view = $state<'list' | 'board'>(data.view as 'list' | 'board');
	let statusFilter = $state<IssueStatus | 'all'>('all');
	let projectFilter = $state('all');
	let assigneeFilter = $state('all');
	let query = $state('');
	let createOpen = $state(data.openCreate);
	let submitting = $state(false);

	const memberById = $derived(new Map(data.members.map((m) => [m.id, m])));
	const projectById = $derived(new Map(data.projects.map((p) => [p.id, p])));
	const labelById = $derived(new Map(data.labels.map((l) => [l.id, l])));

	const filtered = $derived(
		data.issues.filter((issue) => {
			if (statusFilter !== 'all' && issue.status !== statusFilter) return false;
			if (projectFilter !== 'all' && issue.projectId !== projectFilter) return false;
			if (assigneeFilter !== 'all' && issue.assigneeId !== assigneeFilter) return false;
			const q = query.trim().toLowerCase();
			if (!q) return true;
			return (
				issue.title.toLowerCase().includes(q) ||
				issue.key.toLowerCase().includes(q) ||
				issue.description.toLowerCase().includes(q)
			);
		})
	);

	function columnIssues(status: IssueStatus) {
		return filtered.filter((issue) => issue.status === status);
	}

	function resetFilters() {
		statusFilter = 'all';
		projectFilter = 'all';
		assigneeFilter = 'all';
		query = '';
	}

	const statusOptions: IssueStatus[] = [
		'backlog',
		'todo',
		'in_progress',
		'in_review',
		'done',
		'canceled'
	];
	const priorityOptions: IssuePriority[] = ['urgent', 'high', 'medium', 'low', 'none'];
</script>

<svelte:head>
	<title>Issues · Aporia</title>
</svelte:head>

<div class="page">
	<header class="page-head">
		<div>
			<h1 class="page-title">Issues</h1>
			<p class="page-sub">
				{filtered.length} of {data.issues.length} issues shown. Change a status inline and the write
				goes straight to the workspace database.
			</p>
		</div>
		<div class="head-actions">
			<div class="segmented" role="group" aria-label="View">
				<button
					class="seg"
					class:active={view === 'list'}
					type="button"
					aria-pressed={view === 'list'}
					onclick={() => (view = 'list')}
				>
					<Icon name="list" size={14} />
					List
				</button>
				<button
					class="seg"
					class:active={view === 'board'}
					type="button"
					aria-pressed={view === 'board'}
					onclick={() => (view = 'board')}
				>
					<Icon name="board" size={14} />
					Board
				</button>
			</div>
			<button class="btn btn-primary" type="button" onclick={() => (createOpen = !createOpen)}>
				<Icon name="plus" size={14} />
				New issue
			</button>
		</div>
	</header>

	{#if form?.created}
		<p class="notice" role="status">Created {form.created}.</p>
	{/if}
	{#if form?.createError}
		<p class="notice notice-error" role="alert">{form.createError}</p>
	{/if}
	{#if form?.statusError}
		<p class="notice notice-error" role="alert">{form.statusError}</p>
	{/if}

	{#if createOpen}
		<section class="card">
			<h2 class="card-title">New issue</h2>
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
				<div class="field span-2">
					<label for="new-title">Title</label>
					<input
						class="input"
						id="new-title"
						name="title"
						type="text"
						required
						minlength="3"
						placeholder="Board drag drops the issue on rapid status change"
					/>
				</div>

				<div class="field span-2">
					<label for="new-description">Description</label>
					<textarea
						class="input textarea"
						id="new-description"
						name="description"
						rows="3"
						placeholder="What is happening, what should happen, and how to reproduce it."
					></textarea>
				</div>

				<div class="field">
					<label for="new-status">Status</label>
					<select class="input" id="new-status" name="status">
						{#each statusOptions as status}
							<option value={status}>{ISSUE_STATUS_LABEL[status]}</option>
						{/each}
					</select>
				</div>

				<div class="field">
					<label for="new-priority">Priority</label>
					<select class="input" id="new-priority" name="priority">
						{#each priorityOptions as priority}
							<option value={priority}>{PRIORITY_LABEL[priority]}</option>
						{/each}
					</select>
				</div>

				<div class="field">
					<label for="new-project">Project</label>
					<select class="input" id="new-project" name="projectId">
						<option value="">No project</option>
						{#each data.projects as project}
							<option value={project.id}>{project.key} · {project.name}</option>
						{/each}
					</select>
				</div>

				<div class="field">
					<label for="new-assignee">Assignee</label>
					<select class="input" id="new-assignee" name="assigneeId">
						<option value="">Unassigned</option>
						{#each data.members as member}
							<option value={member.id}>{member.name}</option>
						{/each}
					</select>
				</div>

				<fieldset class="field span-2 labels-field">
					<legend>Labels</legend>
					<div class="label-choices">
						{#each data.labels as label}
							<label class="choice">
								<input type="checkbox" name="labelIds" value={label.id} />
								<span class="dot" style="color: {label.colorToken}"></span>
								{label.name}
							</label>
						{/each}
					</div>
				</fieldset>

				<div class="form-actions span-2">
					<button class="btn btn-primary" type="submit" disabled={submitting}>
						{submitting ? 'Creating' : 'Create issue'}
					</button>
					<button class="btn" type="button" onclick={() => (createOpen = false)}>Cancel</button>
				</div>
			</form>
		</section>
	{/if}

	<section class="filters" aria-label="Filters">
		<label class="search">
			<span class="visually-hidden">Search issues</span>
			<Icon name="search" size={14} />
			<input
				class="input search-input"
				type="search"
				bind:value={query}
				placeholder="Filter by title, key or description"
			/>
		</label>

		<label class="filter">
			<span class="visually-hidden">Status</span>
			<select class="input" bind:value={statusFilter}>
				<option value="all">All statuses</option>
				{#each statusOptions as status}
					<option value={status}>{ISSUE_STATUS_LABEL[status]}</option>
				{/each}
			</select>
		</label>

		<label class="filter">
			<span class="visually-hidden">Project</span>
			<select class="input" bind:value={projectFilter}>
				<option value="all">All projects</option>
				{#each data.projects as project}
					<option value={project.id}>{project.key}</option>
				{/each}
			</select>
		</label>

		<label class="filter">
			<span class="visually-hidden">Assignee</span>
			<select class="input" bind:value={assigneeFilter}>
				<option value="all">Anyone</option>
				{#each data.members as member}
					<option value={member.id}>{member.name}</option>
				{/each}
			</select>
		</label>
	</section>

	{#if filtered.length === 0}
		<div class="empty">
			<Icon name="issue" size={20} />
			<p>No issues match these filters.</p>
			<button class="btn" type="button" onclick={resetFilters}>Clear filters</button>
		</div>
	{:else if view === 'list'}
		<section class="list" aria-label="Issue list">
			{#each filtered as issue (issue.id)}
				{@const project = issue.projectId ? projectById.get(issue.projectId) : null}
				{@const assignee = issue.assigneeId ? memberById.get(issue.assigneeId) : null}
				<article class="row">
					<StatusIcon status={issue.status} />
					<span class="mono row-key">{issue.key}</span>
					<span class="row-title">{issue.title}</span>

					<span class="row-labels">
						{#each issue.labelIds as id}
							{@const label = labelById.get(id)}
							{#if label}<LabelChip name={label.name} color={label.colorToken} />{/if}
						{/each}
					</span>

					{#if project}<span class="pill row-project">{project.key}</span>{/if}

					<span class="row-priority" title={PRIORITY_LABEL[issue.priority]}>
						<PriorityIcon priority={issue.priority} />
					</span>

					<time class="subtle row-time" datetime={issue.updatedAt}>{relativeTime(issue.updatedAt)}</time>

					<form
						method="POST"
						action="?/setStatus"
						class="row-form"
						use:enhance={() => async ({ update }) => update({ reset: false })}
					>
						<input type="hidden" name="id" value={issue.id} />
						<label class="visually-hidden" for="status-{issue.id}">
							Status for {issue.key}
						</label>
						<select
							class="input row-select"
							id="status-{issue.id}"
							name="status"
							value={issue.status}
							onchange={(e) => e.currentTarget.form?.requestSubmit()}
						>
							{#each statusOptions as status}
								<option value={status}>{ISSUE_STATUS_LABEL[status]}</option>
							{/each}
						</select>
					</form>

					<Avatar
						initials={assignee?.initials ?? null}
						color={assignee?.avatarColor}
						name={assignee?.name}
						size={22}
					/>
				</article>
			{/each}
		</section>
	{:else}
		<section class="board" aria-label="Issue board">
			{#each BOARD_COLUMNS as status}
				{@const items = columnIssues(status)}
				<div class="board-col">
					<header class="board-head">
						<StatusIcon {status} />
						<h2 class="board-title">{ISSUE_STATUS_LABEL[status]}</h2>
						<span class="mono">{items.length}</span>
					</header>

					{#if items.length === 0}
						<p class="board-empty">Nothing here yet.</p>
					{:else}
						<ul class="board-cards">
							{#each items as issue (issue.id)}
								{@const project = issue.projectId ? projectById.get(issue.projectId) : null}
								{@const assignee = issue.assigneeId ? memberById.get(issue.assigneeId) : null}
								<li class="board-card">
									<div class="card-top">
										<span class="mono">{issue.key}</span>
										<PriorityIcon priority={issue.priority} />
									</div>
									<p class="card-title-text">{issue.title}</p>
									<div class="card-labels">
										{#each issue.labelIds as id}
											{@const label = labelById.get(id)}
											{#if label}<LabelChip name={label.name} color={label.colorToken} />{/if}
										{/each}
									</div>
									<div class="card-foot">
										{#if project}<span class="pill">{project.key}</span>{/if}
										<form
											method="POST"
											action="?/setStatus"
											class="row-form"
											use:enhance={() => async ({ update }) => update({ reset: false })}
										>
											<input type="hidden" name="id" value={issue.id} />
											<label class="visually-hidden" for="board-status-{issue.id}">
												Move {issue.key}
											</label>
											<select
												class="input row-select"
												id="board-status-{issue.id}"
												name="status"
												value={issue.status}
												onchange={(e) => e.currentTarget.form?.requestSubmit()}
											>
												{#each statusOptions as option}
													<option value={option}>{ISSUE_STATUS_LABEL[option]}</option>
												{/each}
											</select>
										</form>
										<Avatar
											initials={assignee?.initials ?? null}
											color={assignee?.avatarColor}
											name={assignee?.name}
											size={20}
										/>
									</div>
								</li>
							{/each}
						</ul>
					{/if}
				</div>
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

	.segmented {
		display: inline-flex;
		border: 1px solid var(--border-default);
		border-radius: var(--radius-sm);
		overflow: hidden;
	}

	.seg {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		min-height: 32px;
		padding: 0 var(--space-3);
		border: 0;
		background: var(--bg-elevated);
		color: var(--text-secondary);
		font-size: var(--text-base);
		cursor: pointer;
		transition: background var(--dur-fast) var(--ease-out);
	}

	.seg:hover {
		background: var(--bg-hover);
		color: var(--text-primary);
	}

	.seg.active {
		background: var(--accent-soft);
		color: var(--accent);
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
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: var(--space-3);
	}

	.span-2 {
		grid-column: span 4;
	}

	.textarea {
		min-height: 76px;
		padding: var(--space-2) var(--space-3);
		resize: vertical;
		font-family: inherit;
	}

	.labels-field {
		border: 0;
		padding: 0;
		margin: 0;
	}

	.labels-field legend {
		font-size: var(--text-sm);
		color: var(--text-secondary);
		font-weight: var(--weight-medium);
		padding: 0 0 var(--space-1);
	}

	.label-choices {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3);
	}

	.choice {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		font-size: var(--text-base);
		color: var(--text-secondary);
		min-height: 28px;
		cursor: pointer;
	}

	.form-actions {
		display: flex;
		gap: var(--space-2);
	}

	.filters {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
		align-items: center;
	}

	.search {
		position: relative;
		display: flex;
		align-items: center;
		gap: var(--space-2);
		flex: 1;
		min-width: 220px;
		padding-left: var(--space-3);
		background: var(--bg-inset);
		border: 1px solid var(--border-default);
		border-radius: var(--radius-sm);
		color: var(--text-tertiary);
	}

	.search-input {
		flex: 1;
		min-width: 0;
		border: 0;
		background: transparent;
		padding-left: 0;
	}

	.search-input:focus-visible {
		box-shadow: none;
	}

	.filter select {
		min-width: 140px;
	}

	.list {
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-lg);
		overflow: hidden;
		background: var(--bg-surface);
	}

	.row {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-2) var(--space-3);
		min-height: 44px;
		border-bottom: 1px solid var(--border-subtle);
		transition: background var(--dur-fast) var(--ease-out);
	}

	.row:last-child {
		border-bottom: 0;
	}

	.row:hover {
		background: var(--bg-hover);
	}

	.row-key {
		flex: none;
		width: 66px;
	}

	.row-title {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.row-labels {
		display: flex;
		gap: var(--space-1);
		flex: none;
	}

	.row-time {
		flex: none;
		width: 68px;
		text-align: right;
	}

	.row-form {
		flex: none;
		display: flex;
	}

	.row-select {
		min-height: 28px;
		font-size: var(--text-sm);
		padding: 0 var(--space-2);
		max-width: 130px;
	}

	.board {
		display: grid;
		grid-auto-flow: column;
		grid-auto-columns: minmax(280px, 1fr);
		gap: var(--space-4);
		overflow-x: auto;
		padding-bottom: var(--space-3);
	}

	.board-col {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		min-width: 280px;
	}

	.board-head {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.board-title {
		font-size: var(--text-base);
		font-weight: var(--weight-semibold);
		flex: 1;
	}

	.board-empty {
		border: 1px dashed var(--border-default);
		border-radius: var(--radius-md);
		padding: var(--space-4);
		text-align: center;
		color: var(--text-tertiary);
		font-size: var(--text-sm);
	}

	.board-cards {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.board-card {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		background: var(--bg-elevated);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-md);
		padding: var(--space-3);
		transition:
			border-color var(--dur-fast) var(--ease-out),
			box-shadow var(--dur-fast) var(--ease-out);
	}

	.board-card:hover {
		border-color: var(--border-strong);
		box-shadow: var(--shadow-sm);
	}

	.card-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.card-title-text {
		font-size: var(--text-base);
		line-height: var(--leading-normal);
	}

	.card-labels {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-1);
	}

	.card-foot {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		justify-content: space-between;
	}

	@media (max-width: 900px) {
		.create-form {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
		.span-2 {
			grid-column: span 2;
		}
		.row-labels,
		.row-time,
		.row-project {
			display: none;
		}
	}

	@media (max-width: 560px) {
		.create-form {
			grid-template-columns: minmax(0, 1fr);
		}
		.span-2 {
			grid-column: span 1;
		}
		.board {
			grid-auto-flow: row;
			grid-auto-columns: auto;
		}
		.row-select {
			max-width: 104px;
		}
	}
</style>
