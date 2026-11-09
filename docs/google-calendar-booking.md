# Google Calendar booking

The booking route supports Google's inline appointment scheduler. Google owns availability, the booking form, reservations and confirmation emails; the portfolio does not need private Google credentials.

## Connect Ron's calendar

1. Sign into Google Calendar as **ronsalvador.m@gmail.com** on a computer.
2. Create an **Appointment schedule** on that account's calendar. Set the duration, working hours and **Asia/Manila** time zone. Enable calendar availability checks to avoid conflicting appointments.
3. Choose the meeting location (for example, Google Meet). In the booking form, add a field for the visitor's message if desired. Review **Booking confirmations and reminders**. Some reminder features require a paid Google plan.
4. Save, then open **Sharing options → Website embed → Inline booking page**. Copy the iframe's `src` URL, not the full HTML or a private calendar URL.
5. Paste that public `https://calendar.google.com/calendar/appointments/schedules/...` URL into `googleBookingUrl` in [scheduling.json](../client/src/content/scheduling.json). Account-indexed `/calendar/u/0/appointments/schedules/...` URLs are also accepted. A shortened `calendar.app.google` link can be placed in `bookingUrl`; the site will hand visitors to Google's live booking page.
6. Reload the local site. The booking page displays the live scheduler instead of demo dates. Existing generic `bookingUrl` support remains for other providers when a Google schedule is not configured.

An email address alone cannot connect a calendar. Until a valid schedule URL is configured, the page explicitly remains a preview. The email fallback only opens the visitor's email application; it does not submit a booking or send an automatic notification.

## Verify a real booking

- From a separate visitor account, select a future slot and complete Google's form.
- Verify the reservation appears on Ron's calendar and confirmation emails arrive for the host and visitor, including Spam if needed.
- Reload the booking page and confirm the reserved slot is no longer available.
- Cancel the test appointment and confirm the cancellation and availability update.
- Test the standalone link if the browser blocks embedded third-party content.

SMS, WhatsApp and Telegram delivery are **not configured**. They require choosing a channel and connecting its provider. A Calendar event reminder is not the same as an immediate new-booking message.

## Sources

- [Create an appointment schedule](https://support.google.com/calendar/answer/10729749)
- [Embed and share a booking page](https://support.google.com/calendar/answer/10733297)

## Local checks

From `client/`: `node --test tests/google-booking.test.mjs`, `npm run lint`, and `npm run build`.
