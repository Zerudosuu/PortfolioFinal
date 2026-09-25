import { useEffect, useMemo, useRef, useState } from "react"
import { useTheme } from "./theme-provider"
import {
  FLIP_DELAY_MS,
  IN_SPREAD_MS,
  OUT_SPREAD_MS,
  prefersReducedMotion,
} from "./theme-transition"

interface Phase {
  id: number
  color: string // destination theme's --background (seamless cover)
}

type Stage = "in" | "out"

const MAX_BLOCKS = 1200 // cap on very large viewports
const MAX_STEP_MS = 30 // max gap between waves (reference uses 0.03s)

/** Fisher–Yates shuffle, as in olivierlarose/pixel-transition-effect. */
function shuffle<T>(items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const swap = items[i]
    items[i] = items[j]
    items[j] = swap
  }
  return items
}

/**
 * Read a theme CSS variable the way the DESTINATION theme would resolve it,
 * without touching the live <html> class: a hidden probe wearing the
 * destination class matches the `.light`/`.dark` variable rules itself.
 */
function readThemeVar(resolved: "light" | "dark", name: string): string {
  const probe = document.createElement("div")
  probe.style.cssText = "position:absolute;visibility:hidden;pointer-events:none"
  probe.classList.add(resolved)
  document.body.appendChild(probe)
  const value = getComputedStyle(probe).getPropertyValue(name).trim()
  probe.remove()
  return value
}

/**
 * Theme transition — centered variant of olivierlarose/pixel-transition-effect:
 * a full-screen grid of 5vw blocks in the DESTINATION background colour pops
 * in one by one (discrete waves — one block per column every ≤30ms, shuffled
 * per column) until the screen is exactly the new background; ThemeProvider
 * flips the <html> class at that moment (FLIP_DELAY_MS), invisibly; then the
 * blocks pop out in the same order, revealing the new page — because the
 * curtain colour IS the new background, the whole handoff is seamless.
 *
 * Pops are driven by per-block setTimeout (deterministic, observable) rather
 * than CSS animation-delay, so they can never collapse into one instant cover.
 */
export function ThemeTransitionOverlay() {
  const { theme } = useTheme()
  const prevThemeRef = useRef(theme)
  const idRef = useRef(0)
  const hostRef = useRef<HTMLDivElement>(null)
  const [phase, setPhase] = useState<Phase | null>(null)
  const [stage, setStage] = useState<Stage>("in")

  // On theme change: resolve the destination background and raise the
  // curtain in a microtask — after the effects, before the browser paints.
  useEffect(() => {
    const prev = prevThemeRef.current
    prevThemeRef.current = theme
    if (prev === theme) return
    if (prefersReducedMotion()) return

    const resolved: "light" | "dark" =
      theme === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : theme

    const color = readThemeVar(resolved, "--background")
    if (!color) return

    queueMicrotask(() => {
      setStage("in")
      setPhase({ id: ++idRef.current, color })
    })
  }, [theme])

  // Stage machine + the pops themselves: every block flips opacity at its
  // own data-delay. The same delays are used on the way out — first block in
  // is the first out (as in the reference).
  useEffect(() => {
    if (!phase) return

    const timers: number[] = []
    const spans = hostRef.current
      ? Array.from(hostRef.current.querySelectorAll<HTMLElement>(".pixel-block"))
      : []

    for (const span of spans) {
      const delay = Number(span.dataset.delay)
      const to = stage === "in" ? "1" : "0"
      timers.push(
        window.setTimeout(() => {
          span.style.opacity = to
        }, delay)
      )
    }

    timers.push(
      window.setTimeout(
        stage === "in" ? () => setStage("out") : () => setPhase(null),
        stage === "in" ? FLIP_DELAY_MS : OUT_SPREAD_MS + 140
      )
    )

    return () => {
      for (const t of timers) window.clearTimeout(t)
    }
  }, [phase, stage])

  const tiles = useMemo(() => {
    if (!phase) return { list: [], size: 0 }

    const width = window.innerWidth
    const height = window.innerHeight

    // 5vw blocks (reference implementation), capped for very large viewports
    let size = width * 0.05
    let cols = Math.max(1, Math.ceil(width / size))
    let rows = Math.max(1, Math.ceil(height / size))
    if (cols * rows > MAX_BLOCKS) {
      size = Math.max(size, Math.sqrt((width * height) / MAX_BLOCKS))
      cols = Math.max(1, Math.ceil(width / size))
      rows = Math.max(1, Math.ceil(height / size))
    }

    // Reference pacing: each column shuffles its own row ranks, so every
    // STEP ms exactly one block per column pops — discrete, visible,
    // "one by one" waves; full coverage lands within IN_SPREAD_MS.
    const step = Math.min(MAX_STEP_MS, IN_SPREAD_MS / Math.max(1, rows - 1))

    const list: { id: number; x: number; y: number; delay: number }[] = []
    for (let col = 0; col < cols; col++) {
      const ranks = shuffle(Array.from({ length: rows }, (_, i) => i))
      for (let row = 0; row < rows; row++) {
        list.push({
          id: col * rows + row,
          x: col * size,
          y: row * size,
          delay: ranks[row] * step,
        })
      }
    }
    return { list, size }
  }, [phase])

  if (!phase) return null

  return (
    <div
      key={phase.id}
      ref={hostRef}
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
    >
      {tiles.list.map((t) => (
        <span
          key={t.id}
          className="pixel-block absolute"
          data-delay={t.delay}
          style={{
            left: t.x,
            top: t.y,
            width: tiles.size,
            height: tiles.size,
            background: phase.color,
            opacity: 0,
          }}
        />
      ))}
    </div>
  )
}
