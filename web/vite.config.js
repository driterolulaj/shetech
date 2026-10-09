import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { paletteToCss, RANDOMIZER_DEFAULTS, randomizerHead, validatePalette, validateRandomizer, withDefaults } from './src/lib/palette.js'

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

/** Randomizer tags for a page (see randomizerHead in src/lib/palette.js), or none while it's off. */
function randomizerTags() {
  const head = randomizerHead(readTemplates(), readRandomizer())
  if (!head) return []
  return [
    { tag: 'style', attrs: { id: 'palette-templates' }, children: head.css, injectTo: 'head' },
    { tag: 'script', children: head.script, injectTo: 'head' },
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
 *  - Build only: adds <script src="/api/palette.js"> after them, which swaps in the colours
 *    saved on the hosted site (database) before the first paint. The baked-in ones stay as
 *    the fallback. Not in dev, where the editor works on the files.
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
  let apiUrl = ''

  return {
    name: 'shetech-palette',

    configResolved(config) {
      apiUrl = (config.env.VITE_API_URL || '').replace(/\/+$/, '')
    },

    transformIndexHtml(_html, ctx) {
      const palette = readPalette()
      const error = validatePalette(palette)
      if (error) throw new Error(`src/config/palette.json: ${error}`)
      const isAdmin = /admin\.html$/.test(ctx.filename ?? ctx.path ?? '')
      return [
        { tag: 'style', attrs: { id: 'palette' }, children: paletteToCss(palette), injectTo: 'head' },
        ...(isAdmin ? [] : randomizerTags()),
        // Render-blocking on purpose: the hosted site's saved colours apply before anything is drawn
        ...(ctx.server ? [] : [{ tag: 'script', attrs: { src: `${apiUrl}/api/palette.js${isAdmin ? '?page=admin' : ''}` }, injectTo: 'head' }]),
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

/**
 * Serves /admin as admin.html and /admin/home (home page + colour editor) as admin-home.html
 * in `npm run dev` and `npm run preview` (server/index.js and vercel.json do the same in production).
 */
function adminPagePlugin() {
  // Must return nothing: Vite treats a returned function as a post-middleware hook
  const mount = (server) => {
    server.middlewares.use((req, _res, next) => {
      if (/^\/admin\/home\/?(\?|$)/.test(req.url)) req.url = req.url.replace(/^\/admin\/home\/?/, '/admin-home.html')
      else if (/^\/admin\/?(\?|$)/.test(req.url)) req.url = req.url.replace(/^\/admin\/?/, '/admin.html')
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
      input: { main: path.join(root, 'index.html'), admin: path.join(root, 'admin.html'), adminHome: path.join(root, 'admin-home.html') },
    },
  },
})
