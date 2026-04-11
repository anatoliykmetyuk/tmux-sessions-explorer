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

export interface TerminalTab {
  id: string
  ptyId: string | null
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
