<script lang="ts">
	import SearchResult from '../../components/SearchResult.svelte';
	import SearchForm from '../../components/SearchForm.svelte';
	import type { LayoutData } from './$types';
	import type { Snippet } from 'svelte';
	import { afterNavigate, replaceState } from '$app/navigation';
	import { onMount } from 'svelte';
	import { getCachedGenres, setCachedGenres } from '$lib/cache';

	type SearchState = 'idle' | 'loading' | 'fullfilled';

	let { data, children }: { data: LayoutData; children?: Snippet } = $props();

	// svelte-ignore state_referenced_locally
	let searchError = $state<LayoutData['error']>(data.error);
	// svelte-ignore state_referenced_locally
	let searchResult = $state<LayoutData['artistWithGenres']>(data.artistWithGenres);
	// svelte-ignore state_referenced_locally
	let searchTerm = $state(data.searchTerm || '');
	// svelte-ignore state_referenced_locally
	let searchState = $state<SearchState>(data.artistWithGenres ? 'fullfilled' : 'idle');
	let routerReady = $state(false);

	let canonicalName = $derived(searchTerm.length > 0 ? searchResult?.name : '');

	let slug = $derived((canonicalName || searchTerm).toLocaleLowerCase().replace(/\W+/g, '+'));

	let pageTitle = $derived(['G e n r', searchResult?.name].filter(Boolean).join(' | '));

	afterNavigate(() => {
		routerReady = true;
	});

	$effect(() => {
		if (!routerReady) return;
		replaceState(`/${slug}`, {});
	});

	// cache a possible server side result
	onMount(() => {
		setTimeout(() => {
			routerReady = true;
		});

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
		onTermChange={(term: string) => (searchTerm = term)}
	/>

	<div class="content">
		<SearchResult term={searchTerm} artist={searchResult} error={searchError} state={searchState} />
		{@render children?.()}
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
