import { pool } from './pool.js'

/** Admin users and their sessions. Session tokens are stored as SHA-256 hashes only. */

export async function countAdmins() {
  const { rows } = await pool.query('SELECT COUNT(*) AS n FROM admin_users')
  return Number(rows[0].n)
}

export async function findAdminByEmail(email) {
  const { rows } = await pool.query('SELECT id, email, password_hash FROM admin_users WHERE email = $1', [email.toLowerCase()])
  return rows[0] ?? null
}

/** Creates the admin, or resets the password if the email already exists. Returns 'created' | 'updated'. */
export async function saveAdmin(email, passwordHash) {
  // xmax is 0 only on a freshly inserted row
  const { rows } = await pool.query(
    `INSERT INTO admin_users (email, password_hash, created_at) VALUES ($1, $2, $3)
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
     RETURNING id, (xmax = 0) AS created`,
    [email.toLowerCase(), passwordHash, new Date()],
  )
  if (!rows[0].created) {
    // Password changed: sign that admin out everywhere
    await pool.query('DELETE FROM admin_sessions WHERE user_id = $1', [rows[0].id])
  }
  return rows[0].created ? 'created' : 'updated'
}

export async function recordLogin(userId) {
  await pool.query('UPDATE admin_users SET last_login_at = $1 WHERE id = $2', [new Date(), userId])
}

export async function createSession(userId, tokenHash, expiresAt) {
  await pool.query('DELETE FROM admin_sessions WHERE expires_at < $1', [new Date()]) // tidy up as we go
  await pool.query('INSERT INTO admin_sessions (token_hash, user_id, created_at, expires_at) VALUES ($1, $2, $3, $4)', [
    tokenHash,
    userId,
    new Date(),
    expiresAt,
  ])
}

/** The signed-in admin for a session, or null if it's unknown or expired. */
export async function findSession(tokenHash) {
  const { rows } = await pool.query(
    `SELECT u.id, u.email FROM admin_sessions s JOIN admin_users u ON u.id = s.user_id
     WHERE s.token_hash = $1 AND s.expires_at > $2`,
    [tokenHash, new Date()],
  )
  return rows[0] ?? null
}

export async function deleteSession(tokenHash) {
  await pool.query('DELETE FROM admin_sessions WHERE token_hash = $1', [tokenHash])
}
