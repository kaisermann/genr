export function timeout(delay: number) {
	return new Promise((resolve) => setTimeout(resolve, delay));
}
