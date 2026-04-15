import { ipcMain, type BrowserWindow } from 'electron'
import { IPC } from '@shared/ipc'
import type {
  CaptureCreateRequest,
  CaptureCreateResponse,
  CaptureResizePayload,
  PtyCreateRequest,
  PtyCreateResponse,
  PtyResizePayload,
  PtyWritePayload
} from '@shared/types'
import type { CaptureService } from '../services/capture-service'
import type { PtyService } from '../services/pty-service'
import type { TmuxService } from '../services/tmux-service'

export function registerIpcHandlers(
  getWindow: () => BrowserWindow | null,
  tmuxService: TmuxService,
  ptyService: PtyService,
  captureService: CaptureService
): void {
  ipcMain.removeHandler(IPC.TMUX_GET_TREE)
  ipcMain.removeHandler(IPC.PTY_CREATE)
  ipcMain.removeHandler(IPC.PTY_DESTROY)
  ipcMain.removeHandler(IPC.CAPTURE_CREATE)
  ipcMain.removeHandler(IPC.CAPTURE_DESTROY)

  ipcMain.handle(IPC.TMUX_GET_TREE, () => tmuxService.getSnapshot())

  ipcMain.handle(IPC.PTY_CREATE, (_event, req: PtyCreateRequest): PtyCreateResponse => {
    const ptyId = ptyService.create(req.socketPath, req.sessionName)
    return { ptyId }
  })

  ipcMain.handle(IPC.PTY_DESTROY, (_event, ptyId: string) => {
    ptyService.destroy(ptyId)
  })

  ipcMain.handle(IPC.CAPTURE_CREATE, (_event, req: CaptureCreateRequest): CaptureCreateResponse => {
    const captureId = captureService.create(req.socketPath, req.sessionName)
    return { captureId }
  })

  ipcMain.handle(IPC.CAPTURE_DESTROY, (_event, captureId: string) => {
    captureService.destroy(captureId)
  })

  ipcMain.removeAllListeners(IPC.PTY_WRITE)
  ipcMain.removeAllListeners(IPC.PTY_RESIZE)
  ipcMain.removeAllListeners(IPC.CAPTURE_RESIZE)

  ipcMain.on(IPC.PTY_WRITE, (_event, payload: PtyWritePayload) => {
    ptyService.write(payload.ptyId, payload.data)
  })

  ipcMain.on(IPC.PTY_RESIZE, (_event, payload: PtyResizePayload) => {
    ptyService.resize(payload.ptyId, payload.cols, payload.rows)
  })

  ipcMain.on(IPC.CAPTURE_RESIZE, (_event, payload: CaptureResizePayload) => {
    captureService.resize(payload.captureId, payload.rows)
  })

  const forwardTree = (tree: unknown): void => {
    const win = getWindow()
    if (win && !win.isDestroyed()) {
      win.webContents.send(IPC.TMUX_TREE_UPDATED, tree)
    }
  }

  tmuxService.on('tree-updated', forwardTree)
}
