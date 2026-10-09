import { dangerouslyDeleteByTag } from '@vercel/functions'
import { Router } from 'express'
import { paletteToCss, RANDOMIZER_DEFAULTS, randomizerHead, validatePalette, validateRandomizer, withDefaults } from '../../../web/src/lib/palette.js'
import { deleteTemplate, getSettings, listTemplates, saveTemplate, setSetting } from '../db/palette.js'

/**
 * The hosted site's colours, kept in the database (seeded from web/src/config by `npm run setup`).
 *
 * GET /api/palette.js: public. A render-blocking script every built page loads, which swaps in
 * the saved palette (and the randomizer) before the first paint. Vercel's CDN keeps it until a
 * save purges it (cache tag "palette"), so the database is read once per change, not per visit.
 *
 * /api/admin/palette: the colour editor at /admin/home (signed-in admins). Same requests and
 * replies as the dev server's /__palette (web/vite.config.js), saved to the database instead
 * of the files, and live for visitors within seconds:
 *   GET                     → { palette, defaults, templates: [{ name, palette }], randomizer }
 *   PUT                     → save the posted palette
 *   POST /reset             → back to the defaults
 *   PUT /randomizer         → save the randomizer settings
 *   PUT /templates/<name>   → save the posted palette as a template
 *   DELETE /templates/<name>
 */
export const paletteRouter = Router()

const TEMPLATE_NAME = /^[a-z0-9][a-z0-9-]{0,39}$/
const CACHE_TAG = 'palette'

/**
 * After a save: drop the CDN's copy of /api/palette.js so the next page load gets the new
 * colours. Deleted rather than invalidated, which would serve the old copy once more.
 * Does nothing outside Vercel.
 */
async function refreshCdn() {
  try {
    await dangerouslyDeleteByTag(CACHE_TAG)
  } catch (err) {
    console.error('[palette] could not purge the CDN cache:', err.message)
  }
}
const BAD_NAME = { error: 'Use lowercase letters, numbers and dashes for the name.' }
const NOT_SEEDED = { error: 'No colours in the database yet. Run `npm run setup` (every deploy does) to copy them from the repository.' }

/** Everything, with missing tokens filled from the defaults and broken entries left out (as the build does). */
async function load() {
  const [{ palette, defaults, randomizer }, rows] = await Promise.all([getSettings(), listTemplates()])
  if (!palette || !defaults) return null
  const templates = rows.flatMap((t) => {
    const filled = withDefaults(t.palette, defaults)
    return validatePalette(filled) ? [] : [{ name: t.name, palette: filled }]
  })
  const settings = { ...RANDOMIZER_DEFAULTS, ...randomizer }
  return { palette: withDefaults(palette, defaults), defaults, templates, randomizer: validateRandomizer(settings) ? RANDOMIZER_DEFAULTS : settings }
}

/** The page script. `?page=admin` (the bookings panel) gets the palette only, never the randomizer. */
export async function paletteScript(req, res) {
  const colours = await load()
  const head = colours && req.query.page !== 'admin' ? randomizerHead(colours.templates, colours.randomizer) : null
  const script = !colours
    ? '' // nothing saved yet: the colours baked into the page stay
    : `(function(){try{var d=document;function put(id,css){var s=d.getElementById(id);if(!s){s=d.createElement('style');s.id=id;d.head.appendChild(s)}s.textContent=css}put('palette',${JSON.stringify(paletteToCss(colours.palette))});${
        head
          ? `put('palette-templates',${JSON.stringify(head.css)});`
          : // Randomizer off here: undo whatever the build switched on
            `window.__paletteRandomizer=null;d.documentElement.removeAttribute('data-palette');put('palette-templates','');`
      }}catch(e){}})();${head ? head.script : ''}`
  res.set({
    'Content-Type': 'text/javascript; charset=utf-8',
    // Browsers check every time (a 304 from the CDN when nothing changed), so a change shows on the next load
    'Cache-Control': 'no-cache',
    // Vercel's CDN keeps it until a save purges the tag (or the next deploy, which starts a fresh cache)
    'Vercel-CDN-Cache-Control': 'max-age=31536000',
    'Vercel-Cache-Tag': CACHE_TAG,
    // Any other CDN in front: refresh in the background every 10 s. Never in Cache-Control, where
    // browsers would apply stale-while-revalidate too and show the old colours one more time
    'CDN-Cache-Control': 'max-age=10, stale-while-revalidate=86400',
  })
  res.send(script)
}

const templateName = (req) => (TEMPLATE_NAME.test(req.params.name) ? req.params.name : null)

paletteRouter.get('/', async (_req, res) => {
  const colours = await load()
  return colours ? res.json(colours) : res.status(503).json(NOT_SEEDED)
})

paletteRouter.put('/', async (req, res) => {
  const error = validatePalette(req.body)
  if (error) return res.status(400).json({ error })
  await setSetting('palette', req.body)
  await refreshCdn()
  res.json({ palette: req.body })
})

paletteRouter.post('/reset', async (_req, res) => {
  const { defaults } = await getSettings()
  if (!defaults) return res.status(503).json(NOT_SEEDED)
  await setSetting('palette', defaults)
  await refreshCdn()
  res.json({ palette: defaults })
})

paletteRouter.put('/randomizer', async (req, res) => {
  const error = validateRandomizer(req.body)
  if (error) return res.status(400).json({ error })
  const { onRefresh, everySeconds, fadeSeconds, exclude } = req.body
  const settings = { onRefresh, everySeconds, fadeSeconds, exclude: [...new Set(exclude)].sort() }
  await setSetting('randomizer', settings)
  await refreshCdn()
  res.json({ randomizer: settings })
})

paletteRouter.put('/templates/:name', async (req, res) => {
  const name = templateName(req)
  if (!name) return res.status(400).json(BAD_NAME)
  const error = validatePalette(req.body)
  if (error) return res.status(400).json({ error })
  await saveTemplate(name, req.body)
  await refreshCdn() // the randomizer's mix may include it
  res.json({ templates: (await load()).templates })
})

paletteRouter.delete('/templates/:name', async (req, res) => {
  const name = templateName(req)
  if (!name) return res.status(400).json(BAD_NAME)
  await deleteTemplate(name)
  await refreshCdn()
  res.json({ templates: (await load()).templates })
})
