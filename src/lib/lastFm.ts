const ERROR_CODE_ARTIST_NOT_FOUND = 6;
const ERROR_CODE_NO_GENRES_FOUND = 72671;
const ERROR_CODE_GENRE_NOT_FOUND = 72672;
const ERROR_CODE_UPSTREAM_FAILURE = 72673;
const ERROR_CODE_BAD_REQUEST = 10002;

export type LastFmErrorObject = {
	code: number;
	message: string;
};

export type LastFmTag = {
	name: string;
	url: string;
};

export type LastFmGenreInfo = {
	name: string;
	summary: string;
};

export type LastFmArtistWithGenres = {
	name: string;
	url: string;
	genres: Array<LastFmTag>;
};

export type ApiSuccess<T> = {
	data: T;
	error: null;
};

export type ApiFailure = {
	data: null;
	error: LastFmErrorObject;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export function createBadRequestError(message = 'Bad request') {
	return { code: ERROR_CODE_BAD_REQUEST, message };
}

export function createGenreNotFoundError() {
	return { code: ERROR_CODE_GENRE_NOT_FOUND, message: 'Genre not found' };
}

export function createArtistNotFoundError() {
	return { code: ERROR_CODE_ARTIST_NOT_FOUND, message: 'Artist not found' };
}

export function createGenresNotFoundError() {
	return { code: ERROR_CODE_NO_GENRES_FOUND, message: 'No genres found' };
}

export function createUpstreamFailureError() {
	return { code: ERROR_CODE_UPSTREAM_FAILURE, message: 'Could not contact Last.fm' };
}

export function normalizeLastFmError(error: unknown): LastFmErrorObject {
	if (typeof error === 'object' && error != null && 'code' in error && 'message' in error) {
		const { code, message } = error;

		if (typeof code === 'number' && typeof message === 'string') {
			return { code, message };
		}
	}

	return createUpstreamFailureError();
}

export const isArtistNotFoundError = (error: unknown): error is LastFmErrorObject => {
	if (typeof error !== 'object' || error == null) return false;

	return 'code' in error && error.code === ERROR_CODE_ARTIST_NOT_FOUND;
};

export const isNoGenresFoundError = (error: unknown): error is LastFmErrorObject => {
	if (typeof error !== 'object' || error == null) return false;

	return 'code' in error && error.code === ERROR_CODE_NO_GENRES_FOUND;
};

export const isGenreNotFoundError = (error: unknown): error is LastFmErrorObject => {
	if (typeof error !== 'object' || error == null) return false;

	return 'code' in error && error.code === ERROR_CODE_GENRE_NOT_FOUND;
};
