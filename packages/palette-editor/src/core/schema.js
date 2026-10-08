/**
 * A schema describes a project's colours: which tokens exist, their default
 * values, how the editor groups and labels them, and how they become CSS
 * variables. Pass the same schema to the Vite plugin and to <PaletteEditor />
 * (both use the built-in default schema when you pass none).
 *
 * Start from the built-in palette and add your own variables:
 *
 *   import { defaultSchema, defineSchema } from 'palette-editor'
 *
 *   export default defineSchema({
 *     extends: defaultSchema,
 *     groups: [
 *       { label: 'Brand', tokens: { highlight: { label: 'Highlight', default: '#ffcc00' } } },   // added to "Brand"
 *       { label: 'Charts', tokens: { chart1: { label: 'Series 1', default: { light: '#2563eb', dark: '#60a5fa' } } } },
 *     ],
 *     remove: ['logoMark', 'logoPrimary', 'logoLight', 'logoDeep'],   // tokens you don't need
 *   })
 *
 * …or describe everything yourself:
 *
 *   defineSchema({
 *     themes: ['light', 'dark'],                  // default; the first is the base (:root)
 *     groups: [
 *       { label: 'Brand', tokens: { accent: { label: 'Accent', default: '#533afd' } } },
 *       { label: 'Surfaces', tokens: {
 *           surface: 'Page',                              // a label only: give its colour in palette.defaults.json
 *           glass: { label: 'Glass tint', css: 'rgb' },   // → --glass-rgb: 255 255 255
 *           border: { label: 'Border', alpha: false },    // no opacity field
 *       } },
 *     ],
 *     accent: 'accent',                           // brand colour (default: the first token)
 *     lists: [{ key: 'mesh', label: 'Hero gradient', items: ['Base', 'Top'], default: ['#000000', '#ffffff'] }],  // → --mesh-0, --mesh-1
 *     links: [{ group: 'Brand', label: 'Derive hover from accent', from: 'accent',
 *               derive: ({ value }) => ({ accentStrong: mixHex(value, '#000', 0.18) }) }],
 *   })
 *
 * A `default` is one colour for every theme, or { light: …, dark: … } per theme.
 * Token keys become variables: accentStrong → --accent-strong, ink2 → --ink-2.
 */
const NORMALIZED = Symbol.for('palette-editor.schema')
const KEY = /^[a-zA-Z][a-zA-Z0-9]*$/

const finishToken = (key, t) => ({ key, label: t.label ?? key, alpha: t.alpha ?? true, css: t.css ?? 'color', default: t.default })

function finishList(key, l) {
  const items = typeof l.items === 'number' ? Array.from({ length: l.items }, (_, i) => `Colour ${i + 1}`) : l.items
  return { key, label: l.label ?? key, items, alpha: l.alpha ?? false, default: l.default }
}

export function defineSchema(input) {
  if (input?.[NORMALIZED]) return input
  const base = input?.extends ? defineSchema(input.extends) : null
  if (!base && !input?.groups?.length) throw new Error('palette-editor: the schema needs at least one group of tokens.')

  const remove = new Set(input.remove ?? [])
  const seen = new Set() // keys defined by this input, to catch typos like the same token twice
  const claim = (key) => {
    if (!KEY.test(key)) throw new Error(`palette-editor: "${key}" isn't a valid token name (letters and digits, starting with a letter).`)
    if (seen.has(key)) throw new Error(`palette-editor: the token "${key}" is defined twice.`)
    seen.add(key)
  }

  // Tokens: a key the base already has is updated in place (e.g. a new label or default); new keys join their group
  const groups = (base?.groups ?? []).map((g) => ({ label: g.label, tokens: [...g.tokens] }))
  for (const group of input.groups ?? []) {
    let target = groups.find((g) => g.label === group.label)
    if (!target) groups.push((target = { label: group.label, tokens: [] }))
    for (const [key, value] of Object.entries(group.tokens ?? {})) {
      claim(key)
      const raw = typeof value === 'string' ? { label: value } : value
      const home = groups.find((g) => g.tokens.some((t) => t.key === key))
      if (home) home.tokens = home.tokens.map((t) => (t.key === key ? finishToken(key, { ...t, ...raw }) : t))
      else target.tokens.push(finishToken(key, raw))
    }
  }
  for (const g of groups) g.tokens = g.tokens.filter((t) => !remove.has(t.key))
  const keptGroups = groups.filter((g) => g.tokens.length)
  const tokens = keptGroups.flatMap((g) => g.tokens)

  const lists = (base?.lists ?? []).map((l) => ({ ...l }))
  for (const list of input.lists ?? []) {
    claim(list.key)
    const i = lists.findIndex((l) => l.key === list.key)
    if (i === -1) lists.push(finishList(list.key, list))
    else lists[i] = finishList(list.key, { ...lists[i], ...list })
  }
  const keptLists = lists.filter((l) => !remove.has(l.key))
  for (const list of keptLists) {
    if (!list.items?.length) throw new Error(`palette-editor: the list "${list.key}" needs at least one item.`)
  }

  const keys = [...tokens.map((t) => t.key), ...keptLists.map((l) => l.key)]
  for (const key of keys) {
    if (keys.indexOf(key) !== keys.lastIndexOf(key)) throw new Error(`palette-editor: "${key}" is both a token and a list.`)
  }
  if (!tokens.length) throw new Error('palette-editor: the schema has no tokens left.')

  const groupOf = (key) => keptGroups.find((g) => g.tokens.some((t) => t.key === key))?.label ?? keptLists.find((l) => l.key === key)?.label
  const links = (base?.links ?? []).filter((l) => !(input.links ?? []).some((n) => n.id && n.id === l.id))
  for (const link of input.links ?? []) {
    if (!keys.includes(link.from)) throw new Error(`palette-editor: link "${link.label}" follows an unknown token "${link.from}".`)
    links.push({
      id: link.id ?? `${link.from}:${link.label}`,
      label: link.label,
      from: link.from,
      group: link.group ?? groupOf(link.from),
      derive: link.derive,
      enabled: link.enabled ?? true,
      applyOnEnable: link.applyOnEnable ?? false,
    })
  }

  const pick = (name, fallback) => (name in input ? input[name] : base ? base[name] : fallback)
  const has = (key) => keys.includes(key)
  const swatches = (input.swatches ?? base?.swatches)?.filter(has)

  return Object.freeze({
    [NORMALIZED]: true,
    themes: pick('themes', ['light', 'dark']),
    themeAttribute: pick('themeAttribute', 'data-theme'),
    prefix: pick('prefix', ''),
    // Built-in templates offered alongside the project's own (presets/<name>/palettes); null = none
    preset: pick('preset', null),
    groups: keptGroups,
    tokens,
    lists: keptLists,
    links: links.filter((l) => has(l.from)),
    // The brand colour: the dot beside each template in the randomizer's mix
    accent: [input.accent, base?.accent].find((k) => k && has(k)) ?? tokens[0].key,
    // Shown as a strip on each template: token keys, or list keys (all of the list's colours)
    swatches: swatches?.length ? swatches : [...keptGroups.map((g) => g.tokens[0].key), ...keptLists.map((l) => l.key)],
  })
}

/** accentStrong → --accent-strong, ink2 → --ink-2 (with the schema's prefix, if any) */
export const cssVar = (schema, key) => `--${schema.prefix}${key.replace(/([a-z])([A-Z0-9])/g, '$1-$2').toLowerCase()}`

const forTheme = (value, theme) => (value == null || typeof value === 'string' || Array.isArray(value) ? value : value[theme])

/** The palette made of the schema's `default` values (tokens without one are left out). */
export function schemaDefaults(schema) {
  schema = defineSchema(schema)
  return Object.fromEntries(
    schema.themes.map((theme) => {
      const colors = {}
      for (const item of [...schema.tokens, ...schema.lists]) {
        const value = forTheme(item.default, theme)
        if (value !== undefined) colors[item.key] = Array.isArray(value) ? [...value] : value
      }
      return [theme, colors]
    }),
  )
}
