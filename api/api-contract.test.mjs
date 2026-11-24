import assert from 'node:assert/strict'
import test from 'node:test'
import { createAvailabilityHandler } from './availability.ts'
import { createBookingHandler } from './book.ts'
import { slotTokenFor } from './_lib/google-calendar.ts'
process.env.BOOKING_TIMEZONE = 'UTC'
process.env.BOOKING_WEEKDAYS = '0,1,2,3,4,5,6'

// Dates relative to now so the suite doesn't rot once fixed dates pass.
function futureDay(days = 7) { const d = new Date(Date.now() + days * 86_400_000); d.setUTCHours(0, 0, 0, 0); return d }
function at(day, hour, minute = 0) { const d = new Date(day); d.setUTCHours(hour, minute, 0, 0); return d.toISOString() }
const day = futureDay()

function response() { return { statusCode: 200, body: null, headers: {}, status(code) { this.statusCode = code; return this }, json(body) { this.body = body; return this }, setHeader(k, v) { this.headers[k.toLowerCase()] = v; return this } } }
function request(method, query, body) { return { method, query, body } }
const noLimit = () => {}
const service = {
  async freeBusy() { return [{ start: at(day, 10), end: at(day, 11) }] },
  async insert() { return { id: 'event-1', htmlLink: 'https://calendar.google.com/event-1' } },
}
function bookingBody(start, end, extra = {}) { return { start, end, token: slotTokenFor(start, end, Date.now() + 60_000), name: 'Ron', email: 'ron@example.com', ...extra } }

test('availability rejects ranges over 62 days', async () => {
  const res = response()
  await createAvailabilityHandler(service, noLimit)(request('GET', { from: at(day, 0), to: at(futureDay(80), 0) }), res)
  assert.equal(res.statusCode, 400)
})

test('availability returns signed free slots but not raw busy ranges', async () => {
  process.env.BOOKING_SLOT_SECRET = 'test-secret'
  const res = response()
  await createAvailabilityHandler(service, noLimit)(request('GET', { from: at(day, 0), to: at(futureDay(8), 0) }), res)
  assert.equal(res.statusCode, 200)
  assert.equal(res.body.busy, undefined)
  assert.ok(res.body.slots.some((slot) => slot.token))
  assert.ok(!res.body.slots.some((slot) => slot.start === at(day, 10)), 'busy slot must not be offered')
  assert.equal(res.headers['cache-control'], 'no-store')
})

test('availability is rate limited', async () => {
  process.env.BOOKING_SLOT_SECRET = 'test-secret'
  const limited = () => { const e = new Error('Too many requests'); e.statusCode = 429; throw e }
  const res = response()
  await createAvailabilityHandler(service, limited)(request('GET', { from: at(day, 0), to: at(futureDay(8), 0) }), res)
  assert.equal(res.statusCode, 429)
})

test('booking rejects missing fields', async () => {
  const res = response()
  await createBookingHandler(service, noLimit)(request('POST', {}, { start: at(day, 10) }), res)
  assert.equal(res.statusCode, 400)
})

test('booking returns confirmation without the host calendar link', async () => {
  process.env.BOOKING_SLOT_SECRET = 'test-secret'
  const res = response()
  await createBookingHandler(service, noLimit)(request('POST', {}, bookingBody(at(day, 12), at(day, 13))), res)
  assert.equal(res.statusCode, 200)
  assert.deepEqual(res.body, { eventId: 'event-1' })
})

test('booking rejects a malformed Google event response', async () => {
  process.env.BOOKING_SLOT_SECRET = 'test-secret'
  const res = response()
  const invalidService = { ...service, async insert() { return { id: '', htmlLink: '' } } }
  await createBookingHandler(invalidService, noLimit)(request('POST', {}, bookingBody(at(day, 12), at(day, 13))), res)
  assert.equal(res.statusCode, 502)
})

test('booking returns conflict when recheck overlaps', async () => {
  process.env.BOOKING_SLOT_SECRET = 'test-secret'
  const conflict = { async freeBusy() { return [{ start: at(day, 12, 30), end: at(day, 13, 30) }] }, async insert() { throw new Error('must not insert') } }
  const res = response()
  await createBookingHandler(conflict, noLimit)(request('POST', {}, bookingBody(at(day, 12), at(day, 13))), res)
  assert.equal(res.statusCode, 409)
})

test('booking rate limits repeated attempts from one client', async () => {
  process.env.BOOKING_SLOT_SECRET = 'test-secret'
  const handler = createBookingHandler(service)
  const body = bookingBody(at(day, 14), at(day, 15))
  let last
  for (let index = 0; index < 4; index++) {
    last = response()
    await handler({ ...request('POST', {}, body), headers: { 'x-forwarded-for': 'rate-test' } }, last)
  }
  assert.equal(last.statusCode, 429)
})

test('booking hides internal configuration errors', async () => {
  delete process.env.BOOKING_SLOT_SECRET
  const res = response()
  await createBookingHandler(service, noLimit)(request('POST', {}, { start: at(day, 12), end: at(day, 13), token: 'x.y', name: 'Ron', email: 'ron@example.com' }), res)
  assert.equal(res.statusCode, 500)
  assert.equal(res.body.error, 'Internal server error')
})
