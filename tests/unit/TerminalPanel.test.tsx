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
