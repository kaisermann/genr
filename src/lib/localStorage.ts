export const getFromLocalStorage = (key: string) => {
	if (typeof window === 'undefined') return null;

	return JSON.parse(window.localStorage.getItem(key) || 'null');
};

export const setToLocalStorage = (key: string, value: any) => {
	if (typeof window === 'undefined') return;

	window.localStorage.setItem(key, JSON.stringify(value));
};
