/**
 * In-memory limiter: at most `max` hits per `windowMs` per key (usually the client IP).
 * Per process; with several API instances behind a load balancer, each counts separately.
 */
export function rateLimiter({ max, windowMs }) {
  const hits = new Map()
  return (key) => {
    const now = Date.now()
    const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs)
    recent.push(now)
    hits.set(key, recent)
    if (hits.size > 5000) hits.clear() // keep memory bounded
    return recent.length > max
  }
}
