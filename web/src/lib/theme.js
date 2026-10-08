import { useSyncExternalStore } from 'react'

/**
 * Light/dark theme: light unless the visitor picked dark with the toggle (their
 * choice is remembered). The theme lives on <html data-theme>; index.html sets it
 * before first paint so there's no flash, and this module keeps it in sync.
 */
const KEY = 'theme'
const listeners = new Set()

const readPreference = () => {
  try {
    return localStorage.getItem(KEY) === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

let preference = readPreference()

const resolve = () => preference

function apply() {
  document.documentElement.dataset.theme = resolve()
  listeners.forEach((listener) => listener())
}

/** Switch theme, cross-fading the page where the View Transitions API exists. */
export function setThemePreference(next) {
  preference = next
  try {
    localStorage.setItem(KEY, next)
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
