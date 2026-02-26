# Jira Integration Updated: Bearer Token Authentication

## What Changed

Your Jira integration has been **completely updated** to match PortOS's authentication approach. This should fix your 403 error!

### The Problem

We were using **Basic Authentication** (username:password encoded in base64):
```
Authorization: Basic c2FyYS5ydXNzZXJ0OnlvdXItdG9rZW4=
```

This doesn't work well with Personal Access Tokens (PAT) on Jira Server.

### The Solution

Now using **Bearer Token Authentication** (like PortOS):
```
Authorization: Bearer your-pat-token-here
```

This is the **correct** way to authenticate with Personal Access Tokens!

---

## What You Need To Do Now

### 1. Clear Your Old Configuration

Go to **Settings** → **Jira** tab and you'll see the updated form.

### 2. Enter Your Credentials (Simplified!)

You only need **2 things** now:

**Domain:**
```
jira.disney.com
```
(No `https://`, no trailing slash)

**Personal Access Token:**
```
[Paste your PAT here]
```

**Username: Leave this blank!**
(You don't need username for Bearer token authentication)

### 3. Test Connection

Click **"Test Connection"** - it should work now! ✅

---

## Key Improvements Based on PortOS

### 1. Bearer Token Authentication
- ✅ Uses `Authorization: Bearer {token}` header
- ✅ Matches Jira Server PAT authentication standard
- ✅ No username required

### 2. Smart Token Expiration Detection
- ✅ Detects when Jira returns HTML login page instead of JSON
- ✅ Gives helpful error: "JIRA token expired or invalid — received login page instead of JSON. Please regenerate your PAT."

### 3. Better Error Messages
- ✅ More specific 403 error guidance
- ✅ Automatic fallback to `/serverInfo` endpoint if `/myself` fails
- ✅ Detailed logging for troubleshooting

### 4. Simplified Configuration
- ✅ Only domain and PAT required
- ✅ Username optional (for debugging only)
- ✅ Auto-detects Jira Cloud vs Server

### 5. REST API v2
- ✅ Uses `/rest/api/2/` endpoints (like PortOS)
- ✅ More stable than v3
- ✅ Better Server/Data Center compatibility

---

## Testing Your Connection

### Expected Success

When it works, you'll see:
```
✅ Connected to Jira Server successfully
```

Then you can:
- View all your Disney Jira projects
- Browse issues
- Create new tickets
- Search and filter

### If You Still Get Errors

**403 Forbidden:**
- Your PAT might not have the right permissions
- Regenerate your PAT with **all permissions** selected
- Make sure it's not expired

**401 Unauthorized:**
- PAT is invalid or expired
- Generate a new one

**404 Not Found:**
- Domain is wrong
- Try accessing `https://jira.disney.com/rest/api/2/serverInfo` in your browser
- If that fails, check your domain spelling

---

## Technical Details

### Authentication Methods Supported

| Method | When Used | Format |
|--------|-----------|--------|
| Bearer | PAT (Personal Access Token) | `Bearer {token}` |
| Basic | Username + Password (fallback) | `Basic {base64}` |

**Default:** Bearer (matches PortOS and modern Jira best practices)

### Endpoints Used

- `GET /rest/api/2/myself` - Test connection & get user
- `GET /rest/api/2/serverInfo` - Fallback test endpoint
- `GET /rest/api/2/project` - List projects
- `GET /rest/api/2/search` - JQL queries
- `POST /rest/api/2/issue` - Create tickets
- `PUT /rest/api/2/issue/{key}` - Update tickets

### What PortOS Does (Now We Match!)

```javascript
// PortOS jira.js (line 84)
headers: {
  'Authorization': `Bearer ${instance.apiToken}`,
  'Content-Type': 'application/json',
  'Accept': 'application/json'
}

// Token expiration detection (line 96-100)
if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE')) {
  throw new Error('JIRA token expired — received login page');
}
```

---

## Configuration File Changes

Your settings now store:
```json
{
  "domain": "jira.disney.com",
  "apiToken": "your-pat-here",
  "authMethod": "bearer",
  "jiraType": "server"
}
```

**Username is optional** - only used for logging/debugging.

---

## Migration From Old Settings

If you had previously saved settings with Basic auth:
1. Just re-enter your credentials in the new form
2. Use **only** your domain and PAT
3. Leave username blank
4. Test connection
5. Save

The system will automatically use Bearer authentication.

---

## Why This Fixes Your 403 Error

Jira Server expects PATs to be sent as Bearer tokens:
- ❌ **Old way:** `Authorization: Basic [username:token]` → 403 Forbidden
- ✅ **New way:** `Authorization: Bearer [token]` → 200 OK

Your PAT was valid, but we were sending it in the wrong format!

---

## References

- PortOS Implementation: `/tmp/PortOS/server/services/jira.js`
- Jira Server REST API Docs: https://docs.atlassian.com/software/jira/docs/api/REST/latest/
- Personal Access Tokens: https://confluence.atlassian.com/enterprise/using-personal-access-tokens-1026032365.html

---

## Next Steps

1. **Try it now:** Go to Settings → Jira
2. Enter domain: `jira.disney.com`
3. Enter your PAT
4. Click "Test Connection"
5. Should see ✅ success!
6. Click "Save Configuration"
7. Go to **Jira** page and view your projects!

This should work! The Bearer token authentication is the standard way to use PATs with Jira Server. 🎉
