import { useEffect, useRef, useState } from 'react'
import { createMeshGradient } from '../lib/meshGradient'
import { cn } from '../lib/cn'

// Base → top layer. Lilac ground, accent violet, cyan and a soft pink lift.
const COLORS = ['#c4b5fd', '#533afd', '#00d4ff', '#f5b0e6']

// CSS fallback for browsers without WebGL
const BLOBS = [
  { c: '#533afd', o: 0.55, w: 'clamp(480px, 60vw, 1100px)', top: '-35%', left: '30%', dx: '-6vw', dy: '6vh', t: '22s' },
  { c: '#00d4ff', o: 0.55, w: 'clamp(420px, 50vw, 900px)', top: '-30%', left: '62%', dx: '-8vw', dy: '10vh', t: '26s' },
  { c: '#a78bfa', o: 0.6, w: 'clamp(380px, 44vw, 820px)', top: '5%', left: '45%', dx: '8vw', dy: '-6vh', t: '19s' },
  { c: '#7dd3fc', o: 0.5, w: 'clamp(360px, 40vw, 760px)', top: '20%', left: '75%', dx: '-6vw', dy: '-8vh', t: '24s' },
]

/**
 * Animated gradient band. WebGL first; it pauses when off-screen, when the
 * tab is hidden, and holds a still frame for prefers-reduced-motion.
 *
 * @param {boolean} skew  Diagonal bottom edge (hero). Off for contained use.
 * @param {boolean} veil  White wash from the left to keep headlines crisp.
 * @param {number}  zoom  < 1 widens the colour bands (read once on mount).
 */
export function GradientMesh({ skew = true, veil = true, zoom = 1, className }) {
  const canvasRef = useRef(null)
  const [mode, setMode] = useState('pending') // pending | webgl | css

  useEffect(() => {
    const canvas = canvasRef.current
    const gradient = canvas && createMeshGradient(canvas, { colors: COLORS, zoom })
    if (!gradient) {
      setMode('css')
      return
    }

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    let onScreen = true
    const sync = () => (onScreen && !document.hidden && !reduce.matches ? gradient.start() : gradient.stop())

    gradient.resize()
    gradient.draw()
    setMode('webgl')

    const resizeObserver = new ResizeObserver(() => {
      gradient.resize()
      gradient.draw()
    })
    resizeObserver.observe(canvas)
    const intersection = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting
      sync()
    })
    intersection.observe(canvas)
    document.addEventListener('visibilitychange', sync)
    reduce.addEventListener('change', sync)
    sync()

    return () => {
      resizeObserver.disconnect()
      intersection.disconnect()
      document.removeEventListener('visibilitychange', sync)
      reduce.removeEventListener('change', sync)
      gradient.destroy()
    }
  }, []) // zoom is a mount-time setting

  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-canvas',
        skew && 'bottom-auto h-[82%] [clip-path:polygon(0_0,100%_0,100%_62%,0_100%)]',
        className,
      )}
    >
      <canvas
        ref={canvasRef}
        className={cn(
          'absolute inset-0 size-full transition-opacity duration-[1800ms] ease-soft',
          mode === 'webgl' ? 'opacity-100' : 'opacity-0',
          mode === 'css' && 'hidden',
        )}
      />
      {mode === 'css' &&
        BLOBS.map((b) => (
          <span
            key={b.c}
            className="mesh-blob"
            style={{ '--c': b.c, '--o': b.o, '--dx': b.dx, '--dy': b.dy, '--t': b.t, width: b.w, top: b.top, left: b.left }}
          />
        ))}
      {veil && <div className="absolute inset-0 bg-linear-to-r from-white/85 via-white/35 to-transparent" />}
    </div>
  )
}
