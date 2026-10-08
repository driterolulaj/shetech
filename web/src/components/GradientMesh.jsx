import { useRef } from 'react'
import { useWebglBackground } from '../hooks/useWebglBackground'
import { cn } from '../lib/cn'

// Colours come from the "mesh" list in src/config/palette.json (base → top layer, per theme).

// CSS fallback for browsers without WebGL
const BLOBS = [
  { c: 'var(--mesh-1)', o: 0.55, w: 'clamp(480px, 60vw, 1100px)', top: '-35%', left: '30%', dx: '-6vw', dy: '6vh', t: '22s' },
  { c: 'var(--mesh-2)', o: 0.55, w: 'clamp(420px, 50vw, 900px)', top: '-30%', left: '62%', dx: '-8vw', dy: '10vh', t: '26s' },
  { c: 'var(--mesh-0)', o: 0.6, w: 'clamp(380px, 44vw, 820px)', top: '5%', left: '45%', dx: '8vw', dy: '-6vh', t: '19s' },
  { c: 'var(--mesh-3)', o: 0.5, w: 'clamp(360px, 40vw, 760px)', top: '20%', left: '75%', dx: '-6vw', dy: '-8vh', t: '24s' },
]

/**
 * Animated gradient band. WebGL first; it pauses when off-screen, when the
 * tab is hidden, and holds a still frame for prefers-reduced-motion.
 *
 * @param {boolean} skew  Diagonal bottom edge (hero). Off for contained use.
 * @param {boolean} veil  Surface-coloured wash from the left to keep headlines crisp.
 * @param {number}  zoom  < 1 widens the colour bands (read once on mount).
 */
export function GradientMesh({ skew = true, veil = true, zoom = 1, className }) {
  const canvasRef = useRef(null)
  const mode = useWebglBackground(canvasRef, { zoom }) // zoom is a mount-time setting

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
      {veil && <div className="absolute inset-0 bg-linear-to-r from-surface/85 via-surface/35 to-transparent" />}
    </div>
  )
}
