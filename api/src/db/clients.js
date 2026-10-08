/**
 * Clients are keyed by email: a returning visitor updates their record
 * (latest name, company and time zone win; blanks never overwrite).
 * Returns the client id. Pass a transaction connection.
 */
export async function upsertClient(connection, { email, name, company, timezone }) {
  const now = new Date()
  const [result] = await connection.query(
    `INSERT INTO clients (email, name, company, timezone, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       id = LAST_INSERT_ID(id),
       name = VALUES(name),
       company = COALESCE(VALUES(company), company),
       timezone = COALESCE(VALUES(timezone), timezone),
       updated_at = VALUES(updated_at)`,
    [email.toLowerCase(), name, company || null, timezone || null, now, now],
  )
  return result.insertId
}
