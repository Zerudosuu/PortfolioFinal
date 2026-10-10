import assert from 'node:assert/strict'
import test from 'node:test'
import { calendarId, validateBookingInput, getGoogleClient, slotTokenFor, verifySlotToken } from './google-calendar.ts'

const originalEnv = { ...process.env }
test.afterEach(() => {
  for (const key of Object.keys(process.env)) if (!(key in originalEnv)) delete process.env[key]
  Object.assign(process.env, originalEnv)
})

test('requires OAuth environment variables', async () => {
  for (const key of ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REFRESH_TOKEN']) {
    process.env.GOOGLE_CLIENT_ID = 'id'
    process.env.GOOGLE_CLIENT_SECRET = 'secret'
    process.env.GOOGLE_REFRESH_TOKEN = 'refresh'
    delete process.env[key]
    await assert.rejects(getGoogleClient(), (error) => error.statusCode === 500 && error.message.includes(key))
  }
})

test('uses configured calendar or primary by default', () => {
  delete process.env.GOOGLE_CALENDAR_ID
  assert.equal(calendarId(), 'primary')
  process.env.GOOGLE_CALENDAR_ID = 'work@example.com'
  assert.equal(calendarId(), 'work@example.com')
})

test('validates a booking payload', () => {
  const booking = validateBookingInput({
    start: '2026-11-10T10:00:00+08:00', end: '2026-11-10T11:00:00+08:00',
    name: 'Ron', email: 'ron@example.com', message: 'Hello',
  })
  assert.equal(booking.name, 'Ron')
  assert.equal(booking.email, 'ron@example.com')
  assert.equal(booking.end.getTime() - booking.start.getTime(), 60 * 60 * 1000)
})

test('rejects malformed email and overlong bookings', () => {
  assert.throws(() => validateBookingInput({ start: '2026-11-10T10:00:00Z', end: '2026-11-10T11:00:00Z', name: 'Ron', email: 'bad', message: '' }), /email/i)
  assert.throws(() => validateBookingInput({ start: '2026-11-10T10:00:00Z', end: '2026-11-10T12:01:00Z', name: 'Ron', email: 'ron@example.com' }), /120/i)
})

test('requires timezone-bearing ISO dates and 30-minute slots', () => {
  const base = { name: 'Ron', email: 'ron@example.com' }
  assert.throws(() => validateBookingInput({ ...base, start: '2026-11-10T10:00:00', end: '2026-11-10T11:00:00Z' }), /timezone/i)
  assert.throws(() => validateBookingInput({ ...base, start: '2026-11-10T10:15:00Z', end: '2026-11-10T11:15:00Z' }), /30-minute/i)
})

test('rejects past booking starts', () => {
  assert.throws(() => validateBookingInput({ name: 'Ron', email: 'ron@example.com', start: '2020-11-10T10:00:00Z', end: '2020-11-10T11:00:00Z' }), /past/i)
})

test('signs and verifies allowlisted slot tokens', () => {
  process.env.BOOKING_SLOT_SECRET = 'test-secret'
  const start = '2026-11-10T10:00:00.000Z'
  const end = '2026-11-10T10:30:00.000Z'
  const token = slotTokenFor(start, end, Date.now() + 60_000)
  assert.deepEqual(verifySlotToken(token, start, end), { start, end })
  assert.throws(() => verifySlotToken(token, start, '2026-11-10T11:00:00.000Z'), /slot token/i)
})
