/* eslint-disable import/no-extraneous-dependencies */

import { join } from 'path';
import { builtinModules } from 'module';
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { chrome } from '../../electron-vendors.config.json';

const PACKAGE_ROOT = __dirname;

export default defineConfig({
  mode: process.env.MODE,
  root: PACKAGE_ROOT,
  resolve: {
    alias: {
      '/@/': `${join(PACKAGE_ROOT, 'src')}/`,
    },
  },
  plugins: [svelte()],
  base: '',
  server: {
    fs: {
      strict: true,
    },
  },
  build: {
    sourcemap: true,
    target: `chrome${chrome}`,
    outDir: 'dist',
    assetsDir: '.',
    rollupOptions: {
      external: [...builtinModules],
    },
    emptyOutDir: true,
    brotliSize: false,
  },
});
