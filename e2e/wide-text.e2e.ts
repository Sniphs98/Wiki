import { expect, test, type Page } from '@playwright/test';

// Seeded by e2e/setup-db.js.
const PATH = 'e2e/pdf-export';

const toggle = (page: Page) => page.getByRole('button', { name: 'Breiter Text' }).first();
const column = (page: Page) => page.locator('.ProseMirror:not(.page-break-measure *)').first();
const columnWidth = (page: Page) =>
	column(page).evaluate((el) => Math.round(el.getBoundingClientRect().width));
const aside = (page: Page) => page.getByRole('navigation', { name: 'Auf dieser Seite' });

test('the wide text mode uses the room beside the A4 column and is remembered', async ({
	page
}) => {
	await page.setViewportSize({ width: 1920, height: 1000 });
	await page.goto(`/w/${PATH}`);
	await expect(column(page)).toBeVisible();
	await expect(page.locator('[data-page-break]').first()).toBeAttached({ timeout: 15_000 });
	const a4Width = await columnWidth(page);

	await toggle(page).click();
	await expect(toggle(page)).toHaveAttribute('aria-pressed', 'true');
	await expect.poll(() => columnWidth(page)).toBeGreaterThan(a4Width + 300);

	// The text never runs under the panels beside it.
	const text = await column(page).boundingBox();
	const toc = await aside(page).boundingBox();
	expect(text!.x + text!.width).toBeLessThanOrEqual(toc!.x);

	// The page breaks only apply to the A4 column.
	await expect(page.locator('[data-page-break]')).toHaveCount(0);
	await expect(page.getByRole('button', { name: 'Seitenumbrüche' }).first()).toBeDisabled();

	// Remembered, and the same in the editor.
	await page.goto(`/w/${PATH}/edit`);
	await expect(column(page)).toBeVisible({ timeout: 15_000 });
	await expect(toggle(page)).toHaveAttribute('aria-pressed', 'true');
	await expect.poll(() => columnWidth(page)).toBeGreaterThan(a4Width + 300);

	await toggle(page).click();
	await expect.poll(() => columnWidth(page)).toBe(a4Width);
});
