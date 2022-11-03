const { builtinModules } = require('module');
const { nodeExternalsPlugin } = require('esbuild-node-externals');

/** @type {import('esbuild').BuildOptions} */
const esbuildConfig = {
  bundle: true,
  splitting: false,
  minify: false,
  platform: 'node',
  target: 'node16',
  format: 'cjs',
  loader: {
    '.node': 'copy',
  },
  external: [...builtinModules],
  plugins: [nodeExternalsPlugin({
    // allowList: ['electron-updater'],
  })],
};

module.exports = {
  esbuildConfig,
};
