# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Adventureland Chief of Staff is a self-hosted personal productivity system with a vintage Adventureland theme. It's a monorepo with a React client and Express server that coordinates AI agents, wellness tracking (Oura Ring), daily planning, knowledge management, and application monitoring (PM2).

## Development Commands

```bash
# Start both client and server via PM2
npm run dev

# Stop / restart / delete PM2 processes
npm run stop
npm run restart
npm run delete

# View PM2 logs and status
pm2 logs
pm2 status

# Client-only dev server
cd packages/client && npm run dev

# Server-only
cd packages/server && node src/index.js

# Tests (client only, uses vitest)
cd packages/client && npm test
cd packages/client && npx vitest run src/pages/Expedition.test.jsx   # single test
cd packages/client && npm run test:coverage

# Build client
cd packages/client && npm run build
```

## Architecture

### Monorepo Structure
- `packages/client/` — React 18 + Vite + Tailwind CSS (port 5173)
- `packages/server/` — Express + Socket.IO (port 5554)
- `packages/shared/` — Shared constants/types
- `ecosystem.config.js` — PM2 config for both processes

Both packages use ES modules (`"type": "module"`).

### Client Architecture
- **State management**: Zustand stores in `packages/client/src/stores/` (agentStore, wellnessStore, configStore, knowledgeStore, jiraStore, appStore, toastStore)
- **Routing**: React Router v6, pages in `packages/client/src/pages/`
- **Real-time**: Socket.IO client connects to server for streaming agent responses and live updates
- **API proxy**: Vite proxies `/api` and `/socket.io` to the server (port 5554), so client code uses relative paths

### Server Architecture
- **Entry point**: `packages/server/src/index.js` — sets up Express, Socket.IO, initializes config/providers/wellness
- **API routes**: `src/api/routes.js` (main), `src/api/configRoutes.js` (settings)
- **Agent system**: Character agents extend `BaseAgent` (`src/agents/characters/BaseAgent.js`). `AgentOrchestrator` manages task execution, `TaskRouter` routes to appropriate agents, `AgentFactory` creates agent instances
- **AI providers**: `ProviderFactory` switches between `BedrockProvider`, `AnthropicProvider`, and `ClaudeCliProvider` — configured via `ConfigStore`
- **Socket handlers**: `src/socket/handlers.js` — handles `agent:task` events, streams responses back as `agent:task:chunk` / `agent:task:response` / `agent:task:completed`
- **Wellness pipeline**: `OuraManager` → `WellnessScheduler` (cron) → `WellnessMeetings` (standup/retro logic) → `WellnessDataStore` (JSON persistence in `data/wellness/`)
- **Data storage**: JSON files in `packages/server/data/` (config, wellness, knowledge, agents). The server caches data in memory and writes to disk.
- **Prompts**: Managed by `PromptManager` with per-agent prompt versioning in `src/prompts/`
- **Logging**: Winston logger configured in `src/config/logger.js`

### Agent System
Agents are themed characters (Guide, Explorer, Trader, Navigator, Archaeologist, Scout) in `packages/server/src/agents/characters/`. Each extends `BaseAgent` which handles:
- Provider selection and model configuration from `ConfigStore`
- Custom prompt loading from `PromptManager`
- Streaming conversation with conversation history
- Tool use (web fetch, etc.) via `AgentTools`

The flow for agent conversations: Client emits `agent:task` socket event → `setupSocketHandlers` → `AgentOrchestrator.executeTask()` → agent processes with streaming → chunks emitted back via socket.

### Knowledge Base (Map Room)
- **API**: `POST /api/knowledge` to add items, `GET /api/knowledge` to list, `GET /api/knowledge/search?q=` to search
- **Server store**: `src/brain/KnowledgeStore.js` caches items in memory
- **Data file**: `packages/server/data/knowledge/items.json` — always use the API, not direct file writes

### Key Pages → Server Features Mapping
| Page | Feature | Key Server Module |
|------|---------|-------------------|
| Expedition | Agent chat | `agents/`, `socket/handlers.js` |
| Medic | Wellness dashboard | `wellness/`, `integrations/OuraManager.js` |
| Base Camp | Daily standup/retro | `wellness/WellnessMeetings.js` |
| Trading Post | PM2 management | `processes/AppRegistry.js` |
| Map Room | Knowledge base | `brain/KnowledgeStore.js` |
| Outpost | Terminal/Git | `terminal/`, `git/` |
| Dashboard | Overview | `briefing/BriefingInsights.js` |

## Design System

Vintage 1950s-60s Adventureland poster aesthetic. Key colors: Sand (#E8D4A8), Terracotta (#D4735E), Jungle (#4A7859), Sunset (#E87144), Teal (#479B99), Mustard (#DAA520). Typography: Bebas Neue (headers), Merriweather (body), Pathway Gothic One (UI), Courier Prime (code). Tailwind CSS for styling.

## Ports

- **5173**: Client (Vite dev server)
- **5554**: Server (Express + Socket.IO)
