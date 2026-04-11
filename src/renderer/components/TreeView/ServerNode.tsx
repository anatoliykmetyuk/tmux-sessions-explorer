import { useState } from 'react'
import type { TmuxServer } from '@shared/types'
import { SessionNode } from './SessionNode'

export function ServerNode({ server }: { server: TmuxServer }): JSX.Element {
  const [open, setOpen] = useState(true)

  return (
    <div>
      <div className="tree-row" role="button" tabIndex={0} onClick={() => setOpen((v) => !v)}>
        <span className="tree-caret" aria-hidden>
          {open ? 'v' : '>'}
        </span>
        <span className="tree-label">{server.socketName}</span>
        <span className="badge">{server.sessions.length}</span>
      </div>
      {open ? (
        <div style={{ paddingLeft: 18 }}>
          {server.sessions.map((session) => (
            <SessionNode
              key={`${server.socketPath}:${session.name}`}
              server={server}
              session={session}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}
