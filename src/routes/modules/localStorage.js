export const getFromLocalStorage = (key) => {
	if (typeof window === 'undefined') return null;

	return JSON.parse(window.localStorage.getItem(key) || 'null');
};

export const setToLocalStorage = (key, value) => {
	if (typeof window === 'undefined') return;
	
	window.localStorage.setItem(key, JSON.stringify(value));
};
