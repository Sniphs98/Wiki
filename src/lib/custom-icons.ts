/** Uploaded page icons (custom_icon): what may be uploaded, and how a page refers to one. */

/** A page's icon value for an uploaded icon: `custom:<id>`. */
export const CUSTOM_ICON_PREFIX = 'custom:';

export const CUSTOM_ICON_TYPES = ['image/svg+xml', 'image/png', 'image/webp'];

/** Icons are shown at 16–40 px: plenty for an SVG or a small PNG. */
export const MAX_CUSTOM_ICON_SIZE = 256 * 1024;

/** An uploaded icon, as the browser knows it (from the layout's data). */
export interface CustomIcon {
	id: string;
	name: string;
	mimeType: string;
	/** Whether the person looking may delete it. */
	canDelete: boolean;
}

export function customIconValue(id: string): string {
	return `${CUSTOM_ICON_PREFIX}${id}`;
}

/** The uploaded icon's id in a page's icon value, or null for a built-in one. */
export function customIconId(value: string | null | undefined): string | null {
	return value?.startsWith(CUSTOM_ICON_PREFIX) ? value.slice(CUSTOM_ICON_PREFIX.length) : null;
}

/** The name shown for an uploaded file: its filename without the extension. */
export function customIconName(filename: string): string {
	return (
		filename
			.replace(/\.[^.]+$/, '')
			.trim()
			.slice(0, 60) || 'Icon'
	);
}
