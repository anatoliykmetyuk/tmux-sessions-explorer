import { useEffect } from 'react'
import { useExplorerStore } from '../store'

export function useTmuxTree(): void {
  const setServerTree = useExplorerStore((s) => s.setServerTree)

  useEffect(() => {
    void window.tmuxExplorer.getTmuxTree().then(setServerTree)
    const unsub = window.tmuxExplorer.onTmuxTreeUpdated(setServerTree)
    return unsub
  }, [setServerTree])
}
