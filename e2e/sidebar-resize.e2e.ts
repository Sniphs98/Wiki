import { expect, test } from '@playwright/test';

const containerWidth = (page: import('@playwright/test').Page) =>
	page
		.locator('[data-slot="sidebar-container"]')
		.evaluate((el) => Math.round(el.getBoundingClientRect().width));

test('the page tree can be dragged wider, and keeps its width', async ({ page }) => {
	await page.setViewportSize({ width: 1400, height: 900 });
	await page.goto('/');

	const start = await containerWidth(page);
	const rail = page.locator('[data-slot="sidebar-rail"]');
	const box = (await rail.boundingBox())!;
	const x = box.x + box.width / 2;
	const y = box.y + box.height / 2;

	await page.mouse.move(x, y);
	await page.mouse.down();
	await page.mouse.move(x + 60, y, { steps: 5 });
	await page.mouse.move(x + 120, y, { steps: 5 });
	await page.mouse.up();

	await expect.poll(() => containerWidth(page)).toBe(start + 120);
	// A drag is not a click: the sidebar stays open.
	await expect(page.locator('[data-slot="sidebar"]')).toHaveAttribute('data-state', 'expanded');

	// Rendered at that width on the next visit, straight from the server.
	await page.reload();
	expect(await containerWidth(page)).toBe(start + 120);

	// Never narrower than the minimum.
	const box2 = (await rail.boundingBox())!;
	await page.mouse.move(box2.x + box2.width / 2, y);
	await page.mouse.down();
	await page.mouse.move(0, y, { steps: 10 });
	await page.mouse.up();
	await expect.poll(() => containerWidth(page)).toBe(192);

	// A plain click still folds it in.
	await page.context().clearCookies({ name: 'sidebar_width' });
	await page.reload();
	await rail.click();
	await expect(page.locator('[data-slot="sidebar"]')).toHaveAttribute('data-state', 'collapsed');
});
