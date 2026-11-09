import { describe, expect, it } from 'vitest';
import { PAGE_ICONS, isPageIcon, pageIcon, searchPageIcons } from './page-icons';

describe('page icons', () => {
	it('has each name once', () => {
		const names = PAGE_ICONS.map((icon) => icon.name);
		expect(new Set(names).size).toBe(names.length);
	});

	it('only accepts the offered names', () => {
		expect(isPageIcon('rocket')).toBe(true);
		expect(isPageIcon('not-an-icon')).toBe(false);
		expect(isPageIcon(null)).toBe(false);
		expect(pageIcon('rocket')?.label).toBe('Rakete');
		expect(pageIcon('gone')).toBeUndefined();
		expect(pageIcon(null)).toBeUndefined();
	});

	it('finds icons by German words, all of them', () => {
		expect(searchPageIcons('').length).toBe(PAGE_ICONS.length);
		expect(searchPageIcons('Onboarding').map((icon) => icon.name)).toContain('user-plus');
		expect(searchPageIcons('neuanstellung onboarding').map((icon) => icon.name)).toEqual([
			'user-plus'
		]);
		expect(searchPageIcons('xyz')).toEqual([]);
	});
});
