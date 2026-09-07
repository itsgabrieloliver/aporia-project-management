<script lang="ts">
	import { enhance } from '$app/forms';
	import Icon from '$lib/components/Icon.svelte';
	import Avatar from '$lib/components/Avatar.svelte';
	import StatusIcon from '$lib/components/StatusIcon.svelte';
	import { percent } from '$lib/format';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const unassigned = $derived(
		data.issues.filter(
			(i) => !i.assigneeId && i.status !== 'done' && i.status !== 'canceled'
		)
	);

	function stats(memberId: string) {
		const mine = data.issues.filter((i) => i.assigneeId === memberId);
		const open = mine.filter((i) => i.status !== 'done' && i.status !== 'canceled');
		const inFlight = mine.filter((i) => i.status === 'in_progress' || i.status === 'in_review');
		const done = mine.filter((i) => i.status === 'done');
		return { total: mine.length, open: open.length, inFlight: inFlight.length, done: done.length };
	}

	function leadsFor(memberId: string) {
		return data.projects.filter((p) => p.leadId === memberId);
	}
</script>

<svelte:head>
	<title>Team · Aporia</title>
</svelte:head>

<div class="page">
	<header class="page-head">
		<div>
			<h1 class="page-title">Team</h1>
			<p class="page-sub">
				{data.members.length} people in the workspace, with the load each is carrying right now.
			</p>
		</div>
	</header>

	{#if form?.assignError}
		<p class="notice notice-error" role="alert">{form.assignError}</p>
	{/if}
	{#if form?.assigned}
		<p class="notice" role="status">Assignment saved.</p>
	{/if}

	<section class="grid members">
		{#each data.members as member (member.id)}
			{@const s = stats(member.id)}
			{@const leads = leadsFor(member.id)}
			<article class="card member">
				<header class="member-head">
					<Avatar
						initials={member.initials}
						color={member.avatarColor}
						name={member.name}
						size={36}
					/>
					<div class="member-id">
						<h2 class="member-name">{member.name}</h2>
						<p class="subtle">{member.email}</p>
					</div>
					<span class="pill">{member.role === 'admin' ? 'Admin' : 'Member'}</span>
				</header>

				<dl class="counts">
					<div><dt>Open</dt><dd>{s.open}</dd></div>
					<div><dt>In flight</dt><dd>{s.inFlight}</dd></div>
					<div><dt>Done</dt><dd>{s.done}</dd></div>
				</dl>

				<div class="meter" aria-hidden="true">
					<span style="width: {percent(s.done, s.total)}%"></span>
				</div>
				<p class="subtle">
					{s.total === 0
						? 'No issues assigned yet'
						: `${percent(s.done, s.total)}% of assigned work completed`}
				</p>

				{#if leads.length > 0}
					<p class="subtle leads">
						Leads {leads.map((p) => p.key).join(', ')}
					</p>
				{/if}
			</article>
		{/each}
	</section>

	<section class="card">
		<div class="card-head">
			<h2 class="card-title">Unassigned issues</h2>
			<span class="subtle">{unassigned.length} waiting for an owner</span>
		</div>

		{#if unassigned.length === 0}
			<div class="empty">
				<Icon name="check" size={18} />
				<p>Every open issue has an owner.</p>
				<a class="btn" href="/issues">Review the issue list</a>
			</div>
		{:else}
			<ul class="unassigned divide">
				{#each unassigned as issue (issue.id)}
					<li>
						<StatusIcon status={issue.status} />
						<span class="mono">{issue.key}</span>
						<span class="u-title">{issue.title}</span>
						<form
							method="POST"
							action="?/assign"
							class="assign-form"
							use:enhance={() => async ({ update }) => update({ reset: false })}
						>
							<input type="hidden" name="issueId" value={issue.id} />
							<label class="visually-hidden" for="assign-{issue.id}">
								Assign {issue.key}
							</label>
							<select
								class="input assign-select"
								id="assign-{issue.id}"
								name="assigneeId"
								onchange={(e) => e.currentTarget.form?.requestSubmit()}
							>
								<option value="">Assign to</option>
								{#each data.members as member}
									<option value={member.id}>{member.name}</option>
								{/each}
							</select>
						</form>
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</div>

<style>
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

	.members {
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
	}

	.member-head {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}

	.member-id {
		flex: 1;
		min-width: 0;
	}

	.member-name {
		font-size: var(--text-md);
	}

	.member-id .subtle {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.counts {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: var(--space-2);
		margin: 0;
	}

	.counts div {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.counts dt {
		font-size: var(--text-xs);
		text-transform: uppercase;
		letter-spacing: var(--tracking-wide);
		color: var(--text-tertiary);
	}

	.counts dd {
		margin: 0;
		font-size: var(--text-lg);
		font-weight: var(--weight-semibold);
	}

	.leads {
		border-top: 1px solid var(--border-subtle);
		padding-top: var(--space-2);
	}

	.unassigned li {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) 0;
	}

	.u-title {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.assign-select {
		min-height: 30px;
		font-size: var(--text-sm);
		max-width: 150px;
	}
</style>
