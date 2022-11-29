<script lang="ts" context="module">
	import { getCachedAliases, getCachedGenres, setCachedAliases, setCachedGenres } from '$lib/cache';
	import { debounceFn } from '$lib/debounceFn';
	import type { LastFmArtistWithGenres, LastFmErrorObject } from '$lib/lastFm';

	export type SearchPromise = Promise<LastFmArtistWithGenres>;
</script>

<script lang="ts">
	export let term = '';
	export let result: LastFmArtistWithGenres | undefined = undefined;
	export let error: LastFmErrorObject | undefined = undefined;
	export let state: 'idle' | 'loading' | 'fullfilled' = 'idle';

	let innerTerm = term;
	let cachedGenres = getCachedGenres();
	let cachedAliases = getCachedAliases();

	$: term = innerTerm.trim();

	// An id used to prevent stale promises from updating the result
	let activeSearchController: AbortController | undefined = undefined;

	function trackArtistSearch(artistName: string) {
		const eventName = `genre-search_${artistName.replace(/\W+/g, '_')}`
			.substring(0, 64)
			.toLocaleLowerCase();
		window.panelbear('track', eventName);
	}

	const [handleSearch, cancelDebouncedSearch] = debounceFn((searchTerm: string) => {
		activeSearchController?.abort();

		const controller = new AbortController();
		activeSearchController = controller;

		const searchPromise = fetch(`/api/genres?artist=${searchTerm}`, {
			signal: activeSearchController.signal
		})
			.then((response) => response.json())
			.catch((err) => {
				if (controller.signal.aborted) return;
				throw err;
			});

		// update the result
		searchPromise
			.then((json) => {
				if (controller.signal.aborted) return;
				if (json.error) {
					error = json.error;
					result = undefined;
				} else {
					error = undefined;
					result = json.data;
				}
			})
			.finally(() => {
				state = 'fullfilled';
			});

		// update cache
		searchPromise.then((json) => {
			if (controller.signal.aborted) return;
			if (json.error) return;

			const artist = json.data as LastFmArtistWithGenres;
			const normalizedArtistName = artist.name.toLocaleLowerCase();

			trackArtistSearch(artist.name);

			// cache the artist and its genres
			setCachedGenres({ ...cachedGenres, [normalizedArtistName]: artist });

			// cache the artist's aliases
			if (searchTerm != null && searchTerm !== normalizedArtistName) {
				setCachedAliases({ ...cachedAliases, [searchTerm]: normalizedArtistName });
			}

			// update local cache variables
			cachedGenres = getCachedGenres();
			cachedAliases = getCachedAliases();
		});
	}, 500);

	// Cancels any pending search
	// - If the debounced method didn't run
	// - If the debounced method ran but the promise is still pending
	const cancelActiveSearch = () => {
		cancelDebouncedSearch();
		activeSearchController?.abort();
	};

	async function handleInputChange(e: Event) {
		cancelActiveSearch();
		state = 'idle';

		if (typeof window === 'undefined') return;

		const searchTerm = (e.target as HTMLInputElement).value.trim();
		const normalizedSearchTerm = searchTerm.toLocaleLowerCase();
		const possibleName = cachedAliases[normalizedSearchTerm] || normalizedSearchTerm;

		if (possibleName.length === 0) {
			result = undefined;
			error = undefined;
			return;
		}

		const isCached = cachedGenres?.[possibleName] != null;

		result = undefined;

		if (isCached) {
			result = cachedGenres[possibleName] as LastFmArtistWithGenres;
			error = undefined;
			state = 'fullfilled';
			trackArtistSearch(result.name);
			return;
		}

		state = 'loading';
		activeSearchController?.abort();
		handleSearch(possibleName);
	}
</script>

<form method="post">
	<input
		name="artistName"
		type="text"
		placeholder="Artist name..."
		aria-label="Artist Name"
		autofocus
		autocomplete="off"
		bind:value={innerTerm}
		on:input={handleInputChange}
	/>
</form>

<style>
	input {
		font-size: clamp(1rem, 10vw, 8rem);
		line-height: 1.4;
		width: 100%;
		border: none;
		border-bottom: 2px solid;
		padding-left: 1rem;
		padding-right: 1rem;
	}
</style>
