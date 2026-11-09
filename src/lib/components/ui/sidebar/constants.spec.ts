import { describe, expect, it } from 'vitest';
import { SIDEBAR_MAX_WIDTH, SIDEBAR_MIN_WIDTH, clampSidebarWidth } from './constants';

describe('clampSidebarWidth', () => {
	it('keeps a width in range, rounded', () => {
		expect(clampSidebarWidth(300)).toBe(300);
		expect(clampSidebarWidth('320.6')).toBe(321);
	});

	it('clamps to the allowed range', () => {
		expect(clampSidebarWidth(10)).toBe(SIDEBAR_MIN_WIDTH);
		expect(clampSidebarWidth('99999')).toBe(SIDEBAR_MAX_WIDTH);
	});

	it('falls back to the default for anything unusable', () => {
		expect(clampSidebarWidth(undefined)).toBeNull();
		expect(clampSidebarWidth('')).toBeNull();
		expect(clampSidebarWidth('breit')).toBeNull();
		expect(clampSidebarWidth(Number.NaN)).toBeNull();
	});
});
