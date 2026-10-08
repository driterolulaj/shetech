import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { config } from './config.js'
import { countAdmins, saveAdmin } from './db/admins.js'
import { migrate } from './db/migrate.js'
import { pool } from './db/pool.js'
import { mailConfigured } from './lib/mail.js'
import { hashPassword } from './lib/passwords.js'

/**
 * Brings the schema up to date and creates the first admin while there are none.
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
