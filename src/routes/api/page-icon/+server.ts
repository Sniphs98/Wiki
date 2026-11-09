import { error, json } from '@sveltejs/kit';
import { getPagePath, setPageIcon } from '$lib/server/repo/pages';
import { requireEdit } from '$lib/server/access';
import { isPageIcon } from '$lib/page-icons';
import type { RequestHandler } from './$types';

/** Sets a page's icon (page-icons.ts), or back to the default: { pageId, icon: name | null }. */
export const POST: RequestHandler = async ({ locals, request }) => {
	const body = (await request.json().catch(() => null)) as { pageId?: unknown; icon?: unknown };
	const pageId = typeof body?.pageId === 'string' ? body.pageId : '';
	const icon = body?.icon ?? null;
	if (!pageId || (icon !== null && !isPageIcon(icon))) error(400, 'Erwartet: { pageId, icon }');

	const path = await getPagePath(pageId);
	if (!path) error(404, 'Seite nicht gefunden');
	requireEdit(locals.access, path);

	await setPageIcon(pageId, icon);
	return json({ pageId, icon });
};
