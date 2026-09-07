export type IconName =
	| 'inbox'
	| 'user'
	| 'dashboard'
	| 'project'
	| 'issue'
	| 'release'
	| 'team'
	| 'settings'
	| 'search'
	| 'sun'
	| 'moon'
	| 'plus'
	| 'chevron-right'
	| 'list'
	| 'board'
	| 'filter'
	| 'calendar'
	| 'check'
	| 'clock'
	| 'tag'
	| 'arrow-up'
	| 'command';

export interface NavItem {
	href: string;
	label: string;
	icon: IconName;
	shortcut?: string;
	count?: number;
}
