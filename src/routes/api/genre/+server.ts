import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	createBadRequestError,
	isGenreNotFoundError,
	normalizeLastFmError,
	type ApiResponse,
	type LastFmGenreInfo
} from '$lib/lastFm';
import { getGenreInfo } from '$lib/server/lastFm';

export const GET: RequestHandler = async ({ url }) => {
	const tag = url.searchParams.get('tag');

	if (tag == null || tag.trim().length === 0) {
		const error = createBadRequestError('No genre provided');
		const body: ApiResponse<LastFmGenreInfo> = { data: null, error };
		return json(body, { status: 400 });
	}

	try {
		const data = await getGenreInfo(tag);
		const body: ApiResponse<LastFmGenreInfo> = { data, error: null };
		return json(body);
	} catch (err) {
		const error = normalizeLastFmError(err);
		const body: ApiResponse<LastFmGenreInfo> = { data: null, error };
		return json(body, { status: isGenreNotFoundError(error) ? 404 : 502 });
	}
};
