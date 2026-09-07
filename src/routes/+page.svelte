<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import StatusIcon from '$lib/components/StatusIcon.svelte';
	import PriorityIcon from '$lib/components/PriorityIcon.svelte';
	import Avatar from '$lib/components/Avatar.svelte';
	import { formatDate, percent, relativeTime, daysUntil } from '$lib/format';
	import { ISSUE_STATUS_LABEL, ISSUE_STATUS_TOKEN, RELEASE_STATUS_LABEL } from '$lib/types';
	import type { IssueStatus } from '$lib/types';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const openStatuses: IssueStatus[] = ['backlog', 'todo', 'in_progress', 'in_review'];
	const openTotal = $derived(openStatuses.reduce((sum, s) => sum + data.counts[s], 0));

	const cyclePercent = $derived(percent(data.cycle.completed, data.cycle.scope));
	const startedPercent = $derived(percent(data.cycle.started, data.cycle.scope));
	const daysLeft = $derived(Math.max(0, daysUntil(data.cycle.endsAt) ?? 0));

	const myIssues = $derived(data.assigned.filter((i) => i.status !== 'done').slice(0, 5));
	const upcoming = $derived(data.releases.filter((r) => r.status !== 'shipped').slice(0, 4));
	const activeProjects = $derived(data.projects.filter((p) => p.status === 'in_progress').length);

	const memberById = $derived(new Map(data.members.map((m) => [m.id, m])));
	const projectById = $derived(new Map(data.projects.map((p) => [p.id, p])));
</script>

<svelte:head>
	<title>Dashboard · Aporia</title>
</svelte:head>

<div class="page">
	<header class="page-head">
		<div>
			<p class="eyebrow">{data.cycle.name} · ends {formatDate(data.cycle.endsAt)}</p>
			<h1 class="page-title">Good to see you, {data.user.name.split(' ')[0]}</h1>
			<p class="page-sub">
				{openTotal} open {openTotal === 1 ? 'issue' : 'issues'} across {activeProjects} active
				{activeProjects === 1 ? 'project' : 'projects'}, {daysLeft}
				{daysLeft === 1 ? 'day' : 'days'} left in the cycle and {upcoming.length} releases still open.
			</p>
		</div>
		<div class="head-actions">
			<a class="btn" href="/issues?view=board">
				<Icon name="board" size={14} />
				Board
			</a>
			<a class="btn btn-primary" href="/issues?new=1">
				<Icon name="plus" size={14} />
				New issue
			</a>
		</div>
	</header>

	<section class="stats" aria-label="Cycle summary">
		<article class="stat">
			<p class="eyebrow">Cycle progress</p>
			<p class="stat-value">{cyclePercent}<span class="stat-unit">%</span></p>
			<div class="meter" aria-hidden="true"><span style="width: {cyclePercent}%"></span></div>
			<p class="subtle">{data.cycle.completed} of {data.cycle.scope} issues completed</p>
		</article>
		<article class="stat">
			<p class="eyebrow">In flight</p>
			<p class="stat-value">{data.cycle.started}<span class="stat-unit">issues</span></p>
			<div class="meter" aria-hidden="true">
				<span style="width: {startedPercent}%; background: var(--status-progress)"></span>
			</div>
			<p class="subtle">Started or waiting on review</p>
		</article>
		<article class="stat">
			<p class="eyebrow">Workspace total</p>
			<p class="stat-value">{data.totalIssues}<span class="stat-unit">issues</span></p>
			<p class="subtle">{data.counts.done} done, {data.counts.canceled} canceled</p>
		</article>
		<article class="stat">
			<p class="eyebrow">Days remaining</p>
			<p class="stat-value">{daysLeft}<span class="stat-unit">days</span></p>
			<p class="subtle">Cycle closes {formatDate(data.cycle.endsAt)}</p>
		</article>
	</section>

	<div class="columns">
		<div class="col">
			<section class="card">
				<div class="card-head">
					<h2 class="card-title">Open issues by status</h2>
					<a class="card-link" href="/issues">
						All issues
						<Icon name="chevron-right" size={13} />
					</a>
				</div>
				{#if openTotal === 0}
					<div class="empty">
						<Icon name="issue" size={18} />
						<p>No open issues in the workspace.</p>
						<a class="btn btn-primary" href="/issues?new=1">Create the first issue</a>
					</div>
				{:else}
					<ul class="status-list">
						{#each openStatuses as status}
							{@const count = data.counts[status]}
							<li>
								<span class="status-name">
									<StatusIcon {status} />
									{ISSUE_STATUS_LABEL[status]}
								</span>
								<span class="status-bar" aria-hidden="true">
									<span
										style="width: {percent(count, openTotal)}%; background: {ISSUE_STATUS_TOKEN[
											status
										]}"
									></span>
								</span>
								<span class="mono">{count}</span>
							</li>
						{/each}
					</ul>
					<p class="subtle">
						{data.counts.done} done and {data.counts.canceled} canceled are hidden from this view.
					</p>
				{/if}
			</section>

			<section class="card">
				<div class="card-head">
					<h2 class="card-title">Assigned to you</h2>
					<a class="card-link" href="/my-issues">
						My issues
						<Icon name="chevron-right" size={13} />
					</a>
				</div>
				{#if myIssues.length === 0}
					<div class="empty">
						<Icon name="check" size={18} />
						<p>Nothing assigned to you right now.</p>
						<a class="btn" href="/issues">Pick up an issue</a>
					</div>
				{:else}
					<ul class="mini-list divide">
						{#each myIssues as issue}
							{@const project = issue.projectId ? projectById.get(issue.projectId) : null}
							<li>
								<StatusIcon status={issue.status} />
								<span class="mono">{issue.key}</span>
								<span class="mini-title">{issue.title}</span>
								{#if project}<span class="pill">{project.key}</span>{/if}
								<PriorityIcon priority={issue.priority} />
							</li>
						{/each}
					</ul>
				{/if}
			</section>
		</div>

		<div class="col">
			<section class="card">
				<div class="card-head">
					<h2 class="card-title">Upcoming releases</h2>
					<a class="card-link" href="/releases">
						All releases
						<Icon name="chevron-right" size={13} />
					</a>
				</div>
				{#if upcoming.length === 0}
					<div class="empty">
						<Icon name="release" size={18} />
						<p>No release is currently planned.</p>
						<a class="btn" href="/releases">Plan a release</a>
					</div>
				{:else}
					<ul class="release-list divide">
						{#each upcoming as release}
							{@const owner = memberById.get(release.ownerId)}
							<li>
								<span class="release-top">
									<span class="mono release-version">{release.version}</span>
									<span class="release-name">{release.name}</span>
									<span class="pill">{RELEASE_STATUS_LABEL[release.status]}</span>
								</span>
								<span class="release-meta subtle">
									<Icon name="calendar" size={13} />
									{formatDate(release.targetDate)}
									<span aria-hidden="true">·</span>
									{release.issueIds.length} issues
									<span aria-hidden="true">·</span>
									{owner?.name ?? 'Unowned'}
								</span>
							</li>
						{/each}
					</ul>
				{/if}
			</section>

			<section class="card">
				<div class="card-head">
					<h2 class="card-title">Recent activity</h2>
					<span class="subtle">Newest first</span>
				</div>
				{#if data.activity.length === 0}
					<div class="empty">
						<Icon name="clock" size={18} />
						<p>No activity recorded yet.</p>
					</div>
				{:else}
					<ul class="activity">
						{#each data.activity as event}
							{@const actor = memberById.get(event.actorId)}
							<li>
								<Avatar
									initials={actor?.initials ?? null}
									color={actor?.avatarColor}
									name={actor?.name}
									size={20}
								/>
								<span class="activity-text">
									<span class="activity-actor">{actor?.name ?? 'Someone'}</span>
									{event.verb}
									<span class="mono">{event.targetKey}</span>
									<span class="activity-target">{event.targetTitle}</span>
								</span>
								<time class="subtle activity-time" datetime={event.at}>{relativeTime(event.at)}</time>
							</li>
						{/each}
					</ul>
				{/if}
			</section>
		</div>
	</div>
</div>

<style>
	.head-actions {
		display: flex;
		gap: var(--space-2);
	}

	.stats {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: var(--space-3);
	}

	.stat {
		background: var(--bg-surface);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-lg);
		padding: var(--space-4);
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.stat-value {
		font-size: var(--text-2xl);
		font-weight: var(--weight-semibold);
		line-height: 1;
		display: flex;
		align-items: baseline;
		gap: var(--space-2);
	}

	.stat-unit {
		font-size: var(--text-sm);
		font-weight: var(--weight-regular);
		color: var(--text-tertiary);
	}

	.columns {
		display: grid;
		grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
		gap: var(--space-4);
		align-items: start;
	}

	.col {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		min-width: 0;
	}

	.card-link {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		font-size: var(--text-sm);
		color: var(--text-tertiary);
		padding: var(--space-1);
		border-radius: var(--radius-xs);
	}

	.card-link:hover {
		color: var(--text-primary);
	}

	.status-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.status-list li {
		display: grid;
		grid-template-columns: 130px minmax(0, 1fr) 32px;
		align-items: center;
		gap: var(--space-3);
	}

	.status-name {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		color: var(--text-secondary);
	}

	.status-bar {
		height: 4px;
		border-radius: var(--radius-full);
		background: var(--bg-active);
		overflow: hidden;
	}

	.status-bar > span {
		display: block;
		height: 100%;
		border-radius: var(--radius-full);
	}

	.status-list .mono {
		text-align: right;
	}

	.mini-list li {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) 0;
	}

	.mini-title {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.release-list li {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		padding: var(--space-3) 0;
	}

	.release-top {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		min-width: 0;
	}

	.release-version {
		color: var(--accent);
		font-weight: var(--weight-medium);
	}

	.release-name {
		flex: 1;
		min-width: 0;
		font-weight: var(--weight-medium);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.release-meta {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		flex-wrap: wrap;
	}

	.activity {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.activity li {
		display: flex;
		align-items: flex-start;
		gap: var(--space-2);
	}

	.activity-text {
		flex: 1;
		min-width: 0;
		color: var(--text-secondary);
		font-size: var(--text-base);
		line-height: var(--leading-normal);
	}

	.activity-actor {
		color: var(--text-primary);
		font-weight: var(--weight-medium);
	}

	.activity-target {
		display: block;
		color: var(--text-tertiary);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.activity-time {
		flex: none;
		white-space: nowrap;
	}

	@media (max-width: 1000px) {
		.columns {
			grid-template-columns: minmax(0, 1fr);
		}
	}

	@media (max-width: 560px) {
		.status-list li {
			grid-template-columns: 110px minmax(0, 1fr) 28px;
			gap: var(--space-2);
		}
	}
</style>
