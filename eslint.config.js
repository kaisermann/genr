import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
	js.configs.recommended,
	...tseslint.configs.recommended,
	...svelte.configs.recommended,
	prettier,
	...svelte.configs.prettier,
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node
			}
		}
	},
	{
		files: ['**/*.svelte'],
		languageOptions: {
			parserOptions: {
				parser: tseslint.parser
			}
		}
	},
	{
		rules: {
			'svelte/no-navigation-without-resolve': 'off'
		}
	},
	{
		ignores: [
			'.DS_Store',
			'.env',
			'.env.*',
			'.svelte-kit/**',
			'build/**',
			'node_modules/**',
			'package/**',
			'package-lock.json',
			'pnpm-lock.yaml',
			'yarn.lock'
		]
	}
);
