<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import Avatar from '$lib/components/Avatar.svelte';
	import StatusIcon from '$lib/components/StatusIcon.svelte';
	import { comments, issues, relativeTime, userById } from '$lib/data/seed';

	interface InboxItem {
		id: string;
		kind: 'comment' | 'review' | 'assignment';
		actorId: string;
		issueKey: string;
		issueTitle: string;
		status: (typeof issues)[number]['status'];
		body: string;
		at: string;
	}

	const notifications: InboxItem[] = [
		{
			id: 'n_1',
			kind: 'comment',
			actorId: comments[0].authorId,
			issueKey: 'APO-128',
			issueTitle: 'Resolve sub-issue depth without N+1 lookups',
			status: 'in_progress',
			body: comments[0].body,
			at: comments[0].createdAt
		},
		{
			id: 'n_2',
			kind: 'review',
			actorId: 'u_5',
			issueKey: 'APO-124',
			issueTitle: 'Board drag drops the issue on rapid status change',
			status: 'in_review',
			body: 'Requested your review. The optimistic version check is in the last two commits.',
			at: '2025-03-28T14:52:00Z'
		},
		{
			id: 'n_3',
			kind: 'assignment',
			actorId: 'u_4',
			issueKey: 'APO-136',
			issueTitle: 'Rank palette results by recent actions',
			status: 'todo',
			body: 'Assigned this to you for cycle 15 so the palette work lands with the release.',
			at: '2025-03-28T09:40:00Z'
		}
	];

	const kindLabel: Record<InboxItem['kind'], string> = {
		comment: 'New comment',
		review: 'Review requested',
		assignment: 'Assigned to you'
	};

	let read = $state<string[]>([]);

	function markRead(id: string) {
		read = read.includes(id) ? read.filter((x) => x !== id) : [...read, id];
	}

	const unread = $derived(notifications.filter((n) => !read.includes(n.id)));
</script>

<div class="page">
	<header class="page-head">
		<div>
			<h1 class="page-title">Inbox</h1>
			<p class="page-sub">
				Comments, review requests and assignments addressed to you. Marking one read clears it from
				the unread count.
			</p>
		</div>
		<span class="pill">{unread.length} unread</span>
	</header>

	{#if notifications.length === 0}
		<div class="empty">
			<Icon name="inbox" size={18} />
			<p>Your inbox is clear.</p>
			<a class="btn" href="/issues">Browse issues</a>
		</div>
	{:else}
		<ul class="notifications">
			{#each notifications as item}
				{@const actor = userById(item.actorId)}
				<li class:read={read.includes(item.id)}>
					<article class="card note">
						<header class="note-head">
							<Avatar
								initials={actor?.initials ?? null}
								color={actor?.avatarColor}
								name={actor?.name}
								size={22}
							/>
							<span class="note-actor">{actor?.name ?? 'Someone'}</span>
							<span class="pill">{kindLabel[item.kind]}</span>
							<time class="subtle" datetime={item.at}>{relativeTime(item.at)}</time>
						</header>
						<a class="note-issue" href="/issues">
							<StatusIcon status={item.status} />
							<span class="mono">{item.issueKey}</span>
							<span class="note-title">{item.issueTitle}</span>
						</a>
						<p class="muted note-body">{item.body}</p>
						<footer class="note-foot">
							<button class="btn" type="button" onclick={() => markRead(item.id)}>
								<Icon name="check" size={14} />
								{read.includes(item.id) ? 'Mark unread' : 'Mark read'}
							</button>
							<a class="btn btn-ghost" href="/issues">Open issue</a>
						</footer>
					</article>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.notifications {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		max-width: 760px;
	}

	li.read .note {
		opacity: 0.55;
	}

	.note-head {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.note-actor {
		font-weight: var(--weight-medium);
	}

	.note-head time {
		margin-left: auto;
	}

	.note-issue {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2);
		border-radius: var(--radius-sm);
		background: var(--bg-inset);
		min-width: 0;
	}

	.note-issue:hover {
		background: var(--bg-hover);
	}

	.note-title {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.note-body {
		line-height: var(--leading-relaxed);
		max-width: var(--prose-max);
	}

	.note-foot {
		display: flex;
		gap: var(--space-2);
	}
</style>
