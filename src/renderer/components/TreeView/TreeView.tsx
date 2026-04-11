import { useExplorerStore } from '../../store'
import { ServerNode } from './ServerNode'

export function TreeView(): JSX.Element {
  const serverTree = useExplorerStore((s) => s.serverTree)

  return (
    <div className="tree">
      {serverTree.length === 0 ? (
        <div className="empty-state">No active tmux servers found under the default socket directory.</div>
      ) : (
        serverTree.map((server) => <ServerNode key={server.socketPath} server={server} />)
      )}
    </div>
  )
}
