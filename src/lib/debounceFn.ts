export function debounceFn<T extends (...args: any[]) => any>(
	fn: T,
	delay: number
): [(...args: Parameters<T>) => void, () => void] {
	let timer: number | undefined;

	const debouncedFn = (...args: Parameters<T>) => {
		if (timer) clearTimeout(timer);

		timer = window.setTimeout(() => {
			timer = undefined;
			fn(...args);
		}, delay);
	};

	return [debouncedFn, () => clearTimeout(timer)];
}
