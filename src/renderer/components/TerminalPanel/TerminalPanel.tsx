import { useExplorerStore } from '../../store'
import { XTerminal } from './XTerminal'

export function TerminalPanel(): JSX.Element {
  const terminalOrder = useExplorerStore((s) => s.terminalOrder)
  const terminals = useExplorerStore((s) => s.terminals)
  const activeTerminalId = useExplorerStore((s) => s.activeTerminalId)
  const setActive = useExplorerStore((s) => s.setActiveTerminal)
  const close = useExplorerStore((s) => s.closeTerminal)

  const active = activeTerminalId ? terminals[activeTerminalId] : null

  return (
    <div className="terminal-area">
      <div className="tabs">
        {terminalOrder.map((id) => {
          const tab = terminals[id]
          if (!tab) return null
          return (
            <div
              key={id}
              className={`tab ${id === activeTerminalId ? 'active' : ''}`}
              onClick={() => setActive(id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setActive(id)
                }
              }}
              role="tab"
              tabIndex={0}
            >
              <span className="tab-title" title={`${tab.socketName} / ${tab.sessionName}`}>
                {tab.sessionName}
              </span>
              <button
                type="button"
                className="tab-close"
                aria-label="Close tab"
                onClick={(e) => {
                  e.stopPropagation()
                  void close(id)
                }}
              >
                ×
              </button>
            </div>
          )
        })}
      </div>
      <div className="terminal-host">
        <div className="terminal-surface">
          {active ? (
            <XTerminal ptyId={active.ptyId} />
          ) : (
            <div className="empty-state">Select a tmux session from the tree to attach.</div>
          )}
        </div>
      </div>
    </div>
  )
}
