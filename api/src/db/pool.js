import { attachDatabasePool } from '@vercel/functions'
import mysql from 'mysql2/promise'
import { config } from '../config.js'

/**
 * Shared MySQL/MariaDB pool. All times are stored in UTC: the session time zone
 * is pinned to +00:00 and mysql2 converts JS Dates as UTC (`timezone: 'Z'`).
 * DATE columns come back as 'YYYY-MM-DD' strings, not Dates.
 */
export const pool = mysql.createPool({
  ...config.db,
  timezone: 'Z',
  dateStrings: ['DATE'],
  charset: 'utf8mb4_unicode_ci',
  waitForConnections: true,
})

pool.pool.on('connection', (connection) => connection.query("SET time_zone = '+00:00'"))

// On Vercel, close idle connections before a function instance is suspended so they don't pile up on the database
// (it recognises mysql2's underlying callback pool, not the promise wrapper)
if (process.env.VERCEL) attachDatabasePool(pool.pool)

/** Runs `work(connection)` in a transaction; commits on success, rolls back on error. */
export async function transaction(work) {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const result = await work(connection)
    await connection.commit()
    return result
  } catch (err) {
    await connection.rollback()
    throw err
  } finally {
    connection.release()
  }
}
