import { cssColorToHex } from './color.js'
import { paletteToCss } from './css.js'
import { cssVar, defineSchema } from './schema.js'

// Browser-only helpers. Nothing here runs at import time, so the core stays SSR-safe.

const EVENT = 'palette:change'
const SHIFT_EVENT = 'palette:shift'

/** Swap the live palette (used by the editor's preview). Writes <style id="palette">. */
export function applyPalette(schema, palette, { styleId = 'palette' } = {}) {
  let style = document.getElementById(styleId)
  if (!style) {
    style = Object.assign(document.createElement('style'), { id: styleId })
    document.head.prepend(style)
  }
  style.textContent = paletteToCss(schema, palette)
  notifyPaletteChange()
}

/** Tell listeners (e.g. canvas/WebGL backgrounds) that the colours on screen changed. */
export function notifyPaletteChange() {
  window.dispatchEvent(new Event(EVENT))
}

/** Returns an unsubscribe function. */
export function onPaletteChange(listener) {
  window.addEventListener(EVENT, listener)
  return () => window.removeEventListener(EVENT, listener)
}

/** A gradual palette shift has started and lasts `duration` ms; canvases should follow it. */
export function notifyPaletteShift(duration) {
  window.dispatchEvent(new CustomEvent(SHIFT_EVENT, { detail: { duration } }))
}

/** Returns an unsubscribe function. The listener gets the shift's duration in ms. */
export function onPaletteShift(listener) {
  const handler = (e) => listener(e.detail.duration)
  window.addEventListener(SHIFT_EVENT, handler)
  return () => window.removeEventListener(SHIFT_EVENT, handler)
}

/** A token's colour as currently on screen ('#rrggbb'), mid-way through a palette shift too. */
export function readColor(schema, key, fallback = null) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(cssVar(defineSchema(schema), key)).trim()
  return (value && cssColorToHex(value)) || fallback
}

/** A list's colours as currently on screen, e.g. for a WebGL gradient. */
export function readListColors(schema, key, fallback = '#000000') {
  schema = defineSchema(schema)
  const list = schema.lists.find((l) => l.key === key)
  if (!list) throw new Error(`palette-editor: no list called "${key}" in the schema.`)
  const styles = getComputedStyle(document.documentElement)
  return list.items.map((_, i) => cssColorToHex(styles.getPropertyValue(`${cssVar(schema, key)}-${i}`).trim()) || fallback)
}
