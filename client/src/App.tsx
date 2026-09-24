import React, { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { gsap } from "gsap"
import { Sun, Moon, X } from "lucide-react"
import {
  RiReactjsLine,
  RiCodeSSlashLine,
  RiWindyLine,
  RiSpeedLine,
  RiTriangleLine,
  RiGitBranchLine,
  RiPenNibLine,
  RiArrowRightUpLine,
  RiArrowRightSLine,
  RiGithubLine,
  RiLinkedinLine,
  RiTwitterXLine,
} from "@remixicon/react"
import { useTheme } from "@/components/theme-provider"
import { AbstractGeometry } from "@/components/abstract-geometry"
import FolderFloat from "@/components/folder-float"
import { PixelSwap } from "@/components/pixel-swap"
import { ThemeTransitionOverlay } from "@/components/theme-transition-overlay"
import "@/responsive-grid.css"

/* ── Modal types ─────────────────────────────────────────────── */

type ModalCard = "headline" | "journey" | "skills" | "portrait" | "logo" | "contact" | "projects"

interface ModalState {
  card: ModalCard
  originRect: DOMRect
}

/* ── Sub-components ─────────────────────────────────────────── */

function SkillTile({ icon, label, delay = 0 }: { icon: React.ReactNode; label: string; delay?: number }) {
  return (
    <div
      className="group flex flex-col items-center gap-1.5 rounded-lg border border-border/60 bg-muted/30 px-2 py-3 transition-all duration-200 hover:border-chart-1/40 hover:bg-chart-1/8"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="text-foreground/50 transition-transform duration-200 group-hover:scale-110">{icon}</div>
      <span className="text-[10px] tracking-wide text-foreground/45">{label}</span>
    </div>
  )
}

function SkillTileLarge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="group flex flex-col items-center gap-3 rounded-xl border border-border/60 bg-muted/30 px-4 py-5 transition-all duration-200 hover:border-chart-1/40 hover:bg-chart-1/8">
      <div className="text-foreground/50 transition-transform duration-200 group-hover:scale-110">{icon}</div>
      <span className="text-[12px] tracking-wide text-foreground/55">{label}</span>
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
    <div className="relative pl-5">
      <span className="absolute left-0 top-[4px] h-2 w-2 rounded-full border border-foreground/20 transition-all duration-300 group-hover:border-chart-1 group-hover:bg-chart-1/30 group-hover:shadow-[0_0_6px_0_oklch(0.837_0.128_66.29/0.4)]" />
      <p className="text-[13px] font-semibold leading-snug text-foreground/90">{title}</p>
      <p className="mt-0.5 text-[11px] text-foreground/45">{company}</p>
      <p className="text-[11px] text-foreground/30">{period}</p>
      <ul className="mt-2 space-y-1">
        {bullets.map((b, i) => (
          <li key={i} className="flex gap-1.5 text-[11px] leading-relaxed text-foreground/55">
            <span className="mt-1 shrink-0 text-foreground/25">•</span>
            {b}
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ── Carousel project data ───────────────────────────────────── */

const PROJECTS = [
  {
    name: "Meridian Ledger",
    desc: "A treasury dashboard that makes cash flow legible at a glance.",
    tag: "Dashboard",
    accent: "bg-amber-500",
    full: "Built with React, TypeScript, and Recharts. Features real-time cash flow tracking, multi-account aggregation, and a custom charting layer that handles irregular payment cadences without visual noise. Delivered in 6 weeks for a Series B fintech.",
    stack: ["React", "TypeScript", "Recharts", "Tailwind", "Vite"],
  },
  {
    name: "Nova Design System",
    desc: "Component library and token architecture for a SaaS product suite.",
    tag: "Design System",
    accent: "bg-violet-500",
    full: "A token-first design system spanning 80+ components across 3 product surfaces. Built with Tailwind, Radix, and Storybook. Reduced cross-team design inconsistencies by 60% in the first quarter after adoption.",
    stack: ["Tailwind", "Radix UI", "Storybook", "TypeScript", "Figma"],
  },
  {
    name: "Pulse Analytics",
    desc: "Real-time data visualisation platform for fintech operations teams.",
    tag: "Data Viz",
    accent: "bg-sky-500",
    full: "WebSocket-driven dashboard with 15+ chart types, drill-down capabilities, and a configurable alert engine. Handles 10k+ events per second in the browser using a rolling buffer architecture with React, D3, and a custom render scheduler.",
    stack: ["React", "D3", "WebSockets", "TypeScript", "Node.js"],
  },
]

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
        className="modal-card absolute flex flex-col overflow-hidden border border-border/50 bg-card shadow-2xl"
      >
        {/* sticky header */}
        <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between border-b border-border/40 bg-card/95 px-7 py-4 backdrop-blur">
          <span className="text-[11px] tracking-[0.18em] text-foreground/40 uppercase">
            {modal.card}
          </span>
          <button
            onClick={close}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 text-foreground/40 transition-all hover:border-foreground/30 hover:text-foreground"
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
              <p className="mb-3 text-[10px] tracking-[0.2em] text-foreground/30">PORTFOLIO</p>
              <h1 className="text-[42px] font-extrabold leading-[1.1] tracking-tight">
                Ron <span className="text-chart-1">—</span> Designer-Developer
              </h1>
            </div>
            <p className="text-[15px] italic leading-relaxed text-foreground/50">
              "I design and build interfaces that read fast and age well — this page is one of them."
            </p>
            <div className="space-y-4 text-[13px] leading-relaxed text-foreground/65">
              <p>I work at the intersection of design and engineering — the place where a pixel decision becomes a component decision, and where a component decision shapes how a product scales.</p>
              <p>My work spans design systems, data-dense dashboards, and polished marketing surfaces. I care about the craft layer: typography, spacing, motion, and the small interactions that make a product feel alive.</p>
              <p>Currently open to senior IC and lead roles at product companies building tools that professionals rely on daily.</p>
            </div>
            <div className="flex gap-4 pt-2">
              {[{ icon: <RiGithubLine className="h-4 w-4" />, label: "GITHUB" },
                { icon: <RiLinkedinLine className="h-4 w-4" />, label: "LINKEDIN" },
                { icon: <RiTwitterXLine className="h-4 w-4" />, label: "X" }].map(({ icon, label }) => (
                <a key={label} href="#" className="flex items-center gap-2 rounded-lg border border-border/60 px-4 py-2 text-[11px] tracking-[0.1em] text-foreground/50 transition-all hover:border-chart-1/50 hover:text-foreground">
                  {icon}{label}
                </a>
              ))}
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
            <h2 className="mb-8 text-[28px] font-extrabold tracking-tight">Career Journey</h2>
            <div className="relative space-y-10 before:absolute before:left-[3px] before:top-2 before:h-[calc(100%-16px)] before:w-px before:bg-border/50">
              {[
                { title: "Senior Designer-Developer", company: "Acme Design Studio", period: "2023–Present", bullets: ["Leading design systems and frontend architecture across 4 product squads.", "Shipped 12+ projects from Figma to production in 18 months.", "Established component library now used by 8 engineers.", "Introduced motion design language adopted site-wide."] },
                { title: "Full-Stack Designer", company: "Creative Agency Co", period: "2021–2023", bullets: ["Built responsive interfaces and real-time data dashboards for fintech clients.", "Reduced design-to-dev handoff friction by authoring a token-driven Tailwind config.", "Delivered 3 major client launches on time with cross-functional teams of 10+."] },
                { title: "Frontend Engineer", company: "StartupXYZ", period: "2019–2021", bullets: ["Early-stage team of 5. Built core product in React from 0 to paying customers.", "Mentored 2 junior developers, ran weekly code reviews.", "Shaped technical direction for front-end stack selection."] },
              ].map((item, i) => (
                <div key={i} className="group relative pl-8">
                  <span className="absolute left-0 top-1.5 h-[7px] w-[7px] rounded-full border border-chart-1/60 bg-chart-1/20 transition-all duration-300 group-hover:bg-chart-1 group-hover:shadow-[0_0_8px_oklch(0.837_0.128_66.29/0.5)]" />
                  <p className="text-[16px] font-semibold text-foreground/90">{item.title}</p>
                  <p className="mt-0.5 text-[12px] text-foreground/45">{item.company}</p>
                  <p className="text-[11px] text-chart-1/70">{item.period}</p>
                  <ul className="mt-3 space-y-1.5">
                    {item.bullets.map((b, j) => (
                      <li key={j} className="flex gap-2 text-[12px] leading-relaxed text-foreground/60">
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
            <h2 className="mb-8 text-[28px] font-extrabold tracking-tight">Skills & Tools</h2>
            <div className="space-y-8">
              {[
                { category: "Frontend", items: [
                  { icon: <RiReactjsLine className="h-6 w-6" />, label: "React" },
                  { icon: <RiCodeSSlashLine className="h-6 w-6" />, label: "TypeScript" },
                  { icon: <RiWindyLine className="h-6 w-6" />, label: "Tailwind" },
                ]},
                { category: "Motion & 3D", items: [
                  { icon: <RiSpeedLine className="h-6 w-6" />, label: "GSAP" },
                  { icon: <RiTriangleLine className="h-6 w-6" />, label: "Three.js" },
                  { icon: <RiGitBranchLine className="h-6 w-6" />, label: "Lenis" },
                ]},
                { category: "Tooling & Design", items: [
                  { icon: <RiSpeedLine className="h-6 w-6" />, label: "Vite" },
                  { icon: <RiGitBranchLine className="h-6 w-6" />, label: "Git" },
                  { icon: <RiPenNibLine className="h-6 w-6" />, label: "Design" },
                ]},
              ].map(({ category, items }) => (
                <div key={category}>
                  <p className="mb-3 text-[10px] tracking-[0.18em] text-foreground/30">{category.toUpperCase()}</p>
                  <div className="grid grid-cols-3 gap-3">
                    {items.map(({ icon, label }) => (
                      <SkillTileLarge key={label} icon={icon} label={label} />
                    ))}
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
              <p className="mt-1 text-[13px] text-chart-1/80">Designer-Developer</p>
            </div>
            <p className="max-w-md text-[13px] leading-relaxed text-foreground/55">
              Based in Manila. I design and build interfaces that feel inevitable — the kind where you forget someone made a decision. Available for senior IC and lead roles.
            </p>
            <div className="flex gap-4">
              {[{ icon: <RiGithubLine className="h-4 w-4" />, label: "GITHUB" },
                { icon: <RiLinkedinLine className="h-4 w-4" />, label: "LINKEDIN" }].map(({ icon, label }) => (
                <a key={label} href="#" className="flex items-center gap-2 rounded-lg border border-border/60 px-4 py-2 text-[11px] tracking-[0.1em] text-foreground/50 transition-all hover:border-chart-1/50 hover:text-foreground">
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
              <span className="text-[32px] font-bold text-chart-1/80">R</span>
            </div>
            <h2 className="text-[26px] font-extrabold tracking-tight">Ron Salvador</h2>
            <p className="text-[11px] tracking-[0.2em] text-chart-1/60">DESIGNER-DEVELOPER</p>
            <div className="mt-4 max-w-sm space-y-3 text-[13px] leading-relaxed text-foreground/55">
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
          <div className="max-w-xl space-y-8 relative z-10">
            <div>
              <h2 className="text-[32px] font-extrabold tracking-tight">Let's build something together</h2>
              <p className="mt-3 text-[13px] leading-relaxed text-foreground/55">
                Open to senior IC, lead, and contract roles. I respond within 24 hours.
              </p>
            </div>
            <div className="space-y-3">
              {[
                { label: "Email", value: "ron@example.com", href: "mailto:ron@example.com" },
                { label: "LinkedIn", value: "linkedin.com/in/ron", href: "#" },
                { label: "GitHub", value: "github.com/ron", href: "#" },
              ].map(({ label, value, href }) => (
                <a key={label} href={href} className="group flex items-center justify-between rounded-xl border border-border/50 bg-muted/20 px-5 py-4 transition-all hover:border-chart-1/40 hover:bg-chart-1/5">
                  <div>
                    <p className="text-[10px] tracking-[0.14em] text-foreground/35">{label.toUpperCase()}</p>
                    <p className="mt-0.5 text-[13px] text-foreground/75">{value}</p>
                  </div>
                  <RiArrowRightUpLine className="h-4 w-4 text-foreground/25 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-chart-1" />
                </a>
              ))}
            </div>
          </div>
          <div className="absolute -right-40 -bottom-16 w-96 h-96 opacity-15 pointer-events-none">
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
        <h2 className="mb-6 text-[28px] font-extrabold tracking-tight">Projects</h2>
        <div className="space-y-3">
          {PROJECTS.map((proj, i) => (
            <button
              key={i}
              onClick={() => openDetail(i)}
              className={`group w-full rounded-2xl border p-5 text-left transition-all duration-200
                ${selected === i
                  ? "border-chart-1/50 bg-chart-1/8 shadow-[0_0_0_1px_oklch(0.837_0.128_66.29/0.15)]"
                  : "border-border/50 bg-muted/10 hover:border-chart-1/30 hover:bg-chart-1/5"}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className={`h-[6px] w-[6px] shrink-0 rounded-full ${proj.accent}`} />
                  <span className="text-[10px] tracking-wide text-foreground/40">{proj.tag}</span>
                </div>
                <RiArrowRightSLine
                  className={`h-4 w-4 shrink-0 transition-all duration-200
                    ${selected === i ? "rotate-90 text-chart-1" : "text-foreground/20 group-hover:text-chart-1/60"}`}
                />
              </div>
              <h3 className="mt-2 text-[15px] font-semibold leading-snug text-foreground/90">{proj.name}</h3>
              <p className={`mt-1 text-[11px] leading-relaxed text-foreground/50 transition-all duration-200 ${selected !== i ? "line-clamp-1 opacity-60" : ""}`}>
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
                <span className="text-[10px] tracking-[0.16em] text-foreground/40">{p.tag}</span>
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
              <span className={`text-[11px] tracking-widest ${p.accent.replace("bg-", "text-")}/40`}>
                PROJECT PREVIEW
              </span>
            </div>

            <p className="text-[12px] italic leading-relaxed text-foreground/50 border-l-2 border-chart-1/40 pl-4 mb-6">
              {p.desc}
            </p>

            <div className="space-y-5 text-[12px] leading-relaxed text-foreground/65">
              <p>{p.full}</p>
            </div>

            {/* tech stack pills */}
            <div className="mt-6">
              <p className="mb-3 text-[10px] tracking-[0.16em] text-foreground/30">STACK</p>
              <div className="flex flex-wrap gap-2">
                {(p.stack ?? ["React", "TypeScript", "Tailwind"]).map((t: string) => (
                  <span key={t} className="rounded-md border border-border/50 bg-muted/30 px-3 py-1 text-[10px] tracking-wide text-foreground/55">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* links */}
            <div className="mt-8 flex gap-3 pb-4">
              <a href="#" className="flex items-center gap-1.5 rounded-lg border border-border/60 px-4 py-2 text-[11px] tracking-[0.1em] text-foreground/50 transition-all hover:border-chart-1/50 hover:text-foreground">
                <RiGithubLine className="h-3.5 w-3.5" /> GITHUB
              </a>
              <a href="#" className="flex items-center gap-1.5 rounded-lg border border-chart-1/40 bg-chart-1/10 px-4 py-2 text-[11px] tracking-[0.1em] text-chart-1/80 transition-all hover:bg-chart-1/20">
                <RiArrowRightUpLine className="h-3.5 w-3.5" /> LIVE
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
      className={`cell-enter group rounded-2xl border bg-card text-card-foreground ${clickable ? "border-amber-500/40 cursor-pointer shadow-[0_0_0_1px_rgba(217,119,6/0.15)] hover:border-amber-500/60 hover:shadow-[0_0_0_1px_rgba(217,119,6/0.25),0_8px_24px_-4px_rgba(0,0,0,0.18)]" : "border-border/50"} ${hoverClasses} ${className}`}
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

      {/* ── Navbar ────────────────────────────────────────────── */}
      <header className="shrink-0 border-b border-border/50 bg-card/80 backdrop-blur">
        <div className="flex items-center justify-between px-5 py-3">
          <span className="text-[13px] font-bold tracking-tight text-foreground">
            Ron<span className="text-chart-1">.</span>
          </span>
          <ThemeToggle />
        </div>
      </header>

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
          <p className="text-[10px] tracking-[0.18em] text-foreground/30">PORTFOLIO</p>
          <div className="relative z-10">
            <h1 className="text-[26px] font-extrabold leading-[1.15] tracking-tight text-foreground">
              Ron <span className="text-chart-1">—</span> Designer-Developer
            </h1>
            <p className="mt-3 text-[12px] italic leading-relaxed text-foreground/45">
              "I design and build interfaces that read fast and age well — this page is one of them."
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
          <p className="border-t border-portrait-fg/20 px-5 py-3 text-[10px] tracking-[0.14em] text-portrait-fg/70">
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
            <span className="text-[10px] tracking-[0.18em] text-foreground/30">PROJECTS</span>
            <a
              href="#"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-[10px] tracking-[0.12em] text-foreground/35 transition-colors hover:text-foreground/75"
            >
              <span>SEE MORE</span>
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
              <span className="text-[10px] tracking-wide text-foreground/40">{project.tag}</span>
            </div>
            <p className="mt-1.5 text-[13px] font-semibold leading-snug text-foreground/85">{project.name}</p>
            <p className="mt-1 text-[11px] leading-relaxed text-foreground/45">{project.desc}</p>
            <a
              href="#"
              onClick={(e) => e.stopPropagation()}
              className="mt-2 inline-flex items-center gap-1 text-[10px] tracking-[0.1em] text-foreground/35 transition-colors hover:text-foreground/70"
            >
              SEE MORE <RiArrowRightUpLine className="h-3 w-3" />
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
                className="flex h-6 w-6 items-center justify-center rounded border border-border/60 text-foreground/35 transition-colors hover:text-foreground/75"
              >
                <RiArrowRightSLine className="h-3 w-3 -scale-x-100" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); goTo((projectIdx + 1) % PROJECTS.length) }}
                className="flex h-6 w-6 items-center justify-center rounded border border-border/60 text-foreground/35 transition-colors hover:text-foreground/75"
              >
                <RiArrowRightSLine className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* social footer */}
          <div className="border-t border-border/40 px-4 py-3">
            <div className="flex items-center justify-center gap-5">
              {(
                [
                  { icon: <RiGithubLine className="h-3.5 w-3.5" />, label: "GITHUB" },
                  { icon: <RiLinkedinLine className="h-3.5 w-3.5" />, label: "LINKEDIN" },
                  { icon: <RiTwitterXLine className="h-3.5 w-3.5" />, label: "X" },
                ] as { icon: React.ReactNode; label: string }[]
              ).map(({ icon, label }) => (
                <a
                  key={label}
                  href="#"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1.5 text-[10px] tracking-[0.12em] text-foreground/35 transition-colors hover:text-foreground/80"
                >
                  {icon}{label}
                </a>
              ))}
            </div>
          </div>
        </Cell>

        {/* ── 4. JOURNEY + SKILLS + LOGO ──────────────────────── */}
        <div
          className="grid gap-[6px]"
          style={{ gridColumn: 1, gridRow: "2 / 4", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr auto" }}
          data-subgrid="true"
        >
          <Cell className="row-span-2 p-5" enterDelay={80} onOpen={openModal("journey")}>
            <p className="mb-4 text-[10px] tracking-[0.18em] text-foreground/30">JOURNEY</p>
            <div className="space-y-5">
              <JourneyItem
                title="Senior Designer-Developer"
                company="Acme Design Studio"
                period="2023–Present"
                bullets={["Leading design systems and frontend architecture.", "Shipped 12+ projects from design through production."]}
              />
              <JourneyItem
                title="Full-Stack Designer"
                company="Creative Agency Co"
                period="2021–2023"
                bullets={["Built responsive interfaces and real-time data dashboards for fintech clients."]}
              />
              <JourneyItem
                title="Frontend Engineer"
                company="StartupXYZ"
                period="2019–2021"
                bullets={["Early-stage team of 5. Built core product in React."]}
              />
            </div>
          </Cell>

          <Cell className="p-5" enterDelay={100}>
            <p className="mb-4 text-[10px] tracking-[0.18em] text-foreground/30">SKILLS</p>
            <div className="grid grid-cols-3 gap-[5px]">
              <SkillTile icon={<RiReactjsLine className="h-[17px] w-[17px]" />} label="React" delay={0} />
              <SkillTile icon={<RiCodeSSlashLine className="h-[17px] w-[17px]" />} label="TypeScript" delay={30} />
              <SkillTile icon={<RiWindyLine className="h-[17px] w-[17px]" />} label="Tailwind" delay={60} />
              <SkillTile icon={<RiSpeedLine className="h-[17px] w-[17px]" />} label="GSAP" delay={90} />
              <SkillTile icon={<RiTriangleLine className="h-[17px] w-[17px]" />} label="Three.js" delay={120} />
              <SkillTile icon={<RiGitBranchLine className="h-[17px] w-[17px]" />} label="Lenis" delay={150} />
              <SkillTile icon={<RiSpeedLine className="h-[17px] w-[17px]" />} label="Vite" delay={180} />
              <SkillTile icon={<RiGitBranchLine className="h-[17px] w-[17px]" />} label="Git" delay={210} />
              <SkillTile icon={<RiPenNibLine className="h-[17px] w-[17px]" />} label="Design" delay={240} />
            </div>
          </Cell>

          <Cell className="flex flex-col items-center justify-center gap-2 py-5" enterDelay={140}>
            <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-chart-1/60 bg-chart-1/10">
              <span className="text-[15px] font-bold text-chart-1/80">R</span>
            </div>
            <p className="text-[9px] tracking-[0.16em] text-chart-1/50">DESIGNER-DEV</p>
          </Cell>
        </div>

        {/* ── 5. CONTACT ──────────────────────────────────────── */}
        <Cell
          className="cursor-pointer"
          style={{ gridColumn: 2, gridRow: 3 }}
          enterDelay={160}
          onOpen={openModal("contact")}
        >
          <div className="flex h-full items-center justify-between p-5">
            <div>
              <span className="text-[14px] font-semibold text-foreground/85">Contact me</span>
              <p className="mt-1.5 text-[11px] leading-relaxed text-foreground/35">
                Let's build something together
              </p>
            </div>
            <RiArrowRightUpLine className="h-5 w-5 shrink-0 text-foreground/30 transition-all duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-chart-1" />
          </div>
        </Cell>

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
