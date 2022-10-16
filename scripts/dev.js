#!/usr/bin/env node

const { createServer, createLogger } = require('vite');
const { build: esbuild } = require('esbuild');
const { spawn } = require('child_process');
const { esbuildConfig } = require('./common/esbuild-conf');

/** @type 'production' | 'development'' */
process.env.MODE = process.env.MODE || 'development';
const mode = process.env.MODE;

/** @type {import('vite').LogLevel} */
const LOG_LEVEL = 'info';

/** @type {import('vite').InlineConfig} */
const sharedConfig = {
  mode,
  build: {
    watch: {},
  },
  logLevel: LOG_LEVEL,
};

/** Messages on stderr that match any of the contained patterns will be stripped from output */
const stderrFilterPatterns = [
  // warning about devtools extension
  // https://github.com/cawa-93/vite-electron-builder/issues/492
  // https://github.com/MarshallOfSound/electron-devtools-installer/issues/143
  /ExtensionLoadWarning/,
];

/**
 *
 * @param string param0
 * @param string param1
 * @param {import('esbuild').Plugin} param2
 * @returns {import('esbuild').BuildResult}
 */
const getWatcher = (entry, outdir, plugin) => esbuild({
  ...esbuildConfig,
  watch: true,
  entryPoints: [entry],
  outdir,
  plugins: [
    ...esbuildConfig.plugins,
    plugin,
  ],
});

/**
 * Start or restart App when source files are changed
 * @param {import('vite').ViteDevServer} viteDevServer
 * @returns {Promise<import('esbuild').BuildResult>}
 */
const setupMainPackageWatcher = (viteDevServer) => {
  // Write a value to an environment variable to pass it to the main process.
  {
    const protocol = `http${viteDevServer.config.server.https ? 's' : ''}:`;
    const host = viteDevServer.config.server.host || 'localhost';
    const { port } = viteDevServer.config.server; // 3000, 3001, 3002, etc...
    const path = '/';
    process.env.VITE_DEV_SERVER_URL = `${protocol}//${host}:${port}${path}`;
  }

  const logger = createLogger(LOG_LEVEL, {
    prefix: '[main]',
  });

  /** @type {ChildProcessWithoutNullStreams | null} */
  let spawnProcess = null;

  return getWatcher('packages/main/src/index.ts', 'packages/main/dist', {
    name: 'reload-app-on-main-package-change',
    setup(build) {
      build.onEnd(() => {
        if (spawnProcess !== null) {
          spawnProcess.kill('SIGINT');
          spawnProcess = null;
        }

        spawnProcess = spawn('electron', ['.']);

        spawnProcess.stdout.on(
          'data',
          (d) => d.toString().trim()
            && logger.warn(d.toString(), { timestamp: true }),
        );
        spawnProcess.stderr.on('data', (d) => {
          const data = d.toString().trim();
          if (!data) return;
          const mayIgnore = stderrFilterPatterns.some((r) => r.test(data));
          if (mayIgnore) return;
          logger.error(data, { timestamp: true });
        });
      });
    },
  });
};

/**
 * Start or restart App when source files are changed
 * @param {import('vite').ViteDevServer} viteDevServer
 * @returns {Promise<Promise<import('esbuild').BuildResult>}
 */
const setupPreloadPackageWatcher = (viteDevServer) => getWatcher('packages/preload/src/index.ts', 'packages/preload/dist', {
  name: 'reload-page-on-preload-package-change',
  setup(build) {
    build.onEnd(() => {
      viteDevServer.ws.send({
        type: 'full-reload',
      });
    });
  },
});

(async () => {
  try {
    const viteDevServer = await createServer({
      ...sharedConfig,
      configFile: 'packages/renderer/vite.config.js',
    });

    await viteDevServer.listen();

    await setupPreloadPackageWatcher(viteDevServer);
    await setupMainPackageWatcher(viteDevServer);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
