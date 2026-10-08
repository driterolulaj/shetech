/**
 * All settings come from environment variables (api/.env locally, loaded by
 * `node --env-file-if-exists`; real env vars on a server). See .env.example.
 */
const env = process.env

const list = (value) =>
  (value ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

export const config = {
  port: Number(env.PORT) || 4000,
  host: env.HOST || '0.0.0.0',
  production: env.NODE_ENV === 'production',

  /** Public address of the website, for links inside emails (e.g. https://shetech.com). */
  publicUrl: (env.PUBLIC_URL || '').replace(/\/+$/, ''),

  /** Frontend origins allowed to call the API from another host (CORS). Empty = same-origin only. */
  corsOrigins: list(env.CORS_ORIGINS),

  /** Set when the API sits behind a reverse proxy (nginx), so client IPs and https are read correctly. */
  trustProxy: env.TRUST_PROXY ? (/^\d+$/.test(env.TRUST_PROXY) ? Number(env.TRUST_PROXY) : env.TRUST_PROXY) : false,

  db: {
    host: env.DB_HOST || '127.0.0.1',
    port: Number(env.DB_PORT) || 3306,
    user: env.DB_USER || 'root',
    password: env.DB_PASSWORD || '',
    database: env.DB_NAME || 'shetech',
    connectionLimit: Number(env.DB_POOL_SIZE) || 10,
  },

  mail: {
    user: env.GMAIL_USER || '',
    // Google shows app passwords in groups of four; the spaces aren't part of it
    pass: (env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, ''),
    /** Where enquiries are delivered; defaults to the Gmail account. */
    to: env.MAIL_TO || env.GMAIL_USER || '',
    senderName: env.MAIL_SENDER_NAME || 'She Tech',
  },

  admin: {
    /** First admin, created on start-up only while there are no admins yet. */
    seedEmail: env.ADMIN_EMAIL || '',
    seedPassword: env.ADMIN_PASSWORD || '',
    sessionDays: Number(env.SESSION_DAYS) || 7,
    /** 'Strict' (default) works for same-site setups; use 'None' only if the API is on a different site (requires https). */
    cookieSameSite: env.COOKIE_SAMESITE || 'Strict',
  },
}
