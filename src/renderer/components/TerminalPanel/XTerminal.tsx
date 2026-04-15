import { useEffect, useRef } from 'react'
import { FitAddon } from '@xterm/addon-fit'
import { Terminal } from '@xterm/xterm'
import type { TerminalObservationMode } from '@shared/types'
import '@xterm/xterm/css/xterm.css'

// Tune how much of the available panel height read-only capture should try to fill.
const CAPTURE_VIEWPORT_ROWS_FRACTION = 0.75

export function XTerminal({
  mode,
  ptyId,
  captureId,
  isActive
}: {
  mode: TerminalObservationMode
  ptyId: string | null
  captureId: string | null
  isActive: boolean
}): JSX.Element | null {
  const containerRef = useRef<HTMLDivElement>(null)
  const termRef = useRef<Terminal | null>(null)
  const fitRef = useRef<FitAddon | null>(null)
  const captureRowsRef = useRef(0)
  const getCaptureTargetRows = (rows: number): number => Math.max(1, Math.floor(rows * CAPTURE_VIEWPORT_ROWS_FRACTION))

  useEffect(() => {
    if (!containerRef.current) return
    if (mode === 'attach' && !ptyId) return
    if (mode === 'capture' && !captureId) return

    const term = new Terminal({
      cursorBlink: mode === 'attach',
      disableStdin: mode === 'capture',
      scrollback: mode === 'capture' ? 0 : 1000,
      fontFamily: 'Menlo, Monaco, Consolas, monospace',
      theme: { background: '#000000', foreground: '#e8ecf1' }
    })
    const fit = new FitAddon()
    termRef.current = term
    fitRef.current = fit
    term.loadAddon(fit)
    term.open(containerRef.current)

    const syncCaptureSize = (): void => {
      if (!captureId) return
      fit.fit()
      if (term.rows > 0) {
        const targetRows = getCaptureTargetRows(term.rows)
        captureRowsRef.current = targetRows
        window.tmuxExplorer.resizeCapture({ captureId, rows: targetRows })
      }
    }

    let unsubData: (() => void) | undefined
    let dataDisposable: { dispose: () => void } | undefined
    let ro: ResizeObserver | undefined

    if (mode === 'attach' && ptyId) {
      fit.fit()
      unsubData = window.tmuxExplorer.onPtyData((payload) => {
        if (payload.ptyId === ptyId) term.write(payload.data)
      })

      dataDisposable = term.onData((data) => {
        window.tmuxExplorer.writePty({ ptyId, data })
      })

      const el = containerRef.current
      ro = new ResizeObserver(() => {
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
    } else if (mode === 'capture' && captureId) {
      unsubData = window.tmuxExplorer.onCaptureData((payload) => {
        if (payload.captureId !== captureId) return
        const cols = payload.cols ?? 80
        const rows = Math.max(captureRowsRef.current, payload.rows ?? 24)
        if (cols > 0 && rows > 0) {
          term.resize(cols, rows)
        }
        // Drop scrollback + visible screen; plain text from capture-pane (no -e) so no cursor junk.
        term.write('\x1b[3J\x1b[2J\x1b[H')
        term.write(payload.data)
      })

      const el = containerRef.current
      ro = new ResizeObserver(() => {
        syncCaptureSize()
      })
      ro.observe(el)
      requestAnimationFrame(() => syncCaptureSize())
    }

    return () => {
      ro?.disconnect()
      dataDisposable?.dispose()
      unsubData?.()
      term.dispose()
      termRef.current = null
      fitRef.current = null
      captureRowsRef.current = 0
    }
  }, [mode, ptyId, captureId])

  useEffect(() => {
    if (!isActive || !fitRef.current || !termRef.current) return

    const fit = fitRef.current
    const term = termRef.current
    let raf1 = 0
    let raf2 = 0
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        fit.fit()
        if (mode === 'attach' && ptyId && term.cols > 0 && term.rows > 0) {
          window.tmuxExplorer.resizePty({
            ptyId,
            cols: term.cols,
            rows: term.rows
          })
        }
        if (mode === 'capture' && captureId && term.rows > 0) {
          const targetRows = getCaptureTargetRows(term.rows)
          captureRowsRef.current = targetRows
          window.tmuxExplorer.resizeCapture({ captureId, rows: targetRows })
        }
      })
    })

    return () => {
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
    }
  }, [isActive, mode, ptyId, captureId])

  if (mode === 'attach' && !ptyId) {
    return <div className="empty-state">Starting tmux client…</div>
  }

  if (mode === 'capture' && !captureId) {
    return <div className="empty-state">Starting capture…</div>
  }

  return <div ref={containerRef} style={{ height: '100%', width: '100%' }} />
}
