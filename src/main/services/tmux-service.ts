import { EventEmitter } from 'node:events'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import type { TmuxServer, TmuxSession } from '@shared/types'

const execFileAsync = promisify(execFile)

export const SESSION_LIST_FORMAT =
  '#{session_id}|#{session_name}|#{session_windows}|#{session_created}|#{session_attached}'

export function getDefaultSocketDir(): string {
  const uid = typeof process.getuid === 'function' ? process.getuid() : 0
  const base = process.env.TMUX_TMPDIR || '/tmp'
  return join(base, `tmux-${uid}`)
}

export function parseSessionLine(line: string): TmuxSession | null {
  const trimmed = line.trim()
  if (!trimmed) return null
  const parts = trimmed.split('|')
  if (parts.length < 5) return null
  const [id, name, windowCountRaw, createdRaw, attachedRaw] = parts
  const windowCount = Number.parseInt(windowCountRaw ?? '', 10)
  const createdAt = Number.parseInt(createdRaw ?? '', 10)
  const attached = (attachedRaw ?? '0') === '1'
  if (!id || !name || Number.isNaN(windowCount) || Number.isNaN(createdAt)) return null
  return {
    id,
    name,
    windowCount,
    createdAt,
    attached
  }
}

export async function listSessionsForSocket(
  socketPath: string,
  execImpl = execFileAsync
): Promise<TmuxSession[] | null> {
  try {
    const { stdout } = await execImpl('tmux', ['-S', socketPath, 'list-sessions', '-F', SESSION_LIST_FORMAT], {
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024
    })
    const lines = stdout.split('\n')
    const sessions: TmuxSession[] = []
    for (const line of lines) {
      const s = parseSessionLine(line)
      if (s) sessions.push(s)
    }
    return sessions
  } catch {
    return null
  }
}

export interface TmuxServiceOptions {
  socketDir?: string
  pollIntervalMs?: number
  readdirImpl?: typeof readdir
  listSessionsImpl?: typeof listSessionsForSocket
}

export class TmuxService extends EventEmitter {
  private timer: ReturnType<typeof setInterval> | null = null
  private pollMs: number
  private lastTree: TmuxServer[] = []
  private readonly socketDir: string
  private readonly readdirImpl: typeof readdir
  private readonly listSessionsImpl: typeof listSessionsForSocket

  constructor(options: TmuxServiceOptions = {}) {
    super()
    this.socketDir = options.socketDir ?? getDefaultSocketDir()
    this.pollMs = options.pollIntervalMs ?? 3000
    this.readdirImpl = options.readdirImpl ?? readdir
    this.listSessionsImpl = options.listSessionsImpl ?? listSessionsForSocket
  }

  getSnapshot(): TmuxServer[] {
    return this.lastTree
  }

  setPollInterval(ms: number): void {
    this.pollMs = Math.max(250, ms)
    if (this.timer) {
      this.stop()
      this.start()
    }
  }

  async buildTree(): Promise<TmuxServer[]> {
    let names: string[] = []
    try {
      names = await this.readdirImpl(this.socketDir)
    } catch {
      return []
    }

    const servers: TmuxServer[] = []
    for (const name of names.sort()) {
      const socketPath = join(this.socketDir, name)
      const sessions = await this.listSessionsImpl(socketPath)
      if (sessions === null) continue
      servers.push({
        socketPath,
        socketName: name,
        sessions
      })
    }
    return servers
  }

  async refresh(): Promise<TmuxServer[]> {
    const tree = await this.buildTree()
    this.lastTree = tree
    this.emit('tree-updated', tree)
    return tree
  }

  start(): void {
    if (this.timer) return
    void this.refresh()
    this.timer = setInterval(() => void this.refresh(), this.pollMs)
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }
}
