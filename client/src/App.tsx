import React, { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { gsap } from "gsap"
import {
  Sun,
  Moon,
  X,
  Quote,
  Sparkles,
} from "lucide-react"
import {
  RiArrowRightUpLine,
  RiArrowRightSLine,
  RiGithubLine,
  RiLinkedinLine,
} from "@remixicon/react"
import { useTheme } from "@/components/theme-provider"
import { AbstractGeometry } from "@/components/abstract-geometry"
import FolderFloat from "@/components/folder-float"
import { getIcon } from "@/components/icon-map"
import { ThemeTransitionOverlay } from "@/components/theme-transition-overlay"
import headlineData from "@/content/headline.json"
import journeyData from "@/content/journey.json"
import projectsData from "@/content/projects.json"
import toolsData from "@/content/tools.json"
import { TOOL_ICONS } from "@/components/tool-icons"
import servicesData from "@/content/services.json"
import testimonialsData from "@/content/testimonials.json"
import credentialsData from "@/content/credentials.json"
import aiBuildsData from "@/content/ai-builds.json"
import contactData from "@/content/contact.json"
import skillsData from "@/content/skills.json"
import uiData from "@/content/ui.json"
import "@/responsive-grid.css"

/* ── Content (edit text in client/src/content/*.json) ─────────── */

const UI = uiData

/* ── Modal types ─────────────────────────────────────────────── */

type ModalCard =
  | "headline"
  | "journey"
  | "skills"
  | "portrait"
  | "logo"
  | "contact"
  | "projects"
  | "testimonials"
  | "services"
  | "credentials"
  | "aibuilds"

interface ModalState {
  card: ModalCard
  originRect: DOMRect
}

/* ── Sub-components ─────────────────────────────────────────── */

/* ── Tools marquee (replaces navbar) ─────────────────────────── */

const TOOLS = toolsData.items

function ToolMarquee({ onOpenSkills }: { onOpenSkills: (rect: DOMRect) => void }) {
  const labelRef = useRef<HTMLButtonElement>(null)

  return (
    <header className="shrink-0 border-b border-border/70 bg-card/80 backdrop-blur">
      <div className="flex items-center gap-4 px-4 py-2.5">
        <button
          ref={labelRef}
          onClick={() => onOpenSkills(labelRef.current!.getBoundingClientRect())}
          className="group shrink-0 cursor-pointer text-left"
        >
          <p className="text-[9px] leading-tight tracking-[0.18em] text-chart-1-text/70">{toolsData.label}</p>
          <p className="text-[13px] font-semibold leading-tight text-foreground/70 transition-colors group-hover:text-foreground">
            {toolsData.title}
          </p>
        </button>

        <div className="marquee relative min-w-0 flex-1 overflow-hidden">
          <div className="marquee-track py-1">
            {[0, 1, 2, 3, 4, 5].map((copy) => (
              <div key={copy} className="flex shrink-0 items-center gap-2 pr-2" aria-hidden={copy > 0}>
                {TOOLS.map((tool) => {
                  const icon = TOOL_ICONS[tool]
                  return (
                    <span
                      key={tool}
                      className="flex shrink-0 items-center gap-2 rounded-full border border-border/60 bg-muted/60 px-3 py-1 text-[12px] text-foreground/55 transition-colors hover:border-chart-1/50 hover:bg-chart-1/15 hover:text-foreground"
                    >
                      {icon ? (
                        <svg
                          viewBox="0 0 24 24"
                          className="h-5 w-5 shrink-0 text-chart-1-text/75"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path d={icon} />
                        </svg>
                      ) : (
                        <span className="h-1.5 w-1.5 rounded-full bg-chart-1/70" />
                      )}
                      {tool}
                    </span>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        <ThemeToggle />
      </div>
    </header>
  )
}

function SkillTileLarge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="group flex flex-col items-center gap-3 rounded-xl border border-border/60 bg-muted/60 px-4 py-5 transition-all duration-200 hover:border-chart-1/40 hover:bg-chart-1/8">
      <div className="text-foreground/50 transition-transform duration-200 group-hover:scale-110">{icon}</div>
      <span className="text-[13px] tracking-wide text-foreground/55">{label}</span>
    </div>
  )
}

function JourneyItem({
  title,
  company,
  period,
  bullets,
}: {
  title: string
  company: string
  period: string
  bullets: string[]
}) {
  return (
    <div className="group/item relative pl-5">
      <span className="absolute left-0 top-[4px] h-2 w-2 rounded-full border border-foreground/20 transition-all duration-300 group-hover/item:border-chart-1 group-hover/item:bg-chart-1/30 group-hover/item:shadow-[0_0_6px_0_oklch(0.837_0.128_66.29/0.4)]" />
      <p className="text-[14px] font-semibold leading-snug text-foreground/90">{title}</p>
      <p className="mt-0.5 text-[12px] text-foreground/60">{company}</p>
      <p className="text-[12px] text-foreground/55">{period}</p>
      <ul className="mt-2 space-y-1">
        {bullets.map((b, i) => (
          <li key={i} className="flex gap-1.5 text-[12px] leading-relaxed text-foreground/55">
            <span className="mt-1 shrink-0 text-foreground/55">•</span>
            {b}
          </li>
        ))}
      </ul>
    </div>
  )
}

function TestimonialCarousel() {
  const [idx, setIdx] = useState(0)
  const [paused, setPaused] = useState(false)

  // Auto-advance; disabled under prefers-reduced-motion, paused on hover
  useEffect(() => {
    if (paused) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const id = setInterval(() => setIdx((i) => (i + 1) % TESTIMONIALS.length), 5000)
    return () => clearInterval(id)
  }, [paused])

  const t = TESTIMONIALS[idx]

  return (
    <div
      className="flex min-h-0 flex-1 flex-col justify-between"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] tracking-[0.18em] text-foreground/55">{testimonialsData.label}</p>
        <div
          className="flex shrink-0 gap-1"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          {TESTIMONIALS.map((tt, i) => (
            <button
              key={tt.name}
              onClick={() => setIdx(i)}
              aria-label={`Show testimonial ${i + 1}`}
              className={`h-1.5 w-1.5 rounded-full transition-colors ${
                i === idx ? "bg-chart-1" : "bg-foreground/20 hover:bg-foreground/45"
              }`}
            />
          ))}
        </div>
      </div>

      <p
        key={idx}
        className="project-fade-in line-clamp-3 text-[12px] italic leading-snug text-foreground/60"
      >
        "{t.quote}"
      </p>

      <div className="min-w-0">
        <p className="truncate text-[11px] font-semibold text-foreground/80">{t.name}</p>
        <p className="truncate text-[10px] text-foreground/55">{t.role}</p>
      </div>
    </div>
  )
}

/* ── Contact form (mailto compose — no backend needed) ──────── */

function ContactForm() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const f = contactData.form
  const inputClass =
    "w-full rounded-xl border border-border/70 bg-muted/45 px-4 py-3 text-[14px] text-foreground/85 outline-none transition-colors focus:border-chart-1/50"

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const subject = encodeURIComponent(`Portfolio inquiry${name ? ` — ${name}` : ""}`)
    const body = encodeURIComponent(`${message}\n\n— ${name}\nReply to: ${email}`)
    window.location.href = `mailto:${contactData.email}?subject=${subject}&body=${body}`
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-[11px] tracking-[0.2em] text-foreground/55">{f.heading.toUpperCase()}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="text-[11px] tracking-[0.14em] text-foreground/55">{f.name.toUpperCase()}</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-[11px] tracking-[0.14em] text-foreground/55">{f.email.toUpperCase()}</span>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </label>
      </div>
      <label className="block space-y-1.5">
        <span className="text-[11px] tracking-[0.14em] text-foreground/55">{f.message.toUpperCase()}</span>
        <textarea
          required
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className={`${inputClass} resize-none`}
        />
      </label>
      <button
        type="submit"
        className="inline-flex items-center gap-1.5 rounded-xl border border-chart-1/40 bg-chart-1/10 px-5 py-2.5 text-[12px] tracking-[0.12em] text-chart-1-text/90 transition-colors hover:bg-chart-1/20"
      >
        {f.send}
        <RiArrowRightUpLine className="h-3.5 w-3.5" />
      </button>
    </form>
  )
}

/* ── Carousel project data (projects.json) ───────────────────── */

const PROJECTS = projectsData.items

/* ── Bento section data (content/*.json) ─────────────────────── */

const TESTIMONIALS = testimonialsData.items

const SERVICES = servicesData.items.map((s) => ({ ...s, Icon: getIcon(s.icon) }))

const CREDENTIALS = credentialsData.items

const AI_BUILDS = aiBuildsData.items

/* ── Theme toggle ────────────────────────────────────────────── */

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Toggle theme"
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-muted/40 text-foreground/55 transition-all hover:bg-muted hover:text-foreground"
    >
      {isDark ? <Sun className="h-[14px] w-[14px]" /> : <Moon className="h-[14px] w-[14px]" />}
    </button>
  )
}

/* ── Card modal — GSAP FLIP ──────────────────────────────────── */

function CardModal({ modal, onClose }: { modal: ModalState; onClose: () => void }) {
  const cardRef  = useRef<HTMLDivElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)
  const closingRef = useRef(false)

  // FLIP values: where the modal starts (card center & scale) vs where it lands
  const flip = useMemo(() => {
    const mw = window.innerWidth  * 0.9
    const mh = window.innerHeight * 0.9
    const mx = window.innerWidth  * 0.05
    const my = window.innerHeight * 0.05
    const { left: cl, top: ct, width: cw, height: ch } = modal.originRect
    return {
      tx: (cl + cw / 2) - (mx + mw / 2),
      ty: (ct + ch / 2) - (my + mh / 2),
      sx: cw / mw,
      sy: ch / mh,
    }
  }, [modal.originRect])

  // Close handler — triggers collapse tween, then unmounts
  const close = useCallback(() => {
    if (closingRef.current) return
    closingRef.current = true
    const el = cardRef.current
    const bd = backdropRef.current
    if (!el) { onClose(); return }
    gsap.to(bd, { opacity: 0, duration: 0.22, ease: "power2.in" })
    gsap.to(el, {
      x: flip.tx, y: flip.ty, scaleX: flip.sx, scaleY: flip.sy,
      opacity: 0, borderRadius: "16px",
      duration: 0.28, ease: "power3.in",
      onComplete: onClose,
    })
  }, [flip, onClose])

  // Esc key
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") close() }
    window.addEventListener("keydown", h)
    return () => window.removeEventListener("keydown", h)
  }, [close])

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = "" }
  }, [])

  // Expand tween on mount
  useEffect(() => {
    const el = cardRef.current
    const bd = backdropRef.current
    if (!el) return
    // Start at card position
    gsap.set(el, { x: flip.tx, y: flip.ty, scaleX: flip.sx, scaleY: flip.sy, opacity: 0, borderRadius: "16px" })
    gsap.set(bd, { opacity: 0 })
    // Expand to full
    gsap.to(bd, { opacity: 1, duration: 0.35, ease: "power2.out" })
    gsap.to(el, {
      x: 0, y: 0, scaleX: 1, scaleY: 1,
      opacity: 1, borderRadius: "20px",
      duration: 0.52, ease: "power4.out",
    })
  }, [flip])

  return (
    <div className="fixed inset-0 z-50">
      {/* backdrop */}
      <div
        ref={backdropRef}
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={close}
      />

      {/* modal card — fixed at final size, GSAP moves it */}
      <div
        ref={cardRef}
        className="modal-card absolute flex flex-col overflow-hidden border border-border/70 bg-card shadow-2xl"
      >
        {/* sticky header */}
        <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between border-b border-border/40 bg-card/95 px-7 py-4 backdrop-blur">
          <span className="text-[12px] tracking-[0.18em] text-foreground/55 uppercase">
            {modal.card}
          </span>
          <button
            onClick={close}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 text-foreground/55 transition-all hover:border-foreground/30 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* scrollable body — projects pane owns its own scroll/padding */}
        <div className={`flex-1 overflow-hidden ${modal.card === "projects" ? "p-0" : "overflow-y-auto overscroll-contain px-7 py-8"}`}>
          <ModalContent card={modal.card} />
        </div>
      </div>
    </div>
  )
}

/* ── Modal content per card ──────────────────────────────────── */

function ModalContent({ card }: { card: ModalCard }) {
  switch (card) {
    case "headline":
      return (
        <div className="relative">
          <div className="max-w-2xl space-y-8 relative z-10">
            <div>
              <p className="mb-3 text-[11px] tracking-[0.2em] text-foreground/55">{headlineData.label}</p>
              <h1 className="text-[42px] font-extrabold leading-[1.1] tracking-tight">
                {headlineData.name} <span className="text-chart-1-text">{headlineData.separator}</span> {headlineData.role}
              </h1>
            </div>
            <p className="text-[16px] italic leading-relaxed text-foreground/50">
              {headlineData.tagline}
            </p>
            <div className="space-y-4 text-[14px] leading-relaxed text-foreground/65">
              {headlineData.paragraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
            <div className="flex gap-4 pt-2">
              {UI.socials.map((s) => {
                const Icon = getIcon(s.icon)
                return (
                  <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg border border-border/60 px-4 py-2 text-[12px] tracking-[0.1em] text-foreground/50 transition-all hover:border-chart-1/50 hover:text-foreground">
                    {Icon && <Icon className="h-4 w-4" />}{s.label}
                  </a>
                )
              })}
            </div>
          </div>
          <div className="absolute -right-32 -top-20 w-96 h-96 opacity-20 pointer-events-none">
            <AbstractGeometry />
          </div>
        </div>
      )

    case "journey":
      return (
        <div className="relative">
          <div className="max-w-2xl relative z-10">
            <h2 className="mb-8 text-[28px] font-extrabold tracking-tight">{journeyData.modalTitle}</h2>
            <div className="relative space-y-10 before:absolute before:left-[3px] before:top-2 before:h-[calc(100%-16px)] before:w-px before:bg-border/50">
              {journeyData.entries.map((item, i) => (
                <div key={i} className="group relative pl-8">
                  <span className="absolute left-0 top-1.5 h-[7px] w-[7px] rounded-full border border-chart-1/60 bg-chart-1/20 transition-all duration-300 group-hover:bg-chart-1 group-hover:shadow-[0_0_8px_oklch(0.837_0.128_66.29/0.5)]" />
                  <p className="text-[17px] font-semibold text-foreground/90">{item.title}</p>
                  <p className="mt-0.5 text-[13px] text-foreground/60">{item.company}</p>
                  <p className="text-[12px] text-chart-1-text/70">{item.period}</p>
                  <ul className="mt-3 space-y-1.5">
                    {item.bullets.map((b, j) => (
                      <li key={j} className="flex gap-2 text-[13px] leading-relaxed text-foreground/60">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-foreground/25" />{b}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute -right-40 -bottom-32 w-96 h-96 opacity-15 pointer-events-none">
            <AbstractGeometry />
          </div>
        </div>
      )

    case "skills":
      return (
        <div className="relative">
          <div className="max-w-2xl relative z-10">
            <h2 className="mb-8 text-[28px] font-extrabold tracking-tight">{skillsData.modalTitle}</h2>
            <div className="space-y-8">
              {skillsData.categories.map(({ category, items }) => (
                <div key={category}>
                  <p className="mb-3 text-[11px] tracking-[0.18em] text-foreground/55">{category.toUpperCase()}</p>
                  <div className="grid grid-cols-3 gap-3">
                    {items.map(({ icon, label }) => {
                      const Icon = getIcon(icon)
                      return (
                        <SkillTileLarge key={label} icon={Icon ? <Icon className="h-6 w-6" /> : null} label={label} />
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute -right-32 -top-16 w-80 h-80 opacity-15 pointer-events-none">
            <AbstractGeometry />
          </div>
        </div>
      )

    case "portrait":
      return (
        <div className="relative">
          <div className="flex flex-col items-center gap-8 py-8 text-center relative z-10">
            <div className="flex h-32 w-32 items-center justify-center rounded-full border-2 border-chart-1/60 bg-portrait-bg">
              <span className="text-[52px] font-black text-portrait-fg">R</span>
            </div>
            <div>
              <h2 className="text-[28px] font-extrabold tracking-tight">Ron Salvador</h2>
              <p className="mt-1 text-[14px] text-chart-1-text/80">Designer-Developer</p>
            </div>
            <p className="max-w-md text-[14px] leading-relaxed text-foreground/55">
              Based in Manila. I design and build interfaces that feel inevitable — the kind where you forget someone made a decision. Available for senior IC and lead roles.
            </p>
            <div className="flex gap-4">
              {[{ icon: <RiGithubLine className="h-4 w-4" />, label: "GITHUB" },
                { icon: <RiLinkedinLine className="h-4 w-4" />, label: "LINKEDIN" }].map(({ icon, label }) => (
                <a key={label} href="#" className="flex items-center gap-2 rounded-lg border border-border/60 px-4 py-2 text-[12px] tracking-[0.1em] text-foreground/50 transition-all hover:border-chart-1/50 hover:text-foreground">
                  {icon}{label}
                </a>
              ))}
            </div>
          </div>
          <div className="absolute -right-20 -top-32 w-64 h-64 opacity-15 pointer-events-none">
            <AbstractGeometry />
          </div>
          <div className="absolute -left-16 -bottom-20 w-56 h-56 opacity-10 pointer-events-none" style={{ transform: 'scaleX(-1)' }}>
            <AbstractGeometry />
          </div>
        </div>
      )

    case "logo":
      return (
        <div className="relative">
          <div className="flex flex-col items-center gap-6 py-8 text-center relative z-10">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-chart-1/60 bg-chart-1/10">
              <span className="text-[32px] font-bold text-chart-1-text/80">R</span>
            </div>
            <h2 className="text-[26px] font-extrabold tracking-tight">Ron Salvador</h2>
            <p className="text-[12px] tracking-[0.2em] text-chart-1-text/60">DESIGNER-DEVELOPER</p>
            <div className="mt-4 max-w-sm space-y-3 text-[14px] leading-relaxed text-foreground/55">
              <p>Building at the intersection of craft and code since 2019.</p>
              <p>Specialising in design systems, interactive interfaces, and the invisible details that make products feel considered.</p>
            </div>
          </div>
          <div className="absolute -right-24 top-1/4 w-72 h-72 opacity-12 pointer-events-none">
            <AbstractGeometry />
          </div>
        </div>
      )

    case "contact":
      return (
        <div className="relative">
          <div className="relative z-10 grid gap-10 lg:grid-cols-2">
            <div className="space-y-8">
              <div>
                <h2 className="text-[32px] font-extrabold tracking-tight">{contactData.modalTitle}</h2>
                <p className="mt-3 text-[14px] leading-relaxed text-foreground/55">
                  {contactData.modalSubtitle}
                </p>
              </div>
              <div className="space-y-3">
                {contactData.links.map(({ label, value, href }) => (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="group flex items-center justify-between rounded-xl border border-border/70 bg-muted/45 px-5 py-4 transition-all hover:border-chart-1/40 hover:bg-chart-1/5">
                    <div>
                      <p className="text-[11px] tracking-[0.14em] text-foreground/55">{label.toUpperCase()}</p>
                      <p className="mt-0.5 text-[14px] text-foreground/75">{value}</p>
                    </div>
                    <RiArrowRightUpLine className="h-4 w-4 text-foreground/55 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-chart-1-text" />
                  </a>
                ))}
              </div>
            </div>
            <div className="border-t border-border/40 pt-8 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
              <ContactForm />
            </div>
          </div>
          <div className="absolute -right-40 -bottom-16 w-96 h-96 opacity-15 pointer-events-none">
            <AbstractGeometry />
          </div>
        </div>
      )

    case "testimonials":
      return (
        <div className="relative">
          <div className="max-w-2xl space-y-5 relative z-10">
            <h2 className="text-[28px] font-extrabold tracking-tight">{testimonialsData.modalTitle}</h2>
            {TESTIMONIALS.map((t) => (
              <figure key={t.name} className="rounded-xl border border-border/70 bg-muted/15 p-5">
                <Quote className="h-4 w-4 text-chart-1-text/60" />
                <blockquote className="mt-3 text-[14px] italic leading-relaxed text-foreground/70">
                  "{t.quote}"
                </blockquote>
                <figcaption className="mt-3 border-t border-border/40 pt-3">
                  <p className="text-[13px] font-semibold text-foreground/85">{t.name}</p>
                  <p className="text-[12px] text-foreground/60">{t.role}</p>
                  <p className="mt-1 text-[11px] tracking-wide text-chart-1-text/70">{t.tags}</p>
                </figcaption>
              </figure>
            ))}
          </div>
          <div className="absolute -right-32 -top-16 w-80 h-80 opacity-15 pointer-events-none">
            <AbstractGeometry />
          </div>
        </div>
      )

    case "services":
      return (
        <div className="relative">
          <div className="max-w-2xl space-y-4 relative z-10">
            <div>
              <h2 className="text-[28px] font-extrabold tracking-tight">{servicesData.modalTitle}</h2>
              <p className="mt-2 text-[14px] text-foreground/55">{servicesData.modalSubtitle}</p>
            </div>
            {SERVICES.map((s, i) => {
              const Icon = s.Icon
              return (
                <div
                  key={s.name}
                  className="flex items-start gap-4 rounded-xl border border-border/70 bg-muted/15 px-5 py-4"
                >
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/60 text-chart-1-text/70">
                    {Icon && <Icon className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-[15px] font-semibold text-foreground/90">{s.name}</p>
                      <span className="text-[12px] text-foreground/55">{String(i + 1).padStart(2, "0")}</span>
                    </div>
                    <p className="mt-1 text-[13px] leading-relaxed text-foreground/55">{s.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="absolute -right-36 -bottom-28 w-80 h-80 opacity-15 pointer-events-none">
            <AbstractGeometry />
          </div>
        </div>
      )

    case "credentials":
      return (
        <div className="relative">
          <div className="relative z-10">
            <h2 className="mb-8 text-[28px] font-extrabold tracking-tight">{credentialsData.modalTitle}</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {CREDENTIALS.map((c) => (
                <a
                  key={c.name}
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col items-center gap-3 rounded-xl border border-border/70 bg-muted/15 px-4 py-6 text-center transition-all hover:border-chart-1/40 hover:bg-chart-1/5"
                >
                  <img
                    src={c.image}
                    alt={c.name}
                    loading="lazy"
                    className="h-16 w-16 object-contain"
                  />
                  <div>
                    <p className="text-[14px] font-semibold text-foreground/90">{c.name}</p>
                    <p className="text-[12px] text-foreground/60">{c.issuer}</p>
                    <p className="text-[11px] text-foreground/55">{c.date}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] tracking-[0.1em] text-foreground/45 transition-colors group-hover:text-chart-1-text">
                    VERIFY
                    <RiArrowRightUpLine className="h-3 w-3" />
                  </span>
                </a>
              ))}
            </div>
            <a
              href={credentialsData.credly}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 inline-flex items-center gap-1.5 rounded-lg border border-chart-1/40 bg-chart-1/10 px-4 py-2 text-[12px] tracking-[0.1em] text-chart-1-text/80 transition-all hover:bg-chart-1/20"
            >
              {credentialsData.credlyLabel}
              <RiArrowRightUpLine className="h-3.5 w-3.5" />
            </a>
          </div>
          <div className="absolute -right-28 top-1/3 w-72 h-72 opacity-15 pointer-events-none">
            <AbstractGeometry />
          </div>
        </div>
      )

    case "aibuilds":
      return (
        <div className="relative">
          <div className="max-w-2xl space-y-3 relative z-10">
            <div>
              <h2 className="text-[28px] font-extrabold tracking-tight">{aiBuildsData.modalTitle}</h2>
              <p className="mt-2 text-[14px] text-foreground/55">{aiBuildsData.subtitle}</p>
            </div>
            {AI_BUILDS.map((b) => (
              <div
                key={b.name}
                className="flex items-start gap-4 rounded-xl border border-border/70 bg-muted/15 px-5 py-4"
              >
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/60 text-chart-1-text/70">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold text-foreground/90">{b.name}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-foreground/55">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="absolute -right-32 -top-16 w-80 h-80 opacity-15 pointer-events-none">
            <AbstractGeometry />
          </div>
        </div>
      )

    case "projects":
      return <ProjectsPane />
  }
}

/* ── Projects master-detail pane ─────────────────────────────── */

function ProjectsPane() {
  const [selected, setSelected] = useState<number>(0)
  const detailRef = useRef<HTMLDivElement>(null)
  const listRef   = useRef<HTMLDivElement>(null)

  function openDetail(i: number) {
    if (selected === i) return
    setSelected(i)
  }

  // Animate detail panel whenever `selected` changes
  useEffect(() => {
    const el = detailRef.current
    if (!el) return
    gsap.fromTo(el,
      { x: 40, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.38, ease: "power3.out" }
    )
  }, [selected])

  const p = PROJECTS[selected]

  return (
    <div className="flex h-full gap-0 overflow-hidden px-7 py-8">
      {/* ── Left: project list ──────────────────────────────── */}
      <div
        ref={listRef}
        className="flex h-full w-full shrink-0 flex-col overflow-y-auto pr-2 transition-all duration-300"
        style={{ width: "38%", minWidth: 240 }}
      >
        <h2 className="mb-6 text-[28px] font-extrabold tracking-tight">{projectsData.modalTitle}</h2>
        <div className="space-y-3">
          {PROJECTS.map((proj, i) => (
            <button
              key={i}
              onClick={() => openDetail(i)}
              className={`group w-full rounded-2xl border p-5 text-left transition-all duration-200
                ${selected === i
                  ? "border-chart-1/50 bg-chart-1/8 shadow-[0_0_0_1px_oklch(0.837_0.128_66.29/0.15)]"
                  : "border-border/70 bg-muted/10 hover:border-chart-1/30 hover:bg-chart-1/5"}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className={`h-[6px] w-[6px] shrink-0 rounded-full ${proj.accent}`} />
                  <span className="text-[11px] tracking-wide text-foreground/55">{proj.tag}</span>
                </div>
                <RiArrowRightSLine
                  className={`h-4 w-4 shrink-0 transition-all duration-200
                    ${selected === i ? "rotate-90 text-chart-1-text" : "text-foreground/20 group-hover:text-chart-1-text/60"}`}
                />
              </div>
              <h3 className="mt-2 text-[16px] font-semibold leading-snug text-foreground/90">{proj.name}</h3>
              <p className={`mt-1 text-[12px] leading-relaxed text-foreground/50 transition-all duration-200 ${selected !== i ? "line-clamp-1 opacity-60" : ""}`}>
                {proj.desc}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* ── Right: detail panel — always visible ── */}
      <div className="mx-5 w-px shrink-0 bg-border/40" />
      <div
        ref={detailRef}
        className="flex h-full flex-col overflow-hidden"
        style={{ width: "62%" }}
      >
          {/* detail header */}
          <div className="mb-5 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${p.accent}`} />
                <span className="text-[11px] tracking-[0.16em] text-foreground/55">{p.tag}</span>
              </div>
              <h2 className="mt-2 text-[24px] font-extrabold leading-tight tracking-tight text-foreground">
                {p.name}
              </h2>
            </div>
          </div>

          {/* scrollable detail content */}
          <div className="flex-1 overflow-y-auto overscroll-contain pr-1">
            {/* project image placeholder */}
            <div className={`mb-6 h-48 w-full rounded-xl ${p.accent.replace("bg-", "bg-").replace("500", "500/15")} border border-border/40 flex items-center justify-center`}>
              <span className={`text-[12px] font-medium tracking-widest ${p.accent.replace("bg-", "text-")}/70`}>
                {UI.projectPreview}
              </span>
            </div>

            <p className="text-[13px] italic leading-relaxed text-foreground/50 border-l-2 border-chart-1/40 pl-4 mb-6">
              {p.desc}
            </p>

            <div className="space-y-5 text-[13px] leading-relaxed text-foreground/65">
              <p>{p.full}</p>
            </div>

            {/* tech stack pills */}
            <div className="mt-6">
              <p className="mb-3 text-[11px] tracking-[0.16em] text-foreground/55">{UI.stack}</p>
              <div className="flex flex-wrap gap-2">
                {(p.stack ?? ["React", "TypeScript", "Tailwind"]).map((t: string) => (
                  <span key={t} className="rounded-md border border-border/70 bg-muted/60 px-3 py-1 text-[11px] tracking-wide text-foreground/55">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* links */}
            <div className="mt-8 flex gap-3 pb-4">
              <a href="#" className="flex items-center gap-1.5 rounded-lg border border-border/60 px-4 py-2 text-[12px] tracking-[0.1em] text-foreground/50 transition-all hover:border-chart-1/50 hover:text-foreground">
                <RiGithubLine className="h-3.5 w-3.5" /> {UI.github}
              </a>
              <a href="#" className="flex items-center gap-1.5 rounded-lg border border-chart-1/40 bg-chart-1/10 px-4 py-2 text-[12px] tracking-[0.1em] text-chart-1-text/80 transition-all hover:bg-chart-1/20">
                <RiArrowRightUpLine className="h-3.5 w-3.5" /> {UI.live}
              </a>
            </div>
          </div>
        </div>
    </div>
  )
}

/* ── Cell wrapper ────────────────────────────────────────────── */

function Cell({
  children,
  className = "",
  style,
  enterDelay = 0,
  noHover = false,
  onOpen,
}: {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  enterDelay?: number
  noHover?: boolean
  onOpen?: (rect: DOMRect) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const hoverClasses = noHover
    ? ""
    : "transition-all duration-300 hover:-translate-y-[2px] hover:border-foreground/18 hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.18)]"
  const clickable = !!onOpen

  return (
    <div
      ref={ref}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={clickable ? () => onOpen(ref.current!.getBoundingClientRect()) : undefined}
      onKeyDown={clickable ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(ref.current!.getBoundingClientRect()) } } : undefined}
      className={`cell-enter group rounded-2xl border bg-card text-card-foreground ${clickable ? "border-amber-500/40 cursor-pointer shadow-[0_0_0_1px_rgba(217,119,6/0.15)] hover:border-amber-500/60 hover:shadow-[0_0_0_1px_rgba(217,119,6/0.25),0_8px_24px_-4px_rgba(0,0,0,0.18)]" : "border-border/70"} ${hoverClasses} ${className}`}
      style={{ ...style, animationDelay: `${enterDelay}ms` }}
    >
      {clickable && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500/60 via-amber-500/40 to-transparent rounded-t-2xl" />
      )}
      {children}
    </div>
  )
}

/* ── Main layout ─────────────────────────────────────────────── */

export function App() {
  const [projectIdx, setProjectIdx] = useState(0)
  const [prevIdx, setPrevIdx] = useState<number | null>(null)
  const [sliding, setSliding] = useState(false)
  const [slideDir, setSlideDir] = useState<"left" | "right">("right")
  const [modal, setModal] = useState<ModalState | null>(null)
  const project = PROJECTS[projectIdx]

  function goTo(idx: number) {
    if (idx === projectIdx || sliding) return
    setSlideDir(idx > projectIdx ? "right" : "left")
    setPrevIdx(projectIdx)
    setProjectIdx(idx)
    setSliding(true)
  }

  function openModal(card: ModalCard) {
    return (rect: DOMRect) => setModal({ card, originRect: rect })
  }

  return (
    <div
      className="flex h-screen flex-col bg-background text-foreground"
      style={{ fontFamily: "'JetBrains Mono Variable', monospace" }}
    >
      {/* ── Theme Transition Overlay ────────────────────────────── */}
      <ThemeTransitionOverlay />

      {/* ── Tools marquee (replaces navbar) ─────────────────────── */}
      <ToolMarquee onOpenSkills={openModal("skills")} />

      {/* ── Bento grid ────────────────────────────────────────── */}
      <div className="flex w-full flex-1 flex-col overflow-hidden p-[6px]">
        <div
          className="grid h-full gap-[6px]"
          style={{
            gridTemplateColumns: "54fr 24fr 22fr",
            gridTemplateRows: "1fr 2fr 1fr",
          }}
          data-layout="responsive"
        >

        {/* ── 1. HEADLINE ─────────────────────────────────────── */}
        <Cell className="flex flex-col justify-between p-7 overflow-hidden" enterDelay={0} onOpen={openModal("headline")}>
          <p className="text-[11px] tracking-[0.18em] text-foreground/55">{headlineData.label}</p>
          <div className="relative z-10">
            <h1 className="text-[26px] font-extrabold leading-[1.15] tracking-tight text-foreground">
              {headlineData.name} <span className="text-chart-1-text">{headlineData.separator}</span> {headlineData.role}
            </h1>
            <p className="mt-3 text-[13px] italic leading-relaxed text-foreground/60">
              {headlineData.tagline}
            </p>
          </div>
          <div className="absolute -right-12 -bottom-16 w-64 h-64 opacity-30">
            <AbstractGeometry />
          </div>
        </Cell>

        {/* ── 2. PROFILE PHOTO ────────────────────────────────── */}
        <Cell
          className="row-span-2 flex flex-col overflow-hidden bg-portrait-bg"
          style={{ gridColumn: 2, gridRow: "1 / 3" }}
          enterDelay={60}
        >
          <div className="flex flex-1 items-center justify-center overflow-hidden">
            <span
              className="portrait-float select-none font-black leading-none text-portrait-fg"
              style={{ fontSize: 140 }}
            >
              R
            </span>
          </div>
          <p className="border-t border-portrait-fg/20 px-5 py-3 text-[11px] tracking-[0.14em] text-portrait-fg/70">
            portrait / placeholder
          </p>
        </Cell>

        {/* ── 3. PROJECTS ─────────────────────────────────────── */}
        <Cell
          className="row-span-3 flex flex-col overflow-hidden"
          style={{ gridColumn: 3, gridRow: "1 / 4" }}
          enterDelay={120}
          noHover
          onOpen={openModal("projects")}
        >
          {/* header */}
          <div className="flex items-start justify-between p-4 pb-3">
            <span className="text-[11px] tracking-[0.18em] text-foreground/55">{projectsData.label}</span>
            <a
              href="#"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-[11px] tracking-[0.12em] text-foreground/55 transition-colors hover:text-foreground/75"
            >
              <span>{UI.seeMore}</span>
              <RiArrowRightUpLine className="h-3.5 w-3.5 shrink-0" />
            </a>
          </div>

          <div className="border-t border-border/40 mx-4" />

          {/* project image */}
          <div className="relative mx-4 mt-4 flex-1 overflow-hidden rounded-lg">
            <div
              key={projectIdx}
              className={`absolute inset-0 rounded-lg bg-muted/40 project-slide-in-${slideDir}`}
              onAnimationEnd={() => { setSliding(false); setPrevIdx(null) }}
            />
            {prevIdx !== null && (
              <div
                key={`prev-${prevIdx}`}
                className={`absolute inset-0 rounded-lg bg-muted/40 project-slide-out-${slideDir}`}
              />
            )}
          </div>

          {/* project info */}
          <div key={`info-${projectIdx}`} className="project-fade-in px-4 pt-4">
            <div className="flex items-center gap-2">
              <span className={`h-[6px] w-[6px] rounded-full transition-colors duration-300 ${project.accent}`} />
              <span className="text-[11px] tracking-wide text-foreground/55">{project.tag}</span>
            </div>
            <p className="mt-1.5 text-[14px] font-semibold leading-snug text-foreground/85">{project.name}</p>
            <p className="mt-1 text-[12px] leading-relaxed text-foreground/60">{project.desc}</p>
            <a
              href="#"
              onClick={(e) => e.stopPropagation()}
              className="mt-2 inline-flex items-center gap-1 text-[11px] tracking-[0.1em] text-foreground/55 transition-colors hover:text-foreground/70"
            >
              {UI.seeMore} <RiArrowRightUpLine className="h-3 w-3" />
            </a>
          </div>

          {/* pagination */}
          <div className="mt-4 flex items-center justify-between px-4 pb-4">
            <div className="flex gap-1.5">
              {PROJECTS.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); goTo(i) }}
                  className={`h-[6px] rounded-full transition-all duration-300 ${i === projectIdx ? "w-4 bg-chart-1" : "w-[6px] bg-foreground/18"}`}
                />
              ))}
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={(e) => { e.stopPropagation(); goTo((projectIdx - 1 + PROJECTS.length) % PROJECTS.length) }}
                className="flex h-6 w-6 items-center justify-center rounded border border-border/60 text-foreground/55 transition-colors hover:text-foreground/75"
              >
                <RiArrowRightSLine className="h-3 w-3 -scale-x-100" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); goTo((projectIdx + 1) % PROJECTS.length) }}
                className="flex h-6 w-6 items-center justify-center rounded border border-border/60 text-foreground/55 transition-colors hover:text-foreground/75"
              >
                <RiArrowRightSLine className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* social footer */}
          <div className="border-t border-border/40 px-4 py-3">
            <div className="flex items-center justify-center gap-5">
              {UI.socials.map((s) => {
                const Icon = getIcon(s.icon)
                return (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1.5 text-[11px] tracking-[0.12em] text-foreground/55 transition-colors hover:text-foreground/80"
                  >
                    {Icon && <Icon className="h-3.5 w-3.5" />}{s.label}
                  </a>
                )
              })}
            </div>
          </div>
        </Cell>

        {/* ── 4. JOURNEY + TESTIMONIALS + SERVICES + CREDENTIALS ─ */}
        <div
          className="grid gap-[6px]"
          style={{ gridColumn: 1, gridRow: "2 / 4", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr 0.5fr 0.65fr" }}
          data-subgrid="true"
        >
          <Cell className="p-5" style={{ gridColumn: 1, gridRow: "1 / 4" }} enterDelay={80} onOpen={openModal("journey")}>
            <p className="mb-4 text-[11px] tracking-[0.18em] text-foreground/55">{journeyData.label}</p>
            <div className="space-y-5">
              {journeyData.entries.map((e) => (
                <JourneyItem
                  key={e.title}
                  title={e.title}
                  company={e.company}
                  period={e.period}
                  bullets={e.preview}
                />
              ))}
            </div>
          </Cell>

          <Cell
            className="flex min-h-0 flex-col overflow-hidden p-3"
            style={{ gridColumn: 1, gridRow: 4 }}
            enterDelay={100}
            onOpen={openModal("testimonials")}
          >
            <TestimonialCarousel />
          </Cell>

          <Cell
            className="flex min-h-0 flex-col overflow-hidden p-4"
            style={{ gridColumn: 2, gridRow: "1 / 3" }}
            enterDelay={120}
            onOpen={openModal("services")}
          >
            <p className="mb-2 text-[11px] tracking-[0.18em] text-foreground/55">{servicesData.label}</p>
            <div className="flex min-h-0 flex-1 flex-col justify-between gap-1.5 overflow-hidden">
              {SERVICES.map((s, i) => {
                const Icon = s.Icon
                return (
                  <div
                    key={s.name}
                    className="flex items-start gap-2.5 rounded-lg border border-border/70 bg-muted/45 px-2.5 py-2 transition-colors hover:border-chart-1/50 hover:bg-chart-1/10"
                  >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border border-border/60 bg-muted/60 text-chart-1-text/70">
                      {Icon && <Icon className="h-3 w-3" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-[12px] font-semibold text-foreground/75">{s.name}</span>
                        <span className="text-[10px] text-foreground/55">{String(i + 1).padStart(2, "0")}</span>
                      </div>
                      <p className="line-clamp-2 text-[11px] leading-snug text-foreground/60">{s.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </Cell>

          <Cell
            className="flex min-h-0 flex-col overflow-hidden p-4"
            style={{ gridColumn: 2, gridRow: "3 / 5" }}
            enterDelay={140}
            onOpen={openModal("credentials")}
          >
            <p className="mb-2 text-[11px] tracking-[0.18em] text-foreground/55">{credentialsData.label}</p>
            <div className="grid min-h-0 flex-1 grid-cols-3 content-center gap-2">
              {CREDENTIALS.map((c) => (
                <div
                  key={c.name}
                  title={c.name}
                  className="group/tile flex min-w-0 flex-col items-center gap-1.5 rounded-lg border border-border/50 bg-muted/30 px-1.5 py-2 transition-colors hover:border-chart-1/40 hover:bg-chart-1/5"
                >
                  <img src={c.image} alt={c.name} loading="lazy" className="h-8 w-8 object-contain" />
                  <span className="line-clamp-2 w-full text-center text-[10px] leading-tight text-foreground/60 group-hover/tile:text-foreground/85">
                    {c.name}
                  </span>
                </div>
              ))}
            </div>
          </Cell>
        </div>

        {/* ── 5. CONTACT + AI BUILDS ───────────────────────────── */}
        <div
          className="grid gap-[6px]"
          style={{ gridColumn: 2, gridRow: 3, gridTemplateRows: "1fr 1fr" }}
          data-subgrid="true"
        >
          <Cell
            className="cursor-pointer"
            enterDelay={160}
            onOpen={openModal("contact")}
          >
            <div className="flex h-full items-center justify-between p-4">
              <div>
                <span className="text-[14px] font-semibold text-foreground/85">{contactData.cardTitle}</span>
                <p className="mt-1 text-[11px] leading-snug text-foreground/55">
                  {contactData.cardSubtitle}
                </p>
              </div>
              <RiArrowRightUpLine className="h-4 w-4 shrink-0 text-foreground/55 transition-all duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-chart-1-text" />
            </div>
          </Cell>

          <Cell
            className="flex min-h-0 flex-col overflow-hidden p-4"
            enterDelay={180}
            onOpen={openModal("aibuilds")}
          >
            <p className="mb-1.5 text-[11px] tracking-[0.18em] text-foreground/55">{aiBuildsData.label}</p>
            <p className="mb-2 text-[11px] leading-snug text-foreground/55">
              {aiBuildsData.subtitle}
            </p>
            <div className="flex min-h-0 flex-1 flex-wrap content-start gap-1.5 overflow-hidden">
              {AI_BUILDS.map((b) => (
                <span
                  key={b.name}
                  className="flex shrink-0 items-center gap-1 rounded-full border border-border/60 bg-muted/60 px-2 py-0.5 text-[11px] text-foreground/55 transition-colors hover:border-chart-1/50 hover:bg-chart-1/15 hover:text-foreground"
                >
                  <Sparkles className="h-2.5 w-2.5 text-chart-1-text/60" />
                  {b.name}
                </span>
              ))}
            </div>
          </Cell>
        </div>

        </div>
      </div>

      {/* ── Modal ───────────────────────────────────────────────── */}
      {modal && (
        <CardModal
          modal={modal}
          onClose={() => setModal(null)}
        />
      )}

      {/* ── Folder Float ────────────────────────────────────────── */}
      {/* <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10">
        <FolderFloat />
      </div> */}
    </div>
  )
}

export default App
