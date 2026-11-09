import { expect, test } from '@playwright/test';
import { createPage, onPage, openEditor, type } from './helpers';

const notice = (page: import('@playwright/test').Page) => page.getByTestId('live-update-notice');

/** Saves a new version of `path` as someone else would, through the edit form. */
async function saveElsewhere(
	page: import('@playwright/test').Page,
	baseURL: string,
	path: string,
	content: string,
	base = 1
) {
	const response = await page.request.post(`${baseURL}/w/${path}/edit?/save`, {
		form: { content, baseVersion: String(base) },
		headers: { origin: baseURL, accept: 'text/html' },
		maxRedirects: 0
	});
	expect(response.status()).toBe(303);
}

test('a page being read offers its new version once someone saves it', async ({
	page,
	baseURL
}) => {
	const path = await createPage(page, baseURL!, 'live', '# Live\n\nErste Fassung');
	await page.goto(`/w/${path}`, { waitUntil: 'networkidle' });
	await expect(onPage(page, 'p')).toHaveText('Erste Fassung');

	await saveElsewhere(page, baseURL!, path, '# Live\n\nZweite Fassung');

	// Said, but the text stays until asked for.
	await expect(notice(page)).toContainText('jetzt Version 2');
	await expect(onPage(page, 'p')).toHaveText('Erste Fassung');

	await notice(page).getByRole('button', { name: 'Aktualisieren' }).click();
	await expect(onPage(page, 'p')).toHaveText('Zweite Fassung');
	await expect(notice(page)).toBeHidden();
});

test('the page tree follows new pages without a reload', async ({ page, baseURL }) => {
	const first = await createPage(page, baseURL!, 'live-baum', '# Live-Baum\n\nText');
	await page.goto(`/w/${first}`, { waitUntil: 'networkidle' });

	const second = await createPage(page, baseURL!, 'live-neu', '# Live-Neu-Baum\n\nText');
	await expect(page.locator(`a[href$="/w/${second}"]`).first()).toBeVisible();
});

test('the editor keeps unsaved changes when someone else saves', async ({ page, baseURL }) => {
	const path = await createPage(page, baseURL!, 'live-edit', '# Live-Edit\n\nUrsprung');
	await openEditor(page, path);
	await type(page, ' und mehr');

	await saveElsewhere(page, baseURL!, path, '# Live-Edit\n\nVon jemand anderem');

	await expect(notice(page)).toContainText('Deine Änderungen bleiben erhalten');
	await expect(onPage(page, 'p')).toHaveText('Ursprung und mehr');

	// Loading the new version asks first — and keeping on editing keeps the text.
	await notice(page).getByRole('button', { name: 'Neue Version laden' }).click();
	await page.getByRole('button', { name: 'Weiter bearbeiten' }).click();
	await expect(onPage(page, 'p')).toHaveText('Ursprung und mehr');

	await notice(page).getByRole('button', { name: 'Neue Version laden' }).click();
	await page.getByRole('button', { name: 'Verwerfen und laden' }).click();
	await expect(onPage(page, 'p')).toHaveText('Von jemand anderem');
	await expect(notice(page)).toBeHidden();
});
