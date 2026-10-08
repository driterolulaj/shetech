// ── Colour helpers ──────────────────────────────────────────────────────────

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i

export const isHexColor = (value) => typeof value === 'string' && HEX.test(value)

/** '#abc', '#abcd', '#aabbcc', '#aabbccdd' → { r, g, b, a } (a in 0–1) */
export function parseHex(hex) {
  let h = hex.slice(1)
  if (h.length <= 4) h = [...h].map((c) => c + c).join('')
  const n = (i) => parseInt(h.slice(i, i + 2), 16)
  return { r: n(0), g: n(2), b: n(4), a: h.length === 8 ? Math.round((n(6) / 255) * 100) / 100 : 1 }
}

const byte = (v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')

/** { r, g, b, a } → '#rrggbb' (opaque) or '#rrggbbaa' */
export const toHex = ({ r, g, b, a = 1 }) => `#${byte(r)}${byte(g)}${byte(b)}${a < 1 ? byte(a * 255) : ''}`

export const toHex6 = (hex) => toHex({ ...parseHex(hex), a: 1 })

/** Mix two colours: t = 0 → a, t = 1 → b (alpha ignored). */
export function mixHex(a, b, t) {
  const x = parseHex(a)
  const y = parseHex(b)
  return toHex({ r: x.r + (y.r - x.r) * t, g: x.g + (y.g - x.g) * t, b: x.b + (y.b - x.b) * t })
}

/** Lighter, base and deeper shades of a colour, e.g. for a logo that follows the brand colour. */
export function deriveShades(color) {
  const base = toHex6(color)
  return { light: mixHex(base, '#ffffff', 0.25), base, deep: mixHex(base, '#000000', 0.4) }
}

/**
 * Suggested hover and wash shades for an accent, matched to the theme.
 * Dark themes get a lighter hover and a translucent wash; light themes a darker
 * hover and a wash mixed into the page colour.
 */
export function deriveAccent(accent, surface, theme) {
  const base = toHex6(accent)
  return theme === 'dark'
    ? { strong: mixHex(base, '#ffffff', 0.18), wash: `${base}24` }
    : { strong: mixHex(base, '#000000', 0.18), wash: mixHex(base, toHex6(surface), 0.93) }
}

/**
 * '#abcdef', 'rgb(1 2 3)', 'rgba(1, 2, 3, 1)' or 'color(srgb 0.1 0.2 0.3)' → '#rrggbb'.
 * Registered colour variables (see paletteShiftCss) compute to rgb() rather than hex.
 */
export function cssColorToHex(value) {
  if (isHexColor(value)) return toHex6(value)
  const n = value.match(/[\d.]+/g)?.map(Number)
  if (!n || n.length < 3) return null
  const scale = value.startsWith('color(') ? 255 : 1
  return toHex({ r: n[0] * scale, g: n[1] * scale, b: n[2] * scale })
}
