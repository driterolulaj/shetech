import app from './app.js'
import { config } from './config.js'
import { pool } from './db/pool.js'
import { setup } from './setup.js'

/** Start-up: bring the schema up to date, create the first admin if needed, then listen. (On Vercel, app.js is served directly.) */
async function main() {
  await setup()

  const server = app.listen(config.port, config.host, () => {
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
  console.error('[api] failed to start:', err.code === 'ECONNREFUSED' ? "can't reach the database: check DATABASE_URL" : err.message)
  process.exit(1)
})
