# Metashine contribution guide

A little quirky. Will fix soon.

## Development

1. Enter development environment `nix develop` or make sure node 16 pnpm 7 and rust 1.62 are installed.
1. Install dependencies `pnpm i`
1. Build native-addon Rust library: `cd packages/native-addon` `nix build .#86_64-unknown-linux-gnu` or `nix build .#86_64-pc-windows-gnu` with nix; or `cargo build --release` without nix.
1. Package native addon `node scripts/package.js`
1. If compiled with `nix build` remove ./result or pnpm will bug out.
1. Go back to project root `cd ../..`
1. Install dependencies again. This will link the native-addon `pnpm i`
1. Start the app in dev mode `node scripts/dev.js`

## Building

1. Enter development environment `nix develop` or make sure node 16 pnpm 7 and rust 1.62 are installed.
1. Install dependencies `pnpm i`
1. Build native-addon Rust library: `cd packages/native-addon` `nix build .#86_64-unknown-linux-gnu` or `nix build .#86_64-pc-windows-gnu` with nix; or `cargo build --release` without nix.
1. Package native addon `node scripts/package.js`
1. If compiled with `nix build` remove ./result or pnpm will bug out.
1. Go back to project root `cd ../..`
1. Install dependencies again. This will link the native-addon `pnpm i`
1. Build electron-side packages `pnpm run build:electron`
1. *(Optional)* Preview the app in prod mode `pnpm exec electron .` or `electron .` if Electron is natively installed (is is in nix)
1. Build the app with electron builder `pnpm exec electron-builder .` (you can do this step in the electron-builder's docker image based container). Output wil be found in ./dist

## Gochas (Outdated. Will fix soon)
- There are 2 bundld steps: esbuild + vite upon `build`, and electron-builder upon `compile`;
- first step does not bundle dependencies listed in the root package.json;
- ideally it would not bundle any dependencies at all but for some reason electron-updater is not bundled correctly that way (might be a pnpm issue);
- electron-builder is the only external dependency not listed in root package.json;
- second step bundles the rest of the required dependencies.
