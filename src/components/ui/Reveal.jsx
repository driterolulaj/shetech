import { useEffect, useRef, useState } from 'react'
import { cn } from '../../lib/cn'

/**
 * Fades + lifts its content in the first time it enters the viewport.
 * Put it directly on a glass surface rather than around one: an animating
 * ancestor's opacity would cut the backdrop blur off from the page.
 */
export function Reveal({ as: Comp = 'div', delay = 0, className, style, ...props }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '0px 0px -10% 0px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <Comp
      ref={ref}
      data-visible={visible}
      className={cn('reveal', className)}
      style={{ '--delay': `${delay}ms`, ...style }}
      {...props}
    />
  )
}
