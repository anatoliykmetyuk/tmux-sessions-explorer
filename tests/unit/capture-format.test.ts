// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  CAPTURE_VIEWPORT_ROWS_FRACTION,
  formatCaptureDataForXterm,
  getCaptureTargetRows
} from '../../src/renderer/components/TerminalPanel/capture-format'

describe('capture-format', () => {
  it('targets 75 percent of fitted rows by default', () => {
    expect(CAPTURE_VIEWPORT_ROWS_FRACTION).toBe(0.75)
    expect(getCaptureTargetRows(40)).toBe(30)
    expect(getCaptureTargetRows(1)).toBe(1)
  })

  it('converts capture newlines to xterm-friendly CRLF', () => {
    expect(formatCaptureDataForXterm('one\ntwo\nthree')).toBe('one\r\ntwo\r\nthree')
  })
})
