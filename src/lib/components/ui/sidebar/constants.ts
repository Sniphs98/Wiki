export const SIDEBAR_COOKIE_NAME = 'sidebar_state';
export const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
export const SIDEBAR_WIDTH = '16rem';
export const SIDEBAR_WIDTH_MOBILE = '18rem';
export const SIDEBAR_WIDTH_ICON = '3rem';
export const SIDEBAR_KEYBOARD_SHORTCUT = 'b';

/** The width the person dragged the sidebar to, in pixels (see sidebar-rail). */
export const SIDEBAR_WIDTH_COOKIE_NAME = 'sidebar_width';
export const SIDEBAR_WIDTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
export const SIDEBAR_MIN_WIDTH = 192; // 12rem
export const SIDEBAR_MAX_WIDTH = 640; // 40rem

/** A width within the allowed range, or null (the default width) for anything unusable. */
export function clampSidebarWidth(value: unknown): number | null {
	const width = typeof value === 'string' ? Number.parseFloat(value) : value;
	if (typeof width !== 'number' || !Number.isFinite(width)) return null;
	return Math.round(Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, width)));
}
