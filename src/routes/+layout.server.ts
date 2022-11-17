import type { LayoutServerLoad } from './$types';

// Load artist data in the server if artist is defined in the URL
export async function load({ params, url }: LayoutServerLoad) {
	if (params.artistName === 'favicon.ico') return;

	const normalizedName = params.artistName?.replace(/\W/g, ' ') || '';
	const origin = url.origin;

	if (normalizedName) {
		const url = new URL('/api/genres', origin);

		url.searchParams.append('artist', normalizedName);

		return fetch(url)
			.then((response) => response.json())
			.then((json) => {
				if (json.error) {
					return {
						searchTerm: normalizedName,
						artistWithGenres: undefined,
						error: json.error
					};
				} else {
					return {
						searchTerm: normalizedName,
						artistWithGenres: json.data,
						error: undefined
					};
				}
			});
	}
}
