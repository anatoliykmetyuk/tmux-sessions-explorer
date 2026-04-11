import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { app, BrowserWindow } from 'electron'
import { IPC } from '@shared/ipc'
import { registerIpcHandlers } from './ipc/handlers'
import { PtyService } from './services/pty-service'
import { TmuxService } from './services/tmux-service'

/** macOS GUI apps get a minimal PATH; restore login-shell PATH so `tmux` resolves (Homebrew, etc.). */
function fixPath(): void {
  if (process.platform !== 'darwin') return
  try {
    const shell = process.env.SHELL || '/bin/zsh'
    const result = execSync(`${shell} -ilc 'printf "%s" "$PATH"'`, {
      encoding: 'utf8',
      timeout: 5000
    }).trim()
    if (result) process.env.PATH = result
  } catch {
    const extra = ['/opt/homebrew/bin', '/opt/homebrew/sbin', '/usr/local/bin', '/usr/local/sbin']
    const current = process.env.PATH || ''
    const missing = extra.filter((p) => !current.split(':').includes(p))
    if (missing.length) process.env.PATH = [...missing, current].filter(Boolean).join(':')
  }
}

fixPath()

app.setName('Tmux Explorer')

let mainWindow: BrowserWindow | null = null
const tmuxService = new TmuxService()
const ptyService = new PtyService((payload) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(IPC.PTY_DATA, payload)
  }
})

function resolvePreloadScript(): string {
  const js = join(__dirname, '../preload/index.js')
  const mjs = join(__dirname, '../preload/index.mjs')
  if (existsSync(js)) return js
  return mjs
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    title: 'Tmux Explorer',
    webPreferences: {
      preload: resolvePreloadScript(),
      contextIsolation: true,
      // electron-vite emits an ESM preload bundle (`.mjs`). With `sandbox: true`, some Electron
      // versions fail to initialize the preload script, leaving `window.tmuxExplorer` undefined.
      sandbox: false
    }
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    void mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    void mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  registerIpcHandlers(() => mainWindow, tmuxService, ptyService)
  createWindow()
  tmuxService.start()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
      tmuxService.start()
    }
  })
})

app.on('window-all-closed', () => {
  tmuxService.stop()
  ptyService.destroyAll()
  app.quit()
})

app.on('before-quit', () => {
  tmuxService.stop()
  ptyService.destroyAll()
})
