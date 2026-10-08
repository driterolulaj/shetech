import { isHexColor, parseHex, toHex6 } from './color.js'
import { cssVar, defineSchema } from './schema.js'

/**
 * A palette is one object per theme, each with every token's hex colour and
 * every list's colours:
 *
 *   { light: { accent: '#533afd', …, mesh: ['#…', '#…'] }, dark: { … } }
 */

function themeBlock(schema, colors) {
  const vars = []
  for (const t of schema.tokens) if (t.css !== 'rgb') vars.push(`${cssVar(schema, t.key)}:${colors[t.key]};`)
  for (const t of schema.tokens) {
    if (t.css === 'color') continue
    const { r, g, b } = parseHex(colors[t.key])
    vars.push(`${cssVar(schema, t.key)}-rgb:${r} ${g} ${b};`)
  }
  for (const list of schema.lists) {
    colors[list.key].forEach((c, i) => vars.push(`${cssVar(schema, list.key)}-${i}:${list.alpha ? c : toHex6(c)};`))
  }
  return vars.join('')
}

/**
 * The palette as CSS variables: the first theme on :root, the others on
 * [data-theme="…"]. With `name`, it's scoped to <html data-palette="name">
 * (used by the randomizer); those rules outrank the unscoped base palette.
 */
export function paletteToCss(schema, palette, name) {
  schema = defineSchema(schema)
  const [base, ...others] = schema.themes
  const scope = name ? `:root[data-palette="${name}"]` : ':root'
  const nested = name ? scope : ''
  return [
    `${scope}{${themeBlock(schema, palette[base])}}`,
    ...others.map((t) => `${nested}[${schema.themeAttribute}="${t}"]{${themeBlock(schema, palette[t])}}`),
  ].join('')
}

/** Fill any tokens missing from a palette with the defaults (e.g. after new tokens are added). */
export function withDefaults(schema, palette, defaults) {
  schema = defineSchema(schema)
  return Object.fromEntries(schema.themes.map((t) => [t, { ...defaults?.[t], ...palette?.[t] }]))
}

/** Returns an error message, or null when the palette is complete and valid. */
export function validatePalette(schema, palette) {
  schema = defineSchema(schema)
  for (const theme of schema.themes) {
    const colors = palette?.[theme]
    if (!colors) return `Missing "${theme}" colours.`
    for (const { key } of schema.tokens) {
      if (!isHexColor(colors[key])) return `"${theme}.${key}" must be a hex colour like #533afd (got ${JSON.stringify(colors[key])}).`
    }
    for (const { key, items } of schema.lists) {
      if (!Array.isArray(colors[key]) || colors[key].length !== items.length || !colors[key].every(isHexColor)) {
        return `"${theme}.${key}" must be a list of ${items.length} hex colours.`
      }
    }
  }
  return null
}

/** Every palette CSS variable that holds a single colour (all but the -rgb triplets). */
function colorVars(schema) {
  return [
    ...schema.tokens.filter((t) => t.css !== 'rgb').map((t) => cssVar(schema, t.key)),
    ...schema.lists.flatMap((l) => l.items.map((_, i) => `${cssVar(schema, l.key)}-${i}`)),
  ]
}

/**
 * CSS that lets the palette drift instead of jump: registering the colour variables
 * as <color> makes them animatable, and <html class="palette-shifting"> (set by the
 * randomizer only while it switches) gives them a transition. Nothing else animates
 * them, so theme toggles and the colour editor stay instant.
 */
export function paletteShiftCss(schema, seconds) {
  const vars = colorVars(defineSchema(schema))
  const properties = vars.map((v) => `@property ${v}{syntax:'<color>';inherits:true;initial-value:transparent}`).join('')
  return `${properties}:root.palette-shifting{transition-property:${vars.join(',')};transition-duration:${seconds}s;transition-timing-function:cubic-bezier(0.45,0,0.55,1)}`
}

// ── Randomizer settings ─────────────────────────────────────────────────────

/**
 * Randomizer settings (palette.randomizer.json):
 *   onRefresh     pick a random template on every page load
 *   everySeconds  switch to another template every N seconds (0 = off, min 3)
 *   fadeSeconds   how long each switch takes to drift from one palette to the next (0 = quick crossfade)
 *   exclude       template names left out of the mix (e.g. accessibility ones)
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
