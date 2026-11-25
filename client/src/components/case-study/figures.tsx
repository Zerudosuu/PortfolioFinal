/* Figures for the Pulse case study. Plain SVG/HTML that follows the portfolio's
   own tokens (--card, --border, --foreground, --chart-1), so it switches with the
   light/dark theme without a separate palette. */

const FG = "var(--foreground)"
const MUTED = "var(--muted-foreground)"
const LINE = "var(--border)"
const CARD = "var(--card)"
const ACCENT = "var(--chart-1)"
const ACCENT_TEXT = "var(--chart-1-text)"

function Box({ x, y, w, h, title, lines, highlight = false }: {
  x: number; y: number; w: number; h: number; title: string; lines: string[]; highlight?: boolean
}) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={10} fill={CARD} stroke={highlight ? ACCENT_TEXT : LINE} strokeWidth={highlight ? 2 : 1} />
      <text x={x + 14} y={y + 25} fontSize={15} fontWeight={700} fill={FG}>{title}</text>
      {lines.map((line, i) => (
        <text key={line} x={x + 14} y={y + 46 + i * 18} fontSize={12.5} fill={MUTED}>{line}</text>
      ))}
    </g>
  )
}

function Arrow({ d, label, lx, ly }: { d: string; label?: string; lx?: number; ly?: number }) {
  return (
    <g>
      <path d={d} fill="none" stroke={MUTED} strokeWidth={1.25} markerEnd="url(#pulse-arrow)" />
      {label && <text x={lx} y={ly} fontSize={12} textAnchor="middle" fill={MUTED}>{label}</text>}
    </g>
  )
}

function ArrowHead() {
  return (
    <defs>
      <marker id="pulse-arrow" viewBox="0 0 10 10" refX={9} refY={5} markerWidth={6} markerHeight={6} orient="auto-start-reverse">
        <path d="M0 0 L10 5 L0 10 z" fill={MUTED} />
      </marker>
    </defs>
  )
}

/** Figure: system architecture. The browser never talks to Jira; the API holds the token. */
export function ArchitectureFigure() {
  const ext = [
    { y: 8, h: 68, t: "Jira Data Center", l: ["REST v2 · read-only"] },
    { y: 96, h: 68, t: "PostgreSQL", l: ["Users · org · tokens"] },
    { y: 184, h: 68, t: "Corporate SSO", l: ["OIDC + PKCE sign-in"] },
    { y: 272, h: 68, t: "Monday.com", l: ["Attendance board"] },
    { y: 360, h: 50, t: "LLM gateway", l: [] },
  ]
  return (
    <svg viewBox="0 0 800 440" role="img" aria-label="System architecture: users reach a React app, which calls an Express API. The API alone talks to Jira (read-only), PostgreSQL, corporate SSO, Monday.com and the LLM gateway." className="h-auto w-full">
      <ArrowHead />
      <Box x={4} y={168} w={176} h={92} title="Users" lines={["Analyst · Team lead", "Ops lead · Ops manager"]} />
      <Box x={208} y={168} w={140} h={92} title="React app" lines={["Vercel · CDN", "Role-aware UI"]} />
      <Box x={378} y={120} w={212} h={188} title="Express API" lines={["Render", "JWT checked per request", "Role checked per route", "Jira token stays here"]} highlight />
      <Box x={378} y={348} w={212} h={62} title="Cache" lines={["4 hours, in memory"]} />
      {ext.map(e => <Box key={e.t} x={630} y={e.y} w={166} h={e.h} title={e.t} lines={e.l} />)}

      <Arrow d="M180 214 H208" />
      <Arrow d="M348 214 H378" />
      <path d="M278 260 V379 H378" fill="none" stroke={MUTED} strokeWidth={1.25} markerEnd="url(#pulse-arrow)" />
      <path d="M590 214 H610 M610 42 V385" fill="none" stroke={MUTED} strokeWidth={1.25} />
      {[42, 130, 218, 306, 385].map(y => (
        <path key={y} d={`M610 ${y} H630`} fill="none" stroke={MUTED} strokeWidth={1.25} markerEnd="url(#pulse-arrow)" />
      ))}
      <text x={4} y={432} fontSize={12.5} fill={MUTED}>Only the API talks to outside systems. The browser never sees the Jira token.</text>
    </svg>
  )
}

/** Figure: org hierarchy and how a team lead's dashboard scope is derived. */
export function OrgScopeFigure() {
  return (
    <svg viewBox="0 0 800 330" role="img" aria-label="Org tree: ops manager, two ops leads, three team leads. The highlighted team lead's dashboard covers every analyst beneath them." className="h-auto w-full">
      <ArrowHead />
      <Box x={300} y={6} w={200} h={72} title="Ops manager" lines={["Whole organisation"]} />
      <Box x={100} y={110} w={200} h={72} title="Ops lead A" lines={["Two teams"]} />
      <Box x={500} y={110} w={200} h={72} title="Ops lead B" lines={["One team"]} />
      <Box x={8} y={214} w={190} h={72} title="Team lead 1" lines={["22 analysts"]} highlight />
      <Box x={208} y={214} w={190} h={72} title="Team lead 2" lines={["18 analysts"]} />
      <Box x={505} y={214} w={190} h={72} title="Team lead 3" lines={["14 analysts"]} />
      <path d="M400 78 V94 H200 V110 M400 94 H600 V110" fill="none" stroke={MUTED} strokeWidth={1.25} />
      <path d="M200 182 V198 H103 V214 M200 198 H303 V214" fill="none" stroke={MUTED} strokeWidth={1.25} />
      <path d="M600 182 V198 H600 V214" fill="none" stroke={MUTED} strokeWidth={1.25} />
      <text x={8} y={314} fontSize={13} fill={FG}>
        Team lead 1 sees: <tspan fontFamily="var(--font-mono)">assignee IN (all 22 analysts under them)</tspan>
      </text>
    </svg>
  )
}

const KPI_STEPS = [
  ["1", "Request", "Dashboard asks for KPIs for one scope"],
  ["2", "Resolve scope", "Org tree turns the user into a list of Jira names"],
  ["3", "Cache check", "Hit: return the saved snapshot"],
  ["4", "Fetch", "Open backlog and 60-day history, in parallel"],
  ["5", "Calculate", "Counts, urgent, waiting, reopened, average resolution"],
  ["6", "Compare", "Current period against the previous one, for the arrows"],
]

/** Figure: KPI data flow, shown as a simple pipeline. */
export function KpiFlowFigure() {
  return (
    <ol className="grid gap-3 @lg:grid-cols-2 @3xl:grid-cols-3">
      {KPI_STEPS.map(([n, title, body]) => (
        <li key={n} className="rounded-xl border border-border/70 bg-card p-4">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md border border-chart-1/40 text-[11px] font-bold text-chart-1-text">{n}</span>
            <span className="text-[13px] font-semibold text-foreground">{title}</span>
          </div>
          <p className="mt-2 text-[12px] leading-relaxed text-foreground/60">{body}</p>
        </li>
      ))}
    </ol>
  )
}

const AUTH_STEPS = [
  ["Sign in", "Corporate single sign-on (OIDC with PKCE). No passwords are stored for these users."],
  ["Match or wait", "The account is matched by email. New users wait in a pending state."],
  ["Approve a role", "An admin assigns analyst, team lead, ops lead, ops manager or admin."],
  ["Hold a session", "A 15-minute access token and a 7-day refresh token, rotated on every use and stored as hashes."],
  ["Check every call", "The server verifies the token and the role on each route. The UI only hides what the server would refuse."],
]

/** Figure: authentication flow. */
export function AuthFlowFigure() {
  return (
    <ol className="grid gap-3 @lg:grid-cols-2 @4xl:grid-cols-5">
      {AUTH_STEPS.map(([title, body], i) => (
        <li key={title} className="relative rounded-xl border border-border/70 bg-card p-4">
          <span className="text-[11px] font-bold tracking-widest text-chart-1-text">STEP {i + 1}</span>
          <p className="mt-1 text-[13px] font-semibold text-foreground">{title}</p>
          <p className="mt-2 text-[12px] leading-relaxed text-foreground/60">{body}</p>
        </li>
      ))}
    </ol>
  )
}

/** Graph: commits per month for the whole build. Single series, so no legend; the title names it. */
export function CommitsChart() {
  const data = [
    { m: "Jul", v: 8 }, { m: "Aug", v: 63 }, { m: "Sep", v: 2 }, { m: "Oct", v: 2 }, { m: "Nov", v: 16 },
  ]
  const max = 70
  const W = 720, H = 220, PAD_L = 8, PAD_B = 28, PAD_T = 18
  const plotH = H - PAD_B - PAD_T
  const slot = (W - PAD_L) / data.length
  const barW = Math.min(64, slot * 0.46)
  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Commits per month: July 8, August 63, September 2, October 2, November 16. 91 in total." className="h-auto w-full">
        <line x1={PAD_L} x2={W} y1={H - PAD_B} y2={H - PAD_B} stroke={LINE} strokeWidth={1} />
        {data.map((d, i) => {
          const h = (d.v / max) * plotH
          const cx = PAD_L + slot * i + slot / 2
          return (
            <g key={d.m}>
              <rect x={cx - barW / 2} y={H - PAD_B - h} width={barW} height={h} rx={4} fill={ACCENT} />
              {(d.v === 63 || d.v === 16) && (
                <text x={cx} y={H - PAD_B - h - 6} fontSize={12} textAnchor="middle" fill={FG}>{d.v}</text>
              )}
              <text x={cx} y={H - 8} fontSize={12} textAnchor="middle" fill={MUTED}>{d.m} 2026</text>
            </g>
          )
        })}
      </svg>
      <figcaption className="mt-2 text-[12px] text-foreground/55">Commits per month, July to November 2026: 91 in total. The August spike is the five-week build; the smaller bars are the iteration phase.</figcaption>
    </figure>
  )
}

const ROLES = ["Analyst", "Team lead", "Ops lead", "Ops manager", "Admin"]
const SCREENS: [string, boolean[]][] = [
  ["Dashboard", [true, true, true, true, false]],
  ["Team overview", [false, true, true, true, false]],
  ["Client analytics", [false, true, true, true, false]],
  ["Attendance", [false, true, true, false, false]],
  ["Employee transfers", [false, true, true, true, false]],
  ["Email composer", [true, true, true, false, false]],
  ["Claims report", [true, true, true, true, true]],
  ["User management", [false, false, false, false, true]],
  ["Name normalization", [false, false, false, false, true]],
  ["Profile & settings", [true, true, true, false, true]],
]

/** Table: which screens each role can open. Mirrors the navigation rules in the app. */
export function RoleMatrix() {
  return (
    <div className="overflow-x-auto rounded-xl border border-border/70">
      <table className="w-full min-w-[560px] text-left text-[12px]">
        <caption className="sr-only">Screens available to each role</caption>
        <thead className="bg-muted/40">
          <tr>
            <th scope="col" className="px-4 py-3 font-semibold text-foreground/70">Screen</th>
            {ROLES.map(r => <th key={r} scope="col" className="px-3 py-3 text-center font-semibold text-foreground/70">{r}</th>)}
          </tr>
        </thead>
        <tbody>
          {SCREENS.map(([name, access]) => (
            <tr key={name} className="border-t border-border/60">
              <th scope="row" className="px-4 py-2.5 font-medium text-foreground/85">{name}</th>
              {access.map((ok, i) => (
                <td key={ROLES[i]} className="px-3 py-2.5 text-center">
                  {ok ? <span className="text-chart-1-text" aria-label="Yes">✓</span> : <span className="text-foreground/25" aria-label="No">–</span>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
