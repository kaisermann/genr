<script lang="ts">
	import { getGenreInfo, type LastFmTag } from '$lib/lastFm';

	export let tag: LastFmTag;

	let summary: string | undefined;
	let summaryPromise: Promise<unknown> | undefined = undefined;

	let touched = false;
	let mouse = [-1, -1];

	$: if (touched && summaryPromise == null && summary == null) {
		summaryPromise = getGenreInfo(tag.name).then((response) => {
			summary = response.summary;
		});
	}

	$: renderedSummary = (() => {
		if (summary == null) return;
		const firstPeriod = summary.indexOf('.');

		// 80 just in case
		if (firstPeriod === -1) return `${summary.slice(80)}...`;

		const trimmedSummary = summary
			.replace(/<a href="http:\/\/www.last.fm.*?">Read more on Last\.fm<\/a>\./gi, '')
			.slice(0, firstPeriod + 1);

		return `${trimmedSummary.trim()}`;
	})();
</script>

<div
	class="genre"
	on:mousemove={(e) => (mouse = [e.clientX, e.clientY])}
	style="
        --mouse-x: {mouse[0]}px;
        --mouse-y: {mouse[1]}px;
    "
>
	<a
		class="badge"
		on:mouseover={() => (touched = true)}
		on:focus={() => (touched = true)}
		href={tag.url}
		target="_blank"
		rel="noreferrer"
	>
		{tag.name}
	</a>

	{#if renderedSummary != null && renderedSummary.length > 0}
		<div class="summary">
			{@html renderedSummary}
		</div>
	{/if}
</div>

<style>
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

	.genre {
		position: relative;
	}

	.genre:not(:hover) .summary:not(.static) {
		visibility: hidden;
	}

	.summary {
		background: #fff;
		border: 0.5rem dashed #000;
		padding: 0.5rem;
	}

	.summary :global(a) {
		color: #000;
	}

	.summary {
		pointer-events: none;
		position: fixed;
		top: 0;
		left: 0;
		z-index: 1;
		transform-origin: 0 0;
		transform: translate(calc(var(--mouse-x) + 1.5rem), calc(var(--mouse-y) + 1.5rem));
		max-width: 400px;
		font-size: clamp(1rem, 1.5vw + 1.5vh, 1.5rem);
	}
</style>
