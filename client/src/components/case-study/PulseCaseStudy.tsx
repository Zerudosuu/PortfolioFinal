import { ArchitectureFigure, AuthFlowFigure, CommitsChart, KpiFlowFigure, OrgScopeFigure, RoleMatrix } from "./figures"

/* Case study for Pulse. Solution and result sit at the top (what a client reads first),
   then the story in the order of the template: problem, goal, tools and timeline,
   how it was built, result, what to improve. Numbers here come from the approved draft. */

const SECTION = "mt-12 first:mt-0"
const H2 = "text-[20px] font-extrabold tracking-tight text-foreground"
const P = "mt-3 text-[14px] leading-relaxed text-foreground/70"
const LABEL = "text-[11px] tracking-[0.18em] text-foreground/55 uppercase"

function Figure({ caption, children }: { caption: string; children: React.ReactNode }) {
  return (
    <figure className="mt-6 rounded-xl border border-border/70 bg-card p-4 sm:p-6">
      {children}
      <figcaption className="mt-4 text-[12px] leading-relaxed text-foreground/55">{caption}</figcaption>
    </figure>
  )
}

function Shot({ src, alt, caption }: { src: string; alt: string; caption: string }) {
  return (
    <figure className="mt-6">
      <img src={src} alt={alt} loading="lazy" className="w-full rounded-xl border border-border/70 bg-card" />
      <figcaption className="mt-2 text-[12px] leading-relaxed text-foreground/55">{caption}</figcaption>
    </figure>
  )
}

const BASE = "/case-studies/pulse/screens/"

export function PulseCaseStudy() {
  return (
    <article className="text-foreground">
      {/* ── Solution first ─────────────────────────────────────── */}
      <header className="rounded-2xl border border-chart-1/40 bg-chart-1/10 p-6 sm:p-8">
        <p className={LABEL}>Case study · Operations dashboard</p>
        <h2 className="mt-2 text-[28px] font-extrabold leading-tight tracking-tight">Pulse</h2>
        <p className="mt-3 text-[16px] leading-relaxed text-foreground/85">
          A Jira productivity dashboard that gives every role in an operations team its own numbers within seconds of sign-in.
          Replaced hand-built Excel reports and saves each team lead roughly 3–5 hours a week.
        </p>

        <dl className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border/60 bg-card/70 p-4">
            <dt className={LABEL}>Time saved</dt>
            <dd className="mt-2 text-[22px] font-bold">3–5 hrs / week</dd>
            <dd className="mt-1 text-[12px] text-foreground/55">per team lead, on manual reporting (estimate)</dd>
          </div>
          <div className="rounded-xl border border-border/60 bg-card/70 p-4">
            <dt className={LABEL}>Used by</dt>
            <dd className="mt-2 text-[22px] font-bold">~100 regular users</dd>
            <dd className="mt-1 text-[12px] text-foreground/55">across 10–20 teams, in an org of up to 400</dd>
          </div>
          <div className="rounded-xl border border-border/60 bg-card/70 p-4">
            <dt className={LABEL}>Running cost</dt>
            <dd className="mt-2 text-[22px] font-bold">$0 / month</dd>
            <dd className="mt-1 text-[12px] text-foreground/55">free-tier hosting and database</dd>
          </div>
        </dl>

        <p className="mt-6 text-[12px] leading-relaxed text-foreground/50">
          Screens in this study use invented demo data. No names, clients or figures come from the live system.
        </p>
      </header>

      {/* ── Problem ───────────────────────────────────────────── */}
      <section className={SECTION}>
        <h3 className={H2}>The problem</h3>
        <p className={P}>
          An operations team works its support tickets in Jira Data Center. Four layers of people look at the same tickets:
          analysts, team leads, ops leads and ops managers. Each needed a different view, and none of them had one.
        </p>
        <ul className="mt-4 space-y-2 text-[14px] leading-relaxed text-foreground/70">
          <li><span className="font-semibold text-foreground/85">Analysts</span> exported Jira to Excel to see their own queue.</li>
          <li><span className="font-semibold text-foreground/85">Team leads</span> spent hours each week building team reports by hand.</li>
          <li><span className="font-semibold text-foreground/85">Ops leads</span> had no view across teams.</li>
          <li><span className="font-semibold text-foreground/85">Nobody</span> had history, so "is the backlog getting better?" had no answer.</li>
          <li><span className="font-semibold text-foreground/85">Attendance</span> lived on a separate board, in another tab with another login.</li>
        </ul>
        <p className={`${P} mt-4`}>
          Jira held the data, but not the org structure (who reports to whom), and every user had to write JQL to get a view.
        </p>
      </section>

      {/* ── Goal ──────────────────────────────────────────────── */}
      <section className={SECTION}>
        <h3 className={H2}>The goal</h3>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-[14px] leading-relaxed text-foreground/70">
          <li>Every user sees only what their role needs, within seconds of signing in.</li>
          <li>Trend arrows show which way the queue is moving, against the previous period.</li>
          <li>Leads can check team health without calling a meeting.</li>
          <li>The Jira token never reaches the browser, and roles are enforced on the server.</li>
          <li>It costs nothing to run.</li>
        </ol>
      </section>

      {/* ── Tools & timeline ──────────────────────────────────── */}
      <section className={SECTION}>
        <h3 className={H2}>Tools and timeline</h3>
        <p className={P}>
          Started 28 July 2026. The first full release was ready at the end of August, about five weeks of build.
          It has kept improving since, with 91 commits from July to November.
        </p>
        <Figure caption="Commits per month. The bars are the build phase in August and the smaller iteration phase after it.">
          <CommitsChart />
        </Figure>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border/70 bg-card p-4">
            <p className={LABEL}>Frontend</p>
            <p className="mt-2 text-[13px] leading-relaxed text-foreground/75">React 18, TypeScript, Vite, Tailwind CSS, Radix UI, Recharts, React Query, Zustand</p>
          </div>
          <div className="rounded-xl border border-border/70 bg-card p-4">
            <p className={LABEL}>Backend</p>
            <p className="mt-2 text-[13px] leading-relaxed text-foreground/75">Node.js, Express, TypeScript, PostgreSQL, JWT, bcrypt, OIDC sign-in</p>
          </div>
          <div className="rounded-xl border border-border/70 bg-card p-4">
            <p className={LABEL}>Integrations</p>
            <p className="mt-2 text-[13px] leading-relaxed text-foreground/75">Jira Data Center (read-only), corporate SSO, Monday.com attendance, an internal LLM gateway</p>
          </div>
          <div className="rounded-xl border border-border/70 bg-card p-4">
            <p className={LABEL}>Infrastructure</p>
            <p className="mt-2 text-[13px] leading-relaxed text-foreground/75">Vercel (frontend), Render (API), Neon (database), Docker Compose for local work. All free tiers.</p>
          </div>
        </div>
      </section>

      {/* ── How I did it ─────────────────────────────────────── */}
      <section className={SECTION}>
        <h3 className={H2}>How I did it</h3>

        <h4 className="mt-8 text-[15px] font-bold text-foreground">1 · Start from the questions each role asks</h4>
        <p className={P}>
          Each role opens the app to answer one question: analysts ask what is in their queue, team leads ask who needs help today,
          ops leads ask which team is falling behind, and admins ask who has access to what. A screen that did not answer one of these was left out.
        </p>

        <h4 className="mt-8 text-[15px] font-bold text-foreground">2 · Put a secure proxy between the browser and Jira</h4>
        <p className={P}>
          The browser never talks to Jira. The API holds the Jira token, checks the user's session and role, decides which tickets that user may see, and only then calls Jira.
        </p>
        <Figure caption="System architecture. The API is the only component that talks to external systems.">
          <ArchitectureFigure />
        </Figure>

        <h4 className="mt-8 text-[15px] font-bold text-foreground">3 · Teach the dashboard the org chart</h4>
        <p className={P}>
          Jira knows tickets and usernames. It does not know who reports to whom. The org tree is stored in the database,
          and each person is mapped to their Jira name. A team lead's dashboard is then the set of tickets assigned to anyone beneath them.
        </p>
        <Figure caption="Org tree and scope. Team lead 1's dashboard covers all 22 analysts beneath them, and no one else.">
          <OrgScopeFigure />
        </Figure>

        <h4 className="mt-8 text-[15px] font-bold text-foreground">4 · Turn raw tickets into KPIs</h4>
        <p className={P}>
          The backend fetches each scope's open backlog and 60 days of history in parallel. It then calculates active, closed, urgent,
          waiting or pending, high-priority, reopened and average resolution time. Jira has no "reopened" flag, so reopens come from each ticket's status history.
          Every KPI compares the current period with the one before it.
        </p>
        <Figure caption="KPI data flow for one request.">
          <KpiFlowFigure />
        </Figure>

        <h4 className="mt-8 text-[15px] font-bold text-foreground">5 · Keep it fast without hammering Jira</h4>
        <p className={P}>
          A four-hour cache sits in front of Jira, and the browser caches on its side too. When a ticket or attendance entry changes, the related
          views refresh straight away, so no one sees stale numbers.
        </p>

        <h4 className="mt-8 text-[15px] font-bold text-foreground">6 · Secure sign-in on a free stack</h4>
        <p className={P}>
          Sign-in uses corporate single sign-on. Sessions use a short access token and a longer refresh token that rotates on every use.
          New users wait in a pending state until an admin gives them a role. Login and refresh calls are rate limited.
        </p>
        <Figure caption="Authentication flow, from first sign-in to a checked API call.">
          <AuthFlowFigure />
        </Figure>

        <h4 className="mt-8 text-[15px] font-bold text-foreground">7 · Show each role only its screens</h4>
        <p className={P}>
          The server decides what each role can open, and the navigation follows from that. This table is the same rule set the app uses.
        </p>
        <div className="mt-6">
          <RoleMatrix />
        </div>

        <h4 className="mt-8 text-[15px] font-bold text-foreground">8 · Build the screens around the questions</h4>
        <p className={P}>
          Each dashboard opens on the headline numbers, then the trend, then the tickets that need action. Team leads get an attendance ring, and
          the team view puts the people behind each number on the same page.
        </p>
        <Shot src={`${BASE}team-lead-dashboard.webp`} alt="Team lead dashboard with invented data: KPI cards for active, closed, waiting, urgent, reopened and average resolution, a productivity trend, team attendance and workload panels." caption="Team lead dashboard. Demo data only." />
        <Shot src={`${BASE}ops-lead-dashboard.webp`} alt="Ops lead dashboard covering several teams, with invented data." caption="Ops lead dashboard across all teams under one lead. Demo data only." />
        <Shot src={`${BASE}ops-manager-dashboard.webp`} alt="Ops manager dashboard covering the whole organisation, with invented data." caption="Ops manager view, with the same KPIs across every operations lead. Demo data only." />
        <Shot src={`${BASE}analyst-dashboard.webp`} alt="Analyst dashboard showing the analyst's own active, closed, urgent and waiting tickets." caption="Analyst dashboard: each person's own queue. Demo data only." />
        <Shot src={`${BASE}team-overview.webp`} alt="Team overview table of rework tickets with assignee and status, plus a team snapshot of active and urgent counts." caption="Team overview: the tickets behind each number, with a snapshot per analyst. Demo data only." />
        <Shot src={`${BASE}attendance.webp`} alt="Weekly attendance grid for a team, with a trend chart and matched board status." caption="Attendance: the weekly board, read from the team's attendance source. Demo data only." />
      </section>

      {/* ── Result ───────────────────────────────────────────── */}
      <section className={SECTION}>
        <h3 className={H2}>The result</h3>
        <div className="mt-4 overflow-x-auto rounded-xl border border-border/70">
          <table className="w-full min-w-[520px] text-left text-[13px]">
            <caption className="sr-only">Before and after Pulse</caption>
            <thead className="bg-muted/40">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold text-foreground/70">Before</th>
                <th scope="col" className="px-4 py-3 font-semibold text-foreground/70">After</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Jira exported to Excel by hand", "KPIs on sign-in, with no export step"],
                ["Team reports compiled by hand, about 3–5 hours a week per team lead", "Team view generated automatically"],
                ["No view across teams", "One ops lead view across every team"],
                ["No history", "Trend arrows on every KPI, plus weekly, bi-weekly and monthly charts"],
                ["Client email drafts took 20–30 minutes", "AI draft in two clicks, then a human edit, about 2–5 minutes (estimate)"],
                ["Attendance on a separate board", "Attendance built in, with alerts for blank entries"],
              ].map(([before, after]) => (
                <tr key={before} className="border-t border-border/60">
                  <td className="px-4 py-2.5 text-foreground/65">{before}</td>
                  <td className="px-4 py-2.5 text-foreground/85">{after}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-[12px] leading-relaxed text-foreground/55">
          Time figures are my estimates, not measurements. Adoption is about 100 regular users in an organisation of up to 400, across roughly 10–20 teams.
        </p>
      </section>

      {/* ── What to improve ──────────────────────────────────── */}
      <section className={SECTION}>
        <h3 className={H2}>What I would improve next</h3>
        <ul className="mt-4 space-y-3 text-[14px] leading-relaxed text-foreground/70">
          <li><span className="font-semibold text-foreground/85">Cold starts.</span> The free hosting tier sleeps when idle, so the first load of the day is slow. A paid always-on instance or a keep-alive ping would fix it.</li>
          <li><span className="font-semibold text-foreground/85">Automated browser tests.</span> There is unit and integration coverage, but no end-to-end tests yet. Playwright is the next step.</li>
          <li><span className="font-semibold text-foreground/85">Audit logging.</span> Admin actions are not logged yet, and compliance will need that.</li>
          <li><span className="font-semibold text-foreground/85">Write-back to Jira.</span> Pulse is read-only by design. Posting approved replies and assigning tickets would close the loop once write access is approved.</li>
          <li><span className="font-semibold text-foreground/85">Real-time updates.</span> Today it refreshes through the cache. Push updates would remove the need to reload.</li>
          <li><span className="font-semibold text-foreground/85">Forecasting.</span> With six months or more of history, alerts on SLA breaches and ticket-volume forecasts are the next step.</li>
        </ul>
      </section>
    </article>
  )
}
