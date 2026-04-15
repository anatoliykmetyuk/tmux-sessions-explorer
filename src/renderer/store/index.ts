import { create } from 'zustand'
import type { TmuxServer, TerminalTab } from '@shared/types'

interface ExplorerState {
  serverTree: TmuxServer[]
  terminals: Record<string, TerminalTab>
  terminalOrder: string[]
  activeTerminalId: string | null
  readOnly: boolean

  setServerTree: (tree: TmuxServer[]) => void
  setReadOnly: (readOnly: boolean) => void
  openSession: (socketPath: string, socketName: string, sessionName: string) => Promise<void>
  setActiveTerminal: (id: string | null) => void
  closeTerminal: (id: string) => Promise<void>
}

export const useExplorerStore = create<ExplorerState>((set, get) => ({
   serverTree: [],
  terminals: {},
  terminalOrder: [],
  activeTerminalId: null,
  readOnly: true,

  setServerTree: (serverTree) => set({ serverTree }),

  setReadOnly: (readOnly) => set({ readOnly }),

  openSession: async (socketPath, socketName, sessionName) => {
    const { terminals, terminalOrder } = get()
    const existing = Object.values(terminals).find(
      (t) => t.socketPath === socketPath && t.sessionName === sessionName
    )
    if (existing) {
      set({ activeTerminalId: existing.id })
      return
    }

    const id = crypto.randomUUID()
    const readOnly = get().readOnly
    const tab: TerminalTab = {
      id,
      mode: readOnly ? 'capture' : 'attach',
      ptyId: null,
      captureId: null,
      socketPath,
      socketName,
      sessionName
    }

    set({
      terminals: { ...terminals, [id]: tab },
      terminalOrder: [...terminalOrder, id],
      activeTerminalId: id
    })

    try {
      if (readOnly) {
        const { captureId } = await window.tmuxExplorer.createCapture({ socketPath, sessionName })
        set((state) => ({
          terminals: {
            ...state.terminals,
            [id]: { ...state.terminals[id], captureId }
          }
        }))
      } else {
        const { ptyId } = await window.tmuxExplorer.createPty({ socketPath, sessionName })
        set((state) => ({
          terminals: {
            ...state.terminals,
            [id]: { ...state.terminals[id], ptyId }
          }
        }))
      }
    } catch (e) {
      console.error(e)
      await get().closeTerminal(id)
    }
  },

  setActiveTerminal: (activeTerminalId) => set({ activeTerminalId }),

  closeTerminal: async (id) => {
    const tab = get().terminals[id]
    if (tab?.mode === 'capture' && tab.captureId) {
      try {
        await window.tmuxExplorer.destroyCapture(tab.captureId)
      } catch {
        // ignore
      }
    } else if (tab?.ptyId) {
      try {
        await window.tmuxExplorer.destroyPty(tab.ptyId)
      } catch {
        // ignore
      }
    }

    set((state) => {
      const { [id]: _removed, ...rest } = state.terminals
      const terminalOrder = state.terminalOrder.filter((x) => x !== id)
      let activeTerminalId = state.activeTerminalId
      if (activeTerminalId === id) {
        activeTerminalId = terminalOrder.length ? terminalOrder[terminalOrder.length - 1]! : null
      }
      return { terminals: rest, terminalOrder, activeTerminalId }
    })
  }
}))
