import { sveltekit } from '@sveltejs/kit/vite';

/** @type {import('vite').UserConfig} */
const config = {
	plugins: [sveltekit()],
	define: {
		'import.meta.env.VITE_APP_VERSION': JSON.stringify(process.env.npm_package_version)
	}
};

export default config;
