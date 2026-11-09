import { createHmac, timingSafeEqual } from "node:crypto"

type Request = {
  headers?: Record<string, string | string[] | undefined>
}

const STATE_TTL_MS = 10 * 60 * 1000

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
