import { error } from '@sveltejs/kit';
import { deleteCustomIcon, getCustomIcon } from '$lib/server/repo/custom-icons';
import { attachmentHeaders } from '$lib/server/attachment-headers';
import { canDeleteCustomIcon } from '$lib/server/custom-icons';
import type { RequestHandler } from './$types';

/**
 * The uploaded icon. Shown only as an <img> or a CSS mask, where an SVG
 * can't run scripts; opened directly, it's a sandboxed download like any
 * uploaded SVG (attachment-headers.ts).
 */
export const GET: RequestHandler = async ({ params }) => {
	const icon = await getCustomIcon(params.id);
	if (!icon) error(404, 'Icon nicht gefunden');
	return new Response(new Uint8Array(icon.data), {
		headers: attachmentHeaders({
			filename: icon.name,
			mimeType: icon.mimeType,
			size: icon.data.length
		})
	});
};

/** Deletes it, for admins and whoever uploaded it; its pages go back to the default icon. */
export const DELETE: RequestHandler = async ({ locals, params }) => {
	const icon = await getCustomIcon(params.id);
	if (!icon) error(404, 'Icon nicht gefunden');
	if (!canDeleteCustomIcon(icon, locals)) error(403, 'Du darfst dieses Icon nicht löschen.');
	await deleteCustomIcon(params.id);
	return new Response(null, { status: 204 });
};
