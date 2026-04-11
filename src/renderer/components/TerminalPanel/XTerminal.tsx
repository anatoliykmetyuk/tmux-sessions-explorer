import { useEffect, useRef } from 'react'
import { FitAddon } from '@xterm/addon-fit'
import { Terminal } from '@xterm/xterm'
import '@xterm/xterm/css/xterm.css'

export function XTerminal({ ptyId }: { ptyId: string | null }): JSX.Element | null {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ptyId || !containerRef.current) return

    const term = new Terminal({
      cursorBlink: true,
      fontFamily: 'Menlo, Monaco, Consolas, monospace',
      theme: { background: '#000000', foreground: '#e8ecf1' }
    })
    const fit = new FitAddon()
    term.loadAddon(fit)
    term.open(containerRef.current)
    fit.fit()

    const unsubData = window.tmuxExplorer.onPtyData((payload) => {
      if (payload.ptyId === ptyId) term.write(payload.data)
    })

    const dataDisposable = term.onData((data) => {
      window.tmuxExplorer.writePty({ ptyId, data })
    })

    const el = containerRef.current
    const ro = new ResizeObserver(() => {
      fit.fit()
      window.tmuxExplorer.resizePty({
        ptyId,
        cols: term.cols,
        rows: term.rows
      })
    })
    ro.observe(el)

    return () => {
      ro.disconnect()
      dataDisposable.dispose()
      unsubData()
      term.dispose()
    }
  }, [ptyId])

  if (!ptyId) {
    return <div className="empty-state">Starting tmux client…</div>
  }

  return <div ref={containerRef} style={{ height: '100%', width: '100%' }} />
}
