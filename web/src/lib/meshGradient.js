/**
 * Flowing WebGL mesh gradient, in the spirit of Stripe's hero.
 * The renderer (shader, frames) is in meshRenderer.js; this file decides where it runs.
 */
import { createRenderer } from './meshRenderer'

// A canvas can hand its control to a worker only once. If the same canvas is
// set up again right after being released (React StrictMode does this in
// development), its worker is reused instead of being shut down.
const workers = new WeakMap()

function workerFor(canvas, options) {
  const existing = workers.get(canvas)
  if (existing) {
    clearTimeout(existing.closing)
    return existing.worker
  }
  let worker
  try {
    worker = new Worker(new URL('./meshGradient.worker.js', import.meta.url), { type: 'module' })
    const offscreen = canvas.transferControlToOffscreen()
    worker.postMessage({ type: 'init', canvas: offscreen, options }, [offscreen])
  } catch {
    worker?.terminate()
    return null
  }
  workers.set(canvas, { worker })
  return worker
}

/**
 * Same controller as createRenderer, but the WebGL work (context creation,
 * shader compile, every frame) runs in a worker on an OffscreenCanvas, so it
 * never blocks the page. Falls back to the page thread where that isn't
 * supported. `onFail` is called if WebGL turns out to be unavailable.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {{ shader?: 'mesh' | 'ribbon', colors: [string, string, string, string], resolution?: number, speed?: number,
 *          zoom?: number, ribbon?: { anchor?: [number, number], angle?: number, width?: number } }} options
 *        zoom < 1 widens the mesh bands (useful for short, wide banners); `ribbon` places the ribbon
 * @param {{ onFail?: () => void }} [events]
 * @returns controller, or null when WebGL is unavailable
 */
export function createMeshGradient(canvas, options, { onFail } = {}) {
  const canTransfer = typeof Worker === 'function' && typeof canvas.transferControlToOffscreen === 'function'
  const worker = canTransfer && workerFor(canvas, options)
  if (worker) {
    worker.onmessage = (e) => e.data === 'failed' && onFail?.()
    worker.onerror = () => onFail?.()
    const send = (type, data) => worker.postMessage({ type, ...data })
    return {
      draw: () => send('draw'),
      resize: (width, height) => send('resize', { width, height }),
      setColors: (colors) => send('colors', { colors }),
      start: () => send('start'),
      stop: () => send('stop'),
      destroy() {
        send('stop')
        const entry = workers.get(canvas)
        if (!entry) return
        entry.closing = setTimeout(() => {
          worker.terminate()
          workers.delete(canvas)
        })
      },
    }
  }
  if (workers.has(canvas)) return null // already handed to a worker; can't draw here
  return createRenderer(canvas, options)
}
