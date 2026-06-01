export function debounceFn<Args extends unknown[]>(
	fn: (...args: Args) => unknown,
	delay: number
): [(...args: Args) => void, () => void] {
	let timer: number | undefined;

	const debouncedFn = (...args: Args) => {
		if (timer) clearTimeout(timer);

		timer = window.setTimeout(() => {
			timer = undefined;
			fn(...args);
		}, delay);
	};

	return [debouncedFn, () => clearTimeout(timer)];
}
