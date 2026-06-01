import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	createBadRequestError,
	isArtistNotFoundError,
	isNoGenresFoundError,
	normalizeLastFmError,
	type ApiResponse,
	type LastFmArtistWithGenres,
	type LastFmErrorObject
} from '$lib/lastFm';
import { looseGetTopTags } from '$lib/server/lastFm';

function errorStatus(error: LastFmErrorObject) {
	if (isArtistNotFoundError(error) || isNoGenresFoundError(error)) return 404;
	return 502;
}

export const GET: RequestHandler = async ({ url }) => {
	const artistName = url.searchParams.get('artist');

	if (artistName == null || artistName.trim().length === 0) {
		const error = createBadRequestError('No name provided');
		const body: ApiResponse<LastFmArtistWithGenres> = { data: null, error };
		return json(body, { status: 400 });
	}

	try {
		const data = await looseGetTopTags({ searchName: artistName });
		const body: ApiResponse<LastFmArtistWithGenres> = { data, error: null };
		return json(body);
	} catch (err) {
		const error = normalizeLastFmError(err);
		const body: ApiResponse<LastFmArtistWithGenres> = { data: null, error };
		return json(body, { status: errorStatus(error) });
	}
};
