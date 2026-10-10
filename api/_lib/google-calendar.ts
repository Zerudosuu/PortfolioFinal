import { createHmac, timingSafeEqual } from 'node:crypto'

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

function slotSecret(): string {
  const secret = process.env.BOOKING_SLOT_SECRET?.trim()
  if (!secret) throw new HttpError(500, 'Missing server configuration: BOOKING_SLOT_SECRET')
  return secret
}
function encoded(value: string): string { return Buffer.from(value).toString('base64url') }
function decoded(value: string): string { return Buffer.from(value, 'base64url').toString('utf8') }
export function slotTokenFor(start: string, end: string, expiresAt: number): string {
  const payload = encoded(JSON.stringify({ start, end, exp: expiresAt }))
  return `${payload}.${createHmac('sha256', slotSecret()).update(payload).digest('base64url')}`
}
export function verifySlotToken(token: unknown, start: string, end: string): { start: string; end: string } {
  if (typeof token !== 'string') throw new HttpError(400, 'A valid slot token is required')
  const [payload, signature] = token.split('.')
  if (!payload || !signature) throw new HttpError(400, 'A valid slot token is required')
  const expected = createHmac('sha256', slotSecret()).update(payload).digest()
  const actual = Buffer.from(signature, 'base64url')
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw new HttpError(400, 'Invalid slot token')
  let parsed: { start?: string; end?: string; exp?: number }
  try { parsed = JSON.parse(decoded(payload)) } catch { throw new HttpError(400, 'Invalid slot token') }
  if (parsed.start !== start || parsed.end !== end || !parsed.exp || parsed.exp <= Date.now()) throw new HttpError(400, 'Invalid or expired slot token')
  return { start, end }
}

function slotConfig() {
  const startHour = Number(process.env.BOOKING_START_HOUR || 9)
  const endHour = Number(process.env.BOOKING_END_HOUR || 17)
  const weekdays = new Set((process.env.BOOKING_WEEKDAYS || '1,2,3,4,5').split(',').map((value) => Number(value.trim())).filter((value) => value >= 0 && value <= 6))
  if (!Number.isInteger(startHour) || !Number.isInteger(endHour) || startHour < 0 || endHour > 24 || startHour >= endHour || !weekdays.size) throw new HttpError(500, 'Invalid booking slot configuration')
  return { startHour, endHour, weekdays }
}
export function allowedSlot(start: Date, end: Date): boolean {
  const { startHour, endHour, weekdays } = slotConfig()
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: process.env.BOOKING_TIMEZONE || 'Asia/Manila', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(start)
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(values.weekday)
  const minute = Number(values.minute); const hour = Number(values.hour) % 24
  const duration = end.getTime() - start.getTime()
  return weekdays.has(day) && minute % 30 === 0 && hour >= startHour && (hour + duration / 3600000) <= endHour
}

export async function getGoogleClient(): Promise<OAuth2Client> {
  const missing = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REFRESH_TOKEN'].find((key) => !process.env[key]?.trim())
  if (missing) throw new HttpError(500, `Missing server configuration: ${missing}`)
  return new OAuth2Client(process.env.GOOGLE_CLIENT_ID!, process.env.GOOGLE_CLIENT_SECRET!, process.env.GOOGLE_REFRESH_TOKEN!)
}

export function parseIsoDate(value: unknown, label: string): Date {
  if (typeof value !== 'string' || !value.trim()) throw new HttpError(400, `${label} is required`)
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) throw new HttpError(400, `${label} must be an ISO date with timezone`)
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) throw new HttpError(400, `${label} must be an ISO date`)
  return date
}

export function validateBookingInput(value: unknown): { start: Date; end: Date; name: string; email: string; message: string } {
  if (!value || typeof value !== 'object') throw new HttpError(400, 'Booking body must be an object')
  const body = value as Record<string, unknown>
  const start = parseIsoDate(body.start, 'start')
  const end = parseIsoDate(body.end, 'end')
  const duration = end.getTime() - start.getTime()
  if (duration <= 0) throw new HttpError(400, 'end must be after start')
  if (duration > 120 * 60 * 1000) throw new HttpError(400, 'Booking duration cannot exceed 120 minutes')
  const startText = body.start as string
  const startMinute = Number(startText.slice(14, 16))
  if (![0, 30].includes(startMinute) || duration % (30 * 60 * 1000) !== 0) throw new HttpError(400, 'Bookings must use 30-minute slots')
  const minimumStart = Date.now() + Number(process.env.BOOKING_MIN_LEAD_MINUTES || 0) * 60 * 1000
  const maximumStart = Date.now() + Number(process.env.BOOKING_MAX_DAYS || 62) * 24 * 60 * 60 * 1000
  if (start.getTime() < minimumStart) throw new HttpError(400, 'Booking start cannot be in the past')
  if (start.getTime() > maximumStart) throw new HttpError(400, 'Booking start is outside the booking window')
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
      const attendees = [{ email: input.email }]
      const hostEmail = process.env.BOOKING_HOST_EMAIL || process.env.GOOGLE_CALENDAR_OWNER_EMAIL
      if (hostEmail) attendees.push({ email: hostEmail })
      const event = { summary: `Portfolio call with ${input.name}`, description: input.message, start: { dateTime: input.start.toISOString(), timeZone: process.env.BOOKING_TIMEZONE || 'Asia/Manila' }, end: { dateTime: input.end.toISOString(), timeZone: process.env.BOOKING_TIMEZONE || 'Asia/Manila' }, attendees }
      return request(`/calendars/${encodeURIComponent(calendarId())}/events?sendUpdates=all`, { method: 'POST', body: JSON.stringify(event) })
    },
  }
}

export async function configuredCalendarService(): Promise<CalendarService> { return createGoogleCalendarService(await getGoogleClient()) }
