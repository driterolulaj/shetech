import fs from 'node:fs'
import http from 'node:http'
import https from 'node:https'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Production web server: serves the built site from dist/ (the admin panel at
 * /admin) and forwards /api/* to the API service, so the browser only ever
 * talks to one origin. Equivalent to the nginx config in api/README.md.
 *
 *   npm run build && npm start
 *   PORT     default 3000
 *   API_URL  where the API runs, default http://localhost:4000
 */

const DIST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist')
const PORT = Number(process.env.PORT) || 3000
const API = new URL(process.env.API_URL || 'http://localhost:4000')

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.json': 'application/json',
}

function serveFile(res, file) {
  const ext = path.extname(file)
  res.setHeader('Content-Type', TYPES[ext] ?? 'application/octet-stream')
  // Hashed build assets never change; everything else is revalidated
  res.setHeader('Cache-Control', file.includes(`${path.sep}assets${path.sep}`) ? 'public, max-age=31536000, immutable' : 'no-cache')
  fs.createReadStream(file).pipe(res)
}

/** Streams the request to the API and the response back, adding the usual X-Forwarded-* headers. */
function proxy(req, res) {
  const upstream = (API.protocol === 'https:' ? https : http).request(
    {
      protocol: API.protocol,
      hostname: API.hostname,
      port: API.port,
      method: req.method,
      path: req.url,
      headers: {
        ...req.headers,
        'x-forwarded-for': [req.headers['x-forwarded-for'], req.socket.remoteAddress].filter(Boolean).join(', '),
        'x-forwarded-proto': req.socket.encrypted ? 'https' : 'http',
        'x-forwarded-host': req.headers.host,
      },
    },
    (apiRes) => {
      res.writeHead(apiRes.statusCode, apiRes.headers)
      apiRes.pipe(res)
    },
  )
  upstream.on('error', (err) => {
    console.error(`[web] API unreachable at ${API.origin}:`, err.message)
    if (res.headersSent) return res.destroy()
    res.writeHead(502, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ success: false, error: 'The service is unavailable.', message: 'The service is unavailable. Please try again shortly.' }))
  })
  req.pipe(upstream)
}

const server = http.createServer((req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost')

  if (pathname.startsWith('/api/')) return proxy(req, res)
  if (pathname === '/admin' || pathname === '/admin/') {
    res.setHeader('X-Robots-Tag', 'noindex')
    return serveFile(res, path.join(DIST, 'admin.html'))
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.statusCode = 405
    return res.end()
  }

  // Resolve inside dist/ only; anything unknown falls back to the single-page app
  let file = ''
  try {
    file = path.join(DIST, path.normalize(decodeURIComponent(pathname)).replace(/^([/\\])+/, ''))
  } catch {
    // malformed URL encoding
  }
  if (file.startsWith(DIST + path.sep) && fs.existsSync(file) && fs.statSync(file).isFile()) return serveFile(res, file)
  serveFile(res, path.join(DIST, 'index.html'))
})

server.listen(PORT, () => console.log(`She Tech website on http://localhost:${PORT} (API: ${API.origin})`))
