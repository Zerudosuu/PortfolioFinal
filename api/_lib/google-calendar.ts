export class HttpError extends Error {
  statusCode: number
  constructor(statusCode: number, message: string) { super(message); this.statusCode = statusCode }
}

export class OAuth2Client {
  private accessToken: string | undefined
  private readonly clientId: string
  private readonly clientSecret: string
  private readonly refreshToken: string
  constructor(clientId: string, clientSecret: string, refreshToken: string) { this.clientId = clientId; this.clientSecret = clientSecret; this.refreshToken = refreshToken }
  async getAccessToken(): Promise<string> {
    if (this.accessToken) return this.accessToken
    const response = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: this.clientId, client_secret: this.clientSecret, refresh_token: this.refreshToken, grant_type: 'refresh_token' }) })
    const body = await response.json() as { access_token?: string }
    if (!response.ok || !body.access_token) throw new HttpError(502, 'Google authentication failed')
    this.accessToken = body.access_token
    return this.accessToken
  }
}

export function calendarId(): string { return process.env.GOOGLE_CALENDAR_ID?.trim() || 'primary' }

export async function getGoogleClient(): Promise<OAuth2Client> {
  const missing = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REFRESH_TOKEN'].find((key) => !process.env[key]?.trim())
  if (missing) throw new HttpError(500, `Missing server configuration: ${missing}`)
  return new OAuth2Client(process.env.GOOGLE_CLIENT_ID!, process.env.GOOGLE_CLIENT_SECRET!, process.env.GOOGLE_REFRESH_TOKEN!)
}

function parseDate(value: unknown, label: string): Date {
  if (typeof value !== 'string' || !value.trim()) throw new HttpError(400, `${label} is required`)
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) throw new HttpError(400, `${label} must be an ISO date`)
  return date
}

export function validateBookingInput(value: unknown): { start: Date; end: Date; name: string; email: string; message: string } {
  if (!value || typeof value !== 'object') throw new HttpError(400, 'Booking body must be an object')
  const body = value as Record<string, unknown>
  const start = parseDate(body.start, 'start')
  const end = parseDate(body.end, 'end')
  const duration = end.getTime() - start.getTime()
  if (duration <= 0) throw new HttpError(400, 'end must be after start')
  if (duration > 120 * 60 * 1000) throw new HttpError(400, 'Booking duration cannot exceed 120 minutes')
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (!name) throw new HttpError(400, 'name is required')
  const email = typeof body.email === 'string' ? body.email.trim() : ''
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, 'email is invalid')
  const message = typeof body.message === 'string' ? body.message.trim() : ''
  return { start, end, name, email, message }
}

export type CalendarService = {
  freeBusy(from: Date, to: Date): Promise<Array<{ start: string; end: string }>>
  insert(input: { start: Date; end: Date; name: string; email: string; message: string }): Promise<{ id?: string; htmlLink?: string }>
}

export function createGoogleCalendarService(client: OAuth2Client): CalendarService {
  async function request(path: string, init: RequestInit) {
    const token = await client.getAccessToken()
    const response = await fetch(`https://www.googleapis.com/calendar/v3${path}`, { ...init, headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json', ...(init.headers || {}) } })
    const body = await response.json() as any
    if (!response.ok) throw new HttpError(502, body?.error?.message || 'Google Calendar request failed')
    return body
  }
  return {
    async freeBusy(from, to) {
      const body = await request('/freeBusy', { method: 'POST', body: JSON.stringify({ timeMin: from.toISOString(), timeMax: to.toISOString(), items: [{ id: calendarId() }] }) })
      return body.calendars?.[calendarId()]?.busy || []
    },
    async insert(input) {
      const event = { summary: `Portfolio call with ${input.name}`, description: input.message, start: { dateTime: input.start.toISOString(), timeZone: process.env.BOOKING_TIMEZONE || 'Asia/Manila' }, end: { dateTime: input.end.toISOString(), timeZone: process.env.BOOKING_TIMEZONE || 'Asia/Manila' }, attendees: [{ email: input.email }] }
      return request(`/calendars/${encodeURIComponent(calendarId())}/events?sendUpdates=all`, { method: 'POST', body: JSON.stringify(event) })
    },
  }
}

export async function configuredCalendarService(): Promise<CalendarService> { return createGoogleCalendarService(await getGoogleClient()) }
