import * as url from 'url';
import { resolve as r } from 'path';
import {
  mkdir, writeFile, cp, rm, stat,
} from 'fs/promises';
import { statSync } from 'fs';

// Resolves paths relative to this module
const resolve = (...args) => r(url.fileURLToPath(import.meta.url), '..', ...args);

// Console.logs various messages very prettyly
const print = (message, type) => {
  if (type === 'error') {
    console.error(`\x1b[31m[package.js] error: \x1b[0m${message}\x1b[0m`);
  } else if (type === 'hint') {
    console.info(`\x1b[34m[package.js] hint: \x1b[0m${message}\x1b[0m`);
  } else if (type === 'success') {
    console.info(`\x1b[32m[package.js] success: \x1b[0m${message}\x1b[0m`);
  } else {
    console.info(`\x1b[2m[package.js] info: ${message}\x1b[0m`);
  }
};

// Main
(async () => {
  // Try to find the Rust compilation artifact
  print('Trying to find the Rust artifact...');

  let rustBuildPath;

  const knownArtifactPaths = [
    // nix
    '../result/lib/libnative_addon.so',
    '../result/lib/native_addon.dll',

    // raw cargo
    '../target/release/libnative_addon.so',
    '../target/release/native_addon.dll',
    '../target/x86_64-unknown-linux-gnu/release/libnative_addon.so',
    '../target/x86_64-pc-windows-gnu/release/native_addon.dll',
  ];

  await Promise.all(knownArtifactPaths.map((path) => new Promise(
    (resolvePromise) => {
      if (rustBuildPath === undefined) {
        try {
          print(`Checking ${path}`);
          if ((statSync(resolve(path), { dereference: true })).isFile()) {
            rustBuildPath = path;
            print(`Found artifact at ${path}`, 'success');
          }
        } catch (e) { /**/ }
      }
      resolvePromise(null);
    },
  )));

  if (rustBuildPath === undefined) {
    print('Could not find the artifact', 'error');
    print('Make sure you\'ve built the Rust artifact first \x1b[2m(cargo build --release or nix build)', 'hint');
    return;
  }

  try {
    await stat(resolve('../result/lib/native_addon.dll'));
  } catch (e) { /**/ }

  try {
    await rm(resolve('../dist'), { recursive: true });
  } catch (e) { /**/ }

  await mkdir(resolve('../dist'));

  await cp(
    resolve(rustBuildPath),
    resolve('../dist/index.node'),
    { dereference: true },
  );

  print('Artifact copied!', 'success');
})();
