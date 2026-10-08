import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { Readable } from 'node:stream'
import { test } from 'node:test'
import { defaultSchema, defineSchema } from 'palette-editor'
import palettePlugin from 'palette-editor/vite'

/** Runs the plugin's dev API against a temporary project folder, without starting Vite. */
function setup(options = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'palette-editor-'))
  const plugin = palettePlugin(options)
  plugin.configResolved({ root })
  let handler
  plugin.configureServer({ watcher: { add() {}, on() {} }, ws: { send() {} }, middlewares: { use: (_path, fn) => (handler = fn) } })

  const call = (method, url = '/', body) =>
    new Promise((resolve) => {
      const req = Object.assign(Readable.from(body ? [JSON.stringify(body)] : []), { method, url })
      const res = { statusCode: 200, setHeader() {}, end: (text) => resolve({ status: res.statusCode, body: JSON.parse(text) }) }
      handler(req, res)
    })
  const html = () => plugin.transformIndexHtml('', { filename: path.join(root, 'index.html') })
  const file = (p) => path.join(root, 'src/config', p)
  return { root, call, html, file }
}

test('zero config: the built-in palette, defaults and templates', async () => {
  const { call, html, file } = setup()
  const { body } = await call('GET')
  assert.equal(body.palette.light.accent, '#2a9d8f')
  assert.deepEqual(body.palette, body.defaults)
  assert.equal(body.templates.length, 16)
  assert.ok(body.templates.every((t) => t.builtin))
  assert.ok(body.randomizer.exclude.includes('high-contrast'), 'the preset suggests leaving accessibility templates out of the mix')

  const [style] = html()
  assert.match(style.children, /^:root\{--accent:#2a9d8f;/)

  // Built-ins can't be deleted, but saving one under the same name replaces it with your copy
  assert.equal((await call('DELETE', '/templates/purple')).status, 400)
  const purple = body.templates.find((t) => t.name === 'purple')
  const saved = await call('PUT', '/templates/purple', { ...purple.palette, light: { ...purple.palette.light, accent: '#000000' } })
  const mine = saved.body.templates.find((t) => t.name === 'purple')
  assert.equal(mine.builtin, false)
  assert.equal(mine.palette.light.accent, '#000000')
  assert.equal(saved.body.templates.length, 16)
  assert.equal((await call('DELETE', '/templates/purple')).status, 200)
  assert.equal((await call('GET')).body.templates.find((t) => t.name === 'purple').builtin, true, 'deleting your copy brings the built-in back')

  // Reset without a defaults file writes the built-in defaults
  await call('PUT', '/', { ...body.palette, light: { ...body.palette.light, accent: '#123456' } })
  assert.equal(JSON.parse(fs.readFileSync(file('palette.json'), 'utf8')).light.accent, '#123456')
  await call('POST', '/reset')
  assert.deepEqual(JSON.parse(fs.readFileSync(file('palette.json'), 'utf8')), body.defaults)
})

test('added variables get their schema defaults everywhere, templates included', async () => {
  const schema = defineSchema({
    extends: defaultSchema,
    groups: [{ label: 'Charts', tokens: { chart1: { label: 'Series 1', default: { light: '#2563eb', dark: '#60a5fa' } } } }],
  })
  const { call, html, file } = setup({ schema })
  // An existing palette.json from before the new variable was added
  fs.mkdirSync(path.dirname(file('palette.json')), { recursive: true })
  fs.writeFileSync(file('palette.json'), JSON.stringify({ light: { accent: '#ff0000' }, dark: {} }))

  const { body } = await call('GET')
  assert.equal(body.palette.light.accent, '#ff0000')
  assert.equal(body.palette.light.chart1, '#2563eb')
  assert.equal(body.palette.dark.chart1, '#60a5fa')
  assert.ok(body.templates.every((t) => t.palette.dark.chart1 === '#60a5fa'))
  assert.match(html()[0].children, /--chart-1:#2563eb;/)

  // A project defaults file overrides the schema's defaults
  fs.writeFileSync(file('palette.defaults.json'), JSON.stringify({ light: { chart1: '#111111' } }))
  assert.equal((await call('GET')).body.defaults.light.chart1, '#111111')
})

test('a variable with no default anywhere is a clear error', () => {
  const schema = defineSchema({ extends: defaultSchema, groups: [{ label: 'Brand', tokens: { highlight: 'Highlight' } }] })
  const { html } = setup({ schema })
  assert.throws(html, /no default colour for "light\.highlight"\. Give the token a `default` in your schema/)
})

test('builtinTemplates: false hides the built-in templates', async () => {
  const { call } = setup({ builtinTemplates: false })
  assert.equal((await call('GET')).body.templates.length, 0)
})
