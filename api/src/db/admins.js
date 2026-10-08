import { pool } from './pool.js'

/** Admin users and their sessions. Session tokens are stored as SHA-256 hashes only. */

export async function countAdmins() {
  const [[row]] = await pool.query('SELECT COUNT(*) AS n FROM admin_users')
  return Number(row.n)
}

export async function findAdminByEmail(email) {
  const [rows] = await pool.query('SELECT id, email, password_hash FROM admin_users WHERE email = ?', [email.toLowerCase()])
  return rows[0] ?? null
}

/** Creates the admin, or resets the password if the email already exists. Returns 'created' | 'updated'. */
export async function saveAdmin(email, passwordHash) {
  const [result] = await pool.query(
    `INSERT INTO admin_users (email, password_hash, created_at) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
    [email.toLowerCase(), passwordHash, new Date()],
  )
  if (result.affectedRows !== 1) {
    // Password changed: sign that admin out everywhere
    await pool.query('DELETE s FROM admin_sessions s JOIN admin_users u ON u.id = s.user_id WHERE u.email = ?', [email.toLowerCase()])
  }
  return result.affectedRows === 1 ? 'created' : 'updated'
}

export async function recordLogin(userId) {
  await pool.query('UPDATE admin_users SET last_login_at = ? WHERE id = ?', [new Date(), userId])
}

export async function createSession(userId, tokenHash, expiresAt) {
  await pool.query('DELETE FROM admin_sessions WHERE expires_at < ?', [new Date()]) // tidy up as we go
  await pool.query('INSERT INTO admin_sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)', [
    tokenHash,
    userId,
    new Date(),
    expiresAt,
  ])
}

/** The signed-in admin for a session, or null if it's unknown or expired. */
export async function findSession(tokenHash) {
  const [rows] = await pool.query(
    `SELECT u.id, u.email FROM admin_sessions s JOIN admin_users u ON u.id = s.user_id
     WHERE s.token_hash = ? AND s.expires_at > ?`,
    [tokenHash, new Date()],
  )
  return rows[0] ?? null
}

export async function deleteSession(tokenHash) {
  await pool.query('DELETE FROM admin_sessions WHERE token_hash = ?', [tokenHash])
}
