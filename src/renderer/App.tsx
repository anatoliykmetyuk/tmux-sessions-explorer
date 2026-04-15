import { Allotment } from 'allotment'
import 'allotment/dist/style.css'
import { TerminalPanel } from './components/TerminalPanel/TerminalPanel'
import { TreeView } from './components/TreeView/TreeView'
import { useTmuxTree } from './hooks/useTmuxTree'
import { useExplorerStore } from './store'

function ReadOnlyToggle(): JSX.Element {
  const readOnly = useExplorerStore((s) => s.readOnly)
  const setReadOnly = useExplorerStore((s) => s.setReadOnly)

  return (
    <label className="sidebar-toggle">
      <input
        type="checkbox"
        role="switch"
        aria-checked={readOnly}
        checked={readOnly}
        onChange={(e) => setReadOnly(e.target.checked)}
      />
      <span className="sidebar-toggle-label">Read-only mode</span>
      <span className="sidebar-toggle-hint">Read-only capture via tmux (no attach, no colors)</span>
    </label>
  )
}

export function App(): JSX.Element {
  useTmuxTree()

  return (
    <div className="app-shell">
      <Allotment>
        <Allotment.Pane minSize={200} preferredSize={320} maxSize={520}>
          <aside className="sidebar">
            <div className="sidebar-header">Tmux Sessions Explorer</div>
            <div className="sidebar-sub">Servers and sessions refresh automatically.</div>
            <ReadOnlyToggle />
            <TreeView />
          </aside>
        </Allotment.Pane>
        <Allotment.Pane>
          <TerminalPanel />
        </Allotment.Pane>
      </Allotment>
    </div>
  )
}
