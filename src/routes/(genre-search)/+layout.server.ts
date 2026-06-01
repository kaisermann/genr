import type { LayoutServerLoad } from './$types';
import { normalizeLastFmError } from '$lib/lastFm';
import { looseGetTopTags } from '$lib/server/lastFm';

// Load artist data in the server if artist is defined in the URL
export const load: LayoutServerLoad = async ({ params, url }) => {
	const pageUrl = url.href;
	const origin = url.origin;

	if (params.artistName === 'favicon.ico') return;

	const normalizedName = params.artistName?.replace(/\W/g, ' ') || '';

	if (normalizedName) {
		try {
			return {
				origin,
				pageUrl,
				searchTerm: normalizedName,
				artistWithGenres: await looseGetTopTags({ searchName: normalizedName }),
				error: undefined
			};
		} catch (error) {
			return {
				origin,
				pageUrl,
				searchTerm: normalizedName,
				artistWithGenres: undefined,
				error: normalizeLastFmError(error)
			};
		}
	}

	return { origin, pageUrl };
};
