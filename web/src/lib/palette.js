/**
 * Colour scheme.
 *
 *   src/config/palette.json           the live palette: edit freely (by hand or with the editor)
 *   src/config/palette.defaults.json  the original values: never edit; "reset" copies this back
 *
 * The palette is turned into CSS variables (--accent, --ink-2, …) and injected into
 * index.html at build/serve time by the Vite plugin in vite.config.js, so there is
 * no flash of the wrong colours. This module is shared by that plugin (Node) and the
 * browser, so nothing here touches `document` at import time.
 */

/** Editor groups. Keys are palette tokens; values are labels. */
export const PALETTE_GROUPS = [
  {
    label: 'Brand',
    tokens: { accent: 'Accent', accentStrong: 'Accent hover', accentWash: 'Accent wash', secondary: 'Secondary' },
  },
  { label: 'Text', tokens: { ink: 'Headings', ink2: 'Body text', ink3: 'Muted text' } },
  {
    label: 'Surfaces',
    tokens: { surface: 'Page', canvas: 'Tinted panels', glass: 'Glass tint', line: 'Hairlines', lineStrong: 'Borders', lineHover: 'Borders (hover)' },
  },
  {
    label: 'Logo',
    tokens: { logoMark: 'Wordmark & bolt', logoPrimary: 'Logo purple', logoLight: 'Logo light', logoDeep: 'Logo deep' },
  },
  {
    label: 'Status',
    tokens: { success: 'Success', successWash: 'Success wash', warn: 'Warning', warnWash: 'Warning wash', danger: 'Error', dangerWash: 'Error wash' },
  },
]

export const TOKENS = PALETTE_GROUPS.flatMap((g) => Object.keys(g.tokens))
export const MESH_SIZE = 4
export const THEMES = ['light', 'dark']

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

/** Logo purples derived from an accent, so the logo can follow the brand colour. */
export function deriveLogo(accent) {
  const base = toHex6(accent)
  return { logoPrimary: base, logoLight: mixHex(base, '#ffffff', 0.25), logoDeep: mixHex(base, '#000000', 0.4) }
}

/** Fill any tokens missing from a palette with the defaults (e.g. after new tokens are added). */
export function withDefaults(palette, defaults) {
  return Object.fromEntries(THEMES.map((t) => [t, { ...defaults[t], ...palette?.[t] }]))
}

/** Suggested hover and wash shades for a new accent, matched to the theme. */
export function deriveAccent(accent, surface, theme) {
  const base = toHex6(accent)
  return theme === 'dark'
    ? { accentStrong: mixHex(base, '#ffffff', 0.18), accentWash: `${base}24` }
    : { accentStrong: mixHex(base, '#000000', 0.18), accentWash: mixHex(base, toHex6(surface), 0.93) }
}

// ── Palette ↔ CSS ───────────────────────────────────────────────────────────

/** accentStrong → --accent-strong, ink2 → --ink-2 */
const cssVar = (token) => `--${token.replace(/([a-z])([A-Z0-9])/g, '$1-$2').toLowerCase()}`

function themeBlock(colors) {
  const vars = TOKENS.filter((t) => t !== 'glass').map((t) => `${cssVar(t)}:${colors[t]};`)
  const { r, g, b } = parseHex(colors.glass)
  vars.push(`--glass-rgb:${r} ${g} ${b};`)
  colors.mesh.forEach((c, i) => vars.push(`--mesh-${i}:${toHex6(c)};`))
  return vars.join('')
}

/**
 * The palette as CSS variables. With `name`, it's scoped to <html data-palette="name">
 * (used by the randomizer); those rules outrank the unscoped base palette.
 */
export function paletteToCss(palette, name) {
  if (!name) return `:root{${themeBlock(palette.light)}}[data-theme="dark"]{${themeBlock(palette.dark)}}`
  const scope = `:root[data-palette="${name}"]`
  return `${scope}{${themeBlock(palette.light)}}${scope}[data-theme="dark"]{${themeBlock(palette.dark)}}`
}

/**
 * Randomizer settings (src/config/palette.randomizer.json):
 *   onRefresh     pick a random template on every page load
 *   everySeconds  switch to another template every N seconds (0 = off, min 3)
 *   fadeSeconds   how long each switch takes to drift from one palette to the next (0 = quick crossfade)
 *   exclude       template names left out of the mix (e.g. the accessibility ones)
 */
export const RANDOMIZER_DEFAULTS = { onRefresh: false, everySeconds: 0, fadeSeconds: 4, exclude: [] }

/** Returns an error message, or null when the randomizer settings are valid. */
export function validateRandomizer(settings) {
  if (typeof settings?.onRefresh !== 'boolean') return '"onRefresh" must be true or false.'
  const s = settings.everySeconds
  if (!Number.isInteger(s) || (s !== 0 && (s < 3 || s > 3600))) return '"everySeconds" must be 0 (off) or 3–3600.'
  const f = settings.fadeSeconds
  if (typeof f !== 'number' || !(f >= 0 && f <= 60)) return '"fadeSeconds" must be between 0 and 60.'
  if (!Array.isArray(settings.exclude) || !settings.exclude.every((n) => typeof n === 'string')) return '"exclude" must be a list of template names.'
  return null
}

/** Every palette CSS variable that holds a single colour (all but --glass-rgb, which is a triplet). */
const COLOR_VARS = [...TOKENS.filter((t) => t !== 'glass').map(cssVar), ...Array.from({ length: MESH_SIZE }, (_, i) => `--mesh-${i}`)]

/**
 * CSS that lets the palette drift instead of jump: registering the colour variables
 * as <color> makes them animatable, and <html class="palette-shifting"> (set by the
 * randomizer only while it switches) gives them a transition. Nothing else animates
 * them, so the theme toggle and the colour editor stay instant.
 */
export function paletteShiftCss(seconds) {
  const properties = COLOR_VARS.map((v) => `@property ${v}{syntax:'<color>';inherits:true;initial-value:transparent}`).join('')
  return `${properties}:root.palette-shifting{transition-property:${COLOR_VARS.join(',')};transition-duration:${seconds}s;transition-timing-function:cubic-bezier(0.45,0,0.55,1)}`
}

/**
 * The randomizer's part of a page's <head>: every template in the mix as CSS scoped to
 * <html data-palette="…">, and a tiny script that picks one before the first paint (no
 * flash of the base colours). The timed changes are done by src/lib/paletteRandomizer.js,
 * which reads `window.__paletteRandomizer`. Null when the randomizer is off.
 * `templates` are { name, palette }. Used by the build (vite.config.js) and the API (/api/palette.js).
 */
export function randomizerHead(templates, { onRefresh, everySeconds, fadeSeconds, exclude }) {
  if (!onRefresh && !everySeconds) return null
  const pool = templates.filter((t) => !exclude.includes(t.name))
  if (pool.length < 2) return null
  const config = { names: pool.map((t) => t.name), onRefresh, everySeconds, fadeSeconds }
  return {
    // The drift CSS is only needed when the palette changes while you watch
    css: (everySeconds && fadeSeconds ? paletteShiftCss(fadeSeconds) : '') + pool.map((t) => paletteToCss(t.palette, t.name)).join(''),
    // Avoids repeating the previous visit's palette when there's a choice
    script: `(function(){try{var c=${JSON.stringify(config)};window.__paletteRandomizer=c;if(!c.onRefresh)return;var k='palette:last',l=null;try{l=localStorage.getItem(k)}catch(e){}var n=c.names.filter(function(x){return x!==l});var p=n[Math.floor(Math.random()*n.length)];document.documentElement.setAttribute('data-palette',p);try{localStorage.setItem(k,p)}catch(e){}}catch(e){}})()`,
  }
}

/** Returns an error message, or null when the palette is complete and valid. */
export function validatePalette(palette) {
  for (const theme of THEMES) {
    const colors = palette?.[theme]
    if (!colors) return `Missing "${theme}" colours.`
    for (const token of TOKENS) {
      if (!isHexColor(colors[token])) return `"${theme}.${token}" must be a hex colour like #533afd (got ${JSON.stringify(colors[token])}).`
    }
    if (!Array.isArray(colors.mesh) || colors.mesh.length !== MESH_SIZE || !colors.mesh.every(isHexColor)) {
      return `"${theme}.mesh" must be a list of ${MESH_SIZE} hex colours.`
    }
  }
  return null
}

// ── Browser ─────────────────────────────────────────────────────────────────

const EVENT = 'palette:change'

/** Swap the live palette (used by the editor's preview). */
export function applyPalette(palette) {
  let style = document.getElementById('palette')
  if (!style) {
    style = Object.assign(document.createElement('style'), { id: 'palette' })
    document.head.prepend(style)
  }
  style.textContent = paletteToCss(palette)
  notifyPaletteChange()
}

/** Tell listeners (e.g. the WebGL backgrounds) that the colours on screen changed. */
export function notifyPaletteChange() {
  window.dispatchEvent(new Event(EVENT))
}

export function onPaletteChange(listener) {
  window.addEventListener(EVENT, listener)
  return () => window.removeEventListener(EVENT, listener)
}

/**
 * '#abcdef', 'rgb(1 2 3)', 'rgba(1, 2, 3, 1)' or 'color(srgb 0.1 0.2 0.3)' → '#rrggbb'.
 * Registered colour variables (see paletteShiftCss) compute to rgb() rather than hex.
 */
function cssColorToHex(value) {
  if (isHexColor(value)) return toHex6(value)
  const n = value.match(/[\d.]+/g)?.map(Number)
  if (!n || n.length < 3) return null
  const scale = value.startsWith('color(') ? 255 : 1
  return toHex({ r: n[0] * scale, g: n[1] * scale, b: n[2] * scale })
}

/** The gradient colours currently on screen (mid-way through a palette shift, too). */
export function readMeshColors() {
  const styles = getComputedStyle(document.documentElement)
  return Array.from({ length: MESH_SIZE }, (_, i) => cssColorToHex(styles.getPropertyValue(`--mesh-${i}`).trim()) || '#533afd')
}

const SHIFT_EVENT = 'palette:shift'

/** A gradual palette shift has started and lasts `duration` ms; canvases should follow it. */
export function notifyPaletteShift(duration) {
  window.dispatchEvent(new CustomEvent(SHIFT_EVENT, { detail: { duration } }))
}

export function onPaletteShift(listener) {
  const handler = (e) => listener(e.detail.duration)
  window.addEventListener(SHIFT_EVENT, handler)
  return () => window.removeEventListener(SHIFT_EVENT, handler)
}
