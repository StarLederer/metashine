/* eslint-disable import/no-extraneous-dependencies */

const { builtinModules } = require('module');
const esbuild = require('esbuild');
const { nodeExternalsPlugin } = require('esbuild-node-externals');
const { build } = require('vite');

process.env.MODE = process.env.MODE || 'production';
const mode = process.env.MODE;

/** @type {import('esbuild').BuildOptions} */
const esbuildConfig = {
  bundle: true,
  splitting: false,
  minify: true,
  platform: 'node',
  target: 'node16',
  format: 'cjs',
  external: [...builtinModules],
  plugins: [nodeExternalsPlugin()],
};

esbuild.build({
  ...esbuildConfig,
  entryPoints: ['packages/main/src/index.ts'],
  outdir: 'packages/main/dist',
});

esbuild.build({
  ...esbuildConfig,
  entryPoints: ['packages/preload/src/index.ts'],
  outdir: 'packages/preload/dist',
});

build({ configFile: 'packages/renderer/vite.config.js', mode });
