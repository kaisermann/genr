type CacheEntry<Value> = {
	value?: Value;
	expiresAt: number;
	staleUntil: number;
	refreshing?: Promise<Value>;
};

type CacheOptions = {
	maxAgeMs: number;
	staleWhileRevalidateMs: number;
	now?: () => number;
};

export type CacheStatus = 'hit' | 'miss' | 'stale';

export type CachedValue<Value> = {
	value: Value;
	status: CacheStatus;
};

export function createCache<Value>({
	maxAgeMs,
	staleWhileRevalidateMs,
	now = Date.now
}: CacheOptions) {
	const entries = new Map<string, CacheEntry<Value>>();

	function save(entry: CacheEntry<Value>, value: Value) {
		const refreshedAt = now();
		entry.value = value;
		entry.expiresAt = refreshedAt + maxAgeMs;
		entry.staleUntil = entry.expiresAt + staleWhileRevalidateMs;
		entry.refreshing = undefined;
	}

	function refresh(key: string, load: () => Promise<Value>, entry?: CacheEntry<Value>) {
		const nextEntry = entry ?? {
			expiresAt: 0,
			staleUntil: 0
		};

		if (!entry) entries.set(key, nextEntry);

		nextEntry.refreshing = load()
			.then((value) => {
				save(nextEntry, value);
				return value;
			})
			.catch((error: unknown) => {
				nextEntry.refreshing = undefined;

				if (nextEntry.value === undefined) {
					entries.delete(key);
				}

				throw error;
			});

		return nextEntry.refreshing;
	}

	return {
		async get(key: string, load: () => Promise<Value>): Promise<CachedValue<Value>> {
			const entry = entries.get(key);
			const currentTime = now();

			if (entry?.value !== undefined && currentTime < entry.expiresAt) {
				return { value: entry.value, status: 'hit' };
			}

			if (entry?.value !== undefined && currentTime < entry.staleUntil) {
				if (!entry.refreshing) {
					refresh(key, load, entry).catch(() => {
						// Keep serving the stale value until the stale window expires.
					});
				}

				return { value: entry.value, status: 'stale' };
			}

			const value = await (entry?.refreshing ?? refresh(key, load, entry));
			return { value, status: 'miss' };
		},

		clear() {
			entries.clear();
		},

		size() {
			return entries.size;
		}
	};
}
