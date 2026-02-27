## Jira Integration - Complete Guide ✅

## 🎯 Overview

Your Adventureland Chief of Staff now has **full Jira integration** supporting both **Jira Cloud** and **Jira Server/Data Center**! You can view your projects, browse issues, create new tickets, and manage your work directly from the Chief of Staff interface without switching to Jira.

---

## ✅ Features

### Jira Configuration
- Connect to Jira Cloud with API tokens
- Test connection before saving
- Secure credential storage

### Project Management
- View all your Jira projects
- Switch between projects easily
- See project keys and names

### Issue Management
- **View Issues**: Browse all issues in a project
- **Create Issues**: Add new tickets with full details
- **Search Issues**: Filter by key or summary
- **Quick Actions**: Open issues in Jira with one click
- **Status Tracking**: See current status with color coding
- **Priority Indicators**: Visual priority markers

---

## 🚀 Getting Started

The setup process differs slightly depending on whether you're using **Jira Cloud** or **Jira Server/Data Center**. The system automatically detects which type you have based on your domain.

### Jira Cloud Setup (*.atlassian.net)

#### Step 1: Generate API Token

1. Go to [Atlassian API Tokens](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Click **"Create API token"**
3. Give it a label (e.g., "Adventureland Chief of Staff")
4. Click **"Create"**
5. **Copy the token immediately** (you won't see it again!)

#### Step 2: Configure in Settings

1. Navigate to **Settings** page (gear icon in nav)
2. Click the **"Jira"** tab (🎫)
3. Fill in your credentials:
   - **Jira Domain**: `yourcompany.atlassian.net` (no `https://`)
   - **Username/Email**: Your Jira account email address
   - **API Token**: Paste the token you generated
4. Click **"Test Connection"** to verify
5. Once you see ✅ success message, click **"Save Configuration"**

### Jira Server/Data Center Setup (Custom Domain)

#### Step 1: Get Your Credentials

You'll need:
- Your Jira server domain (e.g., `jira.company.com`)
- Your Jira username (what you use to log in)
- Your password or Personal Access Token (if available)

#### Step 2: Configure in Settings

1. Navigate to **Settings** page (gear icon in nav)
2. Click the **"Jira"** tab (🎫)
3. Fill in your credentials:
   - **Jira Domain**: `jira.company.com` (no `https://`)
   - **Username/Email**: Your Jira username
   - **API Token/Password**: Your Jira password or PAT
4. Click **"Test Connection"** to verify
5. Once you see ✅ success message, click **"Save Configuration"**

**📘 For detailed Server setup instructions, see [`JIRA_SERVER_SETUP.md`](./JIRA_SERVER_SETUP.md)**

### Step 3: Access Jira Tickets

1. Click **"Jira"** in the navigation bar
2. You'll see all your projects
3. Click on a project to view its issues
4. Start creating and managing tickets!

---

## 📋 Using the Jira Page

### Selecting a Project

When you first open the Jira page, you'll see all your projects displayed as cards:
- Click any project card to view its issues
- Selected project is highlighted with a green border
- Project key and name are displayed on each card

### Viewing Issues

Once a project is selected:
- All issues are displayed as cards
- Each card shows:
  - **Issue Key** (e.g., PROJ-123) - Click to open in Jira
  - **Summary** - Title of the issue
  - **Status Badge** - Current status with color coding
  - **Priority Icon** - Visual indicator (🔴 High, 🟡 Medium, etc.)
  - **Issue Type** - Task, Bug, Story, Epic
  - **Assignee** - Who it's assigned to
  - **Last Updated** - When it was last modified

### Creating a New Issue

1. Click **"+ Create Issue"** button
2. Fill out the form:
   - **Summary** (required): Brief title
   - **Description**: Detailed explanation
   - **Issue Type**: Task, Bug, Story, or Epic
   - **Priority**: Lowest to Highest
   - **Labels**: Comma-separated tags (optional)
3. Click **"Create Issue"**
4. Issue appears in your list immediately

### Searching Issues

- Use the search bar to filter issues
- Search by issue key (e.g., "PROJ-123")
- Search by summary text
- Real-time filtering as you type

---

## 🎨 Status Colors

Issues are color-coded by status for easy identification:
- **Green**: Done, Closed, Completed
- **Teal**: In Progress, Development
- **Yellow**: In Review, Code Review
- **Gray**: To Do, Backlog, Open

---

## 🏷️ Priority Icons

Visual priority indicators:
- 🔴 **Highest/Critical** - Urgent, needs immediate attention
- 🟠 **High** - Important, prioritize soon
- 🟡 **Medium** - Normal priority
- 🔵 **Low** - Can wait
- ⚪ **Lowest** - Nice to have

---

## 📊 Issue Types

Each issue type has its own icon:
- 🐛 **Bug** - Defects, errors, problems
- 📖 **Story** - User stories, features
- ✅ **Task** - General tasks, todos
- 🎯 **Epic** - Large initiatives, themes
- 📝 **Other** - Default for other types

---

## 💡 Tips & Best Practices

### Security Best Practices

**API Token Security:**
- ✅ Treat API tokens like passwords
- ✅ Use a unique token just for Chief of Staff
- ✅ Revoke tokens you're not using
- ❌ Don't share your tokens
- ❌ Don't commit tokens to git repositories

**If Compromised:**
1. Go to Atlassian API Tokens page
2. Revoke the compromised token
3. Generate a new token
4. Update Chief of Staff settings

### Workflow Tips

**Efficient Issue Management:**
- Use the search to quickly find specific issues
- Click issue keys to open full details in Jira
- Create issues directly from Chief of Staff when they come up
- Use labels to categorize related issues

**When to Use Chief of Staff vs. Jira:**
- **Chief of Staff**: Quick ticket creation, browsing, searching
- **Jira Web**: Detailed editing, comments, attachments, advanced workflows

**Integration with Other Features:**
- Use **Archaeologist agent** to research Jira API documentation
- Save common Jira queries in **Map Room** for quick reference
- Ask **Guide agent** for help writing good issue descriptions

---

## 🔧 Troubleshooting

### "Jira not configured"

**Problem**: You see "No Jira configuration found"

**Solutions**:
1. Go to Settings → Jira tab
2. Enter your credentials
3. Test connection
4. Save configuration

### "Connection failed" or "Authentication error"

**Possible Causes**:
1. **Incorrect domain**: Make sure it's just the domain (no `https://`)
2. **Wrong credentials**: Email/username and token/password must match your account
3. **Invalid token**: Token may have expired or been revoked (Cloud only)
4. **Account permissions**: You need access to the Jira instance

**Solutions**:

**For Jira Cloud:**
1. Double-check domain format: `company.atlassian.net` (not `https://company.atlassian.net`)
2. Verify email matches your Jira login
3. Generate a new API token
4. Test connection again

**For Jira Server:**
1. Double-check domain format: `jira.company.com` (not `https://jira.company.com`)
2. Verify username is correct (try your email if username fails)
3. Confirm password is correct
4. Check with your admin about API access

### "No projects showing"

**Possible Causes**:
1. You don't have access to any projects
2. API token doesn't have necessary permissions

**Solutions**:
1. Log into Jira web to confirm you can see projects
2. Check with your Jira admin about permissions
3. Try generating a new API token

### "Can't create issues"

**Possible Causes**:
1. You don't have "Create Issues" permission in the project
2. Required fields are missing
3. Issue type doesn't exist in the project

**Solutions**:
1. Check project permissions in Jira
2. Fill in all required fields (marked with *)
3. Try a different issue type (Task usually works)

### "Issues not loading"

**Possible Causes**:
1. Network timeout
2. Large project with many issues
3. API rate limiting

**Solutions**:
1. Refresh the page
2. Wait a moment and try again
3. If persistent, check Jira status: status.atlassian.com

---

## 🔌 API Endpoints Reference

Your Chief of Staff uses these Jira REST API v3 endpoints:

- `GET /rest/api/3/project/search` - List projects
- `GET /rest/api/3/search` - Search issues (JQL)
- `GET /rest/api/3/issue/{issueKey}` - Get issue details
- `POST /rest/api/3/issue` - Create issue
- `PUT /rest/api/3/issue/{issueKey}` - Update issue
- `POST /rest/api/3/issue/{issueKey}/comment` - Add comment
- `GET /rest/api/3/myself` - Get current user

**Rate Limits**:
- Jira Cloud has API rate limits per user/app
- Chief of Staff respects these limits
- If you hit limits, wait and try again

---

## 🚧 Coming Soon

### Planned Features

- **Issue Details Modal**: View full issue without leaving Chief of Staff
- **Edit Issues**: Update summary, description, status from Chief of Staff
- **Add Comments**: Comment on issues directly
- **Status Transitions**: Change issue status with dropdown
- **Assignee Selection**: Assign issues to team members
- **Filter by Status**: Quick filter buttons
- **Recent Issues**: See your recently viewed/created issues
- **Bulk Actions**: Select and modify multiple issues
- **Notifications**: Get alerted for mentions and updates
- **Custom Fields**: Support for project-specific fields

### Agent Integration (Future)

Imagine asking your agents:
- **Archaeologist**: "What's the status of PROJ-123?"
- **Guide**: "Create a Jira ticket for adding user authentication"
- **Scout**: "Are there any critical bugs open?"
- **Navigator**: "Show me all my assigned tickets"

---

## 📖 Example Workflows

### Workflow 1: Bug Triage

1. Open Jira page
2. Select your project
3. Search for status "Open"
4. Create new bugs as you find them
5. Click through to Jira for detailed triage

### Workflow 2: Sprint Planning

1. View your project
2. Browse backlog issues
3. Create new stories/tasks
4. Open in Jira to add to sprint

### Workflow 3: Quick Ticket Creation

1. You're coding and notice a bug
2. Click Jira in nav
3. Select project
4. "+ Create Issue"
5. Fill quick form
6. Back to coding!

### Workflow 4: Status Check

1. Morning standup
2. Open Jira page
3. Quick scan of issue statuses
4. See what's In Progress vs Done
5. Update team

---

## 🎯 Keyboard Shortcuts (Coming Soon)

Planned shortcuts:
- `Cmd/Ctrl + K` - Quick issue search
- `Cmd/Ctrl + N` - New issue
- `/` - Focus search bar
- `Esc` - Close modals

---

## 💾 Data & Privacy

### What's Stored Locally

- Jira domain, email, API token (in settings)
- Cached project and issue data (temporary)

### What's NOT Stored

- Your Jira password (uses API tokens only)
- Issue attachments or full history
- Detailed audit logs

### Data Flow

1. You configure credentials
2. Chief of Staff makes API calls to Jira
3. Data is fetched and displayed
4. No data sent to third parties

---

## 📚 Additional Resources

**Jira Documentation:**
- [Jira Cloud REST API](https://developer.atlassian.com/cloud/jira/platform/rest/v3/)
- [Jira API Tokens](https://support.atlassian.com/atlassian-account/docs/manage-api-tokens-for-your-atlassian-account/)
- [Jira Query Language (JQL)](https://support.atlassian.com/jira-software-cloud/docs/use-advanced-search-with-jira-query-language-jql/)

**Chief of Staff Integration:**
- Backend: `/packages/server/src/integrations/JiraManager.js`
- Frontend: `/packages/client/src/pages/Jira.jsx`
- API Routes: `/packages/server/src/api/routes.js` (Jira section)

---

## ✨ Summary

Your Chief of Staff now seamlessly integrates with Jira! You can:

✅ Configure Jira connection securely
✅ View all your projects
✅ Browse and search issues
✅ Create new tickets with full details
✅ See status and priority at a glance
✅ Open issues in Jira with one click

**Next Steps:**
1. Configure Jira in Settings
2. Navigate to Jira page
3. Start managing your tickets from Chief of Staff!

**Your development workflow just got more streamlined!** 🎫✨
