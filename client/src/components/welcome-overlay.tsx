import { useCallback, useEffect, useRef, useState } from "react"
import welcomeData from "../content/welcome.json"

export interface WelcomeOverlayProps {
  onVisiting: () => void
  onClient: () => void
}

const EXIT_DURATION_MS = 260

export function WelcomeOverlay({
  onVisiting,
  onClient,
}: WelcomeOverlayProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const fallbackRef = useRef<HTMLButtonElement>(null)
  const [closing, setClosing] = useState(false)

  const selectChoice = useCallback(
    (callback: () => void) => {
      if (closing) return
      setClosing(true)

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        callback()
        return
      }

      window.setTimeout(callback, EXIT_DURATION_MS)
    },
    [closing],
  )

  useEffect(() => {
    const previouslyFocused = document.activeElement
    fallbackRef.current?.focus()

    return () => {
      if (previouslyFocused instanceof HTMLElement && previouslyFocused.isConnected) {
        previouslyFocused.focus()
      }
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !closing) {
        event.preventDefault()
        selectChoice(onVisiting)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [closing, onVisiting, selectChoice])

  return (
    <div
      className={`welcome-backdrop-enter fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 ${
        closing ? "welcome-exit" : ""
      }`}
    >
      <div
        ref={panelRef}
        className={`welcome-panel-enter w-full max-w-lg border border-white/20 bg-background p-8 text-foreground shadow-2xl sm:p-12 ${
          closing ? "welcome-exit" : ""
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-overlay-title"
        aria-describedby="welcome-overlay-body"
      >
        <p className="mb-6 text-xs tracking-[0.3em] text-muted-foreground">
          {welcomeData.label}
        </p>
        <div aria-live="polite">
          <h1
            id="welcome-overlay-title"
            className="font-heading text-3xl leading-tight sm:text-5xl"
          >
            {welcomeData.title}
          </h1>
          <p id="welcome-overlay-body" className="mt-4 text-sm text-muted-foreground">
            {welcomeData.body}
          </p>
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            className="welcome-item-enter border border-foreground bg-foreground px-5 py-4 text-left text-background transition-opacity hover:opacity-80"
            onClick={() => selectChoice(onVisiting)}
            disabled={closing}
          >
            <span className="block font-heading text-lg">{welcomeData.visitingChoice.title}</span>
            <span className="mt-2 block text-xs opacity-70">
              {welcomeData.visitingChoice.description}
            </span>
          </button>
          <button
            type="button"
            className="welcome-item-enter border border-foreground/40 px-5 py-4 text-left transition-colors hover:border-foreground"
            onClick={() => selectChoice(onClient)}
            disabled={closing}
          >
            <span className="block font-heading text-lg">{welcomeData.clientChoice.title}</span>
            <span className="mt-2 block text-xs text-muted-foreground">
              {welcomeData.clientChoice.description}
            </span>
          </button>
        </div>

        <button
          ref={fallbackRef}
          type="button"
          className="welcome-item-enter mt-8 text-xs tracking-[0.2em] text-muted-foreground underline underline-offset-4 hover:text-foreground"
          onClick={() => selectChoice(onVisiting)}
          disabled={closing}
        >
          {welcomeData.portfolioFallback}
        </button>
      </div>
    </div>
  )
}
