import express from 'express'
import { config } from './config.js'
import { pool } from './db/pool.js'
import { adminRouter } from './routes/admin.js'
import { contactRouter } from './routes/contact.js'

/**
 * The HTTP API. Everything lives under /api so a reverse proxy can forward
 * that prefix unchanged from the website's domain.
 */
export function createApp() {
  const app = express()
  app.disable('x-powered-by')
  app.set('trust proxy', config.trustProxy)

  app.use((req, res, next) => {
    res.set({ 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'X-Frame-Options': 'DENY' })
    next()
  })

  // CORS, only for origins listed in CORS_ORIGINS (not needed behind a same-origin proxy)
  app.use((req, res, next) => {
    const origin = req.get('origin')
    if (origin && config.corsOrigins.includes(origin)) {
      res.set({
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Headers': 'Content-Type, X-Admin',
        'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
        'Access-Control-Max-Age': '600',
        Vary: 'Origin',
      })
      if (req.method === 'OPTIONS') return res.sendStatus(204)
    }
    next()
  })

  app.use(express.json({ limit: '20kb' }))

  app.get('/api/health', async (_req, res) => {
    try {
      await pool.query('SELECT 1')
      res.json({ ok: true, db: 'up' })
    } catch {
      res.status(503).json({ ok: false, db: 'down' })
    }
  })
  app.use('/api/contact', contactRouter)
  app.use('/api/admin', adminRouter)

  app.use((_req, res) => res.status(404).json({ error: 'Not found.' }))

  // Express 5 forwards async errors here
  app.use((err, _req, res, _next) => {
    if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Request is too large.', message: 'Request is too large.' })
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid request.', message: 'Invalid request.' })
    console.error('[api]', err)
    res.status(500).json({ error: 'Something went wrong.', message: 'Something went wrong.' })
  })

  return app
}

/** Vercel serves this default export as a function; src/server.js listens with it everywhere else. */
export default createApp()
