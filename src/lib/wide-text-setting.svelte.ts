import { browser } from '$app/environment';

const STORAGE_KEY = 'wide-text';

/**
 * Whether the page and edit views use the whole width of the window for
 * the text, instead of the A4 column the PDF has. Per browser.
 */
class WideTextSetting {
	wide = $state(false);

	constructor() {
		if (!browser) return;
		try {
			this.wide = localStorage.getItem(STORAGE_KEY) === 'true';
		} catch {
			// Storage blocked (private mode etc.) — keep the default.
		}
	}

	toggle() {
		this.wide = !this.wide;
		try {
			localStorage.setItem(STORAGE_KEY, String(this.wide));
		} catch {
			// Not persisted; still applies for this page view.
		}
	}
}

export const wideTextSetting = new WideTextSetting();
