// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CaptureDataPayload } from '../../src/shared/types'
import { CaptureService } from '../../src/main/services/capture-service'

async function flushMicrotasks(): Promise<void> {
  for (let i = 0; i < 20; i++) {
    await Promise.resolve()
  }
}

describe('CaptureService', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('runs capture-pane and display-message with expected args and sends dimensions', async () => {
    const sent: CaptureDataPayload[] = []
    const execImpl = vi.fn().mockImplementation(async (file: string, args: readonly string[]) => {
      if (args.includes('capture-pane')) {
        return { stdout: 'pane-out', stderr: '' }
      }
      if (args.includes('display-message')) {
        return { stdout: '120|40', stderr: '' }
      }
      return { stdout: '', stderr: '' }
    })

    const svc = new CaptureService((p) => sent.push(p), { pollIntervalMs: 500, execImpl })
    svc.create('/tmp/tmux-501/default', 'mysess')

    await flushMicrotasks()

    expect(execImpl).toHaveBeenCalledWith(
      'tmux',
      ['-S', '/tmp/tmux-501/default', 'capture-pane', '-p', '-t', 'mysess'],
      expect.objectContaining({ encoding: 'utf8' })
    )
    expect(execImpl).toHaveBeenCalledWith(
      'tmux',
      [
        '-S',
        '/tmp/tmux-501/default',
        'display-message',
        '-t',
        'mysess',
        '-p',
        '#{pane_width}|#{pane_height}'
      ],
      expect.objectContaining({ encoding: 'utf8' })
    )

    expect(sent.at(-1)).toEqual({
      captureId: expect.any(String),
      data: 'pane-out',
      cols: 120,
      rows: 40
    })
  })

  it('polls on interval until destroyed', async () => {
    const execImpl = vi.fn().mockImplementation(async (_f: string, args: readonly string[]) => {
      if (args.includes('capture-pane')) return { stdout: 'x', stderr: '' }
      return { stdout: '1|1', stderr: '' }
    })

    const svc = new CaptureService(() => {}, { pollIntervalMs: 500, execImpl })
    const id = svc.create('/sock', 's')

    await flushMicrotasks()
    const afterFirst = execImpl.mock.calls.length

    await vi.advanceTimersByTimeAsync(500)
    await flushMicrotasks()
    expect(execImpl.mock.calls.length).toBeGreaterThan(afterFirst)

    execImpl.mockClear()
    svc.destroy(id)
    await vi.advanceTimersByTimeAsync(1000)
    await flushMicrotasks()
    expect(execImpl).not.toHaveBeenCalled()
    expect(svc.size).toBe(0)
  })

  it('captures enough recent lines to fill a taller viewport after resize', async () => {
    const sent: CaptureDataPayload[] = []
    const execImpl = vi.fn().mockImplementation(async (_f: string, args: readonly string[]) => {
      if (args.includes('capture-pane')) return { stdout: 'history', stderr: '' }
      return { stdout: '120|40', stderr: '' }
    })

    const svc = new CaptureService((p) => sent.push(p), { pollIntervalMs: 500, execImpl })
    const id = svc.create('/sock', 'sess')
    await flushMicrotasks()

    execImpl.mockClear()
    svc.resize(id, 60)
    await flushMicrotasks()

    expect(execImpl).toHaveBeenCalledWith(
      'tmux',
      ['-S', '/sock', 'capture-pane', '-p', '-S', '-60', '-E', '-1', '-t', 'sess'],
      expect.objectContaining({ encoding: 'utf8' })
    )
    expect(sent.at(-1)).toEqual({
      captureId: expect.any(String),
      data: 'history',
      cols: 120,
      rows: 60
    })
  })
})
