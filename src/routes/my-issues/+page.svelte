<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import StatusIcon from '$lib/components/StatusIcon.svelte';
	import PriorityIcon from '$lib/components/PriorityIcon.svelte';
	import LabelChip from '$lib/components/LabelChip.svelte';
	import { currentUser, formatDate, issues, labelsByIds, projectById } from '$lib/data/seed';
	import { ISSUE_STATUS_LABEL, type IssueStatus } from '$lib/types';

	const mine = issues.filter((issue) => issue.assigneeId === currentUser.id);
	const order: IssueStatus[] = ['in_progress', 'in_review', 'todo', 'backlog', 'done', 'canceled'];
	const groups = order
		.map((status) => ({ status, items: mine.filter((issue) => issue.status === status) }))
		.filter((group) => group.items.length > 0);
</script>

<div class="page">
	<header class="page-head">
		<div>
			<h1 class="page-title">My issues</h1>
			<p class="page-sub">
				Everything assigned to {currentUser.name}, grouped by status and ordered by how close it is
				to shipping.
			</p>
		</div>
		<a class="btn" href="/issues">
			<Icon name="issue" size={14} />
			All issues
		</a>
	</header>

	{#if mine.length === 0}
		<div class="empty">
			<Icon name="user" size={18} />
			<p>Nothing is assigned to you.</p>
			<a class="btn" href="/issues">Find work in the backlog</a>
		</div>
	{:else}
		<div class="groups">
			{#each groups as group}
				<section>
					<header class="group-head">
						<StatusIcon status={group.status} />
						<h2>{ISSUE_STATUS_LABEL[group.status]}</h2>
						<span class="mono">{group.items.length}</span>
					</header>
					<ul class="rows">
						{#each group.items as issue}
							{@const project = projectById(issue.projectId)}
							<li>
								<a class="row" href="/issues">
									<PriorityIcon priority={issue.priority} />
									<span class="mono row-key">{issue.key}</span>
									<span class="row-title">{issue.title}</span>
									<span class="row-labels">
										{#each labelsByIds(issue.labelIds) as label}
											<LabelChip {label} />
										{/each}
									</span>
									{#if project}<span class="pill">{project.key}</span>{/if}
									<span class="subtle">{formatDate(issue.updatedAt)}</span>
								</a>
							</li>
						{/each}
					</ul>
				</section>
			{/each}
		</div>
	{/if}
</div>

<style>
	.groups {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
	}

	.group-head {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-3);
		background: var(--bg-surface);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-md) var(--radius-md) 0 0;
	}

	.group-head h2 {
		font-size: var(--text-base);
	}

	.rows {
		border: 1px solid var(--border-subtle);
		border-top: 0;
		border-radius: 0 0 var(--radius-md) var(--radius-md);
		overflow: hidden;
	}

	.rows li + li .row {
		border-top: 1px solid var(--border-subtle);
	}

	.row {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		min-height: var(--row-height);
		padding: 0 var(--space-3);
	}

	.row:hover {
		background: var(--bg-hover);
	}

	.row-key {
		width: 68px;
		flex: none;
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
	}

	@media (max-width: 760px) {
		.row-labels {
			display: none;
		}
	}
</style>
