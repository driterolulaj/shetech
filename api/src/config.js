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

  /**
   * Set when the API sits behind a reverse proxy (nginx), so client IPs and https are read correctly.
   * On Vercel the edge is that proxy (it overwrites X-Forwarded-For with the real client IP), so it defaults to 1 there.
   */
  trustProxy: env.TRUST_PROXY ? (/^\d+$/.test(env.TRUST_PROXY) ? Number(env.TRUST_PROXY) : env.TRUST_PROXY) : env.VERCEL ? 1 : false,

  /**
   * PostgreSQL. Neon (added from Vercel's Storage tab) sets DATABASE_URL and
   * DATABASE_URL_UNPOOLED itself, with TLS in the URL (?sslmode=require).
   */
  db: {
    connectionString: env.DATABASE_URL || env.POSTGRES_URL || 'postgres://localhost:5432/shetech',
    /** Direct connection for migrations, where the provider separates it from the pooled one. */
    directConnectionString: env.DATABASE_URL_UNPOOLED || env.POSTGRES_URL_NON_POOLING || env.DATABASE_URL || env.POSTGRES_URL || 'postgres://localhost:5432/shetech',
    max: Number(env.DB_POOL_SIZE) || 10,
  },

  mail: {
    user: env.GMAIL_USER || '',
    // Google shows app passwords in groups of four; the spaces aren't part of it
    pass: (env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, ''),
    /** Where enquiries are delivered; defaults to the Gmail account. */
    to: env.MAIL_TO || env.GMAIL_USER || '',
    senderName: env.MAIL_SENDER_NAME || 'She Tech',
  },

  /**
   * Colour editor on a deployed site (VITE_PALETTE_EDITOR=true): saves are committed here.
   * GITHUB_TOKEN needs "Contents: read and write" on the repository. Repo and branch
   * default to the ones Vercel deployed from.
   */
  github: {
    token: env.GITHUB_TOKEN || '',
    repo: env.GITHUB_REPO || (env.VERCEL_GIT_REPO_OWNER && env.VERCEL_GIT_REPO_SLUG ? `${env.VERCEL_GIT_REPO_OWNER}/${env.VERCEL_GIT_REPO_SLUG}` : ''),
    branch: env.GITHUB_BRANCH || env.VERCEL_GIT_COMMIT_REF || 'main',
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
