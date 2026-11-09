import { timingSafeEqual } from "node:crypto"
import { callbackUrl, signedState } from "../_lib/google-oauth.js"

type Request = {
  method?: string
  body?: unknown
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
function environment(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`Missing ${name}`)
  return value
}

function single(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? ""
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
  const supplied = headerKey || (authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "") || bodyKey
  if (!supplied) {
    res.status(401).json({ error: "Provide the OAuth admin key in X-Google-OAuth-Admin-Key, Authorization: Bearer, or POST body" })
    return
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
