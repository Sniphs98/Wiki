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

test('an uploaded icon can be picked for pages, and deleted again', async ({ page, request }) => {
	const { path, title } = await newPage(request);
	const name = `logo-${Date.now().toString(36)}`;
	await page.goto(`/w/${path}`);
	const row = page.locator('[data-sidebar="menu-button"]', { hasText: title });

	await page.getByRole('button', { name: 'Icon hinzufügen' }).click();
	await page.getByLabel('Icon hochladen').setInputFiles({
		name: `${name}.svg`,
		mimeType: 'image/svg+xml',
		buffer: Buffer.from(
			'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><circle cx="8" cy="8" r="8"/></svg>'
		)
	});
	// Uploading gives it to the page right away.
	await expect(page.getByRole('button', { name: `Icon ändern: ${name}` })).toBeVisible();
	await expect(row.locator('[data-page-icon="custom"]')).toBeVisible();

	// Offered for other pages too, and gone from all of them once deleted.
	await page.getByRole('button', { name: `Icon ändern: ${name}` }).click();
	await expect(page.getByRole('option', { name })).toHaveAttribute('aria-selected', 'true');
	page.once('dialog', (dialog) => dialog.accept());
	await page.getByRole('option', { name }).hover();
	await page.getByRole('button', { name: `Icon löschen: ${name}` }).click();
	await expect(page.getByRole('option', { name })).toHaveCount(0);
	await page.keyboard.press('Escape');
	await expect(row.locator('svg.lucide-file-text')).toBeVisible();
});

test('only images are taken as icons', async ({ request }) => {
	const response = await request.post('/api/icons', {
		multipart: { file: { name: 'x.html', mimeType: 'text/html', buffer: Buffer.from('<b>') } },
		headers: { origin: baseURL }
	});
	expect(response.status()).toBe(415);
});
