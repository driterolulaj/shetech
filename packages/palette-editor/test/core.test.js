import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { defaultSchema, defineSchema, paletteShiftCss, paletteToCss, schemaDefaults, validatePalette, withDefaults } from 'palette-editor'

const here = path.dirname(fileURLToPath(import.meta.url))
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'))

test('minimal schema: variables, rgb tokens, lists and themes', () => {
  const schema = defineSchema({
    groups: [{ label: 'A', tokens: { accent: 'Accent', ink2: 'Ink', glass: { label: 'Glass', css: 'both' } } }],
    lists: [{ key: 'mesh', items: 2 }],
  })
  const colors = { accent: '#112233', ink2: '#44556680', glass: '#ffffff', mesh: ['#000000', '#ffffffcc'] }
  const css = paletteToCss(schema, { light: colors, dark: colors })
  assert.equal(
    css,
    ':root{--accent:#112233;--ink-2:#44556680;--glass:#ffffff;--glass-rgb:255 255 255;--mesh-0:#000000;--mesh-1:#ffffff;}' +
      '[data-theme="dark"]{--accent:#112233;--ink-2:#44556680;--glass:#ffffff;--glass-rgb:255 255 255;--mesh-0:#000000;--mesh-1:#ffffff;}',
  )
  assert.match(paletteToCss(schema, { light: colors, dark: colors }, 'x'), /^:root\[data-palette="x"\]\{.*\}:root\[data-palette="x"\]\[data-theme="dark"\]\{/)
  assert.equal(validatePalette(schema, { light: colors, dark: colors }), null)
  assert.match(validatePalette(schema, { light: { ...colors, accent: 'red' }, dark: colors }), /light\.accent/)
  assert.match(validatePalette(schema, { light: { ...colors, mesh: ['#000'] }, dark: colors }), /list of 2/)
})

test('schema errors are explained', () => {
  assert.throws(() => defineSchema({ groups: [] }), /at least one group/)
  assert.throws(() => defineSchema({ groups: [{ label: 'A', tokens: { a: 'A' } }, { label: 'B', tokens: { a: 'A' } }] }), /defined twice/)
  assert.throws(() => defineSchema({ groups: [{ label: 'A', tokens: { 'my-token': 'A' } }] }), /valid token name/)
  assert.throws(() => defineSchema({ groups: [{ label: 'A', tokens: { a: 'A' } }], links: [{ label: 'x', from: 'b' }] }), /unknown token/)
})

test('the built-in schema has every default colour', () => {
  assert.equal(validatePalette(defaultSchema, schemaDefaults(defaultSchema)), null)
  assert.equal(defaultSchema.preset, 'default')
  // Every built-in template is complete on its own
  const dir = path.join(here, '../presets/default/palettes')
  const files = fs.readdirSync(dir)
  assert.equal(files.length, 16)
  for (const f of files) assert.equal(validatePalette(defaultSchema, readJson(path.join(dir, f))), null, f)
})

test('extending the built-in schema: add, override and remove variables', () => {
  const schema = defineSchema({
    extends: defaultSchema,
    groups: [
      { label: 'Brand', tokens: { highlight: { label: 'Highlight', default: '#ffcc00' }, accent: 'Brand colour' } },
      { label: 'Charts', tokens: { chart1: { label: 'Series 1', default: { light: '#2563eb', dark: '#60a5fa' } } } },
    ],
    lists: [{ key: 'stops', label: 'Stops', items: ['A', 'B'], default: ['#000000', '#ffffff'] }],
    remove: ['logoMark', 'logoPrimary', 'logoLight', 'logoDeep'],
  })

  const brand = schema.groups.find((g) => g.label === 'Brand')
  assert.deepEqual(brand.tokens.map((t) => t.key), ['accent', 'accentStrong', 'accentWash', 'secondary', 'highlight'])
  assert.equal(brand.tokens[0].label, 'Brand colour')
  assert.deepEqual(brand.tokens[0].default, defaultSchema.tokens[0].default, 'relabelling keeps the default')
  assert.equal(schema.groups.at(-1).label, 'Charts')
  assert.ok(!schema.groups.some((g) => g.label === 'Logo'), 'a group with every token removed disappears')
  assert.deepEqual(schema.links.map((l) => l.id), ['accent-shades', 'logo-follows-accent'], 'links survive; the editor ignores values for removed tokens')
  assert.equal(schema.preset, 'default')

  const defaults = schemaDefaults(schema)
  assert.equal(validatePalette(schema, defaults), null)
  assert.equal(defaults.light.highlight, '#ffcc00')
  assert.equal(defaults.dark.highlight, '#ffcc00')
  assert.equal(defaults.dark.chart1, '#60a5fa')
  assert.equal(defaults.light.logoMark, undefined)

  const css = paletteToCss(schema, defaults)
  assert.match(css, /--highlight:#ffcc00;/)
  assert.match(css, /--chart-1:#2563eb;/)
  assert.match(css, /--stops-1:#ffffff;/)
  assert.doesNotMatch(css, /--logo-/)

  // The base schema is untouched
  assert.ok(defaultSchema.tokens.some((t) => t.key === 'logoMark'))
  assert.ok(!defaultSchema.tokens.some((t) => t.key === 'highlight'))
  assert.equal(defaultSchema.tokens[0].label, 'Accent')
})

test('an extending schema can opt out of the built-in templates and change themes', () => {
  const schema = defineSchema({ extends: defaultSchema, preset: null, prefix: 'pe-' })
  assert.equal(schema.preset, null)
  assert.match(paletteToCss(schema, schemaDefaults(schema)), /^:root\{--pe-accent:/)
})

// Parity with the She Tech site this package was extracted from (skipped outside that repo)
const web = path.resolve(here, '../../../web')
const original = path.join(web, 'src/lib/palette.js')

test('the built-in schema reproduces the She Tech site exactly', { skip: !fs.existsSync(original) && 'web/ not found' }, async () => {
  const lib = await import(new URL(`file:///${original.replace(/\\/g, '/')}`).href)
  const config = path.join(web, 'src/config')
  const defaults = readJson(path.join(config, 'palette.defaults.json'))
  assert.deepEqual(schemaDefaults(defaultSchema), defaults, 'built-in defaults = the site defaults')

  const palettes = [
    ['palette.json', readJson(path.join(config, 'palette.json'))],
    ...fs.readdirSync(path.join(config, 'palettes')).map((f) => [f, readJson(path.join(config, 'palettes', f))]),
  ]
  for (const [name, raw] of palettes) {
    const palette = withDefaults(defaultSchema, raw, defaults)
    assert.deepEqual(palette, lib.withDefaults(raw, defaults), name)
    assert.equal(validatePalette(defaultSchema, palette), lib.validatePalette(palette), name)
    assert.equal(paletteToCss(defaultSchema, palette), lib.paletteToCss(palette), name)
    assert.equal(paletteToCss(defaultSchema, palette, 'tpl'), lib.paletteToCss(palette, 'tpl'), name)
  }
  assert.equal(paletteShiftCss(defaultSchema, 2), lib.paletteShiftCss(2))
  assert.deepEqual(defaultSchema.tokens.map((t) => t.key), lib.TOKENS)

  // The editor's links derive what the original editor did
  const [accentLink, logoLink] = defaultSchema.links
  assert.equal(accentLink.group, 'Brand')
  assert.equal(logoLink.group, 'Logo')
  for (const value of ['#2a9d8f', '#533afd', '#ff000080']) {
    for (const theme of ['light', 'dark']) {
      const colors = { surface: theme === 'light' ? '#f7f7ed' : '#061312' }
      assert.deepEqual(accentLink.derive({ value, colors, theme }), lib.deriveAccent(value, colors.surface, theme))
    }
    assert.deepEqual(logoLink.derive({ value }), lib.deriveLogo(value))
  }
})
