import { randomUUID } from 'node:crypto'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import type { CaptureDataPayload } from '@shared/types'

const execFileAsync = promisify(execFile)

export type CaptureSendFn = (payload: CaptureDataPayload) => void

export type ExecCapture = (
  file: string,
  args: readonly string[],
  options: { encoding: 'utf8'; maxBuffer: number }
) => Promise<{ stdout: string; stderr: string }>

const defaultExecFileAsync: ExecCapture = execFileAsync as ExecCapture
const MAX_CAPTURE_ROWS = 500

type ActiveCapture = {
  timer: ReturnType<typeof setInterval>
  socketPath: string
  sessionName: string
  requestedRows: number
  run: () => Promise<void>
}

export interface CaptureServiceOptions {
  pollIntervalMs?: number
  execImpl?: ExecCapture
}

export class CaptureService {
  private readonly captures = new Map<string, ActiveCapture>()
  private readonly pollMs: number
  private readonly execImpl: ExecCapture

  constructor(
    private readonly send: CaptureSendFn,
    options: CaptureServiceOptions = {}
  ) {
    this.pollMs = options.pollIntervalMs ?? 500
    this.execImpl = options.execImpl ?? defaultExecFileAsync
  }

  create(socketPath: string, sessionName: string): string {
    const captureId = randomUUID()

    const run = async (): Promise<void> => {
      try {
        const execOpts = { encoding: 'utf8' as const, maxBuffer: 10 * 1024 * 1024 }
        const active = this.captures.get(captureId)
        if (!active) return

        const dims = await this.execImpl(
          'tmux',
          ['-S', socketPath, 'display-message', '-t', sessionName, '-p', '#{pane_width}|#{pane_height}'],
          { encoding: 'utf8', maxBuffer: 1024 }
        )

        const dimLine = dims.stdout.trim()
        const parts = dimLine.split('|')
        let cols: number | undefined
        let paneRows: number | undefined
        if (parts.length >= 2) {
          const c = Number.parseInt(parts[0]!, 10)
          const r = Number.parseInt(parts[1]!, 10)
          if (!Number.isNaN(c)) cols = c
          if (!Number.isNaN(r)) paneRows = r
        }

        const rows = Math.max(1, Math.min(MAX_CAPTURE_ROWS, Math.max(paneRows ?? 0, active.requestedRows)))
        const captureArgs = ['-S', socketPath, 'capture-pane', '-p'] as string[]
        if (!paneRows || rows > paneRows) {
          captureArgs.push('-S', `-${rows}`, '-E', '-1')
        }
        captureArgs.push('-t', sessionName)

        const snapshot = await this.execImpl('tmux', captureArgs, execOpts)

        const text = snapshot.stdout.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

        this.send({
          captureId,
          data: text,
          cols,
          rows
        })
      } catch {
        this.send({
          captureId,
          data: '\r\n\x1b[33m[capture failed: session may be gone]\x1b[0m\r\n'
        })
      }
    }

    const timer = setInterval(() => void run(), this.pollMs)
    this.captures.set(captureId, {
      timer,
      socketPath,
      sessionName,
      requestedRows: 0,
      run
    })
    void run()
    return captureId
  }

  resize(captureId: string, rows: number): void {
    const cap = this.captures.get(captureId)
    if (!cap) return
    cap.requestedRows = Math.max(0, Math.floor(rows))
    void cap.run()
  }

  destroy(captureId: string): void {
    const cap = this.captures.get(captureId)
    if (!cap) return
    clearInterval(cap.timer)
    this.captures.delete(captureId)
  }

  destroyAll(): void {
    for (const id of [...this.captures.keys()]) {
      this.destroy(id)
    }
  }

  /** @internal testing */
  get size(): number {
    return this.captures.size
  }
}
