import { error, json } from '@sveltejs/kit';
import { createCustomIcon } from '$lib/server/repo/custom-icons';
import {
	CUSTOM_ICON_TYPES,
	MAX_CUSTOM_ICON_SIZE,
	customIconName,
	customIconValue
} from '$lib/custom-icons';
import type { RequestHandler } from './$types';

/**
 * Uploads an icon for pages to pick (multipart: file). Anyone who may edit
 * pages may: everyone with AUTH_MODE=disabled, otherwise those logged in
 * (the hooks already turn away the others).
 */
export const POST: RequestHandler = async ({ locals, request }) => {
	if (locals.authMode !== 'disabled' && !locals.user) error(401, 'Melde dich an.');
	const file = (await request.formData().catch(() => null))?.get('file');
	if (!(file instanceof File)) error(400, 'Keine Datei übermittelt.');
	if (!CUSTOM_ICON_TYPES.includes(file.type)) error(415, 'Nur SVG, PNG oder WebP.');
	if (file.size > MAX_CUSTOM_ICON_SIZE) error(413, 'Das Icon ist zu groß (max. 256 KB).');

	const name = customIconName(file.name);
	const id = await createCustomIcon({
		name,
		mimeType: file.type,
		data: Buffer.from(await file.arrayBuffer()),
		uploadedBy: locals.user?.id
	});
	return json({ id, name, mimeType: file.type, icon: customIconValue(id) });
};
