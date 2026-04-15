export interface TmuxSession {
  id: string
  name: string
  windowCount: number
  createdAt: number
  attached: boolean
}

export interface TmuxServer {
  socketPath: string
  socketName: string
  sessions: TmuxSession[]
}

export type TerminalObservationMode = 'attach' | 'capture'

export interface TerminalTab {
  id: string
  mode: TerminalObservationMode
  ptyId: string | null
  captureId: string | null
  socketPath: string
  socketName: string
  sessionName: string
}

export interface PtyCreateRequest {
  socketPath: string
  sessionName: string
}

export interface PtyCreateResponse {
  ptyId: string
}

export interface PtyDataPayload {
  ptyId: string
  data: string
}

export interface PtyWritePayload {
  ptyId: string
  data: string
}

export interface PtyResizePayload {
  ptyId: string
  cols: number
  rows: number
}

export interface CaptureCreateRequest {
  socketPath: string
  sessionName: string
}

export interface CaptureCreateResponse {
  captureId: string
}

export interface CaptureResizePayload {
  captureId: string
  rows: number
}

export interface CaptureDataPayload {
  captureId: string
  data: string
  cols?: number
  rows?: number
}
