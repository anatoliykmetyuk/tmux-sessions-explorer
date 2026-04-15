// Tune how much of the available panel height read-only capture should try to fill.
export const CAPTURE_VIEWPORT_ROWS_FRACTION = 0.75

export function getCaptureTargetRows(rows: number): number {
  return Math.max(1, Math.floor(rows * CAPTURE_VIEWPORT_ROWS_FRACTION))
}

export function formatCaptureDataForXterm(text: string): string {
  return text.replace(/\n/g, '\r\n')
}
