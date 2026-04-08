# Plugin Authoring Smoke Example

A Yantra plugin

## Development

```bash
pnpm install
pnpm dev            # watch builds
pnpm dev:ui         # local dev server with hot-reload events
pnpm test
```

## Install Into Yantra

```bash
pnpm yantraai plugin install ./
```

## Build Options

- `pnpm build` uses esbuild presets from `@yantra/plugin-sdk/bundlers`.
- `pnpm build:rollup` uses rollup presets from the same SDK.
