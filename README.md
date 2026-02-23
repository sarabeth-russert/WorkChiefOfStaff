# 🌴 Adventureland Chief of Staff

A self-hosted "Chief of Staff" system with vintage 1950s-60s Adventureland theme. Manage AI agents, local applications, knowledge, and developer tools from one delightful interface.

## ✨ Features

- **🗺️ Expedition (Chief of Staff)**: AI agent orchestration with character-based agents
- **💰 Trading Post**: Application management with PM2 integration
- **📍 Map Room**: Second Brain for knowledge capture and semantic search
- **⛺ Outpost**: Integrated terminal, Git tools, and system monitoring

## 🏗️ Architecture

Monorepo structure with:
- **Client**: React 18 + Vite + Tailwind CSS (Port 5555)
- **Server**: Node.js + Express + Socket.IO (Port 5554)
- **Shared**: Common types and constants

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- AWS Account with Bedrock access (Claude models enabled)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd chiefOfStaff
```

2. Install dependencies:
```bash
npm install
```

3. Configure AWS credentials:
```bash
# Option 1: Use AWS Profile (Recommended)
aws configure  # Set up your AWS credentials

# Option 2: Set environment variables
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key
export AWS_REGION=us-east-1

# The system will automatically use AWS Bedrock with Claude
# See AWS_BEDROCK_SETUP.md for detailed configuration options
```

4. Start the development servers:
```bash
npm run dev
```

This will start both the client (port 5555) and server (port 5554) using PM2.

5. Open your browser:
```
http://localhost:5555
```

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

## 🎨 Design System

The application features a vintage 1950s-60s Adventureland poster aesthetic:

### Color Palette

- **Primary**: Sand (#E8D4A8), Terracotta (#D4735E), Jungle (#4A7859), Sunset (#E87144)
- **Secondary**: Teal (#479B99), Mustard (#DAA520), Burgundy (#8B3A3A), Cream (#FFF8E7)

### Typography

- **Headers**: Bebas Neue (bold poster style)
- **Body**: Merriweather (readable serif)
- **UI**: Pathway Gothic One (clean sans-serif)
- **Code**: Courier Prime (monospace)

### Styling Techniques

- Rough borders with double box-shadows
- Letterpress text effects
- Vintage button states
- Paper texture overlays

## 🤖 AI Agents

### Explorer 🗺️
**Personality**: Curious, methodical
**Role**: Code discovery, refactoring, architecture
**Skills**: Code analysis, pattern recognition, dependency mapping

### Coming Soon
- Trader 💰 (Dependency management)
- Navigator 🧭 (Git operations)
- Archaeologist 🏺 (Knowledge retrieval)
- Scout 🔭 (Testing & monitoring)
- Guide 📖 (Onboarding & tutorials)

## 📁 Project Structure

```
chiefOfStaff/
├── packages/
│   ├── client/              # React frontend
│   │   ├── src/
│   │   │   ├── components/  # UI components
│   │   │   ├── pages/       # Page components
│   │   │   ├── stores/      # Zustand state management
│   │   │   └── styles/      # Theme and styles
│   │   └── public/
│   │
│   ├── server/              # Express backend
│   │   ├── src/
│   │   │   ├── agents/      # Agent system
│   │   │   ├── api/         # REST API routes
│   │   │   ├── config/      # Configuration
│   │   │   └── socket/      # Socket.IO handlers
│   │   └── data/            # Data storage
│   │
│   └── shared/              # Shared types/constants
│
├── ecosystem.config.js      # PM2 configuration
└── package.json             # Root workspace config
```

## 🔧 Tech Stack

### Frontend
- React 18.2
- Vite 5.x
- React Router 6
- Zustand (state management)
- Tailwind CSS 3.x
- Socket.IO client

### Backend
- Node.js 18+
- Express.js 4.x
- Socket.IO
- Anthropic SDK (Claude API)
- PM2
- Winston (logging)

## 📝 Development Status

### ✅ Phase 1 Complete (MVP Foundation)
- [x] Monorepo structure
- [x] Vintage Adventureland design system
- [x] Basic navigation and layout
- [x] Express server with Socket.IO
- [x] BaseAgent class with Claude API integration
- [x] Explorer agent character
- [x] Agent interaction UI
- [x] PM2 configuration

### 🚧 Coming Next (Phase 2)
- [ ] Remaining 5 character agents
- [ ] Agent orchestration system
- [ ] Task routing logic
- [ ] Agent memory/history
- [ ] Character illustrations

## 🤝 Contributing

This is a personal project inspired by [PortOS](https://github.com/atomantic/PortOS). Contributions, issues, and feature requests are welcome!

## 📜 License

MIT

## 🙏 Acknowledgments

- Inspired by [PortOS](https://github.com/atomantic/PortOS) by atomantic
- Vintage Adventureland poster aesthetic
- Claude AI by Anthropic

---

**Let the expedition begin!** 🗺️✨
