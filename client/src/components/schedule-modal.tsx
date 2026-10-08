import { useEffect, useMemo, useRef, useState } from "react"
import schedulingData from "../content/scheduling.json"

type CalendarDate = {
  iso: string
  day: number
  inMonth: boolean
  available: boolean
}

export interface ScheduleModalProps {
  onClose: () => void
  onBackToPortfolio?: () => void
}

const DEMO_YEAR = 2026

function getMonthDays(year: number, month: number): CalendarDate[] {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPreviousMonth = new Date(year, month, 0).getDate()
  const availableDates = new Set(schedulingData.availableDates)
  const dates: CalendarDate[] = []

  for (let index = firstDay - 1; index >= 0; index -= 1) {
    const day = daysInPreviousMonth - index
    const previousDate = new Date(year, month - 1, day)
    const iso = toIsoDate(previousDate)
    dates.push({ iso, day, inMonth: false, available: availableDates.has(iso) })
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const iso = toIsoDate(new Date(year, month, day))
    dates.push({ iso, day, inMonth: true, available: availableDates.has(iso) })
  }

  const trailingDays = (7 - (dates.length % 7)) % 7
  for (let day = 1; day <= trailingDays; day += 1) {
    const nextDate = new Date(year, month + 1, day)
    const iso = toIsoDate(nextDate)
    dates.push({ iso, day, inMonth: false, available: availableDates.has(iso) })
  }

  return dates
}

function toIsoDate(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-")
}

function formatDateLabel(iso: string): string {
  return new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`))
}

function getInitialMonth(): number {
  const firstAvailable = schedulingData.availableDates[0]
  return firstAvailable ? Number(firstAvailable.slice(5, 7)) - 1 : 9
}

export function ScheduleModal({
  onClose,
  onBackToPortfolio,
}: ScheduleModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const [month, setMonth] = useState(getInitialMonth)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)

  const monthDays = useMemo(() => getMonthDays(DEMO_YEAR, month), [month])

  useEffect(() => {
    previousFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null
    closeButtonRef.current?.focus()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.body.style.overflow = previousOverflow
      if (previousFocusRef.current?.isConnected)
        previousFocusRef.current.focus()
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key !== "Tab") return
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
      )
      if (!focusable?.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onClose])

  const selectDate = (iso: string) => {
    setSelectedDate(iso)
    setSelectedTime(null)
  }

  const handleBooking = () => {
    if (!selectedDate || !selectedTime) return
    if (schedulingData.bookingUrl) {
      window.open(schedulingData.bookingUrl, "_blank", "noopener,noreferrer")
    }
  }

  return (
    <div className="schedule-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 sm:p-6">
      <div
        ref={dialogRef}
        className="schedule-modal-panel flex max-h-[calc(100vh-2rem)] w-full max-w-4xl flex-col overflow-y-auto border border-white/20 bg-background p-6 text-foreground shadow-2xl sm:max-h-[calc(100vh-3rem)] sm:p-10"
        role="dialog"
        aria-modal="true"
        aria-labelledby="schedule-modal-title"
      >
        <header className="flex items-start justify-between gap-6">
          <div>
            <p className="text-xs tracking-[0.3em] text-muted-foreground">
              {schedulingData.label}
            </p>
            <h2
              id="schedule-modal-title"
              className="mt-4 font-heading text-3xl leading-tight sm:text-4xl"
            >
              {schedulingData.title}
            </h2>
            <p className="mt-3 max-w-xl text-sm text-muted-foreground">
              {schedulingData.description}
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className="schedule-modal-close border border-foreground/30 px-3 py-2 text-xs tracking-[0.2em] hover:border-foreground"
            onClick={onClose}
            aria-label="Close scheduling dialog"
          >
            CLOSE
          </button>
        </header>

        <div className="schedule-modal-layout mt-8 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <section aria-labelledby="schedule-calendar-title">
            <div className="flex items-center justify-between">
              <h3 id="schedule-calendar-title" className="font-heading text-xl">
                {schedulingData.months[month]} {DEMO_YEAR}
              </h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="schedule-modal-nav border border-foreground/30 px-3 py-2 text-sm hover:border-foreground disabled:cursor-not-allowed disabled:opacity-30"
                  onClick={() =>
                    setMonth((current) => Math.max(0, current - 1))
                  }
                  disabled={month === 0}
                  aria-label="Previous month"
                >
                  ←
                </button>
                <button
                  type="button"
                  className="schedule-modal-nav border border-foreground/30 px-3 py-2 text-sm hover:border-foreground disabled:cursor-not-allowed disabled:opacity-30"
                  onClick={() =>
                    setMonth((current) => Math.min(11, current + 1))
                  }
                  disabled={month === 11}
                  aria-label="Next month"
                >
                  →
                </button>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-7 gap-1 text-center text-[0.65rem] tracking-[0.15em] text-muted-foreground">
              {schedulingData.weekdays.map((weekday) => (
                <span key={weekday}>{weekday}</span>
              ))}
            </div>
            <div className="mt-2 grid grid-cols-7 gap-1">
              {monthDays.map((date) => (
                <button
                  key={date.iso}
                  type="button"
                  className={`schedule-modal-date aspect-square border text-sm ${
                    selectedDate === date.iso
                      ? "border-foreground bg-foreground text-background"
                      : "border-transparent"
                  } ${date.inMonth && date.available ? "hover:border-foreground/60" : ""} ${
                    !date.inMonth || !date.available
                      ? "text-muted-foreground/30"
                      : ""
                  }`}
                  onClick={() => selectDate(date.iso)}
                  disabled={!date.inMonth || !date.available}
                  aria-label={formatDateLabel(date.iso)}
                  aria-pressed={selectedDate === date.iso}
                >
                  {date.day}
                </button>
              ))}
            </div>
          </section>

          <section
            aria-labelledby="schedule-times-title"
            className="border-t border-foreground/15 pt-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8"
          >
            <h3 id="schedule-times-title" className="font-heading text-xl">
              Choose a time
            </h3>
            {selectedDate ? (
              <>
                <p className="mt-2 text-sm text-muted-foreground">
                  {formatDateLabel(selectedDate)}
                </p>
                <div className="mt-5 grid gap-2">
                  {schedulingData.timeSlots.map((time) => (
                    <button
                      key={time}
                      type="button"
                      className={`schedule-modal-time border px-4 py-3 text-left text-sm ${
                        selectedTime === time
                          ? "border-foreground bg-foreground text-background"
                          : "border-foreground/25 hover:border-foreground"
                      }`}
                      onClick={() => setSelectedTime(time)}
                      aria-pressed={selectedTime === time}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                Select an available date to see times.
              </p>
            )}
          </section>
        </div>

        <footer className="mt-8 border-t border-foreground/15 pt-6">
          {selectedDate && selectedTime ? (
            <p className="text-sm">
              {formatDateLabel(selectedDate)} · {selectedTime} ·{" "}
              {schedulingData.timezone}
            </p>
          ) : null}
          <p className="mt-2 text-xs text-muted-foreground">
            {schedulingData.timezone}
          </p>
          {!schedulingData.bookingUrl && selectedDate && selectedTime ? (
            <p className="mt-3 text-sm text-muted-foreground" role="status">
              {schedulingData.emptyBookingMessage}
            </p>
          ) : null}
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <button
              type="button"
              className="schedule-modal-booking border border-foreground bg-foreground px-5 py-3 text-xs tracking-[0.18em] text-background hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
              onClick={handleBooking}
              disabled={!selectedDate || !selectedTime}
            >
              {schedulingData.bookingLabel}
            </button>
            {onBackToPortfolio ? (
              <button
                type="button"
                className="text-xs tracking-[0.15em] text-muted-foreground underline underline-offset-4 hover:text-foreground"
                onClick={onBackToPortfolio}
              >
                BACK TO PORTFOLIO
              </button>
            ) : null}
          </div>
        </footer>
      </div>
    </div>
  )
}
