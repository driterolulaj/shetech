import { SITE } from '../config/site'

/**
 * Client for the admin API (api/src/routes/admin.js). Same origin by default;
 * VITE_API_URL points it at a separate API host (cookies are sent cross-origin).
 * Throws with the server's message; err.status is set.
 */
async function request(path, { method = 'GET', body } = {}) {
  let response
  try {
    response = await fetch(`${SITE.apiUrl}/api/admin${path}`, {
      method,
      credentials: SITE.apiUrl ? 'include' : 'same-origin',
      headers: { 'X-Admin': '1', ...(body && { 'Content-Type': 'application/json' }) },
      body: body && JSON.stringify(body),
    })
  } catch {
    throw Object.assign(new Error("Can't reach the server. Is the API running?"), { status: 0 })
  }
  let json = {}
  try {
    json = await response.json()
  } catch {
    // empty body
  }
  if (!response.ok) throw Object.assign(new Error(json.error || `The server responded with ${response.status}.`), { status: response.status })
  return json
}

export const api = {
  session: () => request('/session'),
  login: (email, password) => request('/login', { method: 'POST', body: { email, password } }),
  logout: () => request('/logout', { method: 'POST' }),
  bookings: () => request('/bookings').then((r) => r.bookings),
  update: (id, body) => request(`/bookings/${id}`, { method: 'PATCH', body }),
  remove: (id) => request(`/bookings/${id}`, { method: 'DELETE' }),
}
