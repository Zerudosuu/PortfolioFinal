import { useEffect, useMemo, useState } from "react"
import schedulingData from "../content/scheduling.json"
import { googleBookingUrl } from "../lib/google-booking"

type CalendarDate = { iso: string; day: number; inMonth: boolean; available: boolean }
type BusyInterval = { start: string; end: string }
type BookingState = "idle" | "loading" | "success" | "conflict" | "error"

const BOOKING_TIMEZONE = "Asia/Manila"
const BOOKING_OFFSET = "+08:00"

function toIsoDate(date: Date): string {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-")
}

function formatDateLabel(iso: string): string {
  return new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`))
}

function monthName(month: number): string {
  return schedulingData.months[month]
}

function getMonthDays(year: number, month: number, availableDates: Set<string>): CalendarDate[] {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const dates: CalendarDate[] = []
  for (let index = firstDay - 1; index >= 0; index -= 1) {
    const date = new Date(year, month, -index)
    dates.push({ iso: toIsoDate(date), day: date.getDate(), inMonth: false, available: false })
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    const iso = toIsoDate(new Date(year, month, day))
    dates.push({ iso, day, inMonth: true, available: availableDates.has(iso) })
  }
  const trailingDays = (7 - (dates.length % 7)) % 7
  for (let day = 1; day <= trailingDays; day += 1) {
    const date = new Date(year, month + 1, day)
    dates.push({ iso: toIsoDate(date), day, inMonth: false, available: false })
  }
  return dates
}

function slotDate(iso: string, time: string): Date {
  return new Date(`${iso}T${time}:00${BOOKING_OFFSET}`)
}

function isBusy(slot: Date, durationMinutes: number, busy: BusyInterval[]): boolean {
  const end = new Date(slot.getTime() + durationMinutes * 60_000)
  return busy.some((interval) => {
    const start = Date.parse(interval.start)
    const finish = Date.parse(interval.end)
    return Number.isFinite(start) && Number.isFinite(finish) && slot.getTime() < finish && end.getTime() > start
  })
}

function normalizeBookingUrl(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed || trimmed === "#" || trimmed.toLowerCase() === "about:blank") return null
  try {
    const url = new URL(trimmed)
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null
  } catch {
    return null
  }
}

function initialMonth(): { year: number; month: number } {
  const parts = new Intl.DateTimeFormat("en", { timeZone: BOOKING_TIMEZONE, year: "numeric", month: "numeric" }).formatToParts(new Date())
  return { year: Number(parts.find((part) => part.type === "year")?.value), month: Number(parts.find((part) => part.type === "month")?.value) - 1 }
}

function manilaToday(): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: BOOKING_TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date())
  return `${parts.find((part) => part.type === "year")?.value}-${parts.find((part) => part.type === "month")?.value}-${parts.find((part) => part.type === "day")?.value}`
}

export function SchedulePage() {
  const initial = initialMonth()
  const [year, setYear] = useState(initial.year)
  const [month, setMonth] = useState(initial.month)
  const [busy, setBusy] = useState<BusyInterval[]>([])
  const [availabilityState, setAvailabilityState] = useState<"loading" | "ready" | "error">("loading")
  const [loadedMonth, setLoadedMonth] = useState<string | null>(null)
  const [availabilityRevision, setAvailabilityRevision] = useState(0)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [bookingState, setBookingState] = useState<BookingState>("idle")
  const [statusMessage, setStatusMessage] = useState("")

  const fallbackUrl = normalizeBookingUrl(schedulingData.bookingUrl) || googleBookingUrl(schedulingData.googleBookingUrl)
  const monthKey = `${year}-${month}`
  const today = manilaToday()
  const monthStart = `${year}-${String(month + 1).padStart(2, "0")}-01T00:00:00${BOOKING_OFFSET}`
  const monthEndDate = new Date(year, month + 1, 0)
  const monthEnd = `${toIsoDate(monthEndDate)}T23:59:59${BOOKING_OFFSET}`

  useEffect(() => {
    const controller = new AbortController()
    fetch(`/api/availability?from=${encodeURIComponent(monthStart)}&to=${encodeURIComponent(monthEnd)}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Availability request failed")
        const data = (await response.json()) as { busy?: BusyInterval[] }
        setBusy(Array.isArray(data.busy) ? data.busy : [])
        setLoadedMonth(monthKey)
        setAvailabilityState("ready")
      })
      .catch((error: unknown) => {
        if ((error as { name?: string }).name !== "AbortError") {
          setLoadedMonth(monthKey)
          setAvailabilityState("error")
        }
      })
    return () => controller.abort()
  }, [availabilityRevision, monthKey, monthStart, monthEnd])

  const availabilityReady = loadedMonth === monthKey && availabilityState === "ready"
  const availabilityLoading = loadedMonth !== monthKey
  const availabilityError = loadedMonth === monthKey && availabilityState === "error"
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const availableDates = useMemo(() => {
    const dates = new Set<string>()
    for (let day = 1; day <= daysInMonth; day += 1) {
      const iso = toIsoDate(new Date(year, month, day))
      if (iso >= today && schedulingData.timeSlots.some((time) => !isBusy(slotDate(iso, time), 30, busy))) dates.add(iso)
    }
    return dates
  }, [busy, daysInMonth, month, today, year])
  const monthDays = useMemo(() => getMonthDays(year, month, availableDates), [availableDates, month, year])
  const selectedSlotBusy = selectedDate && selectedTime ? isBusy(slotDate(selectedDate, selectedTime), 30, busy) : false

  const selectDate = (iso: string) => {
    setSelectedDate(iso)
    setSelectedTime(null)
    setBookingState("idle")
    setStatusMessage("")
  }

  const moveMonth = (delta: number) => {
    const next = new Date(year, month + delta, 1)
    setYear(next.getFullYear())
    setMonth(next.getMonth())
    setSelectedDate(null)
    setSelectedTime(null)
  }

  const submitBooking = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedDate || !selectedTime || selectedSlotBusy) return
    setBookingState("loading")
    setStatusMessage("")
    const start = slotDate(selectedDate, selectedTime)
    const end = new Date(start.getTime() + 30 * 60_000)
    try {
      const response = await fetch("/api/book", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ start: start.toISOString(), end: end.toISOString(), name: name.trim(), email: email.trim(), message: message.trim() }) })
      if (response.status === 409) {
        setSelectedTime(null)
        setAvailabilityState("loading")
        setAvailabilityRevision((revision) => revision + 1)
        setBookingState("conflict")
        setStatusMessage("That time was just booked. Choose another available slot.")
        return
      }
      if (!response.ok) throw new Error("Booking request failed")
      setBookingState("success")
      setStatusMessage("Your conversation is booked. A confirmation will be sent to your email.")
    } catch {
      setBookingState("error")
      setStatusMessage("Booking is temporarily unavailable. Use the Google Calendar link below or email Ron.")
    }
  }

  return (
    <main className="entry-page booking-page">
      <header className="entry-header">
        <a className="entry-name" href="#/welcome">Ron Salvador<span aria-hidden="true">.</span></a>
        <a className="entry-back" href="#/portfolio">View portfolio</a>
      </header>
      <div className="booking-content">
        <header>
          <h1 className="mt-4 font-heading text-3xl leading-tight sm:text-4xl">{schedulingData.title}</h1>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground">Choose a live available time and confirm your details to book our conversation.</p>
        </header>
        <div className="schedule-modal-layout mt-8 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <section aria-labelledby="schedule-calendar-title">
            <div className="flex items-center justify-between">
              <h2 id="schedule-calendar-title" className="font-heading text-xl">{monthName(month)} {year}</h2>
              <div className="flex gap-2">
                <button type="button" className="schedule-modal-nav border border-foreground/30 px-3 py-2 text-sm hover:border-foreground" onClick={() => moveMonth(-1)} aria-label="Previous month">←</button>
                <button type="button" className="schedule-modal-nav border border-foreground/30 px-3 py-2 text-sm hover:border-foreground" onClick={() => moveMonth(1)} aria-label="Next month">→</button>
              </div>
            </div>
            {availabilityLoading ? <p className="mt-3 text-sm text-muted-foreground" role="status">Loading live availability…</p> : null}
            {availabilityError ? <p className="mt-3 text-sm text-muted-foreground" role="alert">Live availability is unavailable. You can use the Google Calendar fallback below.</p> : null}
            <div className="mt-5 grid grid-cols-7 gap-1 text-center text-[0.65rem] tracking-[0.15em] text-muted-foreground">{schedulingData.weekdays.map((weekday) => <span key={weekday}>{weekday}</span>)}</div>
            <div className="mt-2 grid grid-cols-7 gap-1">
              {monthDays.map((date) => <button key={date.iso} type="button" className={`schedule-modal-date aspect-square border text-sm ${selectedDate === date.iso ? "border-foreground bg-foreground text-background" : "border-transparent"} ${date.inMonth && date.available ? "hover:border-foreground/60" : "text-muted-foreground/30"}`} onClick={() => selectDate(date.iso)} disabled={!date.inMonth || !date.available || !availabilityReady} aria-label={formatDateLabel(date.iso)} aria-pressed={selectedDate === date.iso}>{date.day}</button>)}
            </div>
          </section>
          <section aria-labelledby="schedule-times-title" className="border-t border-foreground/15 pt-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
            <h2 id="schedule-times-title" className="font-heading text-xl">Choose a time</h2>
            {selectedDate ? <><p className="mt-2 text-sm text-muted-foreground">{formatDateLabel(selectedDate)}</p><div className="mt-5 grid gap-2">{schedulingData.timeSlots.map((time) => { const unavailable = isBusy(slotDate(selectedDate, time), 30, busy); return <button key={time} type="button" className={`schedule-modal-time border px-4 py-3 text-left text-sm ${selectedTime === time ? "border-foreground bg-foreground text-background" : "border-foreground/25 hover:border-foreground"} disabled:cursor-not-allowed disabled:opacity-35`} onClick={() => setSelectedTime(time)} disabled={unavailable || !availabilityReady} aria-pressed={selectedTime === time}>{time}{unavailable ? " · unavailable" : ""}</button> })}</div></> : <p className="mt-3 text-sm text-muted-foreground">Select an available date to see times.</p>}
          </section>
        </div>
        <form className="booking-form mt-8 border-t border-foreground/15 pt-6" onSubmit={submitBooking}>
          {selectedDate && selectedTime ? <p className="text-sm">{formatDateLabel(selectedDate)} · {selectedTime} · {schedulingData.timezone}</p> : <p className="text-sm text-muted-foreground">Select a date and time to continue.</p>}
          <div className="booking-fields mt-5 grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-xs tracking-[0.12em]">NAME<input required value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" className="booking-input" /></label>
            <label className="grid gap-2 text-xs tracking-[0.12em]">EMAIL<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" className="booking-input" /></label>
            <label className="grid gap-2 text-xs tracking-[0.12em] sm:col-span-2">MESSAGE <span className="text-muted-foreground">(OPTIONAL)</span><textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={3} className="booking-input resize-y" /></label>
          </div>
          {statusMessage ? <p className={`mt-4 text-sm ${bookingState === "success" ? "text-chart-1-text" : "text-muted-foreground"}`} role="status">{statusMessage}</p> : null}
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <button type="submit" className="schedule-modal-booking border border-foreground bg-foreground px-5 py-3 text-xs tracking-[0.18em] text-background hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40" disabled={!selectedDate || !selectedTime || selectedSlotBusy || !availabilityReady || bookingState === "loading" || bookingState === "success"}>{bookingState === "loading" ? "BOOKING…" : bookingState === "success" ? "BOOKED" : "BOOK THIS TIME"}</button>
            {fallbackUrl ? <a className="text-xs tracking-[0.12em] text-muted-foreground underline underline-offset-4 hover:text-foreground" href={fallbackUrl} target="_blank" rel="noopener noreferrer">USE GOOGLE CALENDAR INSTEAD</a> : null}
            <a href="#/portfolio" className="text-xs tracking-[0.15em] text-muted-foreground underline underline-offset-4 hover:text-foreground">Back to portfolio</a>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">{schedulingData.timezone} · Need help? <a className="underline" href={`mailto:${schedulingData.bookingEmail}`}>Email Ron</a>.</p>
        </form>
      </div>
    </main>
  )
}
