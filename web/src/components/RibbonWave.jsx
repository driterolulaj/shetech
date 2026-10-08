import { useRef } from 'react'
import { useWebglBackground } from '../hooks/useWebglBackground'
import { cn } from '../lib/cn'

/**
 * Silk-ribbon background (lib/ribbonShader.js), the page's second animation.
 * Fills its positioned parent; colours follow the palette's "mesh" list.
 *
 * @param {[number, number]} anchor  A point the ribbon passes through, 0–1 across the box (y up).
 * @param {number}           angle   Direction in radians from horizontal (negative = downwards).
 * @param {number}           width   Half-width, as a fraction of the box's shorter side.
 * All three are read once on mount.
 */
export function RibbonWave({ anchor = [0.75, 0.6], angle = -1, width = 0.2, className }) {
  const canvasRef = useRef(null)
  const mode = useWebglBackground(canvasRef, {
    shader: 'ribbon',
    // Fine strands need real pixels; capped so big retina screens stay cheap
    resolution: Math.min(typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1, 1.5),
    ribbon: { anchor, angle, width },
  })

  return (
    <div aria-hidden="true" className={cn('pointer-events-none absolute inset-0 -z-10 overflow-hidden', className)}>
      <canvas
        ref={canvasRef}
        className={cn(
          'absolute inset-0 size-full transition-opacity duration-[2000ms] ease-soft',
          mode === 'webgl' ? 'opacity-100' : 'opacity-0',
          mode === 'css' && 'hidden',
        )}
      />
      {/* No WebGL: a still band in the same colours and direction */}
      {mode === 'css' && (
        <span
          className="absolute h-[38%] w-[160%] rounded-full opacity-80 blur-2xl"
          style={{
            left: `${anchor[0] * 100 - 80}%`,
            top: `${(1 - anchor[1]) * 100 - 19}%`,
            transform: `rotate(${(-angle * 180) / Math.PI}deg)`,
            background: 'linear-gradient(90deg, var(--mesh-0), var(--mesh-1), var(--mesh-2), var(--mesh-3))',
          }}
        />
      )}
    </div>
  )
}
