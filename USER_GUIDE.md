# Adventureland Chief of Staff - User Guide

## 🎯 What Is This?

Your Adventureland Chief of Staff is a self-hosted development companion that combines:
- **AI Agent Orchestration** - 6 character-based AI agents to help with coding tasks
- **Application Management** - Control your local development apps via PM2
- **Knowledge Management** - Your "Second Brain" for capturing and retrieving information
- **Developer Tools** - Integrated terminal, Git tools, and system monitoring

---

## 🚀 Getting Started

### Prerequisites

Before using the app, ensure you have:

1. **API Access** (for AI agents):
   - **AWS Bedrock** account with Claude access, OR
   - **Anthropic API** key

2. **PM2 Installed** (for app management):
   ```bash
   npm install -g pm2
   ```

3. **Application Running**:
   ```bash
   npm run dev
   ```
   - Client: http://localhost:5555
   - Server: http://localhost:5554

### Initial Setup

1. **Navigate to Settings** (gear icon in nav bar)
2. **Configure Your AI Provider**:
   - Select provider: AWS Bedrock or Anthropic
   - Choose model (Claude 3.5 Sonnet recommended)
   - Provider validates automatically when you enter credentials

3. **Environment Variables** (if not using Settings UI):
   ```bash
   # For AWS Bedrock
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your_key
   AWS_SECRET_ACCESS_KEY=your_secret
   AWS_BEDROCK_MODEL_ID=us.anthropic.claude-3-5-sonnet-20241022-v2:0

   # OR for Anthropic API
   ANTHROPIC_API_KEY=your_api_key
   ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
   ```

---

## 📍 Page-by-Page Guide

### 🗺️ Expedition - AI Agent Orchestration

**What It Does**: Deploy AI agents to help with coding tasks, code reviews, refactoring, testing, and more.

**Your 6 Agents**:
1. **Explorer** 🗺️ - Code discovery, refactoring, architecture analysis
2. **Trader** 💰 - Dependency management, optimization, npm operations
3. **Navigator** 🧭 - Git operations, deployment, CI/CD workflows
4. **Archaeologist** 🏺 - Knowledge retrieval, documentation, API research
5. **Scout** 🔭 - Testing, monitoring, error detection, performance
6. **Guide** 📖 - Onboarding, tutorials, best practices, documentation

**How to Use**:

1. **Select an Agent**:
   - Click on an agent card to select them
   - Each agent has unique skills and personality
   - Read their role description to pick the right one

2. **Submit a Task**:
   - Type your task in the input field
   - Examples:
     - "Review this code for security issues: [paste code]"
     - "Refactor this function to be more readable: [code]"
     - "Explain what this component does: [code]"
     - "Find all the API endpoints in my project"
     - "Write tests for this function: [code]"

3. **Get Response**:
   - Agent processes your task using Claude AI
   - Response appears in real-time below
   - Each agent responds with their unique personality

**Example Workflows**:

**Code Review**:
```
Select: Scout or Explorer
Task: "Review this authentication function for security vulnerabilities:
[paste your code here]"
```

**Refactoring**:
```
Select: Explorer
Task: "Refactor this component to use React hooks instead of class components:
[paste your code]"
```

**Git Help**:
```
Select: Navigator
Task: "How do I revert the last 3 commits without losing my changes?"
```

**Documentation**:
```
Select: Guide
Task: "Write API documentation for this Express route:
[paste your route code]"
```

---

### 💰 Trading Post - Application Management

**What It Does**: Manage your local development applications using PM2. Start, stop, restart, and monitor all your projects from one place.

**How to Use**:

1. **Register an Application**:
   - Click "+ Register App" button
   - Fill out the form:
     - **Name**: Friendly display name (e.g., "My API Server")
     - **Script**: Entry point (e.g., `./src/index.js`, `npm start`)
     - **Working Directory**: Path to your app (optional)
     - **Port**: Port number (optional)
     - **Environment Variables**: Add any env vars your app needs
   - Click "Register Application"
   - App appears in your dashboard

2. **Control Applications**:
   - **Start**: Launch a stopped application (click "Start" button)
   - **Stop**: Shut down a running application (click "Stop" button)
   - **Restart**: Restart to apply changes (click "Restart" button)
   - **View Logs**: See real-time application logs (coming soon)
   - **Unregister**: Remove app from registry (only when stopped)

3. **Monitor Applications**:
   - **Status Badge**: Green (Running), Red (Stopped), Gray (Not Running)
   - **Stats**: CPU usage, memory usage, restart count (when running)
   - **Port**: Click to open app in browser
   - **Metadata**: View category, tags, and other info

4. **System Stats**:
   - Total processes, running count, stopped count
   - Total memory usage across all apps
   - Real-time updates every 5 seconds

**Example Registrations**:
- Express API: `npm start`, port 3000
- React dev server: `npm run dev`, port 5173
- Python Flask: `python app.py`, port 5000
- Next.js app: `npm run dev`, port 3000

**Note**: Your Adventureland system processes (client/server) are already running via PM2. Register additional apps to manage your entire dev environment!

**Full Guide**: See `/APP_REGISTRATION_GUIDE.md` for detailed documentation.

---

### 📍 Map Room - Knowledge Management (Second Brain)

**What It Does**: Capture and retrieve knowledge using semantic AI search. Never lose track of important information, code snippets, solutions, or research.

**How to Use**:

1. **Add Knowledge Items**:
   - Click "+ Add Item" button
   - Fill in the form:
     - **Title**: Brief description (e.g., "Fix CORS Error in Express")
     - **Content**: The actual information (code snippet, solution, notes)
     - **Category**: Organize by type (code, documentation, research, etc.)
     - **Tags**: Keywords for filtering (e.g., "express", "cors", "bug-fix")
   - Click "Save"

2. **Search Knowledge**:
   - Enter search query in the search bar
   - Uses **semantic search** powered by Claude AI
   - Finds relevant items even if exact keywords don't match
   - Example: Search "authentication error" might find items about "login failures" or "auth bugs"

3. **Browse Knowledge**:
   - View all items in card grid
   - See categories and tags
   - Check access counts (most referenced items)
   - Click on any card to view full details

4. **Organize Knowledge**:
   - Use categories for high-level organization
   - Use tags for cross-category connections
   - Stats dashboard shows totals and most accessed items

**Example Uses**:

**Code Snippets**:
```
Title: "React useEffect Cleanup Pattern"
Content: [paste code snippet]
Category: code
Tags: react, hooks, cleanup, memory-leak
```

**Bug Solutions**:
```
Title: "Fixed PM2 Memory Leak in Production"
Content: "The issue was caused by... Solution: [steps]"
Category: troubleshooting
Tags: pm2, memory, production, bug-fix
```

**Research Notes**:
```
Title: "AWS Bedrock Cross-Region Inference Profiles"
Content: "Must use 'us.' prefix for model IDs..."
Category: documentation
Tags: aws, bedrock, api, setup
```

**Learning Resources**:
```
Title: "Best Practices for React Performance"
Content: [notes from article, key takeaways]
Category: research
Tags: react, performance, optimization
```

---

### ⛺ Outpost - Developer Tools

**What It Does**: Integrated terminal, Git operations, and system monitoring—your command center for developer operations.

**Features**:

1. **Terminal** (In Development):
   - Run commands directly in the UI
   - No need to switch to external terminal
   - Session persists across page navigation

2. **Git Status** (Working):
   - Current branch display
   - Uncommitted changes count
   - Quick Git operations

3. **System Stats** (Working):
   - Server status
   - PM2 process management status
   - System health indicators

**How to Use**:

- Navigate to Outpost page
- View Git status in the sidebar
- Check system stats in the cards
- Terminal interface coming soon for running commands

---

### ⚙️ Settings - Configuration

**What It Does**: Configure your AI providers, models, and system prompts.

**How to Use**:

1. **Provider Selection**:
   - Choose between AWS Bedrock or Anthropic
   - Enter credentials (API keys)
   - System validates automatically
   - Green checkmark = working, Red X = invalid

2. **Model Selection**:
   - Choose which Claude model to use
   - Options: Claude 3.5 Sonnet, Claude 3 Opus, etc.
   - Different models have different capabilities and costs
   - Recommended: Claude 3.5 Sonnet (best balance)

3. **Prompt Customization** (Advanced):
   - Customize system prompts for each agent
   - Adjust agent personalities and behavior
   - Reset to defaults anytime

**Provider Options**:

**AWS Bedrock**:
- ✅ Use if you have AWS account with Bedrock access
- ✅ Cross-region inference profiles supported
- ✅ Enterprise-grade security and compliance
- Model ID format: `us.anthropic.claude-3-5-sonnet-20241022-v2:0`

**Anthropic API**:
- ✅ Use if you have Anthropic API key
- ✅ Direct access to Claude models
- ✅ Simpler setup, no AWS configuration needed
- Model ID format: `claude-3-5-sonnet-20241022`

---

## 💡 Common Workflows

### Workflow 1: Code Review Before Commit

1. Go to **Expedition**
2. Select **Scout** (testing/error detection) or **Explorer** (code analysis)
3. Paste your code and ask: "Review this code for issues before I commit"
4. Get feedback on bugs, security issues, best practices
5. Make improvements
6. Go to **Outpost** to check Git status and commit

### Workflow 2: Learning New Technology

1. Go to **Expedition**
2. Select **Guide** (tutorials/onboarding)
3. Ask: "Explain how to use [technology] with code examples"
4. Get tutorial-style response with examples
5. Go to **Map Room**
6. Save key learnings as knowledge items for future reference

### Workflow 3: Debugging Production Issue

1. Go to **Map Room**
2. Search for similar past issues
3. If found, use that solution
4. If not, go to **Expedition**
5. Select **Scout** or **Archaeologist**
6. Describe the issue, get debugging suggestions
7. Once resolved, save solution to **Map Room** for future reference

### Workflow 4: Refactoring Old Code

1. Go to **Expedition**
2. Select **Explorer** (refactoring specialist)
3. Paste old code: "Refactor this to modern best practices"
4. Get refactored version with explanations
5. Select **Scout** for second opinion
6. Ask: "Review this refactored code for any issues"
7. Make final adjustments
8. Commit via **Outpost** Git tools

---

## 🎨 Visual Features

### Character Illustrations
- Each agent has a custom vintage illustration
- Hover over agent cards to see details
- Visual personality matches agent role

### Page Headers
- Beautiful vintage hero banners on each page
- Expedition: Adventure scene with explorers
- Trading Post: Marketplace with cargo
- Map Room: Cartography library
- Outpost: Frontier camp

### Dashboard Icons
- Large prominent icons for quick navigation
- Vintage emblem style matching Adventureland theme
- Stats tracked in real-time

---

## 🔧 Tips & Best Practices

### For AI Agents

**Be Specific**:
- ❌ "Fix my code"
- ✅ "Review this authentication function for security vulnerabilities: [code]"

**Provide Context**:
- Include relevant code snippets
- Mention tech stack (React, Express, etc.)
- Explain what you're trying to accomplish

**Choose the Right Agent**:
- Code review → Scout or Explorer
- Git questions → Navigator
- Dependencies → Trader
- Documentation → Guide or Archaeologist
- Testing → Scout

### For Knowledge Management

**Good Titles**:
- Clear and descriptive
- Include key technology names
- Action-oriented when possible

**Good Tags**:
- Use consistent tag names
- Include technology names
- Add action types (bug-fix, tutorial, reference)

**Categories**:
- Create meaningful categories (code, documentation, troubleshooting, research)
- Keep categories broad, use tags for specifics

### For System Performance

**API Costs**:
- Each agent interaction uses Claude API
- Longer prompts = higher cost
- Consider using cached knowledge from Map Room for repeated questions

**Rate Limiting**:
- Be mindful of API rate limits
- Don't spam requests too quickly
- Server handles rate limiting gracefully

---

## 🐛 Troubleshooting

### "Provider validation failed"
- Check your API credentials in Settings
- For Bedrock: Verify AWS credentials and region
- For Anthropic: Verify API key is correct
- Check server logs at `/packages/server/logs/error.log`

### "Agent not responding"
- Check internet connection
- Verify API provider is configured
- Check that server is running (`pm2 list`)
- Look for errors in browser console (F12)

### "No knowledge items found"
- Make sure you've added items using "+ Add Item"
- Check that server is running and connected
- Verify database directory exists at `/packages/server/data/knowledge/`

### "Terminal not working"
- Terminal is currently in development
- Use external terminal for now
- Coming in future update

---

## 📊 Data Storage

All your data is stored locally:

```
/packages/server/data/
├── agents/         # Agent interaction history
├── knowledge/      # Your knowledge items
├── config/         # System configuration
└── prompts/        # Custom prompt templates
```

**Your data is private** - nothing is sent to external services except AI API calls.

---

## 🎯 Quick Start Checklist

- [ ] Configure AI provider in Settings
- [ ] Test an agent in Expedition
- [ ] Add your first knowledge item in Map Room
- [ ] Generate and add custom dashboard icons
- [ ] Generate and add custom logo
- [ ] Register your first app in Trading Post (when ready)

---

## 🚀 Next Steps

1. **Generate Custom Icons**: Use the guides to create your dashboard icons and logo
2. **Build Your Knowledge Base**: Start capturing solutions and snippets in Map Room
3. **Explore Each Agent**: Try each of the 6 agents to see their personalities
4. **Register Your Apps**: Add your development projects to Trading Post for centralized management

---

**Your adventure begins now!** 🌴✨

Chart your course through code with AI agents as your guides and knowledge as your compass.
