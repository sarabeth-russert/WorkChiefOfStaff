# Jira 403 Error Troubleshooting Guide

You're getting a **403 Forbidden** error when testing your Jira Server connection. This means the request is reaching the server but being rejected. Let's fix it!

---

## Step 1: Verify Your Username Format

**The most common cause of 403 errors is using the wrong username format.**

### Find Your Correct Username

1. Log into `https://jira.disney.com` with SSO
2. Click your profile picture (top-right)
3. Click **"Profile"**
4. Look for one of these fields:
   - **"Username"** (this is what you need!)
   - **"User Key"**
   - **"Account ID"**

### Common Username Formats

Try these formats in order:

| Format | Example | When to Use |
|--------|---------|-------------|
| First.Last | `sara.russert` | Most common for Jira Server |
| DOMAIN\Username | `DISNEY\sara.russert` | Windows AD integration |
| Email prefix | `sara.russert` (without @disney.com) | Some SSO setups |
| Full email | `sara.russert@disney.com` | Rarely for Server |

**Try the simplest format first:** Just your first.last name (e.g., `sara.russert`)

---

## Step 2: Verify Your PAT is Valid

### Check PAT Permissions

1. Log into Jira → Profile → Personal Access Tokens
2. Find the token you created
3. Make sure it has these permissions:
   - ✅ **Read** access to Jira
   - ✅ **Write** access to Jira (for creating issues)
   - ✅ Not expired

### Regenerate if Needed

If unsure, create a new token:
1. Delete the old token
2. Create a new one with **ALL permissions** selected
3. Copy the new token
4. Try again in Chief of Staff

---

## Step 3: Verify Domain Format

Your domain should be **exactly** as shown when you log in:

- ✅ Correct: `jira.disney.com`
- ❌ Wrong: `https://jira.disney.com`
- ❌ Wrong: `jira.disney.com/`
- ❌ Wrong: `www.jira.disney.com`

**Test it:** Open `https://jira.disney.com/rest/api/2/serverInfo` in your browser
- If you see JSON data → Domain is correct
- If you get an error → Check your domain

---

## Step 4: Try Alternative Test Endpoint

The updated integration will automatically try `/serverInfo` if `/myself` fails, but you might still get a 403 if your PAT doesn't have basic read permissions.

---

## Step 5: Check with Your Admin

If none of the above works, your PAT might not have the right permissions. Contact your Disney Jira admin and ask:

### What to Ask

> "I created a Personal Access Token for API access, but I'm getting a 403 Forbidden error when trying to access the REST API. Can you please verify:
>
> 1. My PAT has the correct permissions (Read/Write access to Jira)
> 2. My username for API authentication (is it just 'sara.russert' or another format?)
> 3. Are there any IP restrictions or additional security settings blocking API access?
>
> I'm trying to access endpoints like `/rest/api/2/myself` and `/rest/api/2/serverInfo`"

---

## Step 6: Test with Updated Settings

Now try testing your connection again in Chief of Staff:

1. Go to **Settings** → **Jira** tab
2. Update your info:
   - **Domain**: `jira.disney.com` (no https://)
   - **Username**: Try just `firstname.lastname` first
   - **API Token**: Your PAT
3. Click **"Test Connection"**

The new error message will be more helpful and might try an alternative endpoint automatically.

---

## Detailed Debugging

If you want to see exactly what's happening:

### Check Server Logs

1. Test connection in the UI
2. In terminal, run:
   ```bash
   npx pm2 logs adventureland-server --lines 50
   ```
3. Look for lines showing:
   - The URL being called
   - Your username
   - The API version (should be `/rest/api/2/`)
   - The specific error response from Jira

The logs will show you exactly what's being sent, which can help diagnose the issue.

---

## Common 403 Causes & Solutions

| Cause | Solution |
|-------|----------|
| Wrong username format | Try `firstname.lastname` instead of email |
| PAT expired | Generate a new token |
| PAT lacks permissions | Recreate token with all permissions |
| PAT not activated | Wait a few minutes after creating, try again |
| Account lacks API access | Ask admin to grant API permissions |
| IP restrictions | Ask admin to whitelist your IP or disable restrictions for your account |
| SSO middleware blocking | Ask admin about API bypass for PATs |

---

## Quick Test Checklist

Before contacting your admin, verify:

- [ ] Domain is correct: `jira.disney.com` (no https://)
- [ ] Username is in simplest format (first.last, no @disney.com)
- [ ] PAT is copied correctly (no extra spaces)
- [ ] PAT was just created (not expired)
- [ ] You can access Jira web interface normally
- [ ] You tried regenerating the PAT

---

## What Happens After Fix

Once the connection test succeeds, you'll be able to:
- ✅ View all your Disney Jira projects
- ✅ Browse issues
- ✅ Create new tickets
- ✅ Search and filter issues
- ✅ Open issues in Jira web with one click

Let me know what error message you get after trying the username format change, and we can debug further!
