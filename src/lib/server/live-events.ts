/**
 * Tells open browser tabs that the wiki changed, so they can offer to show
 * the new state (GET /api/events, live-updates.svelte.ts). Server-Sent
 * Events: the changes only ever flow from the server to the browser, and
 * SSE works over plain HTTP — no extra server next to SvelteKit's.
 *
 * In memory, in this one server process: several wiki processes behind a
 * load balancer would only hear about their own changes.
 */

/** A change, as the server knows it — with paths, to decide who may hear of it. */
export type WikiChange =
	| {
			type: 'page';
			pageId: string;
			/** Where the page is (was, if deleted or moved). */
			path: string;
			/** The newest version now; absent if the page was deleted or only moved. */
			version?: number;
			deleted?: boolean;
			/** Where the page moved to. */
			movedTo?: string;
	  }
	/** The page tree changed: a page was added, removed, moved, retitled or (un)pinned. */
	| { type: 'tree'; paths: string[] };

/** A change, numbered: the browser asks for those after the last it saw when reconnecting. */
export interface NumberedChange {
	id: number;
	change: WikiChange;
}

type Listener = (event: NumberedChange) => void;

const listeners = new Set<Listener>();

/** Recent changes, for tabs that lost the connection for a moment (sleep, network). */
const RECENT = 200;
const recent: NumberedChange[] = [];
let lastId = 0;

/**
 * Tells this server's lifetime apart from the next one's: numbers restart
 * with the server, so "after 17" from before a restart means nothing.
 */
export const bootId = Date.now().toString(36);

export function publish(change: WikiChange) {
	const event = { id: ++lastId, change };
	recent.push(event);
	if (recent.length > RECENT) recent.shift();
	for (const listener of listeners) {
		try {
			listener(event);
		} catch {
			// One closed connection mustn't keep the others from hearing.
		}
	}
}

/** The number of the latest change (sent as `<bootId>:<number>`, GET /api/events). */
export function cursor(): number {
	return lastId;
}

/** Calls `listener` for every change from now on; returns the function that stops it. */
export function subscribe(listener: Listener): () => void {
	listeners.add(listener);
	return () => listeners.delete(listener);
}

/**
 * The changes after `id`, or null if they aren't all known any more
 * (too long ago, or from before a restart) — then the tab must refresh what it shows.
 */
export function changesSince(id: number): NumberedChange[] | null {
	if (id > lastId) return null;
	if (id === lastId) return [];
	const first = recent[0]?.id ?? lastId + 1;
	if (id < first - 1) return null;
	return recent.filter((event) => event.id > id);
}

/** What the browser is told: only what the visitor may know, without paths. */
export type ClientChange =
	| {
			type: 'page';
			pageId: string;
			version?: number;
			deleted?: boolean;
			movedTo?: string;
	  }
	| { type: 'tree' };

/** The change as `canRead` may hear it, or null if it concerns nothing the visitor may see. */
export function visibleChange(
	change: WikiChange,
	canRead: (path: string) => boolean
): ClientChange | null {
	if (change.type === 'tree') {
		return change.paths.some(canRead) ? { type: 'tree' } : null;
	}
	const canReadTarget = change.movedTo !== undefined && canRead(change.movedTo);
	if (!canRead(change.path) && !canReadTarget) return null;
	return {
		type: 'page',
		pageId: change.pageId,
		...(change.version !== undefined && { version: change.version }),
		...(change.deleted && { deleted: true }),
		// Moved somewhere the visitor may not follow: for them, it's gone.
		...(change.movedTo !== undefined &&
			(canReadTarget ? { movedTo: change.movedTo } : { deleted: true }))
	};
}
