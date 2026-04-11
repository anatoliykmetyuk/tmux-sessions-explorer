import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TreeView } from '../../src/renderer/components/TreeView/TreeView'
import { useExplorerStore } from '../../src/renderer/store'

describe('TreeView', () => {
  it('renders servers and sessions', () => {
    useExplorerStore.setState({
      serverTree: [
        {
          socketPath: '/tmp/tmux-1/default',
          socketName: 'default',
          sessions: [{ id: '$0', name: 'dev', windowCount: 2, createdAt: 1, attached: false }]
        }
      ]
    })

    render(<TreeView />)
    expect(screen.getByText('default')).toBeInTheDocument()
    expect(screen.getByText('dev')).toBeInTheDocument()
  })

  it('shows empty state', () => {
    useExplorerStore.setState({ serverTree: [] })
    render(<TreeView />)
    expect(screen.getByText(/No active tmux servers/i)).toBeInTheDocument()
  })
})
