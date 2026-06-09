<script lang="ts">
	import SearchResult from '../../components/SearchResult.svelte';
	import SearchForm from '../../components/SearchForm.svelte';
	import type { LayoutData } from './$types';
	import type { Snippet } from 'svelte';
	import { afterNavigate, replaceState } from '$app/navigation';
	import { onMount } from 'svelte';
	import { getCachedGenres, setCachedGenres } from '$lib/cache';
	import type { SearchState } from '$lib/searchState';

	let { data, children }: { data: LayoutData; children?: Snippet } = $props();

	// svelte-ignore state_referenced_locally
	let searchError = $state<LayoutData['error']>(data.error);
	// svelte-ignore state_referenced_locally
	let searchResult = $state<LayoutData['artistWithGenres']>(data.artistWithGenres);
	// svelte-ignore state_referenced_locally
	let searchTerm = $state(data.searchTerm || '');
	// svelte-ignore state_referenced_locally
	let searchState = $state<SearchState>(data.artistWithGenres ? 'fulfilled' : 'idle');
	let routerReady = $state(false);

	let canonicalName = $derived(searchTerm.length > 0 ? searchResult?.name : '');

	let slug = $derived((canonicalName || searchTerm.trim()).toLocaleLowerCase().replace(/\W+/g, '+'));

	let pageTitle = $derived(['G e n r', searchResult?.name].filter(Boolean).join(' | '));
	let pageDescription = $derived(
		searchResult
			? `Find the main genres for ${searchResult.name}: ${searchResult.genres
					.slice(0, 5)
					.map((genre) => genre.name)
					.join(', ')}.`
			: 'Quickly find the main Last.fm genres for any artist.'
	);
	let pageUrl = $derived(data.origin ? `${data.origin}/${slug}` : data.pageUrl);

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
	<meta name="description" content={pageDescription} />
	<meta property="og:title" content={pageTitle} />
	<meta property="og:description" content={pageDescription} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={pageUrl} />
	<meta name="twitter:card" content="summary" />
	<meta name="twitter:title" content={pageTitle} />
	<meta name="twitter:description" content={pageDescription} />
</svelte:head>

<div class="container" data-app-ready={routerReady}>
	<SearchForm
		bind:term={searchTerm}
		bind:error={searchError}
		bind:state={searchState}
		bind:result={searchResult}
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
