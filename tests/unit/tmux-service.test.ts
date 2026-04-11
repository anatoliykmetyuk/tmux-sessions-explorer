// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { readdir } from 'node:fs/promises'
import {
  TmuxService,
  getDefaultSocketDir,
  listSessionsForSocket,
  parseSessionLine
} from '../../src/main/services/tmux-service'

describe('parseSessionLine', () => {
  it('parses a valid tmux format line', () => {
    const s = parseSessionLine('$0|dev|3|1700000000|1')
    expect(s).toEqual({
      id: '$0',
      name: 'dev',
      windowCount: 3,
      createdAt: 1700000000,
      attached: true
    })
  })

  it('returns null for invalid lines', () => {
    expect(parseSessionLine('')).toBeNull()
    expect(parseSessionLine('nope')).toBeNull()
    expect(parseSessionLine('a|b|c')).toBeNull()
  })
})

describe('getDefaultSocketDir', () => {
  it('uses TMUX_TMPDIR when set', () => {
    const prev = process.env.TMUX_TMPDIR
    process.env.TMUX_TMPDIR = '/tmp/custom'
    try {
      const dir = getDefaultSocketDir()
      expect(dir).toMatch(/\/tmp\/custom\/tmux-\d+$/)
    } finally {
      if (prev === undefined) delete process.env.TMUX_TMPDIR
      else process.env.TMUX_TMPDIR = prev
    }
  })
})

describe('listSessionsForSocket', () => {
  it('returns sessions when tmux succeeds', async () => {
    const execImpl = vi.fn().mockResolvedValue({ stdout: '$0|s|1|10|0\n' })
    const result = await listSessionsForSocket('/tmp/tmux-501/default', execImpl as never)
    expect(result).toEqual([
      {
        id: '$0',
        name: 's',
        windowCount: 1,
        createdAt: 10,
        attached: false
      }
    ])
  })

  it('returns null when tmux fails', async () => {
    const execImpl = vi.fn().mockRejectedValue(new Error('no server'))
    const result = await listSessionsForSocket('/tmp/nope', execImpl as never)
    expect(result).toBeNull()
  })
})

describe('TmuxService', () => {
  it('buildTree merges readdir + session probes', async () => {
    const readdirImpl = vi.fn().mockResolvedValue(['b', 'a'])
    const listSessionsImpl = vi.fn().mockImplementation(async (socketPath: string) => {
      if (socketPath.endsWith('/a')) return [{ id: '$0', name: 'sa', windowCount: 1, createdAt: 1, attached: false }]
      if (socketPath.endsWith('/b')) return null
      return []
    })

    const svc = new TmuxService({
      socketDir: '/tmp/tmux-test',
      readdirImpl: readdirImpl as typeof readdir,
      listSessionsImpl
    })

    const tree = await svc.buildTree()
    expect(tree.map((s) => s.socketName)).toEqual(['a'])
    expect(tree[0]?.sessions[0]?.name).toBe('sa')
  })

  it('emits tree-updated on refresh', async () => {
    const readdirImpl = vi.fn().mockResolvedValue([])
    const svc = new TmuxService({
      socketDir: '/tmp/empty',
      readdirImpl: readdirImpl as typeof readdir
    })

    const spy = vi.fn()
    svc.on('tree-updated', spy)
    await svc.refresh()
    expect(spy).toHaveBeenCalledWith([])
  })
})
