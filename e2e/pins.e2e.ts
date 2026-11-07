import Database from 'better-sqlite3';
import { expect, test, type APIRequestContext, type Browser } from '@playwright/test';

// The default server (AUTH_MODE=disabled). Pins are for everyone, so each
// test pins in a folder of its own: tests running alongside see none of it.
const baseURL = 'http://localhost:4173';
const DATABASE = './.data/e2e/disabled/wiki.db';

/** Someone with an account; with `admin`, one who may pin for everyone. */
async function person(browser: Browser, name: string, { admin = false } = {}) {
	const email = `${name.toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.test`;
	const context = await browser.newContext({ baseURL });
	const response = await context.request.post('/api/auth/sign-up/email', {
		data: { email, password: 'ein-langes-passwort-123', name },
		headers: { origin: baseURL }
	});
	expect(response.ok()).toBe(true);
	// The first account on a fresh wiki is an admin: set the role either way.
	const db = new Database(DATABASE);
	try {
		db.prepare(`UPDATE user SET role = ? WHERE email = ?`).run(admin ? 'admin' : 'member', email);
	} finally {
		db.close();
	}
	return { context, page: await context.newPage() };
}

/** A folder of two pages, "Anfang …" and "Zweite …", in that order; returns their titles and a page. */
async function area(request: APIRequestContext) {
	const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
	const folder = `e2e/pins-${id}`;
	const first = `Anfang ${id}`;
	const second = `Zweite ${id}`;
	for (const [slug, title] of [
		['anfang', first],
		['zweite', second]
	]) {
		const response = await request.post(`/w/${folder}/${slug}/edit?/save`, {
			form: { content: `# ${title}\n\nInhalt.` },
			headers: { origin: baseURL, accept: 'text/html' },
			maxRedirects: 0
		});
		expect(response.status()).toBe(303);
	}
	return { folder, first, second, url: `/w/${folder}/anfang` };
}

async function pinRequest(request: APIRequestContext, path: string, pinned: boolean) {
	return request.post('/api/pins', { data: { path, pinned }, headers: { origin: baseURL } });
}

const level = (page: import('@playwright/test').Page, title: string) =>
	page
		.locator('[data-sidebar="menu-sub"]')
		.filter({ has: page.getByRole('link', { name: title }) })
		.last() // the innermost level: the area's, not the whole e2e folder's
		.getByRole('link');

/** Picks an entry in the "…" menu of a tree item. */
async function fromMenu(page: import('@playwright/test').Page, title: string, item: string) {
	await page.getByRole('button', { name: `Mehr zu ${title}` }).click();
	await page.getByRole('menuitem', { name: item }).click();
}

test('pins an admin sets move entries to the top of their level, for everyone', async ({
	browser,
	request
}) => {
	const { first, second, url } = await area(request);
	const ada = await person(browser, 'Ada', { admin: true });
	const otto = await person(browser, 'Otto');
	const subpages = (page: import('@playwright/test').Page) => level(page, first);

	await ada.page.goto(url);
	await expect(subpages(ada.page)).toHaveText([first, second]);

	await fromMenu(ada.page, second, 'Oben anpinnen');
	await expect(subpages(ada.page)).toHaveText([second, first]);
	await expect(
		ada.page.getByRole('button', { name: `Nicht mehr anpinnen: ${second}` })
	).toHaveAttribute('aria-pressed', 'true');

	// Still pinned after a reload, and Otto sees it pinned too — but can't change it.
	await ada.page.reload();
	await expect(subpages(ada.page)).toHaveText([second, first]);
	await otto.page.goto(url);
	await expect(subpages(otto.page)).toHaveText([second, first]);
	await expect(otto.page.getByRole('button', { name: /Nicht mehr anpinnen/ })).toHaveCount(0);
	await otto.page.getByRole('button', { name: `Mehr zu ${first}` }).click();
	await expect(otto.page.getByRole('menuitem', { name: 'Link kopieren' })).toBeVisible();
	await expect(otto.page.getByRole('menuitem', { name: /anpinnen/ })).toHaveCount(0);

	await ada.page.getByRole('button', { name: `Nicht mehr anpinnen: ${second}` }).click();
	await expect(subpages(ada.page)).toHaveText([first, second]);

	await ada.context.close();
	await otto.context.close();
});

test('only admins may pin, also through the API', async ({ browser, request }) => {
	expect((await pinRequest(request, 'e2e/handbuch', true)).status()).toBe(401);
	const otto = await person(browser, 'Otto');
	expect((await pinRequest(otto.context.request, 'e2e/handbuch', true)).status()).toBe(403);
	await otto.context.close();
});

test('without a login there is nothing to pin', async ({ page }) => {
	await page.goto('/w/e2e/handbuch/betrieb');
	await page.getByRole('button', { name: 'Mehr zu Betrieb' }).click();
	await expect(page.getByRole('menuitem', { name: 'Link kopieren' })).toBeVisible();
	await expect(page.getByRole('menuitem', { name: /anpinnen/ })).toHaveCount(0);
});

test('hovering an entry shows its own menu only, and it goes away again', async ({
	browser,
	request
}) => {
	const { first, second, url } = await area(request);
	const { context, page } = await person(browser, 'Hugo', { admin: true });
	await page.goto(url);
	const firstMenu = page.getByRole('button', { name: `Mehr zu ${first}` });
	const secondMenu = page.getByRole('button', { name: `Mehr zu ${second}` });

	await page.getByRole('link', { name: first, exact: true }).hover();
	await expect(firstMenu).toHaveCSS('opacity', '1');
	await expect(secondMenu).toHaveCSS('opacity', '0');

	// Open while the menu is open, hidden again once it's closed and left.
	await firstMenu.click();
	await page.mouse.move(600, 400);
	await expect(firstMenu).toHaveCSS('opacity', '1');
	await page.getByRole('menuitem', { name: 'Oben anpinnen' }).click();
	await page.getByRole('heading', { level: 1 }).first().hover();
	await expect(firstMenu).toHaveCSS('opacity', '0');

	// A pinned one shows its pin on hover too, which unpins it.
	const pin = page.getByRole('button', { name: `Nicht mehr anpinnen: ${first}` });
	await expect(pin).toHaveCSS('opacity', '0');
	await page.getByRole('link', { name: first, exact: true }).hover();
	await expect(pin).toHaveCSS('opacity', '1');
	await pin.click();
	await expect(pin).toHaveCount(0);

	await context.close();
});
