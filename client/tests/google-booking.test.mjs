import assert from 'node:assert/strict'
import test from 'node:test'
import { googleBookingUrl } from '../src/lib/google-booking.ts'

test('only embeds a Google appointment schedule over HTTPS', () => {
  const url = 'https://calendar.google.com/calendar/appointments/schedules/example'
  assert.equal(googleBookingUrl(`  ${url}  `), `${url}?gv=true`)
  assert.equal(googleBookingUrl(`${url}?foo=bar`), `${url}?foo=bar&gv=true`)
  for (const invalid of ['', 'javascript:alert(1)', 'http://calendar.google.com/calendar/appointments/schedules/a', 'https://calendar.google.com.evil.test/calendar/appointments/schedules/a', 'https://calendar.google.com/calendar/u/0/r', 'https://example.com', 'https://user:secret@calendar.google.com/calendar/appointments/schedules/a']) {
    assert.equal(googleBookingUrl(invalid), null)
  }
})
