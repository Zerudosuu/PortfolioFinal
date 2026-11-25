import { allowedSlot, configuredCalendarService, HttpError, type CalendarService, validateBookingInput, verifySlotToken } from './_lib/google-calendar.js'
import { clientKey, createRateLimiter } from './_lib/rate-limit.js'

function overlaps(start: Date, end: Date, busy: Array<{ start: string; end: string }>) { return busy.some((item) => new Date(item.start) < end && new Date(item.end) > start) }
function errorResponse(error: unknown, res: any) { const e = error as Partial<HttpError>; if (!e.statusCode || e.statusCode >= 500) console.error('book failed', error); return res.status(e.statusCode || 500).json({ error: e.statusCode && e.statusCode !== 500 ? e.message : 'Internal server error' }) }
// Each booking makes Google email an invite, so keep this tight: 3 per 10 minutes per client.
const limitPerClient = createRateLimiter(Number(process.env.BOOKING_RATE_LIMIT || 3), 10 * 60 * 1000)
export function createBookingHandler(service: CalendarService, limit = limitPerClient) {
  return async function book(req: any, res: any) {
    res.setHeader?.('Cache-Control', 'no-store')
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
    try {
      limit(clientKey(req))
      const input = validateBookingInput(req.body)
      if (!allowedSlot(input.start, input.end)) throw new HttpError(400, 'Requested time is outside booking hours')
      verifySlotToken(req.body?.token, input.start.toISOString(), input.end.toISOString())
      const busy = await service.freeBusy(input.start, input.end)
      if (overlaps(input.start, input.end, busy)) throw new HttpError(409, 'That time is no longer available')
      const event = await service.insert(input)
      if (typeof event.id !== 'string' || !event.id || typeof event.htmlLink !== 'string' || !/^https:\/\//.test(event.htmlLink)) throw new HttpError(502, 'Google Calendar returned an invalid event')
      // htmlLink points at the host's calendar; the guest only needs confirmation.
      return res.status(200).json({ eventId: event.id })
    } catch (error) { return errorResponse(error, res) }
  }
}
export default async function handler(req: any, res: any) {
  try {
    return await createBookingHandler(await configuredCalendarService())(req, res)
  } catch (error) {
    return errorResponse(error, res)
  }
}
