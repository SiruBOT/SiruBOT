import { defineConfig, type Options } from 'tsup';

const baseOptions: Options = {
	clean: true,
	entry: ['src/**/*.ts'],
	dts: true,
	minify: false,
	skipNodeModulesBundle: true,
	sourcemap: true,
	target: 'es2021',
	tsconfig: 'tsconfig.json',
	keepNames: true,
	treeshake: true,
    outDir: 'dist',
    format: 'cjs'
};

export default defineConfig({ ...baseOptions });
