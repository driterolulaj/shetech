import { createApp } from './app.js'
import { config } from './config.js'
import { countAdmins, saveAdmin } from './db/admins.js'
import { migrate } from './db/migrate.js'
import { pool } from './db/pool.js'
import { mailConfigured } from './lib/mail.js'
import { hashPassword } from './lib/passwords.js'

/** Start-up: bring the schema up to date, create the first admin if needed, then listen. */
async function main() {
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

  const server = createApp().listen(config.port, config.host, () => {
    console.log(`She Tech API listening on http://${config.host === '0.0.0.0' ? 'localhost' : config.host}:${config.port}`)
  })

  const shutdown = () => {
    server.close(() => pool.end().finally(() => process.exit(0)))
    setTimeout(() => process.exit(1), 10_000).unref()
  }
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

main().catch((err) => {
  console.error('[api] failed to start:', err.code === 'ECONNREFUSED' ? `can't reach MySQL at ${config.db.host}:${config.db.port}` : err.message)
  process.exit(1)
})
