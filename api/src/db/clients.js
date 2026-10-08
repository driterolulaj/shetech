/**
 * Clients are keyed by email: a returning visitor updates their record
 * (latest name, company and time zone win; blanks never overwrite).
 * Returns the client id. Pass a transaction client.
 */
export async function upsertClient(client, { email, name, company, timezone }) {
  const now = new Date()
  const { rows } = await client.query(
    `INSERT INTO clients (email, name, company, timezone, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $5)
     ON CONFLICT (email) DO UPDATE SET
       name = EXCLUDED.name,
       company = COALESCE(EXCLUDED.company, clients.company),
       timezone = COALESCE(EXCLUDED.timezone, clients.timezone),
       updated_at = EXCLUDED.updated_at
     RETURNING id`,
    [email.toLowerCase(), name, company || null, timezone || null, now],
  )
  return rows[0].id
}
