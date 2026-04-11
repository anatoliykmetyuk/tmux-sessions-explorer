/// <reference types="@testing-library/jest-dom" />
import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

globalThis.ResizeObserver = class ResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

if (typeof window !== 'undefined' && typeof HTMLCanvasElement !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    }))
  })

  // xterm reads canvas for color calculations during module init / open()
  const proto = HTMLCanvasElement.prototype as unknown as {
    getContext: (
      this: HTMLCanvasElement,
      contextId: string
    ) => CanvasRenderingContext2D | null
  }
  proto.getContext = function (this: HTMLCanvasElement, contextId: string) {
    if (contextId === '2d') {
      return {
        fillStyle: '',
        fillRect: vi.fn(),
        clearRect: vi.fn(),
        getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4) })),
        putImageData: vi.fn(),
        createImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4) })),
        setTransform: vi.fn(),
        drawImage: vi.fn(),
        save: vi.fn(),
        restore: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        closePath: vi.fn(),
        stroke: vi.fn(),
        translate: vi.fn(),
        scale: vi.fn(),
        rotate: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
        measureText: vi.fn(() => ({ width: 0 }))
      } as unknown as CanvasRenderingContext2D
    }
    return null
  }
}
