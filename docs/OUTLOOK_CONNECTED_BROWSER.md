# Outlook Integration via Connected Browser (Recommended)

This is the recommended approach for accessing Outlook calendar without OAuth credentials. It connects to YOUR existing Chrome browser where you're already logged in.

## How It Works

1. **You** start Chrome with remote debugging enabled
2. **You** log into Outlook and keep the browser open
3. **Chief of Staff** connects to your browser via Chrome DevTools Protocol (CDP)
4. **Requests** are executed in your authenticated browser context
5. **No popups** - uses your existing browser session

## Setup Instructions

### Step 1: Start Chrome with Remote Debugging

Close all Chrome instances, then start Chrome with debugging enabled:

**macOS:**
```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222 &
```

**Windows:**
```bash
chrome.exe --remote-debugging-port=9222
```

**Linux:**
```bash
google-chrome --remote-debugging-port=9222 &
```

**Pro Tip:** Add an alias to your shell profile for easy access:
```bash
# Add to ~/.zshrc or ~/.bashrc
alias chrome-debug="/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222"
```

Then just run: `chrome-debug &`

### Step 2: Log into Outlook

In the Chrome window that just opened:

1. Navigate to https://outlook.office.com/calendar/
2. Log in with your Microsoft account
3. Complete any MFA challenges
4. **Keep this browser window open**

### Step 3: Connect Chief of Staff to Your Browser

```bash
curl -X POST http://localhost:5554/api/outlook/browser/connect \
  -H "Content-Type: application/json" \
  -d '{"cdpUrl": "http://localhost:9222"}'
```

Expected response:
```json
{
  "success": true,
  "message": "Connected to browser successfully",
  "hasOutlookPage": true
}
```

### Step 4: Fetch Your Calendar

Now you can fetch calendar data without any popups!

```bash
# Get today's events
curl http://localhost:5554/api/outlook/browser/events/today

# Get this week's events
curl http://localhost:5554/api/outlook/browser/events/week

# Get events for a specific date range
curl "http://localhost:5554/api/outlook/browser/events?startDate=2026-03-01&endDate=2026-03-15"
```

## API Endpoints

### Connect to Browser
**POST** `/api/outlook/browser/connect`

Connects to your running Chrome instance.

**Body:**
```json
{
  "cdpUrl": "http://localhost:9222"  // Optional, defaults to localhost:9222
}
```

### Check Status
**GET** `/api/outlook/browser/status`

Returns connection status.

**Response:**
```json
{
  "configured": true,
  "connected": true,
  "hasOutlookPage": true,
  "cdpUrl": "http://localhost:9222"
}
```

### Get Today's Events
**GET** `/api/outlook/browser/events/today`

Fetches calendar events for today.

### Get This Week's Events
**GET** `/api/outlook/browser/events/week`

Fetches calendar events for the current week.

### Get Events by Date Range
**GET** `/api/outlook/browser/events?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`

Fetches calendar events for a specific date range.

### Disconnect
**POST** `/api/outlook/browser/disconnect`

Disconnects from browser (browser stays running, you stay logged in).

## How It's Different

### What We Tried Before:
- ❌ Playwright launching its own browser
- ❌ Trying to automate login
- ❌ Extracting and reusing tokens
- ❌ Constant popup windows

### What This Does:
- ✅ Uses YOUR browser that YOU control
- ✅ YOU log in manually and stay logged in
- ✅ Chief of Staff just connects to your existing session
- ✅ No popups, no automation, no token extraction
- ✅ Executes API calls in your browser's context

## Advantages

1. **No Token Management** - Uses your browser's authentication automatically
2. **No Popups** - Doesn't create new windows or tabs
3. **Long-Lived Session** - As long as your browser is logged in, it works
4. **You Control Login** - You handle authentication, MFA, etc.
5. **Simple** - Just keep Chrome running in the background

## Workflow

### Daily Use:

**Morning:**
```bash
# Start Chrome with debugging
chrome-debug &

# Log into Outlook in that browser
# Keep the browser window minimized
```

**Throughout the Day:**
```bash
# Chief of Staff automatically fetches your calendar
# No action needed from you!
```

**End of Day:**
```bash
# Just close Chrome when you're done
# Or leave it running for tomorrow
```

### First Time Setup:

1. Start Chrome with debugging (Step 1)
2. Log into Outlook (Step 2)
3. Connect Chief of Staff once (Step 3)
4. That's it! Leave it running

## Troubleshooting

### Error: "Chrome remote debugging not available"

**Check if Chrome is running:**
```bash
lsof -i :9222
```

If nothing shows up, Chrome isn't running with debugging enabled.

**Solution:**
```bash
# Close all Chrome instances
killall "Google Chrome"

# Start with debugging
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222 &
```

### Error: "No browser contexts found"

**Solution:** Chrome is running but has no windows open. Open at least one tab.

### Error: "Not connected to browser"

**Solution:** Call the connect endpoint:
```bash
curl -X POST http://localhost:5554/api/outlook/browser/connect
```

### Calendar requests fail with 401

**Solution:** Your Outlook session expired. Just refresh the Outlook page in your debug Chrome window and log in again.

## Security Considerations

### What's Secure:
- ✅ You control the browser
- ✅ You control when you log in/out
- ✅ Your credentials stay in your browser
- ✅ Chief of Staff only reads calendar data

### What to Be Aware of:
- ⚠️ Remote debugging port (9222) is exposed on localhost only
- ⚠️ Anyone with access to your computer could connect to the debug port
- ⚠️ Don't expose port 9222 to the network
- ⚠️ Close Chrome when you're not using it if sharing a computer

### Best Practices:
1. Only run debug Chrome when needed
2. Keep the browser window visible or in your taskbar
3. Close it when done for the day
4. Don't run on shared/public computers

## Comparison with Other Approaches

| Approach | Setup | Maintenance | User Control | Stability |
|----------|-------|-------------|--------------|-----------|
| **Connected Browser** ⭐ | Easy | Low | High | High |
| OAuth | Complex | Medium | Low | High |
| Playwright Automation | Medium | High | Low | Low |
| Token Extraction | Hard | Very High | Low | Very Low |

## Tips & Tricks

### 1. Keep Chrome Running

Add Chrome debug to your startup applications so it launches when you log in to your computer.

### 2. Use a Separate Chrome Profile

```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --user-data-dir="/Users/you/chrome-work-profile" &
```

This way your personal Chrome stays separate from your work Chrome.

### 3. Check Connection Before Requests

```bash
curl http://localhost:5554/api/outlook/browser/status
```

### 4. Reconnect After Restarting

If you restart Chief of Staff, just reconnect:
```bash
curl -X POST http://localhost:5554/api/outlook/browser/connect
```

### 5. Add Keyboard Shortcut

Your boss mentioned hotkeys - you could add a hotkey to:
- Start Chrome with debugging
- Open Outlook
- Connect Chief of Staff

Example Alfred/Raycast workflow:
```bash
#!/bin/bash
# Open Outlook in debug Chrome
open -a "Google Chrome" --args --remote-debugging-port=9222 "https://outlook.office.com/calendar/"

# Wait for Chrome to start
sleep 3

# Connect Chief of Staff
curl -X POST http://localhost:5554/api/outlook/browser/connect
```

## When to Use This vs OAuth

### Use Connected Browser When:
- ✅ Waiting for OAuth approval
- ✅ Personal use / development
- ✅ Want quick setup
- ✅ Comfortable leaving Chrome running

### Use OAuth When:
- ✅ Production application
- ✅ Multiple users
- ✅ Automated/headless environment
- ✅ Distribution to others
- ✅ Company security requires it

## Example Startup Script

Save this as `start-outlook-integration.sh`:

```bash
#!/bin/bash

echo "🚀 Starting Outlook Integration..."

# Kill existing Chrome debug instances
pkill -f "remote-debugging-port=9222"

# Start Chrome with debugging
echo "📱 Starting Chrome..."
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  "https://outlook.office.com/calendar/" &

# Wait for Chrome to start
echo "⏳ Waiting for Chrome to start..."
sleep 5

# Connect Chief of Staff
echo "🔗 Connecting Chief of Staff..."
curl -s -X POST http://localhost:5554/api/outlook/browser/connect | jq .

echo "✅ Setup complete!"
echo "📅 Your calendar is now integrated"
echo ""
echo "To test: curl http://localhost:5554/api/outlook/browser/events/today"
```

Make it executable:
```bash
chmod +x start-outlook-integration.sh
```

Run it:
```bash
./start-outlook-integration.sh
```

## Next Steps

Once this is working, you can:
1. Integrate with your Dashboard to show today's meetings
2. Add calendar widgets to other pages
3. Use it for meeting notifications
4. Build on it for Teams integration (same approach)

This is the approach your boss uses in portOS, and it's proven to work well! 🎯
