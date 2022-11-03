# Metashine contribution guide

## Development

1. Enter development environment `nix develop` or make sure node 16 npm 8 and rust 1.62 are installed.
1. Navigate to the native-addon package `cd packages/native-addon`
1. Build the Rust library: `nix build .#86_64-unknown-linux-gnu` or `nix build .#86_64-pc-windows-gnu` with nix; or `cargo build --release` without nix.
1. Package native-addon `node scripts/package.mjs`
1. If compiled with `nix build` remove ./result or electron-builder will bug out.
1. Navigate to the electron-app package `cd ../electron-app`
1. Install dependencies `npm i`
1. Start the app in dev mode `node scripts/dev.js`

## Building

1. Enter development environment `nix develop` or make sure node 16 npm 8 and rust 1.62 are installed.
1. Navigate to the native-addon package `cd packages/native-addon`
1. Build the Rust library: `nix build .#86_64-unknown-linux-gnu` or `nix build .#86_64-pc-windows-gnu` with nix; or `cargo build --release` without nix.
1. Package native-addon `node scripts/package.mjs`
1. If compiled with `nix build` remove ./result or electron-builder will bug out.
1. Navigate to the electron-app package `cd ../electron-app`
1. Install dependencies `npm i`
1. Build JS artifacts `npm run build`
1. *(Optional)* Preview the app in prod mode `npm run preview .` or `electron .` if Electron is natively installed (is is in nix)
1. Build the app with electron builder `npm run compile` (you can do this step in the electron-builder's docker image based container). Output wil be found in ./dist
