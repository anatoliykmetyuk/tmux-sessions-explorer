# Tmux Sessions Explorer

[![CI](https://github.com/anatoliykmetyuk/tmux-sessions-explorer/actions/workflows/ci.yml/badge.svg)](https://github.com/anatoliykmetyuk/tmux-sessions-explorer/actions/workflows/ci.yml)

Desktop app to browse local **tmux** servers (socket files) and **sessions**, with an embedded terminal that attaches to a selected session.

## Requirements

- macOS or Linux with `tmux` on `PATH`
- Node.js 20+

## Development

```bash
npm install
npm run dev
```

`postinstall` runs `electron-rebuild` for `node-pty`.

**Note:** the app runs with `sandbox: false` in `BrowserWindow` so the ESM preload bundle (`out/preload/index.mjs`) reliably exposes `window.tmuxExplorer` via `contextBridge`. Renderer `nodeIntegration` remains disabled.

## macOS app (local install)

The packaged app is named **Tmux Explorer** (menu bar, Dock, and `/Applications`). Icon: `build/icon.icns`.

```bash
./install.sh
```

This runs `npm install` if needed, `npm run build:installer`, then copies the built `.app` from `release/mac-*` to `/Applications` (prompts for your password if required). Artifacts also appear under `release/` (e.g. `Tmux Explorer-0.1.0-arm64.dmg`).

Alternatively: `npm run build:mac` (same as `build:installer`), then open `release/mac-arm64/Tmux Explorer.app` (path may differ on Intel Macs).

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | electron-vite dev |
| `npm run build` | Build to `out/` |
| `npm run build:installer` | Build + electron-builder (macOS `.app` + DMG in `release/`) |
| `npm run build:mac` | Same as `build:installer` |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript |
| `npm test` | Vitest unit tests |
| `npm run test:e2e` | Playwright (build first) |

## E2E

```bash
npm run build
npm run test:e2e
```

## License

MIT
