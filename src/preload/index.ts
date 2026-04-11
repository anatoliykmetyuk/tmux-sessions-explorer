import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '@shared/ipc'
import type {
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

  destroyPty: (ptyId: string): Promise<void> => ipcRenderer.invoke(IPC.PTY_DESTROY, ptyId)
}

contextBridge.exposeInMainWorld('tmuxExplorer', api)
