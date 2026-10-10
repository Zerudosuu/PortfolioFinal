# Vercel Calendar API settings

The live availability endpoint returns signed slot tokens. The booking endpoint requires the token to match the exact start and end timestamps, so clients cannot submit arbitrary times outside the configured schedule.

Set these Vercel environment variables for production:

- `BOOKING_SLOT_SECRET`: long random secret used to sign short-lived slot tokens.
- `BOOKING_TIMEZONE`: IANA time zone, normally `Asia/Manila`.
- `BOOKING_START_HOUR`: local starting hour, default `9`.
- `BOOKING_END_HOUR`: local ending hour (exclusive), default `17`.
- `BOOKING_WEEKDAYS`: comma-separated local weekday numbers (`0` Sunday through `6` Saturday), default `1,2,3,4,5`.
- `BOOKING_TOKEN_TTL_SECONDS`: token lifetime, default `900`.
- `BOOKING_HOST_EMAIL`: host attendee added to every created event.
- `BOOKING_MIN_LEAD_MINUTES` and `BOOKING_MAX_DAYS`: optional booking window limits.

The current rate limiter is process-local and caps each client at 10 booking attempts per 10 minutes. This is a best-effort abuse control on Vercel's serverless runtime: instances do not share memory. Signed slot tokens, Google free/busy rechecks, and the 120-minute limit remain the authoritative booking protections. Use a shared Vercel-compatible store if stronger cross-instance rate limiting becomes necessary.

Each event uses a deterministic SHA-256 Google event ID derived from the normalized slot start and end. Concurrent inserts for the same slot therefore collide at Google; the API maps Google's duplicate-event `409` response to the booking conflict response.
