import { useCallback, useSyncExternalStore } from 'react'

/**
 * The theme the page is showing, read from <html data-theme="…"> (the schema's
 * themeAttribute). Without the attribute, a 'dark' theme follows the system
 * setting and otherwise the first theme is used.
 *
 * Used when <PaletteEditor /> isn't given `theme` / `onThemeChange`. Switching
 * just sets the attribute; pass `onThemeChange` to also store the choice the way
 * your site does.
 */
export function useDocumentTheme(schema) {
  const { themes, themeAttribute } = schema

  const subscribe = useCallback(
    (listener) => {
      const observer = new MutationObserver(listener)
      observer.observe(document.documentElement, { attributes: true, attributeFilter: [themeAttribute] })
      const media = window.matchMedia('(prefers-color-scheme: dark)')
      media.addEventListener('change', listener)
      return () => {
        observer.disconnect()
        media.removeEventListener('change', listener)
      }
    },
    [themeAttribute],
  )

  const read = () => {
    const value = document.documentElement.getAttribute(themeAttribute)
    if (themes.includes(value)) return value
    return themes.includes('dark') && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : themes[0]
  }

  const theme = useSyncExternalStore(subscribe, read, () => themes[0])
  const setTheme = useCallback((next) => document.documentElement.setAttribute(themeAttribute, next), [themeAttribute])
  return [theme, setTheme]
}
