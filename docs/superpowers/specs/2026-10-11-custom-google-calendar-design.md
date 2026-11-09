# Custom Google Calendar Booking Design

## Goal

Replace the Google booking-link handoff with a portfolio-native calendar that reads live availability from Ron's Google Calendar and creates confirmed events without redirecting visitors.

## Architecture

The React client renders the custom calendar and calls two Vercel Functions: `GET /api/availability` and `POST /api/book`. The functions use Google OAuth credentials and a refresh token stored in Vercel encrypted environment variables. Availability uses the narrow `calendar.freebusy` scope; booking uses `calendar.events`.

The booking function rechecks free/busy immediately before inserting the event, rejects an occupied slot with HTTP 409, and sends Google Calendar invitations to the visitor and Ron. The client never receives Google tokens or client secrets.

## Configuration

Required Vercel environment variables: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`, `GOOGLE_CALENDAR_ID` (default `primary`), and `BOOKING_TIMEZONE` (default `Asia/Manila`). OAuth redirect URI is `/api/google/callback` on the deployed Vercel origin. A one-time admin authorization flow produces the refresh token; no token is committed to the repository.

## Booking contract

`GET /api/availability?from=ISO&to=ISO` returns `{busy: Array<{start: string; end: string}>}` and validates an ISO range no longer than 62 days.

`POST /api/book` accepts `{start: string; end: string; name: string; email: string; message?: string}` and returns `{eventId, htmlLink}` on success. It rejects malformed dates, non-positive duration, durations over 120 minutes, invalid email, and conflicts.

## UX

The booking page shows a month grid using live busy ranges, disables occupied slots, collects name/email/message, and displays clear loading, conflict, and success states. The existing Google-link fallback stays available when API environment variables are absent.
