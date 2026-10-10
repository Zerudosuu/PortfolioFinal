import { google } from "googleapis"
import { callbackUrl, hasValidState } from "./start"

type Request = {
  query?: Record<string, string | string[] | undefined>
  headers?: Record<string, string | string[] | undefined>
}
type Response = {
  status: (code: number) => Response
  send: (body: string) => void
  setHeader: (name: string, value: string) => Response
}

function single(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? ""
}

function required(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`Missing ${name}`)
  return value
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ?? character)
}

function page(title: string, body: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title></head><body><h1>${escapeHtml(title)}</h1>${body}</body></html>`
}

export default async function handler(req: Request, res: Response): Promise<void> {
  res.setHeader("Content-Type", "text/html; charset=utf-8")
  const error = single(req.query?.error)
  if (error) {
    res.status(400).send(page("Google authorization cancelled", `<p>${escapeHtml(error)}</p>`))
    return
  }

  try {
    const state = single(req.query?.state)
    const adminKey = required("GOOGLE_OAUTH_ADMIN_KEY")
    if (!hasValidState(state, adminKey)) {
      res.status(403).send(page("Invalid authorization", "<p>The authorization link expired or is invalid. Start again.</p>"))
      return
    }
    const code = single(req.query?.code)
    if (!code) {
      res.status(400).send(page("Missing authorization code", "<p>Google did not return an authorization code.</p>"))
      return
    }

    const oauth = new google.auth.OAuth2(required("GOOGLE_CLIENT_ID"), required("GOOGLE_CLIENT_SECRET"), callbackUrl(req))
    const { tokens } = await oauth.getToken(code)
    if (!tokens.refresh_token) {
      res.status(400).send(page("No refresh token returned", "<p>Revoke this app in your Google Account and start again with consent.</p>"))
      return
    }

    const token = escapeHtml(tokens.refresh_token)
    res.status(200).send(page("Google Calendar connected", `<p>Copy this refresh token into the Vercel <code>GOOGLE_REFRESH_TOKEN</code> environment variable, then delete this page from your history:</p><pre>${token}</pre><p>This token was displayed once and was not stored by the application.</p>`))
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "OAuth exchange failed"
    res.status(500).send(page("OAuth setup failed", `<p>${escapeHtml(message)}</p>`))
  }
}
