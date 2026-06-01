import type { LayoutServerLoad } from './$types';
import { normalizeLastFmError } from '$lib/lastFm';
import { looseGetTopTags } from '$lib/server/lastFm';

// Load artist data in the server if artist is defined in the URL
export const load: LayoutServerLoad = async ({ params }) => {
	if (params.artistName === 'favicon.ico') return;

	const normalizedName = params.artistName?.replace(/\W/g, ' ') || '';

	if (normalizedName) {
		try {
			return {
				searchTerm: normalizedName,
				artistWithGenres: await looseGetTopTags({ searchName: normalizedName }),
				error: undefined
			};
		} catch (error) {
			return {
				searchTerm: normalizedName,
				artistWithGenres: undefined,
				error: normalizeLastFmError(error)
			};
		}
	}
};
