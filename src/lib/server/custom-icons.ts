import { listCustomIcons, type CustomIconMeta } from '$lib/server/repo/custom-icons';
import type { CustomIcon } from '$lib/custom-icons';

interface Viewer {
	authMode: App.Locals['authMode'];
	user?: { id: string } | null;
	access: { isAdmin: boolean };
}

/**
 * Admins and whoever uploaded an icon may delete it; with AUTH_MODE=disabled,
 * where nobody logs in, anyone may — like anyone may edit there.
 */
export function canDeleteCustomIcon(icon: CustomIconMeta, viewer: Viewer): boolean {
	if (viewer.authMode === 'disabled') return true;
	if (!viewer.user) return false;
	return viewer.access.isAdmin || icon.uploadedBy === viewer.user.id;
}

/** The uploaded icons for the browser, each with whether the viewer may delete it. */
export async function customIconsFor(viewer: Viewer): Promise<CustomIcon[]> {
	return (await listCustomIcons()).map((icon) => ({
		id: icon.id,
		name: icon.name,
		mimeType: icon.mimeType,
		canDelete: canDeleteCustomIcon(icon, viewer)
	}));
}
