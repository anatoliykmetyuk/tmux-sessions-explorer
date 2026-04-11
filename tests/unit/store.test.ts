import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useExplorerStore } from '../../src/renderer/store'

const createPty = vi.fn()
const destroyPty = vi.fn()

beforeEach(() => {
  createPty.mockReset()
  destroyPty.mockReset()
  createPty.mockResolvedValue({ ptyId: 'pty-1' })
  destroyPty.mockResolvedValue(undefined)

  window.tmuxExplorer = {
    getTmuxTree: vi.fn().mockResolvedValue([]),
    onTmuxTreeUpdated: () => () => {},
    createPty,
    onPtyData: () => () => {},
    writePty: vi.fn(),
    resizePty: vi.fn(),
    destroyPty
  }

  useExplorerStore.setState({
    serverTree: [],
    terminals: {},
    terminalOrder: [],
    activeTerminalId: null
  })
})

describe('useExplorerStore', () => {
  it('dedupes openSession for the same socket+session', async () => {
    await useExplorerStore.getState().openSession('/sock', 'srv', 's1')
    const firstId = useExplorerStore.getState().activeTerminalId
    await useExplorerStore.getState().openSession('/sock', 'srv', 's1')
    expect(useExplorerStore.getState().terminalOrder.length).toBe(1)
    expect(useExplorerStore.getState().activeTerminalId).toBe(firstId)
    expect(createPty).toHaveBeenCalledTimes(1)
  })

  it('creates a pty for a new session', async () => {
    await useExplorerStore.getState().openSession('/sock', 'srv', 's2')
    expect(createPty).toHaveBeenCalledWith({ socketPath: '/sock', sessionName: 's2' })
    const tab = Object.values(useExplorerStore.getState().terminals)[0]
    expect(tab?.ptyId).toBe('pty-1')
  })

  it('closeTerminal destroys pty and updates active tab', async () => {
    await useExplorerStore.getState().openSession('/sock', 'srv', 'a')
    await useExplorerStore.getState().openSession('/sock', 'srv', 'b')
    const order = useExplorerStore.getState().terminalOrder
    expect(order.length).toBe(2)

    await useExplorerStore.getState().closeTerminal(order[1]!)
    expect(destroyPty).toHaveBeenCalled()
    expect(useExplorerStore.getState().terminalOrder.length).toBe(1)
    expect(useExplorerStore.getState().activeTerminalId).toBe(order[0])
  })
})
