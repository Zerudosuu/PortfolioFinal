import { createHmac } from "node:crypto"
import { google } from "googleapis"

type Request = {
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
  if (signature.length !== expected.length) return false
  let equal = true
  for (let index = 0; index < expected.length; index += 1) {
    equal = equal && signature.charCodeAt(index) === expected.charCodeAt(index)
  }
  if (!equal) return false
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { expires?: number }
    return typeof parsed.expires === "number" && parsed.expires > now
  } catch {
    return false
  }
}

export default function handler(req: Request, res: Response): void {
  if (req.query?.key !== undefined && req.query?.key !== "") {
    const supplied = single(req.query.key)
    if (supplied !== process.env.GOOGLE_OAUTH_ADMIN_KEY) {
      res.status(403).json({ error: "Forbidden" })
      return
    }
  } else {
    res.status(401).json({ error: "Provide the OAuth admin key as ?key=..." })
    return
  }

  try {
    const clientId = environment("GOOGLE_CLIENT_ID")
    const clientSecret = environment("GOOGLE_CLIENT_SECRET")
    const adminKey = environment("GOOGLE_OAUTH_ADMIN_KEY")
    const redirectUri = callbackUrl(req)
    const oauth = new google.auth.OAuth2(clientId, clientSecret, redirectUri)
    const state = signedState(adminKey)
    const url = oauth.generateAuthUrl({ access_type: "offline", prompt: "consent", scope: SCOPES, state })
    res.redirect(url)
  } catch (error) {
    const message = error instanceof Error ? error.message : "OAuth configuration error"
    res.status(500).json({ error: message })
  }
}
