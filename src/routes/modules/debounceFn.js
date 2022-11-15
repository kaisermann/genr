export function debounceFn(fn, delay) {
	let timer = null;

	return (...args) => {
		return new Promise((resolve) => {
			if (timer) clearTimeout(timer);
			timer = setTimeout(() => resolve(fn(...args)), delay);
		});
	};
}
