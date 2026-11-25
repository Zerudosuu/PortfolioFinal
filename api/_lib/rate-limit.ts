import { HttpError } from './google-calendar.js'

// Best-effort, per-instance limiter. Vercel runs many short-lived instances, so this
// only slows down a single client hammering one warm instance. Pair it with a Vercel
// Firewall rate-limit rule on /api/* for a real, shared limit (see docs).
type Bucket = { count: number; resetAt: number }

export function clientKey(req: any): string {
  const header = req.headers?.['x-vercel-forwarded-for'] || req.headers?.['x-forwarded-for'] || req.headers?.['x-real-ip'] || 'anonymous'
  return String(Array.isArray(header) ? header[0] : header).split(',')[0].trim() || 'anonymous'
}

export function createRateLimiter(limit: number, windowMs: number, maxKeys = 5000) {
  const buckets = new Map<string, Bucket>()
  return function check(key: string, now = Date.now()): void {
    if (buckets.size >= maxKeys) {
      for (const [k, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(k)
      if (buckets.size >= maxKeys) buckets.clear()
    }
    const current = buckets.get(key)
    if (!current || current.resetAt <= now) { buckets.set(key, { count: 1, resetAt: now + windowMs }); return }
    if (current.count >= limit) throw new HttpError(429, 'Too many requests; try again later')
    current.count++
  }
}
