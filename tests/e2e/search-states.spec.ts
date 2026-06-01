import { expect, test } from '@playwright/test';

const waitForApp = async (page: import('@playwright/test').Page) => {
	await expect(page.locator('[data-app-ready="true"]')).toBeVisible();
};

test('clearing the search hides the previous result', async ({ page }) => {
	await page.goto('/radiohead');

	await waitForApp(page);
	await expect(page.getByRole('link', { name: 'Radiohead' })).toBeVisible();

	await page.getByRole('textbox', { name: 'Artist Name' }).fill('');

	await expect(page).toHaveURL(/\/$/);
	await expect(page.getByRole('link', { name: 'Radiohead' })).toBeHidden();
	await expect(page.getByText('Something weird is going on')).toBeHidden();
});

test('shows a not-found error and recovers on the next successful search', async ({ page }) => {
	await page.route('**/api/genres?**', async (route) => {
		const url = new URL(route.request().url());
		const artist = url.searchParams.get('artist');

		if (artist === 'missing artist') {
			await route.fulfill({
				status: 404,
				contentType: 'application/json',
				body: JSON.stringify({ data: null, error: { code: 6, message: 'Artist not found' } })
			});
			return;
		}

		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({
				data: {
					name: 'Daft Punk',
					url: 'https://www.last.fm/music/daft+punk',
					genres: [{ name: 'electronic', url: 'https://www.last.fm/tag/electronic' }]
				},
				error: null
			})
		});
	});

	await page.goto('/');
	await waitForApp(page);

	await page.getByRole('textbox', { name: 'Artist Name' }).fill('Missing Artist');
	await expect(page.getByText('Artist not found')).toBeVisible();
	await expect(page.getByRole('link', { name: 'Daft Punk' })).toBeHidden();

	await page.getByRole('textbox', { name: 'Artist Name' }).fill('Daft Punk');
	await expect(page).toHaveURL(/\/daft\+punk$/);
	await expect(page.getByRole('link', { name: 'Daft Punk' })).toBeVisible();
	await expect(page.getByText('Artist not found')).toBeHidden();
});

test('normalizes malformed API responses into an upstream error', async ({ page }) => {
	await page.route('**/api/genres?**', async (route) => {
		await route.fulfill({
			status: 502,
			contentType: 'text/plain',
			body: 'not json'
		});
	});

	await page.goto('/');
	await waitForApp(page);

	await page.getByRole('textbox', { name: 'Artist Name' }).fill('Broken Upstream');

	await expect(page.getByText('Could not contact Last.fm')).toBeVisible();
	await expect(page.getByText('Something weird is going on')).toBeHidden();
});
