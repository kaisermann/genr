<script lang="ts">
	import SearchResult from './components/SearchResult.svelte';
	import SearchForm from './components/SearchForm.svelte';
	import type { PageData } from './$types';
	import { onMount } from 'svelte';
	import { getCachedGenres, setCachedGenres } from '$lib/cache';

	export let data: PageData;

	let searchError = data.error;
	let searchResult = data.artistWithGenres;
	let searchTerm = data.searchTerm || '';
	let searchState: 'idle' | 'loading' | 'fullfilled' = data.artistWithGenres
		? 'fullfilled'
		: 'idle';

	$: pageTitle = ['G e n r', searchResult?.name].filter(Boolean).join(' | ');

	$: {
		if (typeof window === 'undefined') break $;

		window.history.replaceState(null, '', `/${searchTerm.toLocaleLowerCase().replace(/\W/g, '+')}`);
	}

	// cache a possible server side result
	onMount(() => {
		if (data.artistWithGenres) {
			setCachedGenres({
				...getCachedGenres(),
				[data.artistWithGenres.name.toLocaleLowerCase()]: data.artistWithGenres
			});
		}
	});
</script>

<svelte:head>
	<title>{pageTitle}</title>
</svelte:head>

<div class="container">
	<SearchForm
		bind:term={searchTerm}
		bind:error={searchError}
		bind:state={searchState}
		bind:result={searchResult}
	/>

	<div class="content">
		<SearchResult term={searchTerm} artist={searchResult} error={searchError} state={searchState} />
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
</style>
