let locks = 0

/**
 * Reference-counted page scroll lock, so stacked dialogs (a project modal
 * handing off to the contact dialog) don't unlock each other.
 * Returns the matching unlock function.
 */
export function lockScroll() {
  locks += 1
  document.documentElement.classList.add('overflow-hidden')
  let released = false
  return () => {
    if (released) return
    released = true
    locks = Math.max(0, locks - 1)
    if (locks === 0) document.documentElement.classList.remove('overflow-hidden')
  }
}
