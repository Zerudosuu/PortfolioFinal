import { allowedSlot, configuredCalendarService, HttpError, parseIsoDate, slotTokenFor, type CalendarService } from './_lib/google-calendar.js'

function errorResponse(error: unknown, res: any) { const e = error as Partial<HttpError>; return res.status(e.statusCode || 500).json({ error: e.statusCode ? e.message : 'Internal server error' }) }
export function createAvailabilityHandler(service: CalendarService) {
  return async function availability(req: any, res: any) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
    try {
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
      return res.status(200).json({ busy, slots })
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
