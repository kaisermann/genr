import { env } from '$env/dynamic/private';
import {
	createArtistNotFoundError,
	createBadRequestError,
	createGenreNotFoundError,
	createGenresNotFoundError,
	createUpstreamFailureError,
	isArtistNotFoundError,
	isNoGenresFoundError,
	type LastFmArtistWithGenres,
	type LastFmGenreInfo,
	type LastFmTag
} from '$lib/lastFm';

const API_BASE_URL = 'https://ws.audioscrobbler.com/2.0';

type LastFmRequestOptions = {
	method: string;
	query: Record<string, string | number>;
	cache?: RequestCache;
};

type LastFmArtistMatch = {
	name?: unknown;
};

type LastFmTopTagsResponse = {
	error?: number;
	message?: string;
	toptags?: {
		tag?: Array<LastFmTag>;
		'@attr'?: {
			artist?: string;
		};
	};
};

type LastFmTagInfoResponse = {
	error?: number;
	message?: string;
	tag?: {
		name?: string;
		total?: number | string;
		wiki?: {
			summary?: string;
		};
	};
};

function getApiKey() {
	if (!env.LASTFM_API_KEY) {
		throw createUpstreamFailureError();
	}

	return env.LASTFM_API_KEY;
}

function normalizeLastFmError(json: { error?: number; message?: string }) {
	return {
		code: json.error ?? createUpstreamFailureError().code,
		message: json.message || createUpstreamFailureError().message
	};
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value != null;
}

/** Gets the Last FM url of an artist given its canonical name. */
const getArtistUrl = (canonicalName: string) =>
	`https://www.last.fm/music/${canonicalName.replace(/\s+/g, '+').toLocaleLowerCase()}`;

const request = async ({ method, query = {}, cache }: LastFmRequestOptions) => {
	const url = new URL(API_BASE_URL);

	url.searchParams.append('method', method);
	url.searchParams.append('api_key', getApiKey());
	url.searchParams.append('format', 'json');

	Object.entries(query).forEach(([key, value]) => {
		url.searchParams.append(key, String(value));
	});

	const response = await fetch(url, { cache });

	if (!response.ok) {
		throw createUpstreamFailureError();
	}

	try {
		return (await response.json()) as unknown;
	} catch {
		throw createUpstreamFailureError();
	}
};

export const searchArtistName = async (partialName: string) => {
	const data = await request({ method: 'artist.search', query: { artist: partialName } });

	if (!isRecord(data)) {
		throw createArtistNotFoundError();
	}

	const results = data.results;
	const artistMatches = isRecord(results) ? results.artistmatches : undefined;
	const artists = isRecord(artistMatches) ? artistMatches.artist : undefined;
	const firstMatch = Array.isArray(artists)
		? (artists[0] as LastFmArtistMatch | undefined)
		: undefined;

	if (typeof firstMatch?.name === 'string') return firstMatch.name;

	throw createArtistNotFoundError();
};

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
	// 80s, 80's, 90s, 90's, 00s, 00's, etc.
	/\d{2}['`]?s/i,
	// number-only tags.
	/^\d+$/
];

const filterOutIrrelevantTags = (tags: Array<LastFmTag>, { artist }: { artist: string }) => {
	const normalizedArtist = artist.toLocaleLowerCase().replace(/\s+/g, '-');
	const artistWithoutArticles = normalizedArtist.replace(/^(the|a|an)-+/i, '');
	const initials = normalizedArtist
		.split('-')
		.map((word) => word.charAt(0))
		.join('');

	return tags.filter((tag) => {
		const normalizedTag = tag.name.toLocaleLowerCase().replace(/\W/g, '-');

		if (nonRelevantTags.includes(normalizedTag)) return false;
		if (nonRelevantTagPatterns.some((pattern) => pattern.test(normalizedTag))) return false;
		if (normalizedTag === normalizedArtist) return false;
		if (normalizedTag === artistWithoutArticles) return false;
		if (normalizedTag === initials) return false;

		return true;
	});
};

export const getTopTags = async (name: string): Promise<LastFmArtistWithGenres> => {
	const json = (await request({
		method: 'artist.gettoptags',
		query: {
			artist: name,
			autocorrect: 1
		}
	})) as LastFmTopTagsResponse;

	if (json.error != null) {
		throw normalizeLastFmError(json);
	}

	const artist = json.toptags?.['@attr']?.artist;
	const tags = json.toptags?.tag;

	if (artist == null || tags == null) {
		throw createArtistNotFoundError();
	}

	if (tags.length === 0) {
		throw createGenresNotFoundError();
	}

	const lowerCaseTags = tags.map((tag) => {
		return {
			name: tag.name.toLocaleLowerCase(),
			url: tag.url
		};
	});

	return {
		url: getArtistUrl(artist),
		name: artist,
		genres: filterOutIrrelevantTags(lowerCaseTags, { artist })
	};
};

export const looseGetTopTags = async ({
	searchName
}: {
	searchName?: string;
}): Promise<LastFmArtistWithGenres> => {
	const possibleName = searchName?.trim();

	if (!possibleName) {
		throw createBadRequestError('No name provided');
	}

	try {
		return await getTopTags(possibleName);
	} catch (err) {
		if (!isArtistNotFoundError(err) && !isNoGenresFoundError(err)) {
			throw err;
		}

		try {
			return await getTopTags(await searchArtistName(possibleName));
		} catch (err) {
			// If there are still no genres here, assume the artist does not exist.
			if (isNoGenresFoundError(err)) {
				throw createArtistNotFoundError();
			}

			throw err;
		}
	}
};

export const getGenreInfo = async (genre: string): Promise<LastFmGenreInfo> => {
	const json = (await request({
		method: 'tag.getInfo',
		query: {
			tag: genre
		},
		cache: 'force-cache'
	})) as LastFmTagInfoResponse;

	if (json.error != null) {
		throw normalizeLastFmError(json);
	}

	if (json.tag == null || Number(json.tag.total) === 0) {
		throw createGenreNotFoundError();
	}

	return {
		name: json.tag.name || genre,
		summary: json.tag.wiki?.summary || ''
	};
};
