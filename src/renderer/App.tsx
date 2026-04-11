import { Allotment } from 'allotment'
import 'allotment/dist/style.css'
import { TerminalPanel } from './components/TerminalPanel/TerminalPanel'
import { TreeView } from './components/TreeView/TreeView'
import { useTmuxTree } from './hooks/useTmuxTree'

export function App(): JSX.Element {
  useTmuxTree()

  return (
    <div className="app-shell">
      <Allotment>
        <Allotment.Pane minSize={200} preferredSize={320} maxSize={520}>
          <aside className="sidebar">
            <div className="sidebar-header">Tmux Sessions Explorer</div>
            <div className="sidebar-sub">Servers and sessions refresh automatically.</div>
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
