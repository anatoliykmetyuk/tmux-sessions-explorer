import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { test, expect } from '@playwright/test'
import { _electron as electron } from 'playwright'

const require = createRequire(import.meta.url)
const electronPath = require('electron') as string

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..')

test('main window loads', async () => {
  const app = await electron.launch({
    executablePath: electronPath,
    args: [path.join(root, 'out/main/index.js')],
    cwd: root
  })

  app.on('console', (msg) => {
    if (msg.type() === 'error') {
      process.stderr.write(`renderer console error: ${msg.text()}\n`)
    }
  })

  const win = await app.firstWindow()
  await win.waitForLoadState('load')

  await expect(win).toHaveTitle(/Tmux Sessions Explorer/i)
  await expect(win.locator('.sidebar-header')).toHaveText(/Tmux Sessions Explorer/i)

  await app.close()
})
