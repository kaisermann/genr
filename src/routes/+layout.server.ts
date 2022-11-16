import { looseGetTopTags } from '$lib/lastFm';
import type { LayoutServerLoad } from './$types';
import type { LastFmErrorObject } from '../lib/lastFm';

// Load artist data in the server if artist is defined in the URL
export async function load({ params }: LayoutServerLoad) {
	const normalizedName = params.artistName?.replace(/\W/g, ' ') || '';

	if (normalizedName) {
		return looseGetTopTags({ searchName: normalizedName })
			.then((result) => {
				return {
					searchTerm: normalizedName,
					artistWithGenres: result,
					error: undefined
				};
			})
			.catch((error: LastFmErrorObject) => {
				return {
					searchTerm: normalizedName,
					artistWithGenres: undefined,
					error
				};
			});
	}
}
