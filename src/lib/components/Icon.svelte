<script lang="ts">
	/** Hand-written stroke icon set. No icon library, no filled shapes. */
	import type { IconName } from '$lib/icons';

	const paths: Record<IconName, string[]> = {
		inbox: ['M3 13h4l1.5 2.5h7L17 13h4', 'M5.5 5h13l2.5 8v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4z'],
		user: ['M4.5 20v-1.5A4.5 4.5 0 0 1 9 14h6a4.5 4.5 0 0 1 4.5 4.5V20', 'M12 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z'],
		dashboard: ['M4 4h7v7H4z', 'M13 4h7v4.5h-7z', 'M13 10.5h7V20h-7z', 'M4 13h7v7H4z'],
		project: ['M4 6.5h6l1.5 2H20', 'M4 6.5V19h16V8.5', 'M8 13h8'],
		issue: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M12 8.5v4l2.5 2'],
		release: ['M4 8.5 12 4l8 4.5v7L12 20l-8-4.5z', 'M4 8.5 12 13l8-4.5', 'M12 13v7'],
		team: ['M2.5 20v-1a4 4 0 0 1 4-4h3a4 4 0 0 1 4 4v1', 'M8 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M15.5 6.5a3 3 0 0 1 0 5.8', 'M17 15h.5a4 4 0 0 1 4 4v1'],
		settings: ['M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M19.5 12a7.5 7.5 0 0 0-.1-1.2l1.8-1.3-1.8-3.1-2.1.8a7.6 7.6 0 0 0-2-1.2L15 3.5H9l-.3 2.3a7.6 7.6 0 0 0-2 1.2l-2.1-.8-1.8 3.1 1.8 1.3a7.5 7.5 0 0 0 0 2.4l-1.8 1.3 1.8 3.1 2.1-.8a7.6 7.6 0 0 0 2 1.2l.3 2.4h6l.3-2.4a7.6 7.6 0 0 0 2-1.2l2.1.8 1.8-3.1-1.8-1.3c.06-.4.1-.8.1-1.2z'],
		search: ['M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13z', 'M15.5 15.5 20 20'],
		sun: ['M12 16.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9z', 'M12 2.5v2', 'M12 19.5v2', 'M2.5 12h2', 'M19.5 12h2', 'M5.2 5.2l1.4 1.4', 'M17.4 17.4l1.4 1.4', 'M18.8 5.2l-1.4 1.4', 'M6.6 17.4l-1.4 1.4'],
		moon: ['M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z'],
		plus: ['M12 5v14', 'M5 12h14'],
		'chevron-right': ['M9.5 6.5 15 12l-5.5 5.5'],
		list: ['M4 7h16', 'M4 12h16', 'M4 17h10'],
		board: ['M4 5h4.5v14H4z', 'M9.75 5h4.5v9h-4.5z', 'M15.5 5H20v11h-4.5z'],
		filter: ['M4 6h16', 'M7 12h10', 'M10 18h4'],
		calendar: ['M4.5 6.5h15V20h-15z', 'M4.5 10.5h15', 'M8.5 4v3', 'M15.5 4v3'],
		check: ['M5 12.5 9.5 17 19 7.5'],
		clock: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M12 7.5V12l3 2'],
		tag: ['M11 3.5H4.5v6.5L14 19.5l6.5-6.5z', 'M8 8h.01'],
		'arrow-up': ['M12 19V5', 'M6.5 10.5 12 5l5.5 5.5'],
		command: ['M9 6a2.5 2.5 0 1 0-2.5 2.5H9V6z', 'M9 8.5h6v6H9z', 'M15 8.5h1.5A2.5 2.5 0 1 0 15 6v2.5', 'M9 14.5H6.5A2.5 2.5 0 1 0 9 18v-3.5', 'M15 14.5v3.5A2.5 2.5 0 1 0 17.5 15H15z']
	};

	interface Props {
		name: IconName;
		size?: number;
		strokeWidth?: number;
		label?: string;
	}

	let { name, size = 16, strokeWidth = 1.6, label }: Props = $props();
</script>

<svg
	class="icon"
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width={strokeWidth}
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden={label ? undefined : 'true'}
	role={label ? 'img' : undefined}
	aria-label={label}
>
	{#each paths[name] as d}
		<path {d} />
	{/each}
</svg>

<style>
	.icon {
		flex: none;
		display: block;
	}
</style>
