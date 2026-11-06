import { browser } from '$app/environment';
import { SvelteSet } from 'svelte/reactivity';

const STORAGE_KEY = 'open-tree-folders';

/**
 * Which folders of the page tree are open, so they stay open after the page
 * is closed and opened again. Per browser.
 */
class TreeOpenState {
	readonly paths = new SvelteSet<string>();

	constructor() {
		if (!browser) return;
		try {
			const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
			if (Array.isArray(stored)) {
				for (const path of stored) if (typeof path === 'string') this.paths.add(path);
			}
		} catch {
			// Storage blocked or broken — start with everything closed.
		}
	}

	isOpen(path: string) {
		return this.paths.has(path);
	}

	set(path: string, open: boolean) {
		if (open === this.paths.has(path)) return;
		if (open) this.paths.add(path);
		else this.paths.delete(path);
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify([...this.paths]));
		} catch {
			// Not persisted; still applies for this page view.
		}
	}
}

export const treeOpenState = new TreeOpenState();
