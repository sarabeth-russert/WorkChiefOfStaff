# Outlook Integration via Playwright

This guide explains how to use Playwright to automate an authenticated browser session for accessing Outlook calendar data without needing OAuth credentials.

## Overview

This approach uses Playwright to:
1. Launch a real browser with persistent login state
2. Navigate to Outlook Web and authenticate once
3. Make Graph API requests using the authenticated browser session
4. All requests use the same cookies and authentication as your browser

## Advantages

✅ **No OAuth setup required** - bypass the need for Azure AD app registration
✅ **Persistent login** - stays logged in between server restarts
✅ **Simple setup** - just log in once and you're done
✅ **Real browser** - works exactly like using Outlook in your browser
✅ **No token extraction** - no need to find or parse authentication tokens

## Setup Instructions

### Step 1: Initialize the Browser

Start the Playwright browser with persistent authentication:

```bash
curl -X POST http://localhost:5554/api/outlook/playwright/initialize
```

This will:
- Launch a Chromium browser window
- Create a persistent profile at `packages/server/data/playwright-outlook`
- Keep the browser open for you to log in

### Step 2: Log into Outlook

A browser window will appear. In that window:

1. The browser will navigate to https://outlook.office.com/mail/
2. If you're not logged in, sign in with your Microsoft account
3. Complete any MFA challenges
4. Once you see your Outlook inbox, you're done!

**Important:** Keep this browser window open. Playwright uses this session for all API requests.

### Step 3: Verify Status

Check that you're logged in:

```bash
curl http://localhost:5554/api/outlook/playwright/status
```

Expected response when logged in:
```json
{
  "configured": true,
  "needsLogin": false,
  "message": "Already logged in"
}
```

### Step 4: Fetch Calendar Events

Now you can use all the calendar endpoints:

```bash
# Get today's events
curl http://localhost:5554/api/outlook/playwright/events/today

# Get this week's events
curl http://localhost:5554/api/outlook/playwright/events/week

# Get events for a specific date range
curl "http://localhost:5554/api/outlook/playwright/events?startDate=2026-03-01&endDate=2026-03-15"
```

## API Endpoints

### Initialize Browser
**POST** `/api/outlook/playwright/initialize`

Launches the Playwright browser with persistent context.

### Check Status
**GET** `/api/outlook/playwright/status`

Returns login status and whether the browser is initialized.

### Get Today's Events
**GET** `/api/outlook/playwright/events/today`

Fetches calendar events for today.

### Get This Week's Events
**GET** `/api/outlook/playwright/events/week`

Fetches calendar events for the current week (Sunday - Saturday).

### Get Events by Date Range
**GET** `/api/outlook/playwright/events?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`

Fetches calendar events for a specific date range.

**Query Parameters:**
- `startDate` (required): Start date in YYYY-MM-DD format
- `endDate` (required): End date in YYYY-MM-DD format

### Close Browser
**POST** `/api/outlook/playwright/close`

Closes the Playwright browser. You'll need to reinitialize and log in again next time.

## How It Works

### Persistent Browser Context

Playwright creates a "persistent context" which is like having a dedicated browser profile:
- Cookies are saved to disk at `packages/server/data/playwright-outlook`
- Login state persists between server restarts
- No need to re-authenticate unless cookies expire (typically 30-90 days)

### Authenticated API Requests

When you request calendar data:
1. Playwright opens a new page in the authenticated browser
2. Navigates to the Graph API endpoint (e.g., `/me/calendarview`)
3. The browser automatically includes your authentication cookies
4. Response is returned as JSON
5. Page is closed

This is exactly like making the API call from your browser's dev console.

## Configuration

### Headless Mode

By default, the browser runs with a visible window (headless: false). This is useful for:
- Initial setup and login
- Debugging authentication issues
- Seeing what's happening

To run in headless mode (no visible window), edit `OutlookPlaywright.js`:

```javascript
this.browser = await chromium.launchPersistentContext(this.userDataDir, {
  headless: true,  // Change to true for production
  // ...
});
```

### User Data Directory

Browser profile data is stored at:
```
packages/server/data/playwright-outlook/
```

This directory contains:
- Cookies
- Local storage
- Cache
- Browser preferences

**Security Note:** Keep this directory secure as it contains your authenticated session.

## Troubleshooting

### Error: "Browser not initialized"

**Solution:** Call the initialize endpoint first:
```bash
curl -X POST http://localhost:5554/api/outlook/playwright/initialize
```

### Error: "User needs to log in"

**Solution:**
1. Check if a browser window is open
2. Navigate to outlook.office.com in that window
3. Complete the login process
4. Try your API request again

### Session Expired

If your session expires (typically after 30-90 days):
1. Call the status endpoint to check
2. A browser window will open asking you to log in again
3. Complete the login
4. Resume using the API

### Browser Crashes or Closes

If the browser crashes:
1. Call `/api/outlook/playwright/initialize` to restart it
2. You should still be logged in (persistent context)
3. If not logged in, complete the login again

### Graph API Errors

If you get 401/403 errors from Graph API:
- Your session may have expired
- Check `/api/outlook/playwright/status`
- Re-login if needed

## Limitations

### 1. Browser Must Stay Running
- The Playwright browser must remain running for API requests to work
- If you close the browser, you'll need to reinitialize

### 2. Session Duration
- Sessions typically last 30-90 days depending on Microsoft's policies
- You'll need to re-login when the session expires

### 3. Rate Limiting
- Subject to Microsoft Graph API rate limits
- Built-in caching (5 minutes) helps reduce API calls

### 4. Single User Only
- This approach works for a single user's account
- For multiple users, you'd need separate browser profiles

## Comparison with OAuth

| Feature | Playwright | OAuth |
|---------|-----------|-------|
| Setup Complexity | Low | High |
| Initial Setup | Log in once | Azure AD app registration |
| Token Management | Automatic | Manual refresh required |
| Multi-user Support | Limited | Full support |
| Production Ready | Personal use | Yes |
| Session Duration | 30-90 days | 1 hour (refresh up to 90 days) |
| Browser Required | Yes (can be headless) | No |

## When to Use This Approach

**Use Playwright when:**
- Waiting for OAuth approval
- Personal/development use
- Rapid prototyping
- Don't want to deal with OAuth setup

**Use OAuth when:**
- Building production applications
- Supporting multiple users
- Need long-term stability
- Distributing to others

## Security Considerations

- **Profile Directory:** The `playwright-outlook/` directory contains your authenticated session. Treat it like your password.
- **Server Access:** Anyone with access to your server can use your authenticated session.
- **Network Security:** Ensure your server is not publicly accessible without proper authentication.
- **Logging:** The system logs API calls but never logs your authentication cookies.

## Integration with Chief of Staff

Once set up, the Playwright integration works seamlessly with your Chief of Staff dashboard:

1. Calendar events appear on the Dashboard automatically
2. Medic wellness integrations can access your schedule
3. Base Camp can see meeting history
4. All features that need Outlook data will work

No code changes needed - just use the Playwright endpoints instead of the OAuth endpoints!

## Cleanup

To completely remove the Playwright integration:

```bash
# Close the browser
curl -X POST http://localhost:5554/api/outlook/playwright/close

# Remove the profile directory
rm -rf packages/server/data/playwright-outlook
```

## Tips & Best Practices

1. **Keep Browser Open:** Don't close the Playwright browser window manually
2. **Check Status First:** Always check `/outlook/playwright/status` before making requests
3. **Cache is Your Friend:** Results are cached for 5 minutes to reduce API calls
4. **Headless in Production:** Switch to headless mode once you're set up
5. **Monitor Logs:** Check server logs if something isn't working

## Example Usage Script

```bash
#!/bin/bash

# Initialize browser
echo "Initializing browser..."
curl -X POST http://localhost:5554/api/outlook/playwright/initialize

echo "Please log in to Outlook in the browser window that just opened."
echo "Press Enter when you're logged in..."
read

# Check status
echo "Checking login status..."
curl http://localhost:5554/api/outlook/playwright/status

# Get today's calendar
echo "Fetching today's calendar..."
curl http://localhost:5554/api/outlook/playwright/events/today | jq .

echo "Setup complete! You can now use Outlook integration."
```

Save as `setup-outlook-playwright.sh` and run with:
```bash
chmod +x setup-outlook-playwright.sh
./setup-outlook-playwright.sh
```
