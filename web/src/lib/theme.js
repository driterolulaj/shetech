import { useSyncExternalStore } from 'react'

/**
 * Light/dark theme. Preference is 'light' | 'dark' | 'system' (default).
 * The resolved theme lives on <html data-theme>; index.html sets it before
 * first paint so there's no flash, and this module keeps it in sync.
 */
const KEY = 'theme'
const media = window.matchMedia('(prefers-color-scheme: dark)')
const listeners = new Set()

const readPreference = () => {
  try {
    const stored = localStorage.getItem(KEY)
    return stored === 'light' || stored === 'dark' ? stored : 'system'
  } catch {
    return 'system'
  }
}

let preference = readPreference()

const resolve = () => (preference === 'system' ? (media.matches ? 'dark' : 'light') : preference)

function apply() {
  document.documentElement.dataset.theme = resolve()
  listeners.forEach((listener) => listener())
}

media.addEventListener('change', () => preference === 'system' && apply())

/** Switch theme, cross-fading the page where the View Transitions API exists. */
export function setThemePreference(next) {
  preference = next
  try {
    next === 'system' ? localStorage.removeItem(KEY) : localStorage.setItem(KEY, next)
  } catch {
    // storage blocked: the choice still applies for this visit
  }
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (document.startViewTransition && !reduceMotion) document.startViewTransition(apply)
  else apply()
}

const subscribe = (listener) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getTheme() {
  return resolve()
}

/** Re-renders when the resolved theme changes. */
export function useTheme() {
  const theme = useSyncExternalStore(subscribe, resolve, () => 'light')
  return {
    theme,
    toggle: () => setThemePreference(theme === 'dark' ? 'light' : 'dark'),
  }
}

/** For non-React code (e.g. the WebGL gradient). Returns an unsubscribe function. */
export const onThemeChange = subscribe
