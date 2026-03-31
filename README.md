# 🌴 Adventureland Chief of Staff

A self-hosted personal productivity system with vintage 1950s-60s Adventureland theme. Manage AI agents, track wellness, plan your day, manage applications, capture knowledge, and access developer tools—all from one delightful interface.

**Think of it as:** Your AI-powered personal assistant that combines health tracking, daily planning, project management, and coding tools in a beautifully themed adventure interface.

---

## ✨ Features

### 🗺️ Expedition (Agent Orchestration)
Coordinate with specialized AI character agents to tackle complex tasks:
- **Guide** 📖 - Wellness coaching and daily planning assistant
- **Explorer** 🗺️ - Code discovery, refactoring, and architecture analysis
- Task routing and multi-agent coordination
- Real-time conversation with streaming responses
- Character-based agent personalities

### 🏥 Medic (Wellness Monitoring)
Track your health metrics and optimize your performance:
- Oura Ring integration for sleep, activity, and readiness tracking
- Daily wellness metrics dashboard with 7-day trends
- Automatic hourly data syncing
- Personalized health insights and recommendations
- Stress monitoring and break reminders
- Configure wellness settings and notification preferences

### 🏕️ Base Camp (Daily Planning & Reflection)
Your daily planning and reflection journal:
- **Morning Standup Sessions**: Chat with Guide agent to plan your day based on wellness data
- **Evening Retro Sessions**: Review accomplishments and plan tomorrow
- Natural conversation interface with AI coaching
- Persistent journal of all completed sessions
- View full conversation history and summaries
- Morning plans automatically displayed in evening retros

### 💰 Trading Post (Application Management)
Manage local applications and services with PM2 integration:
- Start, stop, restart, and monitor applications
- View real-time logs and resource usage
- Application health monitoring
- Easy PM2 process management

### 📍 Map Room (Knowledge Base)
Second Brain for knowledge capture and semantic search:
- Store notes, documents, and reference materials
- Semantic search across your knowledge base
- Organize with tags and categories
- Quick access to frequently referenced information

### ⛺ Outpost (Developer Tools)
Integrated terminal and Git tools:
- In-browser terminal access
- Git operations and repository management
- System monitoring and diagnostics
- Quick access to development workflows

### 🎫 Jira Integration
Connect your Jira workspace for seamless project management:
- OAuth 2.0 secure authentication
- View and manage issues directly in the app
- Sync project status and updates
- Track work across Jira and Chief of Staff

---

## 🏗️ Architecture

Monorepo structure with client-server architecture:

```
┌─────────────────────────────────────────────────────┐
│                    Browser Client                    │
│   React 18 + Vite + Tailwind CSS (Port 5173)       │
│   ├─ Zustand State Management                       │
│   ├─ React Router Navigation                        │
│   └─ Socket.IO Real-time Updates                    │
└─────────────────┬───────────────────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────────────────┐
│                   Express Server                     │
│      Node.js + Express + Socket.IO (Port 5554)     │
│   ├─ Agent Orchestrator                             │
│   ├─ Wellness Integration (Oura API)                │
│   ├─ PM2 Process Management                         │
│   ├─ Knowledge Store                                │
│   └─ REST API + WebSocket Events                    │
└─────────────────┬───────────────────────────────────┘
                  │
                  ↓
         ┌────────┴────────┐
         │                 │
    ┌────▼─────┐     ┌────▼─────┐
    │  AWS     │     │  Oura    │
    │ Bedrock  │     │  Ring    │
    │ (Claude) │     │   API    │
    └──────────┘     └──────────┘
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js 18+** and npm/yarn
- **AWS Account** with Bedrock access (Claude models enabled)
- **Oura Ring** (optional, for wellness features)
- **Jira Account** (optional, for project management integration)

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/sarabeth-russert/WorkChiefOfStaff.git
cd chiefOfStaff
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure AWS credentials:**
```bash
# Option 1: Use AWS Profile (Recommended)
aws configure
# Enter your AWS credentials when prompted

# Option 2: Set environment variables
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key
export AWS_REGION=us-east-1

# The system will automatically use AWS Bedrock with Claude
```

See `AWS_BEDROCK_SETUP.md` for detailed AWS configuration options.

4. **Start the development servers:**
```bash
npm run dev
```

This starts both client (port 5173) and server (port 5554) using PM2.

5. **Open your browser:**
```
http://localhost:5173
```

6. **Configure integrations (optional):**
- **Oura Ring**: Navigate to Settings → Oura Ring tab to set up OAuth connection
- **Jira**: Go to Jira page to connect your workspace
- **AI Providers**: Configure in Settings → Providers tab

### Development Commands

```bash
# Start all services with PM2
npm run dev

# Stop all services
npm run stop

# Restart all services
npm run restart

# Delete all PM2 processes
npm run delete

# View PM2 logs
pm2 logs

# View PM2 status
pm2 status
```

---

## 🎨 Design System

Vintage 1950s-60s Adventureland poster aesthetic inspired by Disney's Society of Explorers and Adventurers (SEA).

### Color Palette

**Primary Colors:**
- 🏜️ **Sand** (#E8D4A8) - Warm neutral base
- 🧱 **Terracotta** (#D4735E) - Earthy accent
- 🌿 **Jungle** (#4A7859) - Deep green
- 🌅 **Sunset** (#E87144) - Vibrant orange

**Secondary Colors:**
- 🌊 **Teal** (#479B99) - Cool accent
- 🌻 **Mustard** (#DAA520) - Golden highlight
- 🍷 **Burgundy** (#8B3A3A) - Rich red
- 📄 **Cream** (#FFF8E7) - Background

### Typography

- **Headers**: Bebas Neue (bold poster style)
- **Body**: Merriweather (readable serif)
- **UI Elements**: Pathway Gothic One (clean sans-serif)
- **Code/Monospace**: Courier Prime

### Visual Style

- Vintage letterpress text effects
- Rough hand-drawn borders
- Paper texture overlays
- Hero banner illustrations for each page
- Character-based agent illustrations
- Shadow effects and depth

---

## 🤖 AI Agents

Each agent is a specialized AI assistant with unique personality, skills, and visual character design.

### Active Agents

#### 📖 Guide
**Personality**: Warm, supportive, insightful
**Role**: Wellness coaching and daily planning
**Skills**: Health data interpretation, goal setting, reflection facilitation
**Usage**: Morning standups, evening retros, wellness advice

#### 🗺️ Explorer
**Personality**: Curious, methodical, adventurous
**Role**: Code discovery and architecture analysis
**Skills**: Code analysis, pattern recognition, refactoring, dependency mapping
**Usage**: Codebase exploration, technical documentation, architecture reviews

#### 💰 Trader
**Personality**: Pragmatic, cost-conscious, resourceful
**Role**: Dependency and resource management
**Skills**: npm operations, bundle optimization, performance tuning, cost-benefit analysis
**Usage**: Dependency updates, package management, performance optimization

#### 🧭 Navigator
**Personality**: Strategic, methodical, forward-thinking
**Role**: Git workflows and deployment
**Skills**: Branch strategies, CI/CD, release management, version control
**Usage**: Git operations, deployment planning, release coordination

#### 🏺 Archaeologist
**Personality**: Thorough, investigative, detail-oriented
**Role**: Code archaeology and research
**Skills**: Documentation search, technical debt analysis, historical context
**Usage**: Legacy code analysis, research, documentation discovery

#### 🔭 Scout
**Personality**: Vigilant, quality-focused, proactive
**Role**: Testing, monitoring, and quality assurance
**Skills**: Bug detection, test analysis, performance monitoring, quality metrics
**Usage**: Test runs, monitoring, QA reviews, performance analysis

---

## 📁 Project Structure

```
chiefOfStaff/
├── packages/
│   ├── client/                    # React frontend (Port 5173)
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── agents/        # Agent chat interfaces
│   │   │   │   ├── layout/        # Navigation, header, footer
│   │   │   │   ├── ui/            # Reusable UI components
│   │   │   │   └── wellness/      # Wellness & session components
│   │   │   ├── pages/
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── Expedition.jsx # Agent orchestration
│   │   │   │   ├── Medic.jsx      # Wellness metrics
│   │   │   │   ├── BaseCamp.jsx   # Planning journal
│   │   │   │   ├── TradingPost.jsx
│   │   │   │   ├── MapRoom.jsx
│   │   │   │   ├── Outpost.jsx
│   │   │   │   ├── Jira.jsx
│   │   │   │   └── Settings.jsx
│   │   │   ├── stores/            # Zustand state management
│   │   │   │   ├── agentStore.js
│   │   │   │   ├── wellnessStore.js
│   │   │   │   └── configStore.js
│   │   │   └── styles/            # Tailwind config & theme
│   │   └── public/
│   │       ├── images/
│   │       │   ├── characters/    # Agent illustrations
│   │       │   ├── pages/         # Hero banner images
│   │       │   └── dashboard/     # Dashboard cards
│   │       └── fonts/             # Custom web fonts
│   │
│   ├── server/                    # Express backend (Port 5554)
│   │   ├── src/
│   │   │   ├── agents/
│   │   │   │   ├── BaseAgent.js   # Agent base class
│   │   │   │   ├── AgentOrchestrator.js
│   │   │   │   └── characters/    # Individual agent implementations
│   │   │   ├── api/
│   │   │   │   ├── routes.js      # Main API routes
│   │   │   │   ├── configRoutes.js
│   │   │   │   └── jiraRoutes.js
│   │   │   ├── config/
│   │   │   │   ├── ConfigStore.js # Configuration management
│   │   │   │   └── logger.js      # Winston logging
│   │   │   ├── wellness/
│   │   │   │   ├── WellnessDataStore.js  # Session persistence
│   │   │   │   ├── WellnessMeetings.js   # Standup/retro logic
│   │   │   │   ├── WellnessScheduler.js  # Cron jobs
│   │   │   │   └── OuraManager.js        # Oura API client
│   │   │   ├── prompts/
│   │   │   │   └── PromptManager.js # Agent prompt versioning
│   │   │   ├── providers/
│   │   │   │   ├── ProviderFactory.js
│   │   │   │   ├── AnthropicProvider.js
│   │   │   │   └── BedrockProvider.js
│   │   │   ├── socket/
│   │   │   │   └── socketHandlers.js
│   │   │   └── index.js           # Server entry point
│   │   └── data/                  # Data storage
│   │       ├── config/            # App configuration
│   │       ├── wellness/          # Daily wellness metrics & sessions
│   │       └── knowledge/         # Knowledge base entries
│   │
│   └── shared/                    # Shared types/constants
│       ├── types.js
│       └── constants.js
│
├── scripts/                       # Utility scripts
│   ├── generate-jira-icon.js
│   └── add-jira-banner.js
│
├── docs/                          # Documentation
│   ├── AWS_BEDROCK_SETUP.md
│   └── PAGE_ILLUSTRATIONS_GUIDE.md
│
├── ecosystem.config.js            # PM2 configuration
├── package.json                   # Root workspace config
└── README.md                      # This file
```

---

## 🔧 Tech Stack

### Frontend
- **React 18.2** - UI library
- **Vite 5.x** - Build tool and dev server
- **React Router 6** - Client-side routing
- **Zustand** - Lightweight state management
- **Tailwind CSS 3.x** - Utility-first styling
- **Socket.IO Client** - Real-time communication

### Backend
- **Node.js 18+** - Runtime environment
- **Express.js 4.x** - Web framework
- **Socket.IO** - WebSocket server
- **Anthropic SDK** - Claude API integration
- **AWS SDK** - Bedrock access
- **PM2** - Process management
- **Winston** - Logging
- **node-cron** - Scheduled tasks

### External APIs
- **AWS Bedrock** - Claude AI models
- **Oura Ring API** - Health and wellness data
- **Jira REST API** - Project management integration

---

## 🌟 Key Workflows

### Morning Routine
1. Oura Ring syncs overnight sleep data
2. System triggers morning standup at 8:30 AM
3. Guide agent analyzes your sleep, activity, and readiness
4. Interactive chat session to plan your day
5. Save plan summary to Base Camp journal

### Evening Routine
1. System triggers evening retro at 6:00 PM
2. Guide shows your morning plan for reference
3. Chat about what you accomplished
4. Leave notes for tomorrow morning
5. Review wellness trends and adjust habits

### Working with Agents
1. Navigate to Expedition page
2. Select an agent (Guide, Explorer, etc.)
3. Describe your task or question
4. Receive streaming AI responses
5. Continue conversation as needed
6. Agent maintains context throughout session

### Managing Applications
1. Go to Trading Post
2. View all PM2-managed processes
3. Start, stop, or restart applications
4. Monitor logs and resource usage
5. Configure process settings

---

## 📝 Development Status

### ✅ Completed Features

**Core Infrastructure**
- [x] Monorepo structure with workspaces
- [x] Client-server architecture with Socket.IO
- [x] PM2 process management
- [x] AWS Bedrock integration
- [x] Vintage Adventureland design system
- [x] Navigation and routing
- [x] Settings and configuration management

**Agent System**
- [x] BaseAgent class architecture
- [x] Agent orchestration system
- [x] Streaming conversation interface
- [x] Guide agent (wellness coaching)
- [x] Explorer agent (code analysis)
- [x] Trader agent (dependency management)
- [x] Navigator agent (git workflows)
- [x] Archaeologist agent (code archaeology)
- [x] Scout agent (testing & QA)
- [x] Multi-turn conversation support
- [x] Character illustrations

**Wellness Integration**
- [x] Oura Ring OAuth 2.0 connection
- [x] Daily metrics dashboard (sleep, activity, readiness)
- [x] 7-day wellness trend charts
- [x] Hourly data syncing
- [x] Stress monitoring and alerts
- [x] Interactive standup/retro sessions
- [x] Session persistence and journaling
- [x] Natural conversation with Guide agent

**Pages**
- [x] Dashboard with overview cards
- [x] Expedition (agent orchestration)
- [x] Medic (wellness monitoring)
- [x] Base Camp (daily planning journal)
- [x] Trading Post (PM2 management)
- [x] Map Room (knowledge base)
- [x] Outpost (terminal and Git tools)
- [x] Jira integration
- [x] Settings (providers, models, prompts, integrations)

**UI/UX**
- [x] Vintage hero banner images for all pages
- [x] Responsive mobile-friendly design
- [x] Real-time notifications
- [x] Loading states and error handling
- [x] Vintage styling effects (letterpress, shadows, textures)

### 🚧 In Progress
- [ ] Knowledge base semantic search
- [ ] Terminal functionality in Outpost
- [ ] Git operations in Outpost

### 🔮 Future Enhancements
- [ ] Multi-agent task coordination
- [ ] Agent memory and learning
- [ ] Calendar integration
- [ ] Email integration
- [ ] Mobile app (React Native)
- [ ] Voice interaction with agents
- [ ] Task templates and workflows
- [ ] Team collaboration features
- [ ] Export/import configurations
- [ ] Plugin system for extensibility

---

## 🔐 Security & Privacy

- **Local-first**: All data stored locally on your machine
- **No external data sharing**: Your health data never leaves your system
- **Secure OAuth**: Industry-standard OAuth 2.0 for third-party integrations
- **API key encryption**: Credentials stored securely in local configuration
- **AWS IAM**: Use IAM roles and policies for Bedrock access

---

## 🤝 Contributing

This is a personal productivity system, but contributions are welcome! If you'd like to contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow the existing code style
- Maintain the vintage Adventureland theme
- Add comments for complex logic
- Test thoroughly before submitting
- Update documentation as needed

---

## 📜 License

MIT License - See LICENSE file for details

---

## 🙏 Acknowledgments

- **Inspired by**: [PortOS](https://github.com/atomantic/PortOS) by atomantic
- **AI Provider**: Claude by Anthropic
- **Design Inspiration**: Vintage Disney Adventureland posters and SEA (Society of Explorers and Adventurers) lore
- **Health Tracking**: Oura Ring API
- **Icons & Illustrations**: Generated with AI (ChatGPT DALL-E)

---

## 📞 Support

For issues, questions, or feature requests:
- Open an issue on GitHub
- Check existing documentation in `/docs`
- Review the project wiki (coming soon)

---

**Ready for adventure?** 🗺️✨

Start your journey with Chief of Staff and transform your daily routine into an epic expedition!
