import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { config } from './config.js'
import { countAdmins, saveAdmin } from './db/admins.js'
import { migrate } from './db/migrate.js'
import { seedPalette } from './db/palette.js'
import { pool } from './db/pool.js'
import { mailConfigured } from './lib/mail.js'
import { hashPassword } from './lib/passwords.js'

const COLOURS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../web/src/config')
const readJson = async (file) => JSON.parse(await fs.readFile(path.join(COLOURS, file), 'utf8'))

/**
 * Copies the website's colour files into the database the first time (and the defaults
 * every time); from then on the hosted site's colours are edited at /admin/home.
 */
async function seedColours() {
  let files
  try {
    files = (await fs.readdir(path.join(COLOURS, 'palettes'))).filter((f) => f.endsWith('.json'))
  } catch {
    return console.warn(`[colours] ${COLOURS} not found: the site keeps the colours it was built with`)
  }
  const seeded = await seedPalette({
    defaults: await readJson('palette.defaults.json'),
    palette: await readJson('palette.json'),
    randomizer: await readJson('palette.randomizer.json').catch(() => ({})),
    templates: await Promise.all(files.map(async (f) => ({ name: f.slice(0, -5), palette: await readJson(`palettes/${f}`) }))),
  })
  if (seeded) console.log(`[colours] copied the palette, randomizer and ${files.length} templates into the database`)
}

/**
 * Brings the schema up to date, creates the first admin while there are none, and
 * copies the colours into the database the first time.
 * Runs on start-up (src/server.js), or on its own with `npm run setup`, which is
 * what the Vercel build does: serverless functions have no start-up step.
 */
export async function setup() {
  await migrate()

  if ((await countAdmins()) === 0) {
    if (config.admin.seedEmail && config.admin.seedPassword) {
      await saveAdmin(config.admin.seedEmail, await hashPassword(config.admin.seedPassword))
      console.log(`[admin] created admin ${config.admin.seedEmail} from ADMIN_EMAIL / ADMIN_PASSWORD`)
    } else {
      console.warn('[admin] no admin users yet: set ADMIN_EMAIL and ADMIN_PASSWORD, or run `npm run admin:create`')
    }
  }
  await seedColours()
  if (!mailConfigured) console.warn('[mail] GMAIL_USER / GMAIL_APP_PASSWORD not set: submissions are saved but not emailed')
}

// `npm run setup`
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  setup()
    .catch((err) => {
      console.error('[setup] failed:', err.code === 'ECONNREFUSED' ? "can't reach the database: check DATABASE_URL" : err.message)
      process.exitCode = 1
    })
    .finally(() => pool.end())
}
