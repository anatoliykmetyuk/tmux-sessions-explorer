import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '@shared/ipc'
import type {
  CaptureCreateRequest,
  CaptureCreateResponse,
  CaptureDataPayload,
  CaptureResizePayload,
  PtyCreateRequest,
  PtyCreateResponse,
  PtyDataPayload,
  PtyResizePayload,
  PtyWritePayload,
  TmuxServer
} from '@shared/types'

const api = {
  getTmuxTree: (): Promise<TmuxServer[]> => ipcRenderer.invoke(IPC.TMUX_GET_TREE),

  onTmuxTreeUpdated: (cb: (tree: TmuxServer[]) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, tree: TmuxServer[]) => cb(tree)
    ipcRenderer.on(IPC.TMUX_TREE_UPDATED, listener)
    return () => {
      ipcRenderer.removeListener(IPC.TMUX_TREE_UPDATED, listener)
    }
  },

  createPty: (req: PtyCreateRequest): Promise<PtyCreateResponse> => ipcRenderer.invoke(IPC.PTY_CREATE, req),

  createCapture: (req: CaptureCreateRequest): Promise<CaptureCreateResponse> =>
    ipcRenderer.invoke(IPC.CAPTURE_CREATE, req),

  resizeCapture: (payload: CaptureResizePayload): void => {
    ipcRenderer.send(IPC.CAPTURE_RESIZE, payload)
  },

  onPtyData: (cb: (payload: PtyDataPayload) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, payload: PtyDataPayload) => cb(payload)
    ipcRenderer.on(IPC.PTY_DATA, listener)
    return () => {
      ipcRenderer.removeListener(IPC.PTY_DATA, listener)
    }
  },

  writePty: (payload: PtyWritePayload): void => {
    ipcRenderer.send(IPC.PTY_WRITE, payload)
  },

  resizePty: (payload: PtyResizePayload): void => {
    ipcRenderer.send(IPC.PTY_RESIZE, payload)
  },

  destroyPty: (ptyId: string): Promise<void> => ipcRenderer.invoke(IPC.PTY_DESTROY, ptyId),

  onCaptureData: (cb: (payload: CaptureDataPayload) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, payload: CaptureDataPayload) => cb(payload)
    ipcRenderer.on(IPC.CAPTURE_DATA, listener)
    return () => {
      ipcRenderer.removeListener(IPC.CAPTURE_DATA, listener)
    }
  },

  destroyCapture: (captureId: string): Promise<void> => ipcRenderer.invoke(IPC.CAPTURE_DESTROY, captureId)
}

contextBridge.exposeInMainWorld('tmuxExplorer', api)
