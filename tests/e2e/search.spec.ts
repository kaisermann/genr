import { expect, test } from '@playwright/test';

test('loads an artist route and searches a new artist', async ({ page }) => {
	const consoleErrors: string[] = [];
	const routerWarnings: string[] = [];

	page.on('console', (message) => {
		if (message.type() === 'error') consoleErrors.push(message.text());
		if (message.type() === 'warning' && message.text().includes('history.replaceState')) {
			routerWarnings.push(message.text());
		}
	});

	await page.goto('/radiohead');

	await expect(page).toHaveTitle('G e n r | Radiohead');
	await expect(page.getByRole('textbox', { name: 'Artist Name' })).toHaveValue('radiohead');
	await expect(page.getByRole('link', { name: 'Radiohead' })).toBeVisible();
	await page.waitForTimeout(1000);

	await page.getByRole('textbox', { name: 'Artist Name' }).fill('Daft Punk');
	await expect(page).toHaveURL(/\/daft\+punk$/);
	await expect(page).toHaveTitle('G e n r | Daft Punk');
	await expect(page.getByRole('link', { name: 'Daft Punk' })).toBeVisible();

	expect(consoleErrors).toEqual([]);
	expect(routerWarnings).toEqual([]);
});
