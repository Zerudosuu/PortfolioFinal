# Welcome and Scheduling Flow Design

**Date:** 2026-10-08

## Goal

Add a session-gated welcome experience that introduces Ronald, routes visitors either to the existing portfolio or to a scheduling view, and keeps scheduling accessible from the portfolio afterward.

## Context

The project is a single-page React 19/Vite portfolio in `client/`. The main interface is a dense bento layout with a tools marquee header, a mascot portrait, GSAP-powered modal cards, and a `mailto:` contact form. There is no backend or calendar provider integration.

The first phase intentionally uses a local demo calendar. A future scheduling provider or Google Calendar integration must be connected through a configurable booking URL or a backend/OAuth layer; private calendar credentials must not be shipped to the browser.

## User Flow

1. On a new browser session, show a full-screen welcome overlay before the portfolio.
2. Animate a short greeting: “Hi, I’m Ronald.”
3. Offer two primary choices:
   - **Just visiting**: dismiss the welcome overlay and reveal the existing portfolio.
   - **I’m a client**: mark the welcome flow complete and open the scheduling view.
4. Persist completion in `sessionStorage`, so a refresh in the same tab skips the welcome overlay. A new browser session shows it again.
5. Keep an explicit “View portfolio” fallback in the welcome view so visitors are never blocked.
6. After entering the portfolio, expose **Schedule a call**:
   - in the existing Contact modal;
   - as a compact CTA in the tools marquee header.
7. Opening the CTA shows the scheduling view. Closing it returns the user to the portfolio or the Contact modal that launched it.
8. The scheduling view provides a deterministic demo month, month navigation, selectable available time slots, timezone/booking context, and a configurable **Continue to booking** action.

## Visual and Motion Direction

- Reuse the current theme variables, amber accent, JetBrains Mono body font, Merriweather heading font, border treatments, and modal conventions.
- Welcome motion sequence:
  - backdrop fade;
  - greeting rise/fade;
  - staggered choice cards;
  - short exit transition when a choice is selected.
- Keep motion brief and purposeful. Respect `prefers-reduced-motion: reduce` by disabling entrance/exit animation and showing the final state immediately.
- The scheduling view should use the existing modal visual language rather than introducing a new page shell.
- Keep the existing mascot portrait as the visual anchor where space allows.

## Components and Boundaries

### Welcome overlay

Owns:

- first-session detection;
- `sessionStorage` persistence;
- welcome choice actions;
- focus management, Escape handling, and reduced-motion behavior.

Does not own calendar rendering or portfolio layout.

### Scheduling view

Owns:

- local demo availability data;
- month navigation;
- selected date and time state;
- booking CTA;
- close behavior.

Does not own external calendar authentication or private email access.

### Portfolio entry points

The main `App` wires the welcome overlay, scheduling view, header CTA, and Contact modal CTA into the existing modal state without changing existing card behavior.

### Content/config

Add a small content/config source for:

- greeting and choice copy;
- scheduling label and explanatory copy;
- timezone;
- demo booking URL.

The booking URL must be a single replaceable value and should default to a safe placeholder or configured demo URL that is visibly treated as a future handoff.

## Accessibility and Error Handling

- Use semantic dialog markup with an accessible label.
- Move focus into the active overlay/modal and return focus to the launching control when it closes.
- Support keyboard activation for all choices, calendar dates, and time slots.
- Do not trap users in the welcome view: the portfolio fallback is always available.
- Mark unavailable dates and times as disabled rather than clickable.
- If the booking URL is absent or still a placeholder, show an explicit non-blocking message and keep the selected slot visible; do not silently navigate to an invalid URL.
- Preserve body scroll locking and Escape-to-close conventions used by existing modals.
- Do not expose email/calendar credentials in client code.

## Responsive Behavior

- On desktop, show the welcome choices side-by-side and calendar date/time selection in two columns.
- On narrow screens, stack welcome choices and calendar controls vertically.
- Keep primary actions reachable without horizontal scrolling.
- Preserve the existing responsive grid after the overlay is dismissed.

## Verification

Run the existing client checks:

- `npm run typecheck`
- `npm run lint`
- `npm run build`

Use the running Vite app for browser verification:

- first tab/session shows the welcome overlay;
- “Just visiting” reveals the portfolio;
- “I’m a client” opens scheduling;
- same-session refresh skips welcome;
- a cleared/new session shows welcome again;
- header and Contact modal scheduling CTAs both open scheduling;
- month navigation, date selection, unavailable states, and time selection work;
- closing scheduling returns to the correct portfolio context;
- narrow viewport remains usable;
- reduced-motion preference removes transition choreography.
