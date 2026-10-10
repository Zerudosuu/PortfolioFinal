import { configuredCalendarService, HttpError, type CalendarService, validateBookingInput } from './_lib/google-calendar.ts'

function overlaps(start: Date, end: Date, busy: Array<{ start: string; end: string }>) { return busy.some((item) => new Date(item.start) < end && new Date(item.end) > start) }
function errorResponse(error: unknown, res: any) { const e = error as Partial<HttpError>; return res.status(e.statusCode || 500).json({ error: e.statusCode ? e.message : 'Internal server error' }) }
export function createBookingHandler(service: CalendarService) {
  return async function book(req: any, res: any) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
    try {
      const input = validateBookingInput(req.body)
      const busy = await service.freeBusy(input.start, input.end)
      if (overlaps(input.start, input.end, busy)) throw new HttpError(409, 'That time is no longer available')
      const event = await service.insert(input)
      return res.status(200).json({ eventId: event.id, htmlLink: event.htmlLink })
    } catch (error) { return errorResponse(error, res) }
  }
}
export default async function handler(req: any, res: any) { return createBookingHandler(await configuredCalendarService())(req, res) }
