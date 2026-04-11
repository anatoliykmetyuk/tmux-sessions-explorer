// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockSpawn = vi.fn()

vi.mock('node-pty', () => ({
  spawn: (...args: unknown[]) => mockSpawn(...args)
}))

import { PtyService } from '../../src/main/services/pty-service'

describe('PtyService', () => {
  beforeEach(() => {
    mockSpawn.mockReset()
  })

  it('spawns tmux attach and forwards data', () => {
    const sent: { ptyId: string; data: string }[] = []
    const onDataHandlers: Array<(data: string) => void> = []
    const onExitHandlers: Array<() => void> = []

    mockSpawn.mockImplementation(() => ({
      onData: (cb: (data: string) => void) => onDataHandlers.push(cb),
      onExit: (cb: () => void) => onExitHandlers.push(cb),
      write: vi.fn(),
      resize: vi.fn(),
      kill: vi.fn()
    }))

    const svc = new PtyService((p) => sent.push(p))
    const ptyId = svc.create('/tmp/tmux-501/default', 'mysess')

    expect(mockSpawn).toHaveBeenCalledWith(
      'tmux',
      ['-S', '/tmp/tmux-501/default', 'attach-session', '-t', 'mysess'],
      expect.objectContaining({ name: 'xterm-256color' })
    )

    onDataHandlers[0]?.('hello')
    expect(sent.at(-1)).toEqual({ ptyId, data: 'hello' })

    svc.write(ptyId, 'x')
    const pty = mockSpawn.mock.results[0]?.value
    expect(pty.write).toHaveBeenCalledWith('x')

    svc.resize(ptyId, 120, 40)
    expect(pty.resize).toHaveBeenCalledWith(120, 40)

    onExitHandlers[0]?.()
    expect(svc.size).toBe(0)
  })

  it('destroy kills the process', () => {
    const kill = vi.fn()
    mockSpawn.mockImplementation(() => ({
      onData: () => {},
      onExit: () => {},
      write: vi.fn(),
      resize: vi.fn(),
      kill
    }))

    const svc = new PtyService(() => {})
    const ptyId = svc.create('/sock', 's')
    svc.destroy(ptyId)
    expect(kill).toHaveBeenCalled()
    expect(svc.size).toBe(0)
  })
})
