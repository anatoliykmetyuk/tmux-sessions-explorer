import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useExplorerStore } from '../../src/renderer/store'

const createPty = vi.fn()
const destroyPty = vi.fn()
const createCapture = vi.fn()
const destroyCapture = vi.fn()

beforeEach(() => {
  createPty.mockReset()
  destroyPty.mockReset()
  createCapture.mockReset()
  destroyCapture.mockReset()
  createPty.mockResolvedValue({ ptyId: 'pty-1' })
  destroyPty.mockResolvedValue(undefined)
  createCapture.mockResolvedValue({ captureId: 'cap-1' })
  destroyCapture.mockResolvedValue(undefined)

  window.tmuxExplorer = {
    getTmuxTree: vi.fn().mockResolvedValue([]),
    onTmuxTreeUpdated: () => () => {},
    createPty,
    createCapture,
    onPtyData: () => () => {},
    onCaptureData: () => () => {},
    writePty: vi.fn(),
    resizePty: vi.fn(),
    resizeCapture: vi.fn(),
    destroyPty,
    destroyCapture
  }

  useExplorerStore.setState({
    serverTree: [],
    terminals: {},
    terminalOrder: [],
    activeTerminalId: null,
    readOnly: false
  })
})

describe('useExplorerStore', () => {
  it('defaults read-only mode to on', () => {
    expect(useExplorerStore.getInitialState().readOnly).toBe(true)
  })

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
    expect(tab?.mode).toBe('attach')
    expect(tab?.captureId).toBeNull()
  })

  it('creates capture when read-only mode is on', async () => {
    useExplorerStore.getState().setReadOnly(true)
    await useExplorerStore.getState().openSession('/sock', 'srv', 's3')
    expect(createCapture).toHaveBeenCalledWith({ socketPath: '/sock', sessionName: 's3' })
    expect(createPty).not.toHaveBeenCalled()
    const tab = Object.values(useExplorerStore.getState().terminals)[0]
    expect(tab?.mode).toBe('capture')
    expect(tab?.captureId).toBe('cap-1')
    expect(tab?.ptyId).toBeNull()
  })

  it('closeTerminal calls destroyCapture for capture tabs', async () => {
    useExplorerStore.getState().setReadOnly(true)
    await useExplorerStore.getState().openSession('/sock', 'srv', 'cap')
    const id = useExplorerStore.getState().terminalOrder[0]!
    await useExplorerStore.getState().closeTerminal(id)
    expect(destroyCapture).toHaveBeenCalledWith('cap-1')
    expect(destroyPty).not.toHaveBeenCalled()
  })

  it('setActiveTerminal does not remove or recreate terminal tabs', async () => {
    await useExplorerStore.getState().openSession('/sock', 'srv', 'a')
    createPty.mockResolvedValueOnce({ ptyId: 'pty-2' })
    await useExplorerStore.getState().openSession('/sock', 'srv', 'b')

    const order = useExplorerStore.getState().terminalOrder
    const terminalsSnapshot = { ...useExplorerStore.getState().terminals }

    useExplorerStore.getState().setActiveTerminal(order[0]!)

    expect(useExplorerStore.getState().terminals).toEqual(terminalsSnapshot)
    expect(useExplorerStore.getState().activeTerminalId).toBe(order[0])

    useExplorerStore.getState().setActiveTerminal(order[1]!)

    expect(useExplorerStore.getState().terminals).toEqual(terminalsSnapshot)
    expect(useExplorerStore.getState().activeTerminalId).toBe(order[1])
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
