import { upsertClient } from './clients.js'
import { transaction } from './pool.js'

/** A "Send a message" submission. Creates or updates the client too. Returns the enquiry id. */
export function createEnquiry({ client, interest, project, message }) {
  return transaction(async (connection) => {
    const clientId = await upsertClient(connection, client)
    const [result] = await connection.query(
      'INSERT INTO enquiries (client_id, interest, project, message, created_at) VALUES (?, ?, ?, ?, ?)',
      [clientId, interest || null, project || null, message, new Date()],
    )
    return result.insertId
  })
}
