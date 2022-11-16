<script lang="ts" context="module">
	import { getCachedAliases, getCachedGenres, setCachedAliases, setCachedGenres } from '$lib/cache';
	import { debounceFn } from '$lib/debounceFn';
	import {
		looseGetTopTags,
		type LastFmArtistWithGenres,
		type LastFmErrorObject
	} from '$lib/lastFm';

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
	let activeSearchId: symbol | undefined;

	const [handleSearch, cancelSearch] = debounceFn((term: string) => {
		const searchId = Symbol();
		activeSearchId = searchId;

		const searchPromise = looseGetTopTags({ searchName: term });

		// update the result
		searchPromise
			.then((response) => {
				if (searchId !== activeSearchId) return;
				result = response;
				error = undefined;
			})
			.catch((err) => {
				if (searchId !== activeSearchId) return;
				result = undefined;
				error = err;
			})
			.finally(() => {
				if (searchId !== activeSearchId) return;
				state = 'fullfilled';
			});

		// update cache
		searchPromise.then((artist) => {
			if (searchId !== activeSearchId) return;
			const normalizedArtistName = artist.name.toLocaleLowerCase();

			// cache the artist and its genres
			setCachedGenres({ ...cachedGenres, [normalizedArtistName]: artist });

			// cache the artist's aliases
			if (term != null && term !== normalizedArtistName) {
				setCachedAliases({ ...cachedAliases, [term]: normalizedArtistName });
			}

			// update local cache variables
			cachedGenres = getCachedGenres();
			cachedAliases = getCachedAliases();
		});
	}, 500);

	async function handleInputChange(e: Event) {
		cancelSearch();
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
			result = cachedGenres[possibleName];
			error = undefined;
			state = 'fullfilled';
			return;
		}

		state = 'loading';
		activeSearchId = undefined;
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
