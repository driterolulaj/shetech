import { attachDatabasePool } from '@vercel/functions'
import pg from 'pg'
import { config } from '../config.js'

const DATE = 1082

/**
 * Shared PostgreSQL pool. Times are timestamptz and come back as JS Dates;
 * DATE columns come back as 'YYYY-MM-DD' strings, not Dates (which would shift
 * with the server's time zone).
 */
export const pool = new pg.Pool({
  ...config.db,
  types: { getTypeParser: (oid, format) => (oid === DATE ? (value) => value : pg.types.getTypeParser(oid, format)) },
})

// The database may close idle connections (Neon does when it scales to zero); without a listener that would crash the process
pool.on('error', (err) => console.error('[db] idle connection error:', err.message))

// On Vercel, close idle connections before a function instance is suspended so they don't pile up on the database
if (process.env.VERCEL) attachDatabasePool(pool)

/** Runs `work(client)` in a transaction; commits on success, rolls back on error. */
export async function transaction(work) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await work(client)
    await client.query('COMMIT')
    return result
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}
