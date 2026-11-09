import { expect, test, type APIRequestContext } from '@playwright/test';

const baseURL = 'http://localhost:4173';

/** A page of its own (AUTH_MODE=disabled: anyone edits); returns its path and title. */
async function newPage(request: APIRequestContext) {
	const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
	const path = `e2e/icons-${id}`;
	const title = `Icon ${id}`;
	const response = await request.post(`/w/${path}/edit?/save`, {
		form: { content: `# ${title}\n\nInhalt.` },
		headers: { origin: baseURL, accept: 'text/html' },
		maxRedirects: 0
	});
	expect(response.status()).toBe(303);
	return { path, title };
}

test('a page gets an icon above its title and in the tree, and loses it again', async ({
	page,
	request
}) => {
	const { path, title } = await newPage(request);
	await page.goto(`/w/${path}`);
	const row = page.locator('[data-sidebar="menu-button"]', { hasText: title });
	await expect(row).toBeVisible();
	const defaultIcon = await row.locator('svg').evaluate((svg) => svg.getAttribute('class'));
	expect(defaultIcon).toContain('lucide-file-text');

	await page.getByRole('button', { name: 'Icon hinzufügen' }).click();
	await page.getByRole('textbox', { name: 'Icon suchen' }).fill('rakete');
	await page.getByRole('option', { name: 'Rakete' }).click();

	await expect(page.getByRole('button', { name: 'Icon ändern: Rakete' })).toBeVisible();
	await expect(row.locator('svg.lucide-rocket')).toBeVisible();

	// Still there after a reload, and from the tree's menu it goes again.
	await page.reload();
	await expect(row.locator('svg.lucide-rocket')).toBeVisible();
	await row.hover();
	await page.getByRole('button', { name: `Mehr zu ${title}` }).click();
	await page.getByRole('menuitem', { name: 'Icon ändern …' }).click();
	await expect(page.getByRole('option', { name: 'Rakete' })).toHaveAttribute(
		'aria-selected',
		'true'
	);
	await page.getByRole('button', { name: 'Entfernen' }).click();
	await expect(row.locator('svg.lucide-file-text')).toBeVisible();
	await expect(page.getByRole('button', { name: 'Icon hinzufügen' })).toBeAttached();
});

test('only icons from the list are stored', async ({ request }) => {
	const response = await request.post('/api/page-icon', {
		data: { pageId: 'any', icon: 'nope' },
		headers: { origin: baseURL }
	});
	expect(response.status()).toBe(400);
});
