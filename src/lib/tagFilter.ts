import type { LastFmTag } from '$lib/lastFm';

// Some Last.fm tags that are not actual musical genres. Space variants such as
// "female vocalists" are covered by normalizing tags before comparison.
const nonRelevantTags = [
	'seen-live',
	'favorites',
	'favourites',
	'male-frontend',
	'female-frontend',
	'female-vocalists',
	'male-vocalists',
	'singer-songwriter',
	'beautiful-voice',
	'oldies',
	'usa',
	'uk',
	'england',
	'great-discovery'
];

const nonRelevantTagPatterns = [
	// 80s, 80's, 90s, 90's, 00s, 00's, etc. The apostrophe variants
	// are normalized before this runs, so the separator can be a hyphen.
	/\d{2}[-'`]?s/i,
	// number-only tags.
	/^\d+$/
];

const normalizeTag = (value: string) => value.toLocaleLowerCase().replace(/\W/g, '-');

export const filterOutIrrelevantTags = (tags: Array<LastFmTag>, { artist }: { artist: string }) => {
	const normalizedArtist = normalizeTag(artist);
	const artistWithoutArticles = normalizedArtist.replace(/^(the|a|an)-+/i, '');
	const initials = normalizedArtist
		.split('-')
		.filter(Boolean)
		.map((word) => word.charAt(0))
		.join('');

	return tags.filter((tag) => {
		const normalizedTag = normalizeTag(tag.name);

		if (nonRelevantTags.includes(normalizedTag)) return false;
		if (nonRelevantTagPatterns.some((pattern) => pattern.test(normalizedTag))) return false;
		if (normalizedTag === normalizedArtist) return false;
		if (normalizedTag === artistWithoutArticles) return false;
		if (normalizedTag === initials) return false;

		return true;
	});
};
