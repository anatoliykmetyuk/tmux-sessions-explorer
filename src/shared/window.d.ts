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
} from './types'

export interface TmuxExplorerApi {
  getTmuxTree: () => Promise<TmuxServer[]>
  onTmuxTreeUpdated: (cb: (tree: TmuxServer[]) => void) => () => void
  createPty: (req: PtyCreateRequest) => Promise<PtyCreateResponse>
  createCapture: (req: CaptureCreateRequest) => Promise<CaptureCreateResponse>
  onPtyData: (cb: (payload: PtyDataPayload) => void) => () => void
  onCaptureData: (cb: (payload: CaptureDataPayload) => void) => () => void
  writePty: (payload: PtyWritePayload) => void
  resizePty: (payload: PtyResizePayload) => void
  resizeCapture: (payload: CaptureResizePayload) => void
  destroyPty: (ptyId: string) => Promise<void>
  destroyCapture: (captureId: string) => Promise<void>
}

declare global {
  interface Window {
    tmuxExplorer: TmuxExplorerApi
  }
}

export {}
