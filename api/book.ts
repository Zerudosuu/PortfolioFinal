import { allowedSlot, configuredCalendarService, HttpError, type CalendarService, validateBookingInput, verifySlotToken } from './_lib/google-calendar.js'

function overlaps(start: Date, end: Date, busy: Array<{ start: string; end: string }>) { return busy.some((item) => new Date(item.start) < end && new Date(item.end) > start) }
function errorResponse(error: unknown, res: any) { const e = error as Partial<HttpError>; return res.status(e.statusCode || 500).json({ error: e.statusCode ? e.message : 'Internal server error' }) }
const attempts = new Map<string, { count: number; resetAt: number }>()
export function createBookingHandler(service: CalendarService) {
  return async function book(req: any, res: any) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
    try {
      const key = String(req.headers?.['x-forwarded-for'] || req.headers?.['x-real-ip'] || 'anonymous').split(',')[0].trim()
      const now = Date.now(); const current = attempts.get(key)
      if (!current || current.resetAt <= now) attempts.set(key, { count: 1, resetAt: now + 10 * 60 * 1000 })
      else if (current.count >= 10) throw new HttpError(429, 'Too many booking attempts; try again later')
      else current.count++
      const input = validateBookingInput(req.body)
      if (!allowedSlot(input.start, input.end)) throw new HttpError(400, 'Requested time is outside booking hours')
      verifySlotToken(req.body?.token, input.start.toISOString(), input.end.toISOString())
      const busy = await service.freeBusy(input.start, input.end)
      if (overlaps(input.start, input.end, busy)) throw new HttpError(409, 'That time is no longer available')
      const event = await service.insert(input)
      if (typeof event.id !== 'string' || !event.id || typeof event.htmlLink !== 'string' || !/^https:\/\//.test(event.htmlLink)) throw new HttpError(502, 'Google Calendar returned an invalid event')
      return res.status(200).json({ eventId: event.id, htmlLink: event.htmlLink })
    } catch (error) { return errorResponse(error, res) }
  }
}
export default async function handler(req: any, res: any) { return createBookingHandler(await configuredCalendarService())(req, res) }
