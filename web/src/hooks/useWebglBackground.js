import { useEffect, useState } from 'react'
import { createMeshGradient } from '../lib/meshGradient'
import { onPaletteChange, onPaletteShift, readMeshColors } from '../lib/palette'
import { onThemeChange } from '../lib/theme'

/**
 * Runs a WebGL background (meshRenderer.js) on `canvasRef`: sized to the
 * element, paused off-screen / in hidden tabs, a still frame for
 * prefers-reduced-motion, recoloured on theme and palette changes (following
 * gradual palette shifts frame by frame).
 * Colours come from the "mesh" list in src/config/palette.json.
 *
 * @param {object} options  Renderer options except colours; read once on mount.
 * @returns {'pending' | 'webgl' | 'css'}  'css' = no WebGL, show a fallback
 */
export function useWebglBackground(canvasRef, options) {
  const [mode, setMode] = useState('pending')

  useEffect(() => {
    const canvas = canvasRef.current
    // WebGL runs in a worker where supported, so none of it blocks the page
    const gradient = canvas && createMeshGradient(canvas, { ...options, colors: readMeshColors() }, { onFail: () => setMode('css') })
    if (!gradient) {
      setMode('css')
      return
    }

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    let onScreen = true
    const sync = () => (onScreen && !document.hidden && !reduce.matches ? gradient.start() : gradient.stop())

    // The observer reports the canvas size on its first callback, without forcing a layout
    const resizeObserver = new ResizeObserver(([entry]) => {
      gradient.resize(entry.contentRect.width, entry.contentRect.height)
      gradient.draw()
    })
    resizeObserver.observe(canvas)
    setMode('webgl')

    const intersection = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting
      sync()
    })
    intersection.observe(canvas)
    document.addEventListener('visibilitychange', sync)
    reduce.addEventListener('change', sync)
    const recolor = () => {
      gradient.setColors(readMeshColors())
      gradient.draw()
    }
    const offTheme = onThemeChange(recolor)
    const offPalette = onPaletteChange(recolor)

    // During a gradual palette shift the CSS colours drift for `duration` ms: follow them
    let follow = 0
    const offShift = onPaletteShift((duration) => {
      cancelAnimationFrame(follow)
      const end = performance.now() + duration + 150
      let frame = 0
      const step = (now) => {
        if (frame++ % 2 === 0 || now >= end) recolor() // every other frame is smooth enough
        if (now < end) follow = requestAnimationFrame(step)
      }
      follow = requestAnimationFrame(step)
    })
    sync()

    return () => {
      offTheme()
      offPalette()
      offShift()
      cancelAnimationFrame(follow)
      resizeObserver.disconnect()
      intersection.disconnect()
      document.removeEventListener('visibilitychange', sync)
      reduce.removeEventListener('change', sync)
      gradient.destroy()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- options are mount-time settings

  return mode
}
