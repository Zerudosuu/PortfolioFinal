import assert from 'node:assert/strict'
import test from 'node:test'
import { createAvailabilityHandler } from './availability.ts'
import { createBookingHandler } from './book.ts'

function response() { return { statusCode: 200, body: null, status(code) { this.statusCode = code; return this }, json(body) { this.body = body; return this } } }
function request(method, query, body) { return { method, query, body } }
const service = {
  async freeBusy() { return [{ start: '2026-11-10T10:00:00Z', end: '2026-11-10T11:00:00Z' }] },
  async insert() { return { id: 'event-1', htmlLink: 'https://calendar.google.com/event-1' } },
}

test('availability rejects ranges over 62 days', async () => {
  const res = response()
  await createAvailabilityHandler(service)(request('GET', { from: '2026-01-01T00:00:00Z', to: '2026-04-01T00:00:00Z' }), res)
  assert.equal(res.statusCode, 400)
})

test('availability returns busy intervals', async () => {
  const res = response()
  await createAvailabilityHandler(service)(request('GET', { from: '2026-11-10T00:00:00Z', to: '2026-11-11T00:00:00Z' }), res)
  assert.deepEqual(res.body, { busy: await service.freeBusy() })
})

test('booking rejects missing fields', async () => {
  const res = response()
  await createBookingHandler(service)(request('POST', {}, { start: '2026-11-10T10:00:00Z' }), res)
  assert.equal(res.statusCode, 400)
})

test('booking returns event shape when slot is free', async () => {
  const res = response()
  await createBookingHandler(service)(request('POST', {}, { start: '2026-11-10T12:00:00Z', end: '2026-11-10T13:00:00Z', name: 'Ron', email: 'ron@example.com' }), res)
  assert.equal(res.statusCode, 200)
  assert.deepEqual(res.body, { eventId: 'event-1', htmlLink: 'https://calendar.google.com/event-1' })
})

test('booking rejects a malformed Google event response', async () => {
  const res = response()
  const invalidService = { ...service, async insert() { return { id: '', htmlLink: '' } } }
  await createBookingHandler(invalidService)(request('POST', {}, { start: '2026-11-10T12:00:00Z', end: '2026-11-10T13:00:00Z', name: 'Ron', email: 'ron@example.com' }), res)
  assert.equal(res.statusCode, 502)
})

test('booking returns conflict when recheck overlaps', async () => {
  const conflict = { async freeBusy() { return [{ start: '2026-11-10T12:30:00Z', end: '2026-11-10T13:30:00Z' }] }, async insert() { throw new Error('must not insert') } }
  const res = response()
  await createBookingHandler(conflict)(request('POST', {}, { start: '2026-11-10T12:00:00Z', end: '2026-11-10T13:00:00Z', name: 'Ron', email: 'ron@example.com' }), res)
  assert.equal(res.statusCode, 409)
})

test('booking rate limits repeated attempts from one client', async () => {
  const handler = createBookingHandler(service)
  const body = { start: '2026-11-11T12:00:00Z', end: '2026-11-11T13:00:00Z', name: 'Ron', email: 'ron@example.com' }
  let last
  for (let index = 0; index < 11; index++) {
    last = response()
    await handler({ ...request('POST', {}, body), headers: { 'x-forwarded-for': 'rate-test' } }, last)
  }
  assert.equal(last.statusCode, 429)
})
