module.exports = {
	root: true,
	env: { browser: true, es2022: true, node: true },
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended',
		'plugin:react-hooks/recommended',
	],
	parser: '@typescript-eslint/parser',
	plugins: ['@typescript-eslint', 'react-hooks'],
	rules: {
		'@typescript-eslint/no-explicit-any': 'error',
		'@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
		'no-console': ['warn', { allow: ['warn', 'error'] }],
	},
	ignorePatterns: ['out/', 'dist/', '*.cjs', 'node_modules/'],
};
