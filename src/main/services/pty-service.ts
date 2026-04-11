import { randomUUID } from 'node:crypto'
import * as pty from 'node-pty'
import type { PtyDataPayload } from '@shared/types'

export type PtySendFn = (payload: PtyDataPayload) => void

export class PtyService {
  private readonly processes = new Map<string, pty.IPty>()

  constructor(private readonly send: PtySendFn) {}

  create(socketPath: string, sessionName: string): string {
    const ptyId = randomUUID()
    const child = pty.spawn('tmux', ['-S', socketPath, 'attach-session', '-t', sessionName], {
      name: 'xterm-256color',
      cwd: process.env.HOME || process.cwd(),
      env: process.env as Record<string, string>
    })

    child.onData((data) => {
      this.send({ ptyId, data })
    })

    child.onExit(() => {
      this.processes.delete(ptyId)
      this.send({
        ptyId,
        data: '\r\n\x1b[33m[tmux client exited]\x1b[0m\r\n'
      })
    })

    this.processes.set(ptyId, child)
    return ptyId
  }

  write(ptyId: string, data: string): void {
    const proc = this.processes.get(ptyId)
    if (proc) proc.write(data)
  }

  resize(ptyId: string, cols: number, rows: number): void {
    const proc = this.processes.get(ptyId)
    if (proc) {
      try {
        proc.resize(cols, rows)
      } catch {
        // ignore invalid geometry
      }
    }
  }

  destroy(ptyId: string): void {
    const proc = this.processes.get(ptyId)
    if (!proc) return
    try {
      proc.kill()
    } catch {
      // ignore
    }
    this.processes.delete(ptyId)
  }

  destroyAll(): void {
    for (const id of this.processes.keys()) {
      this.destroy(id)
    }
  }

  /** @internal testing */
  get size(): number {
    return this.processes.size
  }
}
