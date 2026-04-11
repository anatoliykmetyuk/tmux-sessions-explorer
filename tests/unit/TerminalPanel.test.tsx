import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TerminalPanel } from '../../src/renderer/components/TerminalPanel/TerminalPanel'
import { useExplorerStore } from '../../src/renderer/store'

describe('TerminalPanel', () => {
  beforeEach(() => {
    window.tmuxExplorer = {
      getTmuxTree: vi.fn(),
      onTmuxTreeUpdated: () => () => {},
      createPty: vi.fn(),
      onPtyData: () => () => {},
      writePty: vi.fn(),
      resizePty: vi.fn(),
      destroyPty: vi.fn().mockResolvedValue(undefined)
    }
  })

  it('renders tabs and empty hint when nothing active', () => {
    useExplorerStore.setState({
      terminals: {},
      terminalOrder: [],
      activeTerminalId: null
    })

    render(<TerminalPanel />)
    expect(screen.getByText(/Select a tmux session/i)).toBeInTheDocument()
  })

  it('renders a terminal pane per open tab so buffers stay mounted when switching', () => {
    useExplorerStore.setState({
      terminals: {
        t1: {
          id: 't1',
          ptyId: 'pty-1',
          socketPath: '/sock',
          socketName: 'srv',
          sessionName: 's1'
        },
        t2: {
          id: 't2',
          ptyId: 'pty-2',
          socketPath: '/sock',
          socketName: 'srv',
          sessionName: 's2'
        }
      },
      terminalOrder: ['t1', 't2'],
      activeTerminalId: 't1'
    })

    const { container } = render(<TerminalPanel />)
    const panes = container.querySelectorAll('[data-terminal-tab]')
    expect(panes).toHaveLength(2)
  })

  it('hides inactive tab panes with display none and shows the active pane', () => {
    useExplorerStore.setState({
      terminals: {
        t1: {
          id: 't1',
          ptyId: 'pty-1',
          socketPath: '/sock',
          socketName: 'srv',
          sessionName: 's1'
        },
        t2: {
          id: 't2',
          ptyId: 'pty-2',
          socketPath: '/sock',
          socketName: 'srv',
          sessionName: 's2'
        }
      },
      terminalOrder: ['t1', 't2'],
      activeTerminalId: 't1'
    })

    const { container } = render(<TerminalPanel />)
    const pane1 = container.querySelector('[data-terminal-tab="t1"]') as HTMLElement
    const pane2 = container.querySelector('[data-terminal-tab="t2"]') as HTMLElement
    expect(pane1.style.display).toBe('block')
    expect(pane2.style.display).toBe('none')
  })

  it('keeps both terminal panes mounted after switching tabs', () => {
    useExplorerStore.setState({
      terminals: {
        t1: {
          id: 't1',
          ptyId: 'pty-1',
          socketPath: '/sock',
          socketName: 'srv',
          sessionName: 's1'
        },
        t2: {
          id: 't2',
          ptyId: 'pty-2',
          socketPath: '/sock',
          socketName: 'srv',
          sessionName: 's2'
        }
      },
      terminalOrder: ['t1', 't2'],
      activeTerminalId: 't1'
    })

    const { container } = render(<TerminalPanel />)
    fireEvent.click(screen.getByText('s2'))

    const pane1 = container.querySelector('[data-terminal-tab="t1"]') as HTMLElement
    const pane2 = container.querySelector('[data-terminal-tab="t2"]') as HTMLElement
    expect(pane1).toBeTruthy()
    expect(pane2).toBeTruthy()
    expect(pane1.style.display).toBe('none')
    expect(pane2.style.display).toBe('block')
  })

  it('closes a tab when clicking close', async () => {
    const destroyPty = vi.fn().mockResolvedValue(undefined)
    window.tmuxExplorer.destroyPty = destroyPty

    useExplorerStore.setState({
      terminals: {
        t1: {
          id: 't1',
          ptyId: 'pty-1',
          socketPath: '/sock',
          socketName: 'srv',
          sessionName: 's1'
        }
      },
      terminalOrder: ['t1'],
      activeTerminalId: 't1'
    })

    render(<TerminalPanel />)
    fireEvent.click(screen.getByRole('button', { name: /close tab/i }))
    expect(destroyPty).toHaveBeenCalledWith('pty-1')
    await waitFor(() => {
      expect(useExplorerStore.getState().terminalOrder.length).toBe(0)
    })
  })
})
