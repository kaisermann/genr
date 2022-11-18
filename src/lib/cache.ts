import type { LastFmArtistWithGenres } from './lastFm';
import { getFromLocalStorage } from './localStorage';

const APP_VERSION = import.meta.env.VITE_APP_VERSION;
export const getCachedGenres = () => {
	return getFromLocalStorage(`${APP_VERSION}_cached_artists`) || {};
};

export const getCachedAliases = () => {
	return getFromLocalStorage(`${APP_VERSION}_cached_aliases`) || {};
};

export const setCachedGenres = (cachedGenres: Record<string, LastFmArtistWithGenres>) => {
	localStorage.setItem(`${APP_VERSION}_cached_artists`, JSON.stringify(cachedGenres));
};

export const setCachedAliases = (cachedAliases: Record<string, string>) => {
	localStorage.setItem(`${APP_VERSION}_cached_aliases`, JSON.stringify(cachedAliases));
};
