<script lang="ts">
	import { type ApiResponse, type LastFmGenreInfo, type LastFmTag } from '$lib/lastFm';

	let { tag }: { tag: LastFmTag } = $props();

	let summary = $state<string | undefined>();
	let summaryPromise = $state<Promise<void> | undefined>();

	let mouse = $state([-1, -1]);

	const supportsHover = typeof window !== 'undefined' && window.matchMedia('(hover:hover)').matches;

	function loadSummary() {
		const searchParams = new URLSearchParams({ tag: tag.name });

		summaryPromise = window
			.fetch(`/api/genre?${searchParams}`)
			.then(async (response) => {
				const json = (await response
					.json()
					.catch(() => null)) as ApiResponse<LastFmGenreInfo> | null;

				if (json?.data) {
					summary = json.data.summary;
					return;
				}

				throw new Error(json?.error.message || 'Could not load genre summary');
			})
			.catch(() => {
				// Leave the badge usable; a later hover can retry the summary request.
				summaryPromise = undefined;
			});
	}

	function handleInteraction() {
		if (supportsHover && summaryPromise == null && summary == null) {
			loadSummary();
		}
	}

	let renderedSummary = $derived.by(() => {
		if (summary == null) return;
		const firstPeriod = summary.indexOf('.');

		// 80 just in case
		if (firstPeriod === -1) return `${summary.slice(0, 80)}...`;

		const trimmedSummary = summary
			.replace(/<a href="http:\/\/www.last.fm.*?">Read more on Last\.fm<\/a>\./gi, '')
			.slice(0, firstPeriod + 1);

		return `${trimmedSummary.trim()}`;
	});
</script>

<div
	class="container"
	role="presentation"
	onmousemove={(e) => (mouse = [e.clientX, e.clientY])}
	style="
        --mouse-x: {mouse[0]}px;
        --mouse-y: {mouse[1]}px;
    "
>
	<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
	<a
		class="badge"
		href={tag.url}
		target="_blank"
		rel="noreferrer"
		onmouseover={handleInteraction}
		onfocus={handleInteraction}
	>
		{tag.name}
	</a>

	{#if renderedSummary != null && renderedSummary.length > 0}
		<div class="summary">{renderedSummary}</div>
	{/if}
</div>

<style>
	.container {
		position: relative;
	}

	.container:not(:hover) .summary {
		visibility: hidden;
	}

	.badge {
		appearance: none;
		text-decoration-style: solid;
		background-color: #000;
		color: white;
		padding: 0.5rem 1rem;
		cursor: pointer;
		text-decoration: underline solid;
		font-size: clamp(2rem, 3.5vw + 4.5vh, 10rem);
	}

	.badge:hover {
		text-decoration: underline dotted;
	}

	.summary :global(a) {
		color: #000;
	}

	.summary {
		position: fixed;
		top: 0;
		left: 0;
		z-index: 1;

		max-width: 400px;
		padding: 0.5rem;

		transform-origin: 0 0;
		transform: translate(calc(var(--mouse-x) + 1.5rem), calc(var(--mouse-y) + 1.5rem));

		font-size: clamp(1rem, 1.5vw + 1.5vh, 1.5rem);

		background: #fff;
		border: 0.5rem dashed #000;

		pointer-events: none;
	}

	@media (hover: none) {
		.summary {
			visibility: hidden;
		}
	}
</style>
