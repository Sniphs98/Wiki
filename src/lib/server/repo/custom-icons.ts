import { dbDialect } from '$lib/server/db';

/** Icons uploaded for pages (custom_icon), offered in the icon picker next to the built-in ones. */
const impl =
	dbDialect === 'postgresql'
		? await import('./custom-icons.pg')
		: await import('./custom-icons.sqlite');

export const listCustomIcons = impl.listCustomIcons;
export const getCustomIcon = impl.getCustomIcon;
export const createCustomIcon = impl.createCustomIcon;
/** Pages that had it show the default icon again (pageIcon finds none). */
export const deleteCustomIcon = impl.deleteCustomIcon;

export type { CustomIconMeta, CustomIconFile } from './custom-icons.types';
