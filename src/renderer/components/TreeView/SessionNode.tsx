import type { TmuxServer, TmuxSession } from '@shared/types'
import { useExplorerStore } from '../../store'

export function SessionNode({
  server,
  session
}: {
  server: TmuxServer
  session: TmuxSession
}): JSX.Element {
  const openSession = useExplorerStore((s) => s.openSession)
  const activeTerminalId = useExplorerStore((s) => s.activeTerminalId)
  const terminals = useExplorerStore((s) => s.terminals)

  const isActive = Object.values(terminals).some(
    (t) =>
      t.socketPath === server.socketPath &&
      t.sessionName === session.name &&
      t.id === activeTerminalId
  )

  return (
    <div
      className={`tree-row ${isActive ? 'active' : ''}`}
      role="button"
      tabIndex={0}
      onClick={() => void openSession(server.socketPath, server.socketName, session.name)}
    >
      <span className="tree-caret" aria-hidden />
      <span className="tree-label">{session.name}</span>
      <span className="badge">{session.windowCount}w</span>
      {session.attached ? <span className="badge">attached</span> : null}
    </div>
  )
}
