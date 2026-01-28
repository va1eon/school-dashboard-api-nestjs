/** @type {import("prettier").Config} */

const config = {
	tabWidth: 2,
	printWidth: 85,
	useTabs: true,
	semi: false,
	singleQuote: true,
	bracketSpacing: true,
	trailingComma: 'es5',
	arrowParens: 'avoid',

	plugins: ['@ianvs/prettier-plugin-sort-imports'],

	overrides: [
		{
			files: ['*.ts', '*.tsx', '*.js', '*.jsx'],
			options: {
				parser: 'typescript',
				importOrder: [
					'<THIRD_PARTY_MODULES>',
					'',
					'^@/prisma/generated$',
					'^@/prisma/generated/(.*)$',
					'^@/(.*)$',
					'',
					'^\\.\\./(.*)',
					'^\\.\\.(.*)$',
					'^\\./(.*)$',
				],
				importOrderParserPlugins: [
					'classProperties',
					'decorators-legacy',
					'typescript',
				],
				importOrderSortSpecifiers: true,
				importOrderCaseInsensitive: true,
			},
		},
	],
}

export default config
