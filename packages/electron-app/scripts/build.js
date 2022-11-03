const { build: esbuild } = require('esbuild');
const { build: vitebuild } = require('vite');
const { esbuildConfig } = require('./common/esbuild-conf');

process.env.MODE = process.env.MODE || 'production';
const mode = process.env.MODE;

esbuild({
  ...esbuildConfig,
  entryPoints: ['packages/main/src/index.ts'],
  outdir: 'packages/main/dist',
});

esbuild({
  ...esbuildConfig,
  entryPoints: ['packages/preload/src/index.ts'],
  outdir: 'packages/preload/dist',
});

vitebuild({ configFile: 'packages/renderer/vite.config.js', mode });
