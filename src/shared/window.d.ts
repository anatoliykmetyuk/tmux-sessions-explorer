import type {
  PtyCreateRequest,
  PtyCreateResponse,
  PtyDataPayload,
  PtyResizePayload,
  PtyWritePayload,
  TmuxServer
} from './types'

export interface TmuxExplorerApi {
  getTmuxTree: () => Promise<TmuxServer[]>
  onTmuxTreeUpdated: (cb: (tree: TmuxServer[]) => void) => () => void
  createPty: (req: PtyCreateRequest) => Promise<PtyCreateResponse>
  onPtyData: (cb: (payload: PtyDataPayload) => void) => () => void
  writePty: (payload: PtyWritePayload) => void
  resizePty: (payload: PtyResizePayload) => void
  destroyPty: (ptyId: string) => Promise<void>
}

declare global {
  interface Window {
    tmuxExplorer: TmuxExplorerApi
  }
}

export {}
