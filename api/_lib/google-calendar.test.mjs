import assert from 'node:assert/strict'
import test from 'node:test'
import { calendarId, validateBookingInput, getGoogleClient, slotTokenFor, verifySlotToken, eventIdForSlot } from './google-calendar.ts'

// A date a week out, so tests don't start failing once a hardcoded date passes.
const future = (hour, minute = 0, offset = 'Z') => { const d = new Date(Date.now() + 7 * 86_400_000); return `${d.toISOString().slice(0, 10)}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00${offset}` }

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
    start: future(10, 0, '+08:00'), end: future(11, 0, '+08:00'),
    name: 'Ron', email: 'ron@example.com', message: 'Hello',
  })
  assert.equal(booking.name, 'Ron')
  assert.equal(booking.email, 'ron@example.com')
  assert.equal(booking.end.getTime() - booking.start.getTime(), 60 * 60 * 1000)
})

test('rejects malformed email and overlong bookings', () => {
  assert.throws(() => validateBookingInput({ start: future(10), end: future(11), name: 'Ron', email: 'bad', message: '' }), /email/i)
  assert.throws(() => validateBookingInput({ start: future(10), end: future(12, 1), name: 'Ron', email: 'ron@example.com' }), /120/i)
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

test('derives unique valid Google event ids for the same slot', () => {
  const first = eventIdForSlot('2026-11-10T10:00:00.000Z', '2026-11-10T11:00:00.000Z')
  const second = eventIdForSlot('2026-11-10T10:00:00.000Z', '2026-11-10T11:00:00.000Z')
  assert.notEqual(first, second)
  assert.match(first, /^[a-f0-9]{48}$/)
  assert.match(second, /^[a-f0-9]{48}$/)
})

test('caps field lengths so the invite email cannot be stuffed', () => {
  const base = { start: future(10), end: future(11), email: 'ron@example.com' }
  assert.throws(() => validateBookingInput({ ...base, name: 'a'.repeat(101) }), /name cannot exceed/i)
  assert.throws(() => validateBookingInput({ ...base, name: 'Ron', message: 'a'.repeat(1001) }), /message cannot exceed/i)
  assert.throws(() => validateBookingInput({ ...base, name: 'Ron', email: `${'a'.repeat(250)}@x.co` }), /email/i)
})

test('keeps links out of the invite subject and body', () => {
  const base = { start: future(10), end: future(11), email: 'ron@example.com' }
  assert.throws(() => validateBookingInput({ ...base, name: 'Claim prize at evil.com' }), /links/i)
  assert.throws(() => validateBookingInput({ ...base, name: 'https://evil.example/x' }), /links/i)
  const booking = validateBookingInput({ ...base, name: 'Ron', message: 'See https://evil.example/login and www.phish.net/a, or bit.ly/x. Thanks!' })
  assert.equal(booking.message, 'See [link removed] and [link removed] or [link removed] Thanks!')
  assert.doesNotMatch(booking.message, /evil|phish|bit\.ly/)
})

test('strips control and bidi-override characters from text fields', () => {
  const base = { start: future(10), end: future(11), email: 'ron@example.com' }
  const booking = validateBookingInput({ ...base, name: 'Ro‮n\u0000  Salvador', message: 'line one\nline​ two' })
  assert.equal(booking.name, 'Ron Salvador')
  assert.equal(booking.message, 'line one\nline two')
})
