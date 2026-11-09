# Custom Google Calendar Booking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Vercel-hosted, portfolio-native booking calendar backed by Ron's Google Calendar.

**Architecture:** React calls Vercel Functions for live free/busy data and event creation. Google OAuth uses a refresh token stored only in Vercel environment variables; the server rechecks availability before creating each event.

**Tech Stack:** React 19, TypeScript, Vite, Vercel Functions, Google Calendar REST API, Node's built-in test runner.

**Spec:** `docs/superpowers/specs/2026-10-11-custom-google-calendar-design.md`

## Global Constraints

- Never expose Google client secrets or refresh tokens to the browser.
- Use `Asia/Manila` as the default time zone.
- Keep the existing dark/light pixel transition and portfolio visual language.
- Preserve the Google booking-link fallback when API configuration is absent.
- Availability queries must cover no more than 62 days.
- Booking duration must be positive and no more than 120 minutes.

---

### Task 1: Add Google Calendar server utilities

**Files:**
- Create: `api/_lib/google-calendar.ts`
- Test: `api/_lib/google-calendar.test.mjs`

**Interfaces:**
- Produces `getGoogleClient(): Promise<OAuth2Client>` and `calendarId(): string`.
- Produces `validateBookingInput(value: unknown): {start: Date; end: Date; name: string; email: string; message: string}` or throws an HTTP-safe error.

- [ ] Write tests for missing environment variables, valid input, malformed email, and over-120-minute input.
- [ ] Run `node --test api/_lib/google-calendar.test.mjs` and verify it fails because utilities do not exist.
- [ ] Implement OAuth client creation from `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`, and `GOOGLE_CALENDAR_ID`.
- [ ] Run the focused test and verify it passes without network access.

### Task 2: Add availability and booking endpoints

**Files:**
- Create: `api/availability.ts`
- Create: `api/book.ts`
- Test: `api/api-contract.test.mjs`

**Interfaces:**
- `GET /api/availability?from=ISO&to=ISO` returns `{busy}`.
- `POST /api/book` accepts the booking contract and returns `{eventId, htmlLink}`.

- [ ] Write contract tests for invalid ranges, missing fields, conflict responses, and successful response shapes using injected Google service fakes.
- [ ] Run the focused tests and verify failure before implementation.
- [ ] Implement free/busy querying with `freebusy.query` and event creation with `events.insert`, including `sendUpdates: "all"`.
- [ ] Recheck free/busy inside the booking request immediately before insertion; return HTTP 409 for overlap.
- [ ] Run focused tests and verify all pass.

### Task 3: Add OAuth bootstrap endpoint and deployment configuration

**Files:**
- Create: `api/google/start.ts`
- Create: `api/google/callback.ts`
- Create: `docs/vercel-google-calendar-setup.md`
- Modify: `.gitignore`

- [ ] Implement an admin-only start/callback flow that exchanges the OAuth code and displays the refresh token once without storing it in source control.
- [ ] Document Google Cloud OAuth consent setup, redirect URI, required scopes, and Vercel environment variables.
- [ ] Document setting `GOOGLE_CALENDAR_ID=primary`, `BOOKING_TIMEZONE=Asia/Manila`, and redeploying.
- [ ] Verify no `.env` or token file is tracked.

### Task 4: Replace demo calendar UI with live availability

**Files:**
- Modify: `client/src/components/schedule-page.tsx`
- Modify: `client/src/content/scheduling.json`
- Modify: `client/src/entry-pages.css`

- [ ] Add month-range fetching from `/api/availability` and map busy intervals to disabled dates/times.
- [ ] Add a booking form for name, email, and message with client-side validation.
- [ ] Submit to `/api/book`, show loading/success/conflict/error states, and retain the Google-link fallback if API is unavailable.
- [ ] Preserve responsive layout, keyboard access, and reduced-motion behavior.

### Task 5: Verify the complete flow

**Files:**
- Modify: `client/tests/google-booking.test.mjs`
- Create: `client/tests/schedule-flow.test.mjs`

- [ ] Add tests for unavailable slots, valid booking payloads, and 409 conflict handling.
- [ ] Run `node --test tests/*.mjs` from `client/`.
- [ ] Run `npm run build`.
- [ ] Run the local browser flow with mocked API responses: load availability, disable a busy slot, submit a booking, display success, and display conflict.
- [ ] Run `git diff --check` and the Impeccable detector on changed UI files.
