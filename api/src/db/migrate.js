import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'
import { config } from '../config.js'

/**
 * Applies api/migrations/*.sql in name order, once each, recording them in
 * `schema_migrations`. Everything runs in one transaction (Postgres DDL is
 * transactional), so a failed migration leaves the database as it was, and an
 * advisory lock keeps two deploys from migrating at the same time.
 * Runs on server start-up, or by hand with `npm run migrate`.
 */
const MIGRATIONS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../migrations')
const LOCK_ID = 7_413_001 // any constant; identifies "She Tech migrations" for pg_advisory_xact_lock

export async function migrate({ log = console.log } = {}) {
  // Direct (unpooled) connection where the provider has one, as poolers can get in the way of DDL
  const client = new pg.Client({ ...config.db, connectionString: config.db.directConnectionString })
  await client.connect()
  try {
    await client.query('BEGIN')
    await client.query('SELECT pg_advisory_xact_lock($1)', [LOCK_ID])
    await client.query('CREATE TABLE IF NOT EXISTS schema_migrations (name varchar(255) PRIMARY KEY, applied_at timestamptz NOT NULL)')

    const { rows } = await client.query('SELECT name FROM schema_migrations')
    const applied = new Set(rows.map((r) => r.name))
    const files = (await fs.readdir(MIGRATIONS)).filter((f) => f.endsWith('.sql')).sort()

    const pending = files.filter((f) => !applied.has(f))
    for (const file of pending) {
      log(`[db] applying ${file}`)
      await client.query(await fs.readFile(path.join(MIGRATIONS, file), 'utf8'))
      await client.query('INSERT INTO schema_migrations (name, applied_at) VALUES ($1, $2)', [file, new Date()])
    }
    await client.query('COMMIT')
    return pending.length
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    await client.end()
  }
}

// `npm run migrate`
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  migrate()
    .then((count) => console.log(count > 0 ? `[db] ${count} migration(s) applied` : '[db] up to date'))
    .catch((err) => {
      console.error('[db] migration failed:', err.message)
      process.exitCode = 1
    })
}
