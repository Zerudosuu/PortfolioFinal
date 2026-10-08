# Welcome and Scheduling Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a session-gated animated welcome flow, local demo scheduling calendar, and reusable scheduling CTAs without disrupting the existing portfolio.

**Architecture:** Keep the existing `App` as the composition root, but move the new welcome and scheduling UI into focused components. Store copy and demo availability in JSON content files, use `sessionStorage` only for welcome completion, and pass explicit close/booking callbacks from `App` so scheduling can be opened from the welcome flow, header CTA, or Contact modal.

**Tech Stack:** React 19, TypeScript, Vite, GSAP, Tailwind CSS v4, existing theme/modal utilities, JSON content files.

**Spec:** `docs/superpowers/specs/2026-10-08-welcome-scheduling-flow-design.md`

## Global Constraints

- Use a local demo calendar only; never expose email/calendar credentials in client code.
- Show welcome on a new browser session and skip it after completion in the same `sessionStorage` session.
- Preserve the current portfolio layout, theme, modal conventions, and `mailto:` contact behavior.
- Respect `prefers-reduced-motion: reduce`.
- Keep all primary actions keyboard accessible and use semantic dialog markup.
- Keep the booking URL in one replaceable content/config value and do not navigate to an empty or placeholder URL.

---

### Task 1: Add welcome and scheduling content data

**Files:**
- Create: `client/src/content/welcome.json`
- Create: `client/src/content/scheduling.json`

**Interfaces:**
- Produces `welcomeData` with `label`, `title`, `body`, `visitingChoice`, `clientChoice`, and `portfolioFallback` strings.
- Produces `schedulingData` with `label`, `title`, `description`, `timezone`, `bookingUrl`, `bookingLabel`, `emptyBookingMessage`, `weekdays`, `months`, `availableDates`, and `timeSlots`.

- [ ] **Step 1: Write the welcome content**

Create `welcome.json` with copy matching the approved flow:

```json
{
  "label": "WELCOME",
  "title": "Hi, I'm Ronald.",
  "body": "A quick hello before you explore.",
  "visitingChoice": {
    "title": "Just visiting",
    "description": "Take a look around the portfolio."
  },
  "clientChoice": {
    "title": "I'm a client",
    "description": "Find a time for us to talk."
  },
  "portfolioFallback": "VIEW PORTFOLIO"
}
```

- [ ] **Step 2: Write deterministic scheduling content**

Create `scheduling.json` with a fixed 2026 demo month, explicit available dates, 30-minute slots, and a visibly replaceable booking URL:

```json
{
  "label": "SCHEDULE A CALL",
  "title": "Find a time to talk",
  "description": "Pick a demo availability window. This calendar is ready to connect to your booking provider.",
  "timezone": "Asia/Manila (GMT+8)",
  "bookingUrl": "",
  "bookingLabel": "CONTINUE TO BOOKING",
  "emptyBookingMessage": "Choose a time above. A live booking link can be added when your calendar provider is connected.",
  "weekdays": ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"],
  "months": ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"],
  "availableDates": ["2026-10-08", "2026-10-09", "2026-10-12", "2026-10-14", "2026-10-16", "2026-10-20", "2026-10-22"],
  "timeSlots": ["09:00", "10:30", "13:00", "14:30", "16:00"]
}
```

- [ ] **Step 3: Verify JSON imports**

Run: `npm run typecheck` from `client`

Expected: PASS with the new JSON imports not yet consumed or with no JSON syntax errors.

- [ ] **Step 4: Commit**

```bash
git add client/src/content/welcome.json client/src/content/scheduling.json
git commit -m "feat: add welcome and scheduling content"
```

### Task 2: Build the session-gated welcome overlay

**Files:**
- Create: `client/src/components/welcome-overlay.tsx`
- Modify: `client/src/index.css`

**Interfaces:**
- Consumes `welcomeData` from `client/src/content/welcome.json`.
- Exports `WelcomeOverlayProps`:
  - `onVisiting: () => void`
  - `onClient: () => void`
- Renders `role="dialog"` with `aria-modal="true"` and a labelled heading.
- Does not manage calendar state.

- [ ] **Step 1: Add the component shell**

Implement `WelcomeOverlay` with a fixed full-screen backdrop, a semantic dialog panel, greeting copy, two choice buttons, and a fallback portfolio button. Add a `panelRef` and `fallbackRef` for focus management.

- [ ] **Step 2: Add focus and keyboard behavior**

On mount, focus the fallback portfolio button, save the previously focused element, and restore it on unmount. Add a `keydown` listener that lets Escape invoke `onVisiting`. Use real `<button>` elements so Enter and Space work without custom keyboard handlers.

- [ ] **Step 3: Add reduced-motion-aware transition state**

Use a local `closing` state. When a choice is selected, set `closing` and invoke the callback after the exit transition; if `matchMedia("(prefers-reduced-motion: reduce)")` matches, invoke immediately. Add `aria-live="polite"` only for the static greeting, not for the entire interactive dialog.

- [ ] **Step 4: Add CSS animation classes**

In `index.css`, add `welcome-backdrop-enter`, `welcome-panel-enter`, `welcome-item-enter`, and `welcome-exit` keyframes/classes. Wrap all animated rules in a `@media (prefers-reduced-motion: no-preference)` block and keep the base classes visually complete without animation.

- [ ] **Step 5: Run targeted checks**

Run: `npm run typecheck && npm run lint` from `client`

Expected: PASS with no unused imports, hook dependency errors, or implicit `any` types.

- [ ] **Step 6: Commit**

```bash
git add client/src/components/welcome-overlay.tsx client/src/index.css
git commit -m "feat: add session welcome overlay"
```

### Task 3: Build the local demo scheduling modal

**Files:**
- Create: `client/src/components/schedule-modal.tsx`
- Modify: `client/src/index.css`

**Interfaces:**
- Consumes `schedulingData` from `client/src/content/scheduling.json`.
- Exports `ScheduleModalProps`:
  - `onClose: () => void`
  - `onBackToPortfolio?: () => void`
- Calendar state is local to the component.
- The booking button is disabled until both a date and time are selected.

- [ ] **Step 1: Add calendar date helpers**

Implement typed helpers in the component:

```ts
type CalendarDate = { iso: string; day: number; inMonth: boolean; available: boolean }
function getMonthDays(year: number, month: number): CalendarDate[]
function formatDateLabel(iso: string): string
```

Generate the visible month grid with leading/trailing days, mark only `availableDates` as selectable, and keep the initial month at October 2026 from the content data.

- [ ] **Step 2: Add the modal structure and close behavior**

Render a fixed `role="dialog"` with `aria-modal`, a labelled title, close button, optional “Back to portfolio” action, body scroll lock, Escape handling, and focus restoration to the launching control through the callback supplied by `App`.

- [ ] **Step 3: Add month navigation**

Add previous/next month buttons with accessible labels. Keep navigation bounded to the demo year 2026 so dates remain deterministic; disable navigation at January and December.

- [ ] **Step 4: Add date and time selection**

Render date buttons with `aria-pressed`, disabled unavailable dates, selected styling, and a time-slot list that appears after a date is selected. Reset the selected time whenever the selected date changes.

- [ ] **Step 5: Add booking CTA and explicit empty-link handling**

When a slot is selected, show the timezone, chosen date, and chosen time. If `schedulingData.bookingUrl` is non-empty, open it in a new tab with `noopener,noreferrer`. If it is empty, keep the selected slot visible and show `emptyBookingMessage` instead of navigating.

- [ ] **Step 6: Add responsive/reduced-motion styles**

Use a two-column desktop layout for calendar and time selection, stack them under the existing responsive breakpoint, and add a reduced-motion rule so selection and modal transitions do not animate when requested.

- [ ] **Step 7: Run targeted checks**

Run: `npm run typecheck && npm run lint` from `client`

Expected: PASS with correct event types and no accessibility/lint regressions.

- [ ] **Step 8: Commit**

```bash
git add client/src/components/schedule-modal.tsx client/src/index.css
git commit -m "feat: add local demo scheduling modal"
```

### Task 4: Wire welcome, scheduling, and portfolio entry points

**Files:**
- Modify: `client/src/App.tsx`

**Interfaces:**
- Imports `WelcomeOverlay` and `ScheduleModal`.
- Maintains `showWelcome`, `scheduleOrigin`, and `scheduleOpen` state.
- Uses `sessionStorage` key `portfolio-welcome-complete`.

- [ ] **Step 1: Add session-gated App state**

Initialize `showWelcome` from `sessionStorage.getItem("portfolio-welcome-complete") !== "true"` inside a lazy state initializer guarded for browser execution. Add:

```ts
type ScheduleOrigin = "welcome" | "header" | "contact"
const [scheduleOrigin, setScheduleOrigin] = useState<ScheduleOrigin>("header")
const [scheduleOpen, setScheduleOpen] = useState(false)
```

- [ ] **Step 2: Add entry handlers**

Implement:

```ts
function finishWelcome(origin: "visiting" | "client") {
  sessionStorage.setItem("portfolio-welcome-complete", "true")
  setShowWelcome(false)
  if (origin === "client") {
    setScheduleOrigin("welcome")
    setScheduleOpen(true)
  }
}
function openSchedule(origin: ScheduleOrigin) {
  setScheduleOrigin(origin)
  setScheduleOpen(true)
}
```

Close scheduling with `setScheduleOpen(false)` and leave the underlying portfolio/modal state untouched.

- [ ] **Step 3: Add the header CTA**

Update `ToolMarquee` props to accept `onSchedule: () => void` and render a compact “Schedule a call” button beside the theme toggle. Pass `() => openSchedule("header")` from `App`.

- [ ] **Step 4: Add the Contact modal CTA**

Update `ModalContent` props to accept an optional `onSchedule` callback, pass it through `CardModal`, and add a “Schedule a call” button in the Contact card above the existing form. Use `onSchedule("contact")` and stop event propagation so it does not trigger card actions.

- [ ] **Step 5: Render overlays in the correct order**

Render `WelcomeOverlay` after `ThemeTransitionOverlay` and before the portfolio content when `showWelcome` is true. Render `ScheduleModal` last so it sits above the portfolio and can be opened from the welcome client choice, header CTA, or Contact modal.

- [ ] **Step 6: Preserve modal context**

When scheduling is opened from Contact, keep the Contact card mounted underneath and close only the schedule modal. When opened from the welcome flow, closing it must reveal the portfolio with the welcome overlay already completed.

- [ ] **Step 7: Run full client checks**

Run: `npm run typecheck && npm run lint && npm run build` from `client`

Expected: PASS with the existing portfolio still building and no regressions in modal rendering.

- [ ] **Step 8: Commit**

```bash
git add client/src/App.tsx
git commit -m "feat: wire welcome and scheduling flow"
```

### Task 5: Verify the complete flow in the browser

**Files:**
- Modify: none unless verification exposes a defect in the files above.

**Interfaces:**
- Verifies the user-visible behavior from the approved spec.

- [ ] **Step 1: Start the existing Vite app**

Run: `npm run dev -- --host 127.0.0.1 --port 5175` from `client`

Expected: Vite serves the portfolio at `http://127.0.0.1:5175/`.

- [ ] **Step 2: Verify first-session welcome**

Clear `sessionStorage`, reload the page, and verify the welcome overlay appears with both choices and a portfolio fallback. Verify keyboard focus starts inside the dialog and Escape reveals the portfolio.

- [ ] **Step 3: Verify both choices**

Select “Just visiting” and verify the bento portfolio appears. Clear `sessionStorage`, reload, select “I’m a client,” and verify the scheduling modal opens directly.

- [ ] **Step 4: Verify same-session persistence**

Refresh after completing the welcome and verify the overlay does not return. Close scheduling and verify the portfolio is visible.

- [ ] **Step 5: Verify calendar behavior**

Verify month navigation boundaries, disabled unavailable dates, selected-date styling, time selection, disabled booking CTA before selection, selected slot summary, and explicit empty booking-link messaging.

- [ ] **Step 6: Verify portfolio CTAs**

Open scheduling from the header CTA and from the Contact modal CTA. Close scheduling from each origin and verify the correct underlying portfolio context remains.

- [ ] **Step 7: Verify responsive and reduced-motion behavior**

Test a narrow viewport and confirm choices/calendar stack without horizontal scrolling. Enable reduced motion and verify there is no entrance/exit choreography while all controls remain functional.

- [ ] **Step 8: Run final checks**

Run: `npm run typecheck && npm run lint && npm run build` from `client`

Expected: all commands exit with code 0.

- [ ] **Step 9: Commit any verification fixes**

```bash
git add client/src
git commit -m "fix: polish welcome scheduling verification issues"
```

