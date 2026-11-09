import { listPages } from '$lib/server/repo/pages';
import { getUserPreferences } from '$lib/server/repo/preferences';
import { countNotes } from '$lib/server/repo/inbox';
import { pinnedPaths } from '$lib/server/repo/pins';
import { loginEnabled } from '$lib/server/login';
import { bootId, cursor } from '$lib/server/live-events';
import { SIDEBAR_WIDTH_COOKIE_NAME, clampSidebarWidth } from '$lib/components/ui/sidebar/constants';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async (event) => {
	// Reloaded on its own when the tree changes (live-updates.ts).
	event.depends('wiki:tree');
	// Taken before reading, so a change made meanwhile is heard of, not missed.
	const liveCursor = `${bootId}:${cursor()}`;
	const pages = event.locals.access.readable(await listPages());

	const user = event.locals.user;
	const [preferences, inboxCount, pinned] = await Promise.all([
		user ? getUserPreferences(user.id) : null,
		user ? countNotes(user.id) : 0,
		pinnedPaths()
	]);

	return {
		pages,
		user,
		authMode: event.locals.authMode,
		isAdmin: event.locals.access.isAdmin,
		/** Notes in the person's inbox, shown on its button. */
		inboxCount,
		/** No login at all (see loginMethods): no account menu either. */
		loginEnabled,
		/** Pages and folders an admin pinned in the tree, for everyone. */
		pinned,
		/** Where the changes stood when this was loaded (GET /api/events?since=). */
		liveCursor,
		toolbar: preferences?.toolbar ?? null,
		/** The width the page tree was dragged to (per browser), null for the default. */
		sidebarWidth: clampSidebarWidth(event.cookies.get(SIDEBAR_WIDTH_COOKIE_NAME))
	};
};
