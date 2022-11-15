<script>
	import {
		getCachedAliases,
		getCachedGenres,
		setCachedAliases,
		setCachedGenres
	} from './modules/cache';
	import { debounceFn } from './modules/debounceFn';
	import { getTopTags, isArtistNotFoundError, searchArtistName } from './modules/lastFm';

	const debouncedGetTopTags = debounceFn(getTopTags, 500);

	let artistInputValue =
		typeof window !== 'undefined' ? new URL(document.location.href).searchParams.get('s') : '';
	let cachedGenres = getCachedGenres();
	let cachedAliases = getCachedAliases();

	$: {
		if (typeof window === 'undefined') break $;

		window.history.replaceState(null, '', `/?s=${artistInputValue}`);
	}

	/**
	 * Fetches an artist genres.
	 * If the artist is not found, it will try to find the canonial artist name via the artist.search endpoint
	 * and then fetch the genres for the canonial artist name.
	 */
	const fetchArtistGenres = ({ searchName, canonicalName }) => {
		const isAlias = searchName != null && cachedAliases[searchName] != null;
		const possibleName = canonicalName || (isAlias ? cachedAliases[searchName] : searchName.trim());

		let artistPromise =
			cachedGenres?.[possibleName] != null
				? Promise.resolve(cachedGenres[possibleName])
				: debouncedGetTopTags(possibleName);

		return artistPromise
			.then((artist) => {
				// cache the artist and its genres
				setCachedGenres({ ...cachedGenres, [artist.name]: artist });

				// cache the artist's aliases
				if (searchName !== artist.name) {
					setCachedAliases({ ...cachedAliases, [searchName]: artist.name });
				}

				// update local cache variables
				cachedGenres = getCachedGenres();
				cachedAliases = getCachedAliases();

				return artist;
			})
			.catch((error) => {
				if (!isArtistNotFoundError(error)) throw error.message;

				return searchArtistName(possibleName)
					.then((foundName) => {
						return fetchArtistGenres({ searchName, canonicalName: foundName });
					})
					.catch(() => {
						throw error.message;
					});
			});
	};
</script>

<div class="container">
	<input
		type="text"
		bind:value={artistInputValue}
		placeholder="Artist name..."
		aria-label="Artist Name"
		autofocus
	/>
	<div class="content">
		{#if artistInputValue.trim() !== ''}
			{#await fetchArtistGenres({ searchName: artistInputValue })}
				<div class="loading">
					Looking for the genres of '<strong>{artistInputValue}</strong>'...
				</div>
			{:then artist}
				<div class="result">
					<div>
						<a class="artist-name" href={artist.url} target="_blank" rel="noreferrer">
							{artist.name}
						</a>
					</div>

					<ul class="artist-genres">
						{#each artist.genres.slice(0, 5) as tag}
							<li class="genre">
								<a href={tag.url} target="_blank" rel="noreferrer">{tag.name}</a>
							</li>
						{/each}
					</ul>
				</div>
			{:catch error}
				<p class="error">{error}</p>
			{/await}
		{/if}
	</div>
</div>

<style>
	.container {
		font-family: arial;
		line-height: 1.4;
		min-height: 100vh;
	}

	.content {
		padding: 2rem 1rem;
	}

	input {
		font-size: clamp(1rem, 10vw, 8rem);
		line-height: 1.4;
		width: 100%;
		border: none;
		border-bottom: 2px solid;
		padding-left: 1rem;
		padding-right: 1rem;
	}

	.error {
		font-size: 32px;
		color: red;
	}

	.artist-name {
		font-size: clamp(1rem, 1.5vw, 3rem);
		font-weight: bold;
	}

	.artist-genres {
		display: flex;
		flex-wrap: wrap;
		gap: clamp(1rem, 2vw, 5rem);
		list-style: none;
		padding: 0;
		font-size: clamp(2rem, 3.5vw + 4.5vh, 10rem);
	}
</style>
