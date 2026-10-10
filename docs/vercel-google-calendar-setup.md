# Vercel and Google Calendar setup

The booking API keeps Google credentials on the server. The browser never receives the client secret or refresh token.

## 1. Create Google OAuth credentials

1. In [Google Cloud Console](https://console.cloud.google.com/), create or select a project and enable the **Google Calendar API**.
2. Configure the OAuth consent screen. Choose **External** for a personal Google account, add the account that owns the calendar as a test user, and publish the app or keep it in testing while setting it up.
3. Create an OAuth client ID for a **Web application**.
4. Add this exact authorized redirect URI, replacing the host with the deployed Vercel domain:

   `https://your-project.vercel.app/api/google/callback`

The redirect URI must match exactly, including protocol, host, path, and any custom domain. The required OAuth scopes are:

- `https://www.googleapis.com/auth/calendar.freebusy`
- `https://www.googleapis.com/auth/calendar.events`

## 2. Generate the refresh token

Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and a long random `GOOGLE_OAUTH_ADMIN_KEY` in Vercel for the **Production** environment, then redeploy. Start the flow while logged in as the calendar owner by sending the key in a header:

```powershell
Invoke-WebRequest `
  -Uri https://your-project.vercel.app/api/google/start `
  -Headers @{ "X-Google-OAuth-Admin-Key" = "YOUR_GOOGLE_OAUTH_ADMIN_KEY" } `
  -MaximumRedirection 0
```

Follow the returned Google authorization URL in a browser. The legacy `?key=...` URL form remains supported for recovery, but query-string keys can leak through browser history and server logs.

Approve the requested scopes. The callback displays the refresh token once. Copy it directly into the Vercel `GOOGLE_REFRESH_TOKEN` variable and remove it from clipboard history, browser history, and any temporary notes. The token is never written to this repository.

If Google does not return a refresh token, revoke the app under the Google Account's third-party connections and run the start URL again. Keep `GOOGLE_OAUTH_ADMIN_KEY` private; it is the only credential that authorizes the bootstrap endpoint.

## 3. Configure Vercel

Add these environment variables in the Vercel project settings for every environment that serves bookings:

| Variable | Value |
| --- | --- |
| `GOOGLE_CLIENT_ID` | OAuth web client ID |
| `GOOGLE_CLIENT_SECRET` | OAuth web client secret |
| `GOOGLE_REFRESH_TOKEN` | Token produced by the one-time bootstrap flow |
| `GOOGLE_OAUTH_ADMIN_KEY` | Long random value used only for `/api/google/start` |
| `GOOGLE_CALENDAR_ID` | `primary` (or the target calendar ID) |
| `BOOKING_TIMEZONE` | `Asia/Manila` |

`GOOGLE_OAUTH_REDIRECT_URI` is optional. Set it to the exact deployed callback URL if the deployment uses a proxy or custom host that does not provide a reliable `Host` header. After changing environment variables, redeploy so the Vercel Functions receive the new values.

The API accepts availability ranges of at most 62 days and booking durations from one through 120 minutes. It checks the calendar again immediately before creating an event, so a simultaneous booking receives a conflict response.

## Local verification

Do not put credentials in `.env` files that could be committed. The repository ignores `.env`, OAuth token scratch files, and `google-refresh-token.txt`. Verify before committing:

```powershell
git ls-files -- '*.env*' '*refresh-token*' '*oauth-token*'
```

The command should print no credential files. Use Vercel environment variables for deployed credentials and the existing Google booking-link fallback when API configuration is absent.
