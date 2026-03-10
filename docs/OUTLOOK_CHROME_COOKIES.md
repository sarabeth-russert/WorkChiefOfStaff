# Outlook Integration via Chrome Cookie Extraction

This guide explains how to use Chrome's remote debugging feature to authenticate with Outlook without needing official OAuth credentials.

## Overview

This method extracts session cookies from a logged-in Chrome browser session and uses them to make authenticated API calls to Microsoft Graph. It's useful for:
- Personal/development use without OAuth app registration
- Quick prototyping
- Situations where official API access is pending

## ⚠️ Important Notes

- This is for **personal use only** - you're using your own session cookies
- Cookies expire after your browser session ends or after a certain time
- You'll need to re-extract cookies periodically
- Not suitable for production use with multiple users

## Setup Instructions

### Step 1: Start Chrome with Remote Debugging

Close all Chrome instances, then start Chrome with remote debugging enabled:

**macOS/Linux:**
```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222
```

Or add to your shell profile for easier access:
```bash
alias chrome-debug="/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222"
```

**Windows:**
```bash
chrome.exe --remote-debugging-port=9222
```

### Step 2: Log into Outlook

1. With Chrome running in debug mode, navigate to [outlook.office.com](https://outlook.office.com)
2. Log in with your Microsoft account
3. Verify you can see your calendar
4. Keep this tab open

### Step 3: Extract Cookies via API

Make a POST request to extract cookies from Chrome:

```bash
curl -X POST http://localhost:5554/api/outlook/extract-cookies \
  -H "Content-Type: application/json" \
  -d '{"port": 9222}'
```

Or use the UI (when available) to click "Extract Cookies from Chrome"

### Step 4: Verify Configuration

Check the status:

```bash
curl http://localhost:5554/api/outlook/status
```

You should see:
```json
{
  "configured": true,
  "authMethod": "cookies",
  "hasCookies": true,
  "cookieCount": 15
}
```

### Step 5: Use Outlook API

Now you can use all Outlook calendar endpoints:

```bash
# Get today's events
curl http://localhost:5554/api/outlook/events/today

# Get this week's events
curl http://localhost:5554/api/outlook/events/week

# Get events for a date range
curl "http://localhost:5554/api/outlook/events?startDate=2026-03-01&endDate=2026-03-15"
```

## Troubleshooting

### Error: "Chrome remote debugging not available on port 9222"

**Solution:** Make sure Chrome is running with the `--remote-debugging-port=9222` flag. Close all Chrome instances and restart with the flag.

### Error: "No Chrome tabs found"

**Solution:** Open at least one tab in Chrome. The debugger needs an active tab to connect to.

### Error: "Cookie authentication failed. Cookies may have expired."

**Solution:** Your cookies have expired. Log into Outlook again in Chrome and re-extract cookies:

```bash
curl -X POST http://localhost:5554/api/outlook/extract-cookies \
  -H "Content-Type: application/json" \
  -d '{"port": 9222}'
```

### Graph API returns 401 Unauthorized

**Solution:** Cookies have expired or are invalid. Re-extract cookies from a fresh Outlook session.

## Switching Between OAuth and Cookies

You can switch authentication methods at any time:

**Switch to cookie-based auth:**
```bash
curl -X POST http://localhost:5554/api/outlook/auth-method \
  -H "Content-Type: application/json" \
  -d '{"method": "cookies"}'
```

**Switch to OAuth:**
```bash
curl -X POST http://localhost:5554/api/outlook/auth-method \
  -H "Content-Type: application/json" \
  -d '{"method": "oauth"}'
```

## How It Works

1. **Chrome Remote Debugging Protocol**: Chrome exposes a WebSocket debugging interface when started with `--remote-debugging-port`
2. **Cookie Extraction**: We connect to this interface and use the `Network.getAllCookies` command to extract all cookies
3. **Cookie Filtering**: We filter cookies for Microsoft domains (microsoft.com, office.com, outlook.com, etc.)
4. **API Requests**: Extracted cookies are sent with Graph API requests in the `Cookie` header, just like a browser would

## Limitations

- Cookies typically expire after 24 hours or when you log out of Outlook
- You need Chrome running in debug mode during extraction (but not for API usage afterward)
- If Microsoft detects unusual API usage patterns, they may invalidate your session
- Multi-factor authentication (MFA) tokens are included in cookies, so re-extract if MFA prompts appear

## Security Considerations

- **Never share your extracted cookies** - they provide full access to your Outlook account
- The cookies are stored in `packages/server/data/outlook.json` - keep this file secure
- Consider adding `outlook.json` to `.gitignore` if not already present
- Cookies are encrypted at rest by your OS filesystem permissions

## When to Use OAuth Instead

Use the official OAuth flow instead of cookies when:
- Building a production application
- Supporting multiple users
- Requiring long-term, stable authentication
- Distributing your application to others
- Needing to access resources on behalf of other users

To set up OAuth, you'll need to:
1. Register an app in Azure AD
2. Configure redirect URIs
3. Use the existing OAuth endpoints in the application

See `OutlookManager.js` for OAuth implementation details.
