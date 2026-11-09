import { invalidate } from '$app/navigation';
import { withBase } from '$lib/base-path';

/**
 * What the server says changed (GET /api/events, live-events.ts). One
 * connection per tab, opened by the app layout; the page view and the
 * editor listen for their page and offer to show the new state
 * (live-update-notice.svelte) — never replacing what someone is typing.
 * The page tree simply follows.
 */
export interface PageChange {
	pageId: string;
	/** The page's newest version now. */
	version?: number;
	deleted?: boolean;
	/** Where the page is now. */
	movedTo?: string;
}

type PageListener = (change: PageChange) => void;

const pageListeners = new Set<PageListener>();

/** Calls `listener` with every change to a page; returns the function that stops it. */
export function onPageChange(listener: PageListener): () => void {
	pageListeners.add(listener);
	return () => pageListeners.delete(listener);
}

/** Several changes at once (a folder moved) reload the tree once. */
const TREE_DELAY_MS = 300;

/**
 * Listens for changes until the returned function is called. `since` is
 * where the changes stood when the page's data was loaded, so none made
 * meanwhile are missed.
 */
export function connectLiveUpdates(since: string): () => void {
	if (typeof EventSource === 'undefined') return () => {};

	const source = new EventSource(withBase(`/api/events?since=${encodeURIComponent(since)}`));

	let treeTimer: ReturnType<typeof setTimeout> | undefined;
	const reloadTree = () => {
		clearTimeout(treeTimer);
		treeTimer = setTimeout(() => void invalidate('wiki:tree'), TREE_DELAY_MS);
	};

	source.addEventListener('page', (event) => {
		const change = parse<PageChange>(event);
		if (!change) return;
		for (const listener of pageListeners) listener(change);
	});
	source.addEventListener('tree', reloadTree);
	// Changes were missed and can't be named any more (e.g. the server restarted).
	source.addEventListener('resync', reloadTree);

	return () => {
		clearTimeout(treeTimer);
		source.close();
	};
}

function parse<T>(event: Event): T | null {
	try {
		return JSON.parse((event as MessageEvent<string>).data) as T;
	} catch {
		return null;
	}
}
