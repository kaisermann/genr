const API_KEY = import.meta.env.VITE_LASTFM_API_KEY;
const API_BASE_URL = 'https://ws.audioscrobbler.com/2.0';

const ERROR_CODE_ARTIST_NOT_FOUND = 6;
const ERROR_CODE_NO_GENRES_FOUND = 72671;

export const isArtistNotFoundError = (error) => {
	return error?.code === ERROR_CODE_ARTIST_NOT_FOUND;
};

/** Gets the Last FM url of an artist given it's canonical name */
const getArtistUrl = (artist) =>
	`https://www.last.fm/music/${artist.replace(/\W/g, '+').toLocaleLowerCase()}`;

/** Replaces non word characters with a plus sign */
const request = ({ method, query = {} }) => {
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

export const searchArtistName = (partialName) => {
	return request({ method: 'artist.search', query: { artist: partialName } }).then((data) => {
		const firstMatch = data.results.artistmatches.artist[0];

		if (firstMatch) return firstMatch.name;

		throw 'No artist found';
	});
};

export const getTopTags = (name) => {
	return request({ method: 'artist.gettoptags', query: { artist: name } }).then((json) => {
		const hasError = json.error != null;

		if (hasError) {
			throw { code: json.error, message: json.message };
		}

		if (json?.toptags?.tag == null) {
			throw { code: ERROR_CODE_ARTIST_NOT_FOUND, message: 'Artist not found' };
		}

		if (json?.toptags.tag.length === 0) {
			throw { code: ERROR_CODE_NO_GENRES_FOUND, message: 'No genres found' };
		}

		return {
			url: getArtistUrl(json.toptags['@attr'].artist),
			name: json.toptags['@attr'].artist,
			genres: json.toptags.tag
		};
	});
};
