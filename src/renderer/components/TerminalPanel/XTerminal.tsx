import { useEffect, useRef } from 'react'
import { FitAddon } from '@xterm/addon-fit'
import { Terminal } from '@xterm/xterm'
import '@xterm/xterm/css/xterm.css'

export function XTerminal({
  ptyId,
  isActive
}: {
  ptyId: string | null
  isActive: boolean
}): JSX.Element | null {
  const containerRef = useRef<HTMLDivElement>(null)
  const termRef = useRef<Terminal | null>(null)
  const fitRef = useRef<FitAddon | null>(null)

  useEffect(() => {
    if (!ptyId || !containerRef.current) return

    const term = new Terminal({
      cursorBlink: true,
      fontFamily: 'Menlo, Monaco, Consolas, monospace',
      theme: { background: '#000000', foreground: '#e8ecf1' }
    })
    const fit = new FitAddon()
    termRef.current = term
    fitRef.current = fit
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
      if (term.cols > 0 && term.rows > 0) {
        window.tmuxExplorer.resizePty({
          ptyId,
          cols: term.cols,
          rows: term.rows
        })
      }
    })
    ro.observe(el)

    return () => {
      ro.disconnect()
      dataDisposable.dispose()
      unsubData()
      term.dispose()
      termRef.current = null
      fitRef.current = null
    }
  }, [ptyId])

  useEffect(() => {
    if (!isActive || !ptyId || !fitRef.current || !termRef.current) return

    const fit = fitRef.current
    const term = termRef.current
    let raf1 = 0
    let raf2 = 0
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        fit.fit()
        if (term.cols > 0 && term.rows > 0) {
          window.tmuxExplorer.resizePty({
            ptyId,
            cols: term.cols,
            rows: term.rows
          })
        }
      })
    })

    return () => {
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
    }
  }, [isActive, ptyId])

  if (!ptyId) {
    return <div className="empty-state">Starting tmux client…</div>
  }

  return <div ref={containerRef} style={{ height: '100%', width: '100%' }} />
}
