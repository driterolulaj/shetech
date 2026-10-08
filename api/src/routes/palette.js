import { Router } from 'express'
import { RANDOMIZER_DEFAULTS, validatePalette, validateRandomizer, withDefaults } from '../../../web/src/lib/palette.js'
import { config } from '../config.js'
import { deleteFile, githubConfigured, listFiles, readFile, writeFile } from '../lib/github.js'

/**
 * /api/admin/palette: the colour editor on a deployed site (behind the admin sign-in).
 * Same requests and replies as the dev server's /__palette (web/vite.config.js),
 * but files are read from and committed to GitHub, and the commit rebuilds the site.
 *
 *   GET                     → { palette, defaults, templates: [{ name, palette }], randomizer }
 *   PUT                     → save the posted palette as palette.json
 *   POST /reset             → copy palette.defaults.json over palette.json
 *   PUT /randomizer         → save the randomizer settings
 *   PUT /templates/<name>   → save the posted palette as palettes/<name>.json
 *   DELETE /templates/<name>
 */
export const paletteRouter = Router()

const DIR = 'web/src/config'
const PALETTE = `${DIR}/palette.json`
const DEFAULTS = `${DIR}/palette.defaults.json`
const RANDOMIZER = `${DIR}/palette.randomizer.json`
const TEMPLATES = `${DIR}/palettes`
const TEMPLATE_NAME = /^[a-z0-9][a-z0-9-]{0,39}$/

const serialize = (value) => `${JSON.stringify(value, null, 2)}\n`
const readJson = async (path) => {
  const file = await readFile(path)
  return file && JSON.parse(file.text)
}

paletteRouter.use((_req, res, next) =>
  githubConfigured ? next() : res.status(503).json({ error: "set GITHUB_TOKEN (and GITHUB_REPO if this deployment isn't from GitHub) on this project, then redeploy." }),
)

/** Every valid template, A–Z, with missing tokens filled from the defaults (as in vite.config.js). */
async function readTemplates(defaults) {
  const names = (await listFiles(TEMPLATES)).filter((f) => f.endsWith('.json')).sort()
  const templates = await Promise.all(
    names.map(async (file) => {
      try {
        const palette = withDefaults(await readJson(`${TEMPLATES}/${file}`), defaults)
        return validatePalette(palette) ? null : { name: file.slice(0, -5), palette }
      } catch {
        return null
      }
    }),
  )
  return templates.filter(Boolean)
}

async function readRandomizer() {
  try {
    const settings = { ...RANDOMIZER_DEFAULTS, ...(await readJson(RANDOMIZER)) }
    return validateRandomizer(settings) ? RANDOMIZER_DEFAULTS : settings
  } catch {
    return RANDOMIZER_DEFAULTS
  }
}

const templateName = (req) => (TEMPLATE_NAME.test(req.params.name) ? req.params.name : null)
const BAD_NAME = { error: 'Use lowercase letters, numbers and dashes for the name.' }

paletteRouter.get('/', async (_req, res) => {
  const [defaults, saved] = await Promise.all([readJson(DEFAULTS), readJson(PALETTE)])
  if (!defaults) {
    // GitHub answers 404 for a repository the token can't see, too
    const { repo, branch } = config.github
    return res.status(502).json({ error: `Can't read ${DEFAULTS} in ${repo} (${branch}). Check that GITHUB_TOKEN has access to that repository.` })
  }
  const [templates, randomizer] = await Promise.all([readTemplates(defaults), readRandomizer()])
  res.json({ palette: withDefaults(saved, defaults), defaults, templates, randomizer })
})

paletteRouter.put('/', async (req, res) => {
  const error = validatePalette(req.body)
  if (error) return res.status(400).json({ error })
  await writeFile(PALETTE, serialize(req.body), `Colours: update the site palette (${req.admin.email})`)
  res.json({ palette: req.body })
})

paletteRouter.post('/reset', async (req, res) => {
  const defaults = await readFile(DEFAULTS)
  // Byte-for-byte copy of the defaults file (same as `npm run palette:reset`)
  await writeFile(PALETTE, defaults.text, `Colours: reset to the defaults (${req.admin.email})`)
  res.json({ palette: JSON.parse(defaults.text) })
})

paletteRouter.put('/randomizer', async (req, res) => {
  const error = validateRandomizer(req.body)
  if (error) return res.status(400).json({ error })
  const { onRefresh, everySeconds, fadeSeconds, exclude } = req.body
  const settings = { onRefresh, everySeconds, fadeSeconds, exclude: [...new Set(exclude)].sort() }
  await writeFile(RANDOMIZER, serialize(settings), `Colours: update the randomizer (${req.admin.email})`)
  res.json({ randomizer: settings })
})

paletteRouter.put('/templates/:name', async (req, res) => {
  const name = templateName(req)
  if (!name) return res.status(400).json(BAD_NAME)
  const error = validatePalette(req.body)
  if (error) return res.status(400).json({ error })
  await writeFile(`${TEMPLATES}/${name}.json`, serialize(req.body), `Colours: save template "${name}" (${req.admin.email})`)
  res.json({ templates: await readTemplates(await readJson(DEFAULTS)) })
})

paletteRouter.delete('/templates/:name', async (req, res) => {
  const name = templateName(req)
  if (!name) return res.status(400).json(BAD_NAME)
  await deleteFile(`${TEMPLATES}/${name}.json`, `Colours: delete template "${name}" (${req.admin.email})`)
  res.json({ templates: await readTemplates(await readJson(DEFAULTS)) })
})

// Admin-only, so the real reason (e.g. GitHub refusing the token) is shown in the editor
paletteRouter.use((err, _req, res, _next) => {
  console.error('[palette]', err.message)
  res.status(err.status ?? 500).json({ error: err.message })
})
