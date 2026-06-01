<script lang="ts">
	import Genre from './Genre.svelte';
	import type { LastFmArtistWithGenres, LastFmErrorObject } from '$lib/lastFm';

	type SearchState = 'idle' | 'loading' | 'fullfilled';

	let {
		term,
		artist = undefined,
		error = undefined,
		state = 'idle'
	}: {
		term: string;
		artist?: LastFmArtistWithGenres;
		error?: LastFmErrorObject;
		state?: SearchState;
	} = $props();
</script>

<div class="result">
	{#if state === 'loading'}
		<div class="loading">
			Looking for the genres of '<strong>{term}</strong>'...
		</div>
	{:else if term.length !== 0}
		{#if error}
			<p class="error">{error.message}</p>
		{:else if artist != null}
			<div>
				<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
				<a class="name" href={artist.url} target="_blank" rel="noreferrer">
					{artist.name}
				</a>
			</div>

			<ul class="genres">
				{#each artist.genres.slice(0, 8) as tag (tag.url)}
					<li class="genre">
						<Genre {tag} />
					</li>
				{/each}
			</ul>
		{:else}
			<p class="error">Something weird is going on 🤔</p>
		{/if}
	{/if}
</div>

<style>
	.name {
		font-size: clamp(1rem, 1.5vw, 3rem);
		font-weight: bold;
		color: black;
	}

	.genres {
		display: flex;
		flex-wrap: wrap;
		gap: clamp(1rem, 2vw, 5rem);
		list-style: none;
		padding: 0;
		margin-top: 2rem;
	}

	.loading {
		font-size: clamp(2rem, 3.5vw + 4.5vh, 10rem);
		word-wrap: break-word;
	}

	.error {
		font-size: clamp(2rem, 3.5vw + 4.5vh, 10rem);
		color: red;
	}
</style>
