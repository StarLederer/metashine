# Contributing

## Gochas
- There are 2 bundld steps: esbuild + vite upon `build`, and electron-builder upon `compile`;
- first step does not bundle dependencies listed in the root package.json;
- ideally it would not bundle any dependencies at all but for some reason electron-updater is not bundled correctly that way (might be a pnpm issue);
- electron-builder is the only external dependency not listed in root package.json;
- second step bundles the rest of the required dependencies.
