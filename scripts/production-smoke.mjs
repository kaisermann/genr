import { chromium, expect } from '@playwright/test';

const baseURL = process.env.GENR_PRODUCTION_URL || 'https://genr.netlify.app';

const browser = await chromium.launch();
const page = await browser.newPage();
const appEvents = [];

page.on('console', (message) => {
	const text = message.text();

	if (message.type() !== 'error' && message.type() !== 'warning') return;
	if (text.includes('Failed to load resource: net::ERR_CONNECTION_REFUSED')) return;

	appEvents.push({ type: 'console', level: message.type(), text });
});

page.on('requestfailed', (request) => {
	const url = request.url();

	if (url.includes('static.cloudflareinsights.com')) return;

	appEvents.push({ type: 'requestfailed', url, failure: request.failure()?.errorText });
});

try {
	await page.goto(`${baseURL}/radiohead`, { waitUntil: 'networkidle' });
	await expect(page).toHaveTitle('G e n r | Radiohead');
	await expect(page.getByRole('textbox', { name: 'Artist Name' })).toHaveValue('radiohead');
	await expect(page.getByRole('link', { name: 'Radiohead' })).toBeVisible();

	const appReady = page.locator('[data-app-ready="true"]');
	if ((await appReady.count()) > 0) {
		await expect(appReady).toBeVisible();
	}

	await page.getByRole('textbox', { name: 'Artist Name' }).fill('Daft Punk');
	await expect(page).toHaveURL(/\/daft\+punk$/);
	await expect(page).toHaveTitle('G e n r | Daft Punk');
	await expect(page.getByRole('link', { name: 'Daft Punk' })).toBeVisible();

	if (appEvents.length > 0) {
		throw new Error(JSON.stringify(appEvents, null, 2));
	}

	console.log(`Production smoke passed: ${page.url()}`);
} finally {
	await browser.close();
}
