import { useEffect } from 'react'
import { scrollToHash } from '../lib/smoothScroll'

/**
 * Intercept every same-page hash link (navbar, popover, CTAs, modal) and
 * replace the hard jump with an eased scroll. `offset` clears the fixed header.
 */
export function useSmoothAnchors({ offset = 88 } = {}) {
  useEffect(() => {
    const onClick = (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const link = e.target.closest?.('a[href^="#"]')
      if (!link) return
      const hash = link.getAttribute('href')
      if (hash === '#') return // placeholder links
      if (scrollToHash(hash, { offset })) {
        e.preventDefault()
        history.pushState(null, '', hash === '#top' ? window.location.pathname : hash)
      }
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [offset])
}
