import { error, json } from '@sveltejs/kit';
import { getPagePath, setPageIcon } from '$lib/server/repo/pages';
import { requireEdit } from '$lib/server/access';
import { isPageIcon } from '$lib/page-icons';
import { customIconId } from '$lib/custom-icons';
import { getCustomIcon } from '$lib/server/repo/custom-icons';
import type { RequestHandler } from './$types';

/** A built-in icon's name, or `custom:<id>` of an uploaded one that's still there. */
async function isKnownIcon(icon: unknown): Promise<boolean> {
	if (isPageIcon(icon)) return true;
	const id = typeof icon === 'string' ? customIconId(icon) : null;
	return id !== null && (await getCustomIcon(id)) !== null;
}

/**
 * Sets a page's icon, or back to the default: { pageId, icon: name | null },
 * the name of a built-in icon (page-icons.ts) or `custom:<id>` of an uploaded one.
 */
export const POST: RequestHandler = async ({ locals, request }) => {
	const body = (await request.json().catch(() => null)) as { pageId?: unknown; icon?: unknown };
	const pageId = typeof body?.pageId === 'string' ? body.pageId : '';
	const icon = body?.icon ?? null;
	if (!pageId || (icon !== null && (typeof icon !== 'string' || !(await isKnownIcon(icon))))) {
		error(400, 'Erwartet: { pageId, icon }');
	}

	const path = await getPagePath(pageId);
	if (!path) error(404, 'Seite nicht gefunden');
	requireEdit(locals.access, path);

	await setPageIcon(pageId, icon);
	return json({ pageId, icon });
};
