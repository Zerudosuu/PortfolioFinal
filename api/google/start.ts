import { createHmac, timingSafeEqual } from "node:crypto"

type Request = {
  method?: string
  body?: unknown
  query?: Record<string, string | string[] | undefined>
  headers?: Record<string, string | string[] | undefined>
}
type Response = {
  status: (code: number) => Response
  json: (body: unknown) => void
  redirect: (url: string) => void
  send: (body: string) => void
  setHeader: (name: string, value: string) => Response
}

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.freebusy",
  "https://www.googleapis.com/auth/calendar.events",
]
const STATE_TTL_MS = 10 * 60 * 1000

function environment(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`Missing ${name}`)
  return value
}

function single(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? ""
}

export function callbackUrl(req: Request): string {
  if (process.env.GOOGLE_OAUTH_REDIRECT_URI?.trim()) {
    return process.env.GOOGLE_OAUTH_REDIRECT_URI.trim()
  }
  const host = single(req.headers?.["x-forwarded-host"]) || single(req.headers?.host)
  const protocol = single(req.headers?.["x-forwarded-proto"]) || "https"
  if (!host) throw new Error("Missing Vercel host; set GOOGLE_OAUTH_REDIRECT_URI")
  return `${protocol}://${host}/api/google/callback`
}

export function signedState(adminKey: string, now = Date.now()): string {
  const payload = Buffer.from(JSON.stringify({ expires: now + STATE_TTL_MS })).toString("base64url")
  const signature = createHmac("sha256", adminKey).update(payload).digest("base64url")
  return `${payload}.${signature}`
}

export function hasValidState(state: string, adminKey: string, now = Date.now()): boolean {
  const [payload, signature] = state.split(".")
  if (!payload || !signature) return false
  const expected = createHmac("sha256", adminKey).update(payload).digest("base64url")
  const signatureBytes = Buffer.from(signature)
  const expectedBytes = Buffer.from(expected)
  if (signatureBytes.length !== expectedBytes.length || !timingSafeEqual(signatureBytes, expectedBytes)) return false
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { expires?: number }
    return typeof parsed.expires === "number" && parsed.expires > now
  } catch {
    return false
  }
}

function secretsMatch(supplied: string, expected: string | undefined): boolean {
  if (!expected) return false
  const suppliedBytes = Buffer.from(supplied)
  const expectedBytes = Buffer.from(expected)
  return suppliedBytes.length === expectedBytes.length && timingSafeEqual(suppliedBytes, expectedBytes)
}

export default function handler(req: Request, res: Response): void {
  const authorization = single(req.headers?.authorization)
  const headerKey = single(req.headers?.["x-google-oauth-admin-key"])
  const bodyKey = typeof req.body === "object" && req.body !== null && "key" in req.body
    ? String((req.body as { key?: unknown }).key ?? "")
    : ""
  const queryKey = single(req.query?.key)
  const supplied = headerKey || (authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "") || bodyKey || queryKey
  if (!supplied) {
    res.status(401).json({ error: "Provide the OAuth admin key in X-Google-OAuth-Admin-Key, Authorization: Bearer, or POST body" })
    return
  }
  if (queryKey && !headerKey && !authorization && !bodyKey) {
    res.setHeader("Warning", '299 - "Query admin keys can leak through logs; use X-Google-OAuth-Admin-Key"')
  }
  if (!secretsMatch(supplied, process.env.GOOGLE_OAUTH_ADMIN_KEY)) {
    res.status(403).json({ error: "Forbidden" })
    return
  }

  try {
    const clientId = environment("GOOGLE_CLIENT_ID")
    const clientSecret = environment("GOOGLE_CLIENT_SECRET")
    const adminKey = environment("GOOGLE_OAUTH_ADMIN_KEY")
    const redirectUri = callbackUrl(req)
    const state = signedState(adminKey)
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      access_type: "offline",
      prompt: "consent",
      scope: SCOPES.join(" "),
      state,
    })
    const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
    res.redirect(url)
  } catch (error) {
    const message = error instanceof Error ? error.message : "OAuth configuration error"
    res.status(500).json({ error: message })
  }
}
