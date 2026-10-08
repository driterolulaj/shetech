import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import mysql from 'mysql2/promise'
import { config } from '../config.js'

/**
 * Applies api/migrations/*.sql in name order, once each, recording them in
 * `schema_migrations`. Creates the database first if the user is allowed to.
 * Runs on server start-up, or by hand with `npm run migrate`.
 */
const MIGRATIONS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../migrations')

export async function migrate({ log = console.log } = {}) {
  const { database, ...server } = config.db
  const { connectionLimit, ...options } = server
  const connection = await mysql.createConnection({ ...options, timezone: 'Z', multipleStatements: true })
  try {
    try {
      await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`)
    } catch (err) {
      if (err.code !== 'ER_DBACCESS_DENIED_ERROR' && err.code !== 'ER_ACCESS_DENIED_ERROR') throw err // fine if it already exists
    }
    await connection.query(`USE \`${database}\``)
    await connection.query("SET time_zone = '+00:00'")
    await connection.query(
      'CREATE TABLE IF NOT EXISTS schema_migrations (name VARCHAR(255) PRIMARY KEY, applied_at DATETIME(3) NOT NULL) ENGINE=InnoDB',
    )

    const [rows] = await connection.query('SELECT name FROM schema_migrations')
    const applied = new Set(rows.map((r) => r.name))
    const files = (await fs.readdir(MIGRATIONS)).filter((f) => f.endsWith('.sql')).sort()

    const pending = files.filter((f) => !applied.has(f))
    for (const file of pending) {
      log(`[db] applying ${file}`)
      // MySQL DDL commits implicitly, so a failed migration must be fixed by hand; keep each one small
      await connection.query(await fs.readFile(path.join(MIGRATIONS, file), 'utf8'))
      await connection.query('INSERT INTO schema_migrations (name, applied_at) VALUES (?, ?)', [file, new Date()])
    }
    return pending.length
  } finally {
    await connection.end()
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
