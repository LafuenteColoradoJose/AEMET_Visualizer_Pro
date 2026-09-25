import { vitest } from 'vitest';

vitest.setConfig({ testTimeout: 15000 });

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vitest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vitest.fn(),
    removeListener: vitest.fn(),
    addEventListener: vitest.fn(),
    removeEventListener: vitest.fn(),
    dispatchEvent: vitest.fn(),
  })),
});

// Polyfill ResizeObserver for ECharts
globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as any;

(HTMLCanvasElement.prototype as any).getContext = function (this: HTMLCanvasElement, contextId: string) {
  if (contextId === '2d') {
    return {
      canvas: this,
      fillRect: vitest.fn(),
      clearRect: vitest.fn(),
      strokeRect: vitest.fn(),
      getImageData: vitest.fn().mockReturnValue({ data: [] }),
      putImageData: vitest.fn(),
      createImageData: vitest.fn().mockReturnValue([]),
      setTransform: vitest.fn(),
      drawImage: vitest.fn(),
      save: vitest.fn(),
      fillText: vitest.fn(),
      strokeText: vitest.fn(),
      restore: vitest.fn(),
      beginPath: vitest.fn(),
      moveTo: vitest.fn(),
      lineTo: vitest.fn(),
      closePath: vitest.fn(),
      stroke: vitest.fn(),
      translate: vitest.fn(),
      scale: vitest.fn(),
      rotate: vitest.fn(),
      arc: vitest.fn(),
      arcTo: vitest.fn(),
      bezierCurveTo: vitest.fn(),
      quadraticCurveTo: vitest.fn(),
      rect: vitest.fn(),
      fill: vitest.fn(),
      measureText: vitest.fn().mockReturnValue({ width: 0, actualBoundingBoxAscent: 0, actualBoundingBoxDescent: 0 }),
      transform: vitest.fn(),
      resetTransform: vitest.fn(),
      clip: vitest.fn(),
      createLinearGradient: vitest.fn().mockReturnValue({ addColorStop: vitest.fn() }),
      createRadialGradient: vitest.fn().mockReturnValue({ addColorStop: vitest.fn() }),
      createPattern: vitest.fn().mockReturnValue({}),
      isPointInPath: vitest.fn().mockReturnValue(false),
      isPointInStroke: vitest.fn().mockReturnValue(false),
      globalAlpha: 1,
      globalCompositeOperation: 'source-over',
      fillStyle: '#000',
      strokeStyle: '#000',
      lineWidth: 1,
      lineCap: 'butt',
      lineJoin: 'miter',
      miterLimit: 10,
      shadowBlur: 0,
      shadowColor: 'rgba(0, 0, 0, 0)',
      shadowOffsetX: 0,
      shadowOffsetY: 0,
      font: '10px sans-serif',
      textAlign: 'start',
      textBaseline: 'alphabetic',
      direction: 'inherit',
      imageSmoothingEnabled: true
    } as unknown as CanvasRenderingContext2D;
  }
  return null;
} as any;
