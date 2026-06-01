import { describe, expect, test } from 'vitest';
import { createCache } from '../src/lib/server/cache';

describe('createCache', () => {
	test('returns fresh cached values without calling the loader again', async () => {
		let now = 0;
		let calls = 0;
		const cache = createCache<number>({
			maxAgeMs: 100,
			staleWhileRevalidateMs: 100,
			now: () => now
		});

		const first = await cache.get('artist:radiohead', async () => {
			calls += 1;
			return calls;
		});

		now = 50;
		const second = await cache.get('artist:radiohead', async () => {
			calls += 1;
			return calls;
		});

		expect(first).toEqual({ value: 1, status: 'miss' });
		expect(second).toEqual({ value: 1, status: 'hit' });
		expect(calls).toBe(1);
	});

	test('serves stale values while refreshing in the background', async () => {
		let now = 0;
		let calls = 0;
		const cache = createCache<number>({
			maxAgeMs: 100,
			staleWhileRevalidateMs: 100,
			now: () => now
		});

		await cache.get('genre:rock', async () => {
			calls += 1;
			return calls;
		});

		now = 150;
		const stale = await cache.get('genre:rock', async () => {
			calls += 1;
			return calls;
		});

		await Promise.resolve();

		expect(stale).toEqual({ value: 1, status: 'stale' });
		expect(calls).toBe(2);

		const refreshed = await cache.get('genre:rock', async () => {
			calls += 1;
			return calls;
		});

		expect(refreshed).toEqual({ value: 2, status: 'hit' });
		expect(calls).toBe(2);
	});

	test('dedupes concurrent misses', async () => {
		let calls = 0;
		let resolveValue: (value: number) => void = () => {};
		const cache = createCache<number>({
			maxAgeMs: 100,
			staleWhileRevalidateMs: 100
		});
		const load = async () => {
			calls += 1;
			return new Promise<number>((resolve) => {
				resolveValue = resolve;
			});
		};

		const first = cache.get('artist:daft-punk', load);
		const second = cache.get('artist:daft-punk', load);

		resolveValue(42);

		await expect(first).resolves.toEqual({ value: 42, status: 'miss' });
		await expect(second).resolves.toEqual({ value: 42, status: 'miss' });
		expect(calls).toBe(1);
	});

	test('does not cache loader failures', async () => {
		let calls = 0;
		const cache = createCache<number>({
			maxAgeMs: 100,
			staleWhileRevalidateMs: 100
		});
		const load = async () => {
			calls += 1;
			throw new Error('upstream failed');
		};

		await expect(cache.get('artist:missing', load)).rejects.toThrow('upstream failed');
		await expect(cache.get('artist:missing', load)).rejects.toThrow('upstream failed');
		expect(calls).toBe(2);
		expect(cache.size()).toBe(0);
	});
});
