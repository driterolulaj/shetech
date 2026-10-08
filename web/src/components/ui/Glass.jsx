import { useCallback, useEffect, useRef } from 'react'
import { cn } from '../../lib/cn'

/**
 * Liquid-glass surface (see `.liquid-glass` in index.css). With `sheen`, a
 * soft highlight follows a mouse pointer across the surface. Only CSS
 * variables are written (rAF-throttled), so React never re-renders.
 */
export function Glass({ as: Comp = 'div', sheen = true, className, ref: forwardedRef, ...props }) {
  const local = useRef(null)

  const setRef = useCallback(
    (node) => {
      local.current = node
      if (typeof forwardedRef === 'function') forwardedRef(node)
      else if (forwardedRef) forwardedRef.current = node
    },
    [forwardedRef],
  )

  useEffect(() => {
    const el = local.current
    if (!el || !sheen) return
    let frame = 0
    let x = 0
    let y = 0
    const move = (e) => {
      if (e.pointerType !== 'mouse') return
      const r = el.getBoundingClientRect()
      x = e.clientX - r.left
      y = e.clientY - r.top
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        el.style.setProperty('--mx', `${x}px`)
        el.style.setProperty('--my', `${y}px`)
      })
    }
    const enter = (e) => e.pointerType === 'mouse' && el.style.setProperty('--sheen', '1')
    const leave = () => el.style.setProperty('--sheen', '0')
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerenter', enter)
    el.addEventListener('pointerleave', leave)
    return () => {
      cancelAnimationFrame(frame)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerenter', enter)
      el.removeEventListener('pointerleave', leave)
    }
  }, [sheen])

  return <Comp ref={setRef} className={cn('liquid-glass', className)} {...props} />
}
