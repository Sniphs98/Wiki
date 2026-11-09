import { error, json } from '@sveltejs/kit';
import { pin, unpin } from '$lib/server/repo/pins';
import { slugifyPath } from '$lib/slug';
import { publish } from '$lib/server/live-events';
import type { RequestHandler } from './$types';

/** Pins a page or folder in the tree for everyone, or unpins it: { path, pinned }. Admins only. */
export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) error(401, 'Melde dich an, um Seiten anzupinnen.');
	if (!locals.access.isAdmin) error(403, 'Nur Admins dürfen Seiten anpinnen.');
	const body = (await request.json().catch(() => null)) as { path?: unknown; pinned?: unknown };
	const path = typeof body?.path === 'string' ? slugifyPath(body.path) : '';
	if (!path || typeof body?.pinned !== 'boolean') error(400, 'Erwartet: { path, pinned }');

	if (body.pinned) await pin(path, locals.user.id);
	else await unpin(path);
	publish({ type: 'tree', paths: [path] });
	return json({ path, pinned: body.pinned });
};
