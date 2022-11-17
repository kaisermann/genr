import {
	createArtistNotFoundError,
	getTopTags,
	isArtistNotFoundError,
	isNoGenresFoundError,
	searchArtistName
} from '$lib/lastFm';
import { json } from '@sveltejs/kit';

export function GET({ url }) {
	const artistName = url.searchParams.get('artist');

	if (artistName == null) {
		return Promise.reject({ code: 10002, message: 'No name provided' });
	}

	return getTopTags(artistName)
		.then((result) => {
			return json({ data: result, error: null });
		})
		.catch((err) => {
			if (isArtistNotFoundError(err) || isNoGenresFoundError(err)) {
				return searchArtistName(artistName)
					.then(getTopTags)
					.catch((err) => {
						// if there're still no genres here, assume the artist doesn't exist
						if (isNoGenresFoundError(err)) {
							throw { error: createArtistNotFoundError() };
						}

						throw { error: err };
					});
			}

			throw { error: err };
		})
		.catch((err) => {
			return json(err);
		});
}
