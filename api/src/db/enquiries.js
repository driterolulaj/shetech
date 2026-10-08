import { upsertClient } from './clients.js'
import { transaction } from './pool.js'

/** A "Send a message" submission. Creates or updates the client too. Returns the enquiry id. */
export function createEnquiry({ client, interest, project, message }) {
  return transaction(async (db) => {
    const clientId = await upsertClient(db, client)
    const { rows } = await db.query(
      'INSERT INTO enquiries (client_id, interest, project, message, created_at) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [clientId, interest || null, project || null, message, new Date()],
    )
    return rows[0].id
  })
}
