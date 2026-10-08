import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { paletteShiftCss, paletteToCss, RANDOMIZER_DEFAULTS, validatePalette, validateRandomizer, withDefaults } from './src/lib/palette.js'

const root = path.dirname(fileURLToPath(import.meta.url))
const PALETTE = path.join(root, 'src/config/palette.json')
const DEFAULTS = path.join(root, 'src/config/palette.defaults.json')
const TEMPLATES = path.join(root, 'src/config/palettes')
const RANDOMIZER = path.join(root, 'src/config/palette.randomizer.json')

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'))
/** The saved palette, with any tokens it doesn't have yet filled from the defaults */
const readPalette = () => withDefaults(readJson(PALETTE), readJson(DEFAULTS))
const serialize = (palette) => `${JSON.stringify(palette, null, 2)}\n`

/** Template names are file names: lowercase letters, digits and dashes. */
const TEMPLATE_NAME = /^[a-z0-9][a-z0-9-]{0,39}$/
const templateFile = (name) => path.join(TEMPLATES, `${name}.json`)

/** Every saved template, A–Z, with missing tokens filled from the defaults. Broken files are skipped. */
function readTemplates() {
  if (!fs.existsSync(TEMPLATES)) return []
  const defaults = readJson(DEFAULTS)
  return fs
    .readdirSync(TEMPLATES)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .flatMap((f) => {
      try {
        const palette = withDefaults(readJson(path.join(TEMPLATES, f)), defaults)
        return validatePalette(palette) ? [] : [{ name: f.slice(0, -5), palette }]
      } catch {
        return []
      }
    })
}

function readRandomizer() {
  try {
    const settings = { ...RANDOMIZER_DEFAULTS, ...readJson(RANDOMIZER) }
    return validateRandomizer(settings) ? RANDOMIZER_DEFAULTS : settings
  } catch {
    return RANDOMIZER_DEFAULTS
  }
}

/**
 * Randomizer tags for a page: every template in the mix as CSS scoped to
 * <html data-palette="…">, plus a tiny inline script that picks one before the
 * first paint (no flash of the base colours). The timed changes are done by
 * src/lib/paletteRandomizer.js, which reads `window.__paletteRandomizer`.
 */
function randomizerTags() {
  const { onRefresh, everySeconds, fadeSeconds, exclude } = readRandomizer()
  if (!onRefresh && !everySeconds) return []
  const pool = readTemplates().filter((t) => !exclude.includes(t.name))
  if (pool.length < 2) return []
  const config = { names: pool.map((t) => t.name), onRefresh, everySeconds, fadeSeconds }
  // Avoids repeating the previous visit's palette when there's a choice
  const script = `(function(){try{var c=${JSON.stringify(config)};window.__paletteRandomizer=c;if(!c.onRefresh)return;var k='palette:last',l=null;try{l=localStorage.getItem(k)}catch(e){}var n=c.names.filter(function(x){return x!==l});var p=n[Math.floor(Math.random()*n.length)];document.documentElement.setAttribute('data-palette',p);try{localStorage.setItem(k,p)}catch(e){}}catch(e){}})()`
  return [
    {
      tag: 'style',
      attrs: { id: 'palette-templates' },
      // The drift CSS is only needed when the palette changes while you watch
      children: (everySeconds && fadeSeconds ? paletteShiftCss(fadeSeconds) : '') + pool.map((t) => paletteToCss(t.palette, t.name)).join(''),
      injectTo: 'head',
    },
    { tag: 'script', children: script, injectTo: 'head' },
  ]
}

const readBody = (req) =>
  new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (chunk) => (data += chunk))
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })

/**
 * Colour scheme plugin.
 *  - Injects src/config/palette.json as CSS variables into index.html (dev and build),
 *    so pages paint in the right colours immediately.
 *  - Dev only: serves /__palette for the in-browser palette editor
 *  - Adds the palette randomizer to the site (not /admin) when it's switched on.
 *      GET                     → { palette, defaults, templates: [{ name, palette }], randomizer }
 *      PUT /randomizer         → save the randomizer settings (the page then reloads)
 *      PUT                     → save the posted palette to palette.json
 *      POST /reset             → copy palette.defaults.json over palette.json
 *      PUT /templates/<name>   → save the posted palette as src/config/palettes/<name>.json
 *      DELETE /templates/<name>
 *  - Reloads the page when palette.json is edited by hand.
 */
function palettePlugin() {
  let lastWritten = null

  return {
    name: 'shetech-palette',

    transformIndexHtml(_html, ctx) {
      const palette = readPalette()
      const error = validatePalette(palette)
      if (error) throw new Error(`src/config/palette.json: ${error}`)
      const isAdmin = /admin\.html$/.test(ctx.filename ?? ctx.path ?? '')
      return [
        { tag: 'style', attrs: { id: 'palette' }, children: paletteToCss(palette), injectTo: 'head' },
        ...(isAdmin ? [] : randomizerTags()),
      ]
    },

    configureServer(server) {
      server.watcher.add([PALETTE, RANDOMIZER])
      server.watcher.on('change', (file) => {
        // Randomizer settings change the page's <head>, so always reload
        if (path.resolve(file) === RANDOMIZER) return server.ws.send({ type: 'full-reload' })
        if (path.resolve(file) !== PALETTE) return
        // Saves from the editor are already on screen; only reload for hand edits
        if (fs.readFileSync(PALETTE, 'utf8') === lastWritten) return
        server.ws.send({ type: 'full-reload' })
      })

      server.middlewares.use('/__palette', async (req, res) => {
        const send = (status, body) => {
          res.statusCode = status
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(body))
        }
        const write = (palette) => {
          lastWritten = serialize(palette)
          fs.writeFileSync(PALETTE, lastWritten)
        }

        try {
          if (req.method === 'GET') {
            return send(200, { palette: readPalette(), defaults: readJson(DEFAULTS), templates: readTemplates(), randomizer: readRandomizer() })
          }

          if (req.url === '/randomizer' && req.method === 'PUT') {
            const settings = JSON.parse(await readBody(req))
            const error = validateRandomizer(settings)
            if (error) return send(400, { error })
            const { onRefresh, everySeconds, fadeSeconds, exclude } = settings
            fs.writeFileSync(RANDOMIZER, serialize({ onRefresh, everySeconds, fadeSeconds, exclude: [...new Set(exclude)].sort() }))
            return send(200, { randomizer: readRandomizer() })
          }

          const template = req.url.match(/^\/templates\/([^/?]+)$/)
          if (template) {
            const name = decodeURIComponent(template[1])
            if (!TEMPLATE_NAME.test(name)) return send(400, { error: 'Use lowercase letters, numbers and dashes for the name.' })
            if (req.method === 'PUT') {
              const palette = JSON.parse(await readBody(req))
              const error = validatePalette(palette)
              if (error) return send(400, { error })
              fs.mkdirSync(TEMPLATES, { recursive: true })
              fs.writeFileSync(templateFile(name), serialize(palette))
              return send(200, { templates: readTemplates() })
            }
            if (req.method === 'DELETE') {
              if (fs.existsSync(templateFile(name))) fs.unlinkSync(templateFile(name))
              return send(200, { templates: readTemplates() })
            }
          }

          if (req.method === 'PUT') {
            const palette = JSON.parse(await readBody(req))
            const error = validatePalette(palette)
            if (error) return send(400, { error })
            write(palette)
            return send(200, { palette })
          }

          if (req.method === 'POST' && req.url === '/reset') {
            // Byte-for-byte copy of the defaults file (same as `npm run palette:reset`)
            lastWritten = fs.readFileSync(DEFAULTS, 'utf8')
            fs.writeFileSync(PALETTE, lastWritten)
            return send(200, { palette: JSON.parse(lastWritten) })
          }

          send(405, { error: 'Method not allowed' })
        } catch (err) {
          send(500, { error: err.message })
        }
      })
    },
  }
}

/** Serves /admin as admin.html in `npm run dev` and `npm run preview` (server/index.js does the same in production). */
function adminPagePlugin() {
  // Must return nothing: Vite treats a returned function as a post-middleware hook
  const mount = (server) => {
    server.middlewares.use((req, _res, next) => {
      if (/^\/admin\/?(\?|$)/.test(req.url)) req.url = req.url.replace(/^\/admin\/?/, '/admin.html')
      next()
    })
  }
  return { name: 'shetech-admin-page', configureServer: mount, configurePreviewServer: mount }
}

/** The API service (../api) during development. Override with API_URL. */
const apiProxy = { '/api': { target: process.env.API_URL || 'http://localhost:4000', xfwd: true } }

export default defineConfig({
  plugins: [react(), tailwindcss(), palettePlugin(), adminPagePlugin()],
  server: { proxy: apiProxy },
  preview: { proxy: apiProxy },
  build: {
    rolldownOptions: {
      input: { main: path.join(root, 'index.html'), admin: path.join(root, 'admin.html') },
    },
  },
})
