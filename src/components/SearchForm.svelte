<script module lang="ts">
	import { getCachedAliases, getCachedGenres, setCachedAliases, setCachedGenres } from '$lib/cache';
	import { debounceFn } from '$lib/debounceFn';
	import {
		createUpstreamFailureError,
		type ApiResponse,
		type LastFmArtistWithGenres,
		type LastFmErrorObject
	} from '$lib/lastFm';
	import type { SearchState } from '$lib/searchState';

	export type SearchPromise = Promise<LastFmArtistWithGenres>;
	type Props = {
		term?: string;
		result?: LastFmArtistWithGenres;
		error?: LastFmErrorObject;
		state?: SearchState;
		onTermChange?: (term: string) => void;
	};
</script>

<script lang="ts">
	let {
		term = $bindable(''),
		result = $bindable<LastFmArtistWithGenres | undefined>(),
		error = $bindable<LastFmErrorObject | undefined>(),
		state: searchState = $bindable<SearchState>('idle'),
		onTermChange = () => {}
	}: Props = $props();

	let cachedGenres = getCachedGenres();
	let cachedAliases = getCachedAliases();

	// An id used to prevent stale promises from updating the result
	let activeSearchController: AbortController | undefined = undefined;

	const [handleSearch, cancelDebouncedSearch] = debounceFn((searchTerm: string) => {
		activeSearchController?.abort();

		const controller = new AbortController();
		activeSearchController = controller;

		const searchParams = new URLSearchParams({ artist: searchTerm });

		const searchPromise: Promise<ApiResponse<LastFmArtistWithGenres> | undefined> = window
			.fetch(`/api/genres?${searchParams}`, {
				signal: activeSearchController.signal
			})
			.then(async (response) => {
				const json = (await response
					.json()
					.catch(() => null)) as ApiResponse<LastFmArtistWithGenres> | null;

				if (json?.error) return json;
				if (json?.data) return json;

				return { data: null, error: createUpstreamFailureError() };
			})
			.catch(() => {
				if (controller.signal.aborted) return;
				return { data: null, error: createUpstreamFailureError() };
			});

		// update the result
		searchPromise
			.then((json) => {
				if (controller.signal.aborted || json == null) return;
				if (json.error) {
					error = json.error;
					result = undefined;
				} else {
					error = undefined;
					result = json.data;
				}
			})
			.finally(() => {
				if (controller.signal.aborted) return;
				searchState = 'fulfilled';
			});

		// update cache
		searchPromise.then((json) => {
			if (controller.signal.aborted || json == null) return;
			if (json.error) return;

			const artist = json.data;
			const normalizedArtistName = artist.name.toLocaleLowerCase();

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
		searchState = 'idle';

		if (typeof window === 'undefined') return;

		const searchTerm = (e.target as HTMLInputElement).value.trim();
		term = searchTerm;
		onTermChange(searchTerm);

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
			searchState = 'fulfilled';
			return;
		}

		searchState = 'loading';
		activeSearchController?.abort();
		handleSearch(possibleName);
	}
</script>

<form method="post" onsubmit={(e) => e.preventDefault()}>
	<input
		name="artistName"
		type="text"
		placeholder="Artist name..."
		aria-label="Artist Name"
		autocomplete="off"
		bind:value={term}
		oninput={handleInputChange}
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
