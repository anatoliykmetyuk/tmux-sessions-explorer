# Tmux Sessions Explorer

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

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | electron-vite dev |
| `npm run build` | Build to `out/` |
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
