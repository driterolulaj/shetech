const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)
const clamp = (v, min, max) => Math.min(Math.max(v, min), max)

let activeFrame = 0

/**
 * Eased window scroll. Duration scales with distance (soft for short hops,
 * unhurried for long ones). Any wheel/touch/key input hands control back
 * to the user immediately.
 */
export function smoothScrollTo(targetY, { duration } = {}) {
  cancelAnimationFrame(activeFrame)

  const maxY = document.documentElement.scrollHeight - window.innerHeight
  const startY = window.scrollY
  const endY = clamp(targetY, 0, maxY)
  const distance = endY - startY
  if (Math.abs(distance) < 1) return

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    window.scrollTo({ top: endY, behavior: 'instant' })
    return
  }

  const total = duration ?? clamp(Math.abs(distance) * 0.6, 650, 1400)
  const interrupt = () => cancel()
  const events = ['wheel', 'touchstart', 'keydown']
  const cancel = () => {
    cancelAnimationFrame(activeFrame)
    events.forEach((e) => window.removeEventListener(e, interrupt))
  }
  events.forEach((e) => window.addEventListener(e, interrupt, { passive: true }))

  let start
  const step = (now) => {
    start ??= now
    const progress = Math.min((now - start) / total, 1)
    window.scrollTo({ top: startY + distance * easeInOutCubic(progress), behavior: 'instant' })
    if (progress < 1) activeFrame = requestAnimationFrame(step)
    else cancel()
  }
  activeFrame = requestAnimationFrame(step)
}

/** Scroll to an in-page hash ("#work"); "#" or "#top" go to the top. */
export function scrollToHash(hash, { offset = 0 } = {}) {
  const id = decodeURIComponent(hash.slice(1))
  const target = id && id !== 'top' ? document.getElementById(id) : null
  if (id && id !== 'top' && !target) return false

  const y = target ? target.getBoundingClientRect().top + window.scrollY - offset : 0
  smoothScrollTo(y)

  // Move focus for keyboard/screen-reader users without a second jump
  if (target) {
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1')
    target.focus({ preventScroll: true })
  }
  return true
}
