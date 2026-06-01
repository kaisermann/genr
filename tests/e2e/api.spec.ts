import { expect, test } from '@playwright/test';

test.describe('/api/genres', () => {
	test('returns 400 when artist is missing', async ({ request }) => {
		const response = await request.get('/api/genres');
		const body = await response.json();

		expect(response.status()).toBe(400);
		expect(body).toEqual({
			data: null,
			error: { code: 10002, message: 'No name provided' }
		});
	});

	test('returns a typed success response for a known artist', async ({ request }) => {
		const response = await request.get('/api/genres?artist=radiohead');
		const body = await response.json();

		expect(response.status()).toBe(200);
		expect(body.error).toBeNull();
		expect(body.data).toEqual(
			expect.objectContaining({
				name: 'Radiohead',
				url: 'https://www.last.fm/music/radiohead',
				genres: expect.any(Array)
			})
		);
		expect(body.data.genres.length).toBeGreaterThan(0);
	});

	test('returns 404 for an unknown artist', async ({ request }) => {
		const response = await request.get('/api/genres?artist=zzzxxy-not-an-artist');
		const body = await response.json();

		expect(response.status()).toBe(404);
		expect(body).toEqual({
			data: null,
			error: { code: 6, message: 'Artist not found' }
		});
	});
});

test.describe('/api/genre', () => {
	test('returns 400 when tag is missing', async ({ request }) => {
		const response = await request.get('/api/genre');
		const body = await response.json();

		expect(response.status()).toBe(400);
		expect(body).toEqual({
			data: null,
			error: { code: 10002, message: 'No genre provided' }
		});
	});

	test('returns a typed success response for a known genre', async ({ request }) => {
		const response = await request.get('/api/genre?tag=rock');
		const body = await response.json();

		expect(response.status()).toBe(200);
		expect(body.error).toBeNull();
		expect(body.data).toEqual(
			expect.objectContaining({
				name: expect.any(String),
				summary: expect.any(String)
			})
		);
	});

	test('returns 404 for an unknown genre', async ({ request }) => {
		const response = await request.get('/api/genre?tag=zzzxxy-not-a-genre');
		const body = await response.json();

		expect(response.status()).toBe(404);
		expect(body).toEqual({
			data: null,
			error: { code: 72672, message: 'Genre not found' }
		});
	});
});
