# Jira Server Configuration Guide

## Your Setup: jira.disney.com

Your Jira integration has been updated to support both **Jira Cloud** and **Jira Server/Data Center**. The system auto-detects which type you're using based on your domain.

---

## Configuration Steps for jira.disney.com

Since `jira.disney.com` is a custom domain (not `.atlassian.net`), the system will automatically configure it as **Jira Server/Data Center**.

### 1. Navigate to Settings

1. Click **Settings** in the navigation bar
2. Click the **Jira** tab (🎫)

### 2. Fill in Your Credentials

Enter the following information:

**Domain:**
```
jira.disney.com
```
- ⚠️ **Important**: Do NOT include `https://` - just the domain
- ❌ Wrong: `https://jira.disney.com`
- ✅ Correct: `jira.disney.com`

**Username:**
```
your-jira-username
```
- This is your Jira login username (not email)
- Example: `sara.russert` or whatever you use to log into Jira

**API Token/Password:**
```
your-password-or-token
```
- You can use either:
  - Your regular Jira password
  - A Personal Access Token (if your Jira admin has enabled them)

### 3. Test Connection

1. Click **"Test Connection"** button
2. Wait for the connection test to complete
3. You should see a ✅ success message

### 4. Save Configuration

Once the test succeeds, click **"Save Configuration"**

---

## Key Differences: Jira Server vs Cloud

| Feature | Jira Server (Your Setup) | Jira Cloud |
|---------|-------------------------|-----------|
| Domain | Custom (jira.disney.com) | *.atlassian.net |
| API Version | REST API v2 | REST API v3 |
| Username | Jira username | Email address |
| Credentials | Password or PAT | API token only |
| Description Format | Plain text | Atlassian Document Format |

The integration now automatically handles all these differences for you!

---

## Troubleshooting

### "Connection failed" or "Authentication error"

**Possible causes:**
1. Incorrect domain format (includes `https://`)
2. Wrong username (try your email if username doesn't work)
3. Incorrect password
4. Your account doesn't have API access

**Solutions:**
1. Double-check domain: `jira.disney.com` (no `https://`, no trailing slash)
2. Verify username is what you use to log into Jira web
3. Try your password - if that fails, check if PATs are available
4. Contact your Jira admin if API access is blocked

### "No projects showing"

**Possible causes:**
1. You don't have access to any projects
2. API permissions are restricted

**Solutions:**
1. Log into Jira web to confirm you can see projects
2. Check with your Jira admin about API access permissions

### Domain Format Examples

✅ **Correct formats:**
- `jira.disney.com`
- `jira.internal.disney.com`
- `jira-prod.disney.com`

❌ **Wrong formats:**
- `https://jira.disney.com`
- `https://jira.disney.com/`
- `jira.disney.com/`
- `http://jira.disney.com`

---

## What Works After Configuration

Once configured, you can:

✅ View all your Jira projects
✅ Browse issues in any project
✅ Create new tickets with full details
✅ Search issues by key or summary
✅ See status, priority, and assignee
✅ Click through to open issues in Jira web for detailed editing

---

## API Features Supported

The integration uses Jira Server REST API v2 and supports:

- **Projects**: List all accessible projects
- **Issues**: Create, read, update, search
- **Comments**: Add comments to issues
- **Transitions**: Change issue status
- **Assignees**: Assign/reassign issues
- **Labels**: Add categorization tags

---

## Security Notes

- Your credentials are stored in the application settings
- Authentication uses Basic Auth (standard for Jira Server)
- No credentials are sent to third parties
- Always use a strong password
- Consider requesting a Personal Access Token from your admin for better security

---

## Need Help?

If you continue having issues:
1. Verify you can log into `https://jira.disney.com` in your browser
2. Check that your account has "Browse Projects" permission
3. Contact your Disney Jira administrator for API access confirmation
4. Refer to the main `JIRA_INTEGRATION_GUIDE.md` for detailed feature documentation
