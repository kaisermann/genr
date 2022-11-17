const API_KEY = import.meta.env.VITE_LASTFM_API_KEY;
const API_BASE_URL = 'https://ws.audioscrobbler.com/2.0';

const ERROR_CODE_ARTIST_NOT_FOUND = 6;
const ERROR_CODE_NO_GENRES_FOUND = 72671;

export type LastFmErrorObject = {
	code: number;
	message: string;
};

export type LastFmTag = { name: string; url: string };

export type LastFmArtistWithGenres = {
	name: string;
	url: string;
	genres: Array<LastFmTag>;
};

function createArtistNotFoundError() {
	return { code: ERROR_CODE_ARTIST_NOT_FOUND, message: 'Artist not found' };
}

function createGenresNotFoundError() {
	return { code: ERROR_CODE_NO_GENRES_FOUND, message: 'No genres found' };
}

export const isArtistNotFoundError = (error: any): error is LastFmErrorObject => {
	return error?.code === ERROR_CODE_ARTIST_NOT_FOUND;
};

export const isNoGenresFoundError = (error: any): error is LastFmErrorObject => {
	return error?.code === ERROR_CODE_NO_GENRES_FOUND;
};

/** Gets the Last FM url of an artist given it's canonical name */
const getArtistUrl = (canonicalName: string) =>
	`https://www.last.fm/music/${canonicalName.replace(/\W/g, '+').toLocaleLowerCase()}`;

/** Replaces non word characters with a plus sign */
const request = ({ method, query = {} }: { method: string; query: Record<string, any> }) => {
	const url = new URL(API_BASE_URL);

	url.searchParams.append('method', method);
	url.searchParams.append('api_key', API_KEY);
	url.searchParams.append('format', 'json');

	Object.entries(query).forEach(([key, value]) => {
		url.searchParams.append(key, value);
	});

	return fetch(url).then((response) => {
		return response.json();
	});
};

export const searchArtistName = (partialName: string) => {
	return request({ method: 'artist.search', query: { artist: partialName } }).then((data) => {
		const firstMatch = data.results.artistmatches.artist[0];

		if (firstMatch) return firstMatch.name as string;

		throw createArtistNotFoundError();
	});
};

// Some last FM tags that are not actual musical genres
// Space variants (such as "female vocalists") don't need to be included
// because we compare tags after normalizing them (lower casing and replacing spaces with dashes)
const nonRelevantTags = [
	'seen-live',
	'favorites',
	'favourites',
	'female-frontend',
	'female-vocalists',
	'singer-songwriter',
	'beautiful-voice',
	'oldies'
];

/**
 * Given an array of LastFm Tags,
 * returns an array of tags that are not in the nonRelevantTags array
 */
export const filterOutIrrelevantTags = (
	tags: Array<LastFmTag>,
	{
		artist
	}: {
		artist: string;
	}
) => {
	// remove spaces and lowercase artist name
	const normalizedArtist = artist.toLocaleLowerCase().replace(/\W/g, '-');

	// get a version of the artist without a possible article (the beatles vs beatles)
	const artistWithoutArticles = normalizedArtist.replace(/^(the|a|an)-+/i, '');

	// to catch tags such as rhcp (red hot chili peppers)
	const initials = normalizedArtist
		.split('-')
		.map((word) => word.charAt(0))
		.join('');

	return tags.filter((tag) => {
		const normalizedTag = tag.name.toLocaleLowerCase().replace(/\W/g, '-');

		if (nonRelevantTags.includes(normalizedTag)) return false;

		// Filter out tags that are the same as the artist name
		if (normalizedTag === normalizedArtist) return false;
		if (normalizedTag === artistWithoutArticles) return false;
		if (normalizedTag === initials) return false;

		return true;
	});
};

export const getTopTags = (name: string) => {
	return request({
		method: 'artist.gettoptags',
		query: {
			artist: name,
			autocorrect: 1
		}
	}).then((json) => {
		const hasError = json.error != null;

		if (hasError) {
			throw { code: json.error, message: json.message };
		}

		if (json?.toptags?.tag == null) {
			throw createArtistNotFoundError();
		}

		if (json?.toptags.tag.length === 0) {
			throw createGenresNotFoundError();
		}

		return {
			url: getArtistUrl(json.toptags['@attr'].artist),
			name: json.toptags['@attr'].artist,
			genres: filterOutIrrelevantTags(json.toptags.tag, {
				artist: json.toptags['@attr'].artist
			})
		} as LastFmArtistWithGenres;
	});
};

/**
 * Fetches an artist genres.
 * If the artist is not found, it will try to find the canonial artist name via the artist.search endpoint
 * and then fetch the genres for the canonial artist name.
 */
export const looseGetTopTags = ({
	searchName
}: {
	searchName?: string;
}): Promise<LastFmArtistWithGenres> => {
	const possibleName = searchName?.trim();

	if (possibleName == null) {
		return Promise.reject({ code: 10002, message: 'No name provided' });
	}

	return getTopTags(possibleName).catch((err) => {
		if (isArtistNotFoundError(err) || isNoGenresFoundError(err)) {
			return searchArtistName(possibleName)
				.then(getTopTags)
				.catch((err) => {
					// if there're still no genres here, assume the artist doesn't exist
					if (isNoGenresFoundError(err)) {
						throw createArtistNotFoundError();
					}

					throw err;
				});
		}

		throw err;
	});
};
