export const IPC = {
  TMUX_GET_TREE: 'tmux:get-tree',
  TMUX_TREE_UPDATED: 'tmux:tree-updated',
  PTY_CREATE: 'pty:create',
  PTY_DATA: 'pty:data',
  PTY_WRITE: 'pty:write',
  PTY_RESIZE: 'pty:resize',
  PTY_DESTROY: 'pty:destroy',
  CAPTURE_CREATE: 'capture:create',
  CAPTURE_RESIZE: 'capture:resize',
  CAPTURE_DATA: 'capture:data',
  CAPTURE_DESTROY: 'capture:destroy'
} as const

export type IpcChannel = (typeof IPC)[keyof typeof IPC]
