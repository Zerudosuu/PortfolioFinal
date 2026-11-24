import assert from 'node:assert/strict'
import test from 'node:test'
import { clientKey, createRateLimiter } from './rate-limit.ts'

test('allows up to the limit then rejects with 429 until the window resets', () => {
  const check = createRateLimiter(2, 1000)
  check('a', 0); check('a', 1)
  assert.throws(() => check('a', 2), (e) => e.statusCode === 429)
  check('b', 2)
  check('a', 1001)
})

test('bounds memory by evicting expired entries', () => {
  const check = createRateLimiter(1, 10, 3)
  check('a', 0); check('b', 0); check('c', 0)
  check('d', 20)
  assert.doesNotThrow(() => check('a', 20))
})

test('derives the client key from the first forwarded address', () => {
  assert.equal(clientKey({ headers: { 'x-forwarded-for': '1.2.3.4, 10.0.0.1' } }), '1.2.3.4')
  assert.equal(clientKey({ headers: {} }), 'anonymous')
})
