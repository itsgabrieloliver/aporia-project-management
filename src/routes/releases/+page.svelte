<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import StatusIcon from '$lib/components/StatusIcon.svelte';
	import Avatar from '$lib/components/Avatar.svelte';
	import { formatFullDate, percent, daysUntil } from '$lib/format';
	import { RELEASE_STATUS_LABEL } from '$lib/types';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const memberById = $derived(new Map(data.members.map((m) => [m.id, m])));
	const issueById = $derived(new Map(data.issues.map((i) => [i.id, i])));

	let expanded = $state<string | null>(data.releases[0]?.id ?? null);

	function issuesFor(ids: string[]) {
		return ids.map((id) => issueById.get(id)).filter((i) => i !== undefined);
	}

	function shippedCount(ids: string[]) {
		return issuesFor(ids).filter((i) => i.status === 'done').length;
	}

	function dueLabel(release: { targetDate: string; shippedAt: string | null }) {
		if (release.shippedAt) return `Shipped ${formatFullDate(release.shippedAt)}`;
		const days = daysUntil(release.targetDate);
		if (days === null) return 'No target date';
		if (days < 0) return `${Math.abs(days)} days past target`;
		if (days === 0) return 'Targets today';
		return `${days} days to target`;
	}
</script>

<svelte:head>
	<title>Releases · Aporia</title>
</svelte:head>

<div class="page">
	<header class="page-head">
		<div>
			<h1 class="page-title">Releases</h1>
			<p class="page-sub">
				Each version tracks its own scope, target date and changelog. Expand one to see the issues
				riding on it.
			</p>
		</div>
	</header>

	{#if data.releases.length === 0}
		<div class="empty">
			<Icon name="release" size={20} />
			<p>No releases planned yet.</p>
			<a class="btn btn-primary" href="/issues">Plan the work first</a>
		</div>
	{:else}
		<section class="releases">
			{#each data.releases as release (release.id)}
				{@const owner = memberById.get(release.ownerId)}
				{@const linked = issuesFor(release.issueIds)}
				{@const done = shippedCount(release.issueIds)}
				{@const progress = percent(done, linked.length)}
				<article class="card release" class:shipped={release.status === 'shipped'}>
					<header class="release-head">
						<span class="mono version">{release.version}</span>
						<h2 class="release-name">{release.name}</h2>
						<span class="pill">{RELEASE_STATUS_LABEL[release.status]}</span>
					</header>

					<p class="subtle meta-line">
						<Icon name="calendar" size={13} />
						{formatFullDate(release.targetDate)}
						<span aria-hidden="true">·</span>
						{dueLabel(release)}
						<span aria-hidden="true">·</span>
						{owner?.name ?? 'Unowned'}
					</p>

					<div class="meter" aria-hidden="true"><span style="width: {progress}%"></span></div>
					<p class="subtle">{done} of {linked.length} linked issues done</p>

					<button
						class="btn expand"
						type="button"
						aria-expanded={expanded === release.id}
						onclick={() => (expanded = expanded === release.id ? null : release.id)}
					>
						{expanded === release.id ? 'Hide details' : 'Show issues and changelog'}
					</button>

					{#if expanded === release.id}
						<div class="details">
							<div class="detail-col">
								<h3 class="detail-title">Linked issues</h3>
								{#if linked.length === 0}
									<p class="subtle">Nothing linked to this release yet.</p>
								{:else}
									<ul class="linked divide">
										{#each linked as issue}
											{@const assignee = issue.assigneeId
												? memberById.get(issue.assigneeId)
												: null}
											<li>
												<StatusIcon status={issue.status} />
												<span class="mono">{issue.key}</span>
												<span class="linked-title">{issue.title}</span>
												<Avatar
													initials={assignee?.initials ?? null}
													color={assignee?.avatarColor}
													name={assignee?.name}
													size={20}
												/>
											</li>
										{/each}
									</ul>
								{/if}
							</div>

							<div class="detail-col">
								<h3 class="detail-title">Changelog</h3>
								{#if release.changelog.length === 0}
									<p class="subtle">No changelog entries written yet.</p>
								{:else}
									<ul class="changelog">
										{#each release.changelog as entry}
											<li>
												<span class="bullet" aria-hidden="true"></span>
												{entry}
											</li>
										{/each}
									</ul>
								{/if}
							</div>
						</div>
					{/if}
				</article>
			{/each}
		</section>
	{/if}
</div>

<style>
	.releases {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.release.shipped .version {
		color: var(--status-done);
	}

	.release-head {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		flex-wrap: wrap;
	}

	.version {
		font-size: var(--text-md);
		color: var(--accent);
		font-weight: var(--weight-medium);
	}

	.release-name {
		font-size: var(--text-lg);
		flex: 1;
		min-width: 0;
	}

	.meta-line {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		flex-wrap: wrap;
	}

	.expand {
		align-self: flex-start;
	}

	.details {
		display: grid;
		grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
		gap: var(--space-5, var(--space-4));
		padding-top: var(--space-3);
		border-top: 1px solid var(--border-subtle);
	}

	.detail-col {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		min-width: 0;
	}

	.detail-title {
		font-size: var(--text-sm);
		text-transform: uppercase;
		letter-spacing: var(--tracking-wide);
		color: var(--text-tertiary);
	}

	.linked li {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) 0;
	}

	.linked-title {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.changelog {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		color: var(--text-secondary);
	}

	.changelog li {
		display: flex;
		align-items: flex-start;
		gap: var(--space-2);
		line-height: var(--leading-normal);
	}

	.bullet {
		width: 5px;
		height: 5px;
		margin-top: 8px;
		border-radius: var(--radius-full);
		background: var(--accent);
		flex: none;
	}

	@media (max-width: 860px) {
		.details {
			grid-template-columns: minmax(0, 1fr);
		}
	}
</style>
