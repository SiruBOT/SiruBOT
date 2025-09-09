module.exports = {
	endOfLine: 'lf',
	printWidth: 150,
	quoteProps: 'as-needed',
	semi: true,
	singleQuote: true,
	tabWidth: 4,
	trailingComma: 'none',
	useTabs: true,
	overrides: [
		{
			files: '*.yml',
			options: {
				tabWidth: 2,
				useTabs: false
			}
		}
	],
	plugins: ['@trivago/prettier-plugin-sort-imports'],
	importOrder: [
		// 1. setup/register 관련 (side effect imports)
		'^\\./.*setup.*$',
		'^\\.\\..*setup.*$',
		
		// 2. @ 붙은 모듈들
		'^@sapphire/(.*)$',
		'^@sirubot/(.*)$',
		'^@skyra/(.*)$',
		'^@(.*)$',
		
		// 3. 외부 라이브러리
		'^[a-z]',
		
		// 4. 상대 경로 imports
		'^\\.\\./',
		'^\\.\/',
	],
	importOrderSeparation: false,
	importOrderSortSpecifiers: true,
	importOrderParserPlugins: ['typescript', 'decorators-legacy'],
};