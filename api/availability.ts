import { configuredCalendarService, HttpError, type CalendarService } from './_lib/google-calendar.ts'

function errorResponse(error: unknown, res: any) { const e = error as Partial<HttpError>; return res.status(e.statusCode || 500).json({ error: e.statusCode ? e.message : 'Internal server error' }) }
export function createAvailabilityHandler(service: CalendarService) {
  return async function availability(req: any, res: any) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
    try {
      const from = new Date(req.query?.from || '')
      const to = new Date(req.query?.to || '')
      if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || to <= from) throw new HttpError(400, 'Invalid availability range')
      if (to.getTime() - from.getTime() > 62 * 24 * 60 * 60 * 1000) throw new HttpError(400, 'Availability range cannot exceed 62 days')
      return res.status(200).json({ busy: await service.freeBusy(from, to) })
    } catch (error) { return errorResponse(error, res) }
  }
}
export default async function handler(req: any, res: any) { return createAvailabilityHandler(await configuredCalendarService())(req, res) }
