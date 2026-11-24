import { allowedSlot, configuredCalendarService, HttpError, parseIsoDate, slotTokenFor, type CalendarService } from './_lib/google-calendar.js'
import { clientKey, createRateLimiter } from './_lib/rate-limit.js'

function errorResponse(error: unknown, res: any) { const e = error as Partial<HttpError>; if (!e.statusCode || e.statusCode >= 500) console.error('availability failed', error); return res.status(e.statusCode || 500).json({ error: e.statusCode && e.statusCode !== 500 ? e.message : 'Internal server error' }) }
// Every call spends Google API quota; 60 per 10 minutes is plenty for browsing months.
const limitPerClient = createRateLimiter(Number(process.env.AVAILABILITY_RATE_LIMIT || 60), 10 * 60 * 1000)
export function createAvailabilityHandler(service: CalendarService, limit = limitPerClient) {
  return async function availability(req: any, res: any) {
    res.setHeader?.('Cache-Control', 'no-store')
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
    try {
      limit(clientKey(req))
      const from = parseIsoDate(req.query?.from, 'from')
      const to = parseIsoDate(req.query?.to, 'to')
      if (to <= from) throw new HttpError(400, 'Invalid availability range')
      if (to.getTime() - from.getTime() > 62 * 24 * 60 * 60 * 1000) throw new HttpError(400, 'Availability range cannot exceed 62 days')
      const busy = await service.freeBusy(from, to)
      const slots = []
      const first = Math.ceil(from.getTime() / 1_800_000) * 1_800_000
      const expiry = Date.now() + Number(process.env.BOOKING_TOKEN_TTL_SECONDS || 900) * 1000
      for (let cursor = first; cursor < to.getTime(); cursor += 1_800_000) {
        const start = new Date(cursor)
        for (const minutes of [30, 60, 90, 120]) {
          const end = new Date(cursor + minutes * 60_000)
          if (end > to || !allowedSlot(start, end) || busy.some((item) => new Date(item.start) < end && new Date(item.end) > start)) continue
          const startIso = start.toISOString(); const endIso = end.toISOString()
          slots.push({ start: startIso, end: endIso, token: slotTokenFor(startIso, endIso, expiry) })
        }
      }
      // Only free slots are returned; the raw busy ranges would reveal the owner's schedule.
      return res.status(200).json({ slots })
    } catch (error) { return errorResponse(error, res) }
  }
}
export default async function handler(req: any, res: any) {
  try {
    return await createAvailabilityHandler(await configuredCalendarService())(req, res)
  } catch (error) {
    return errorResponse(error, res)
  }
}
