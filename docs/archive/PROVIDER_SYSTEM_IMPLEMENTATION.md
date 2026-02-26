# Provider Management System - Implementation Plan

## Overview

Building a PortOS-style AI provider, model, and prompt management system for Adventureland Chief of Staff.

---

## ✅ COMPLETED (Tasks 24-25)

### 1. AI Provider Abstraction Layer
**Files Created:**
- `/packages/server/src/providers/AIProvider.js` - Base class
- `/packages/server/src/providers/BedrockProvider.js` - AWS Bedrock implementation
- `/packages/server/src/providers/AnthropicProvider.js` - Anthropic direct API
- `/packages/server/src/providers/ProviderFactory.js` - Factory pattern

**Features:**
✅ Provider interface standardization
✅ Automatic credential validation
✅ Model listing per provider
✅ Stream and non-stream support
✅ Provider switching at runtime

---

## ✅ ALL TASKS COMPLETE

**Implementation Status**: All tasks (24-30) have been successfully completed and the provider management system is operational.

See `PROVIDER_SYSTEM_COMPLETE.md` for full implementation details and usage guide.

---

## 🚧 TASKS (NOW COMPLETE)

### Task 26: ConfigStore for Settings Persistence

**Purpose**: Store and manage provider configurations, model preferences, and global settings

**File**: `/packages/server/src/config/ConfigStore.js`

**Schema**:
```javascript
{
  currentProvider: 'bedrock',
  providers: {
    bedrock: {
      type: 'bedrock',
      region: 'us-east-1',
      modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
      enabled: true
    },
    anthropic: {
      type: 'anthropic',
      apiKey: 'sk-ant-...',  // encrypted or from env
      modelId: 'claude-3-5-sonnet-20241022',
      enabled: false
    }
  },
  agentDefaults: {
    explorer: { modelId: null },  // null = use global default
    trader: { modelId: null },
    // ... per-agent overrides
  },
  globalSettings: {
    defaultMaxTokens: 4096,
    defaultTemperature: 1.0,
    streamingEnabled: true
  }
}
```

**Methods**:
- `loadConfig()` - Load from `/data/config/providers.json`
- `saveConfig()` - Save to disk
- `getCurrentProvider()` - Get active provider config
- `setProvider(type, config)` - Switch providers
- `getProviderConfig(type)` - Get specific provider config
- `updateProviderConfig(type, updates)` - Update provider settings
- `getAgentDefaults(agentType)` - Get agent-specific settings
- `setAgentDefault(agentType, settings)` - Override agent settings

---

### Task 27: PromptManager for Prompt Management

**Purpose**: Store, version, and manage agent system prompts

**File**: `/packages/server/src/prompts/PromptManager.js`

**Storage**: `/data/prompts/{agentType}.json`

**Prompt Schema**:
```javascript
{
  agentType: 'explorer',
  version: '1.0.0',
  prompts: {
    system: `You are Explorer, the code discovery agent...`,
    personality: 'Curious, methodical, detail-oriented',
    skills: ['Code analysis', 'Pattern recognition', ...],
    catchphrase: 'Let me chart the territory!',
    instructions: [
      'Start with high-level overview',
      'Identify patterns and design choices',
      // ...
    ]
  },
  templates: {
    codeReview: 'When reviewing code: {instructions}',
    refactoring: 'When refactoring: {instructions}'
  },
  variables: {
    tone: 'professional',
    verbosity: 'moderate'
  },
  history: [
    {
      version: '1.0.0',
      timestamp: '2024-02-23T...',
      changes: 'Initial version'
    }
  ]
}
```

**Methods**:
- `loadPrompt(agentType)` - Load prompt for agent
- `savePrompt(agentType, prompt)` - Save prompt
- `getPrompt(agentType, version?)` - Get specific version
- `updatePrompt(agentType, updates)` - Update prompt
- `listVersions(agentType)` - Get version history
- `revertTo(agentType, version)` - Rollback
- `compilePrompt(agentType, variables)` - Merge templates with variables
- `exportPrompt(agentType)` - Export as JSON
- `importPrompt(agentType, data)` - Import from JSON

---

### Task 28: Configuration API Endpoints

**File**: `/packages/server/src/api/configRoutes.js`

**Endpoints**:

#### Provider Management
```
GET    /api/config/providers             # List all providers
GET    /api/config/providers/types       # Available provider types
GET    /api/config/providers/current     # Current active provider
POST   /api/config/providers/current     # Set active provider
GET    /api/config/providers/:type       # Get provider config
PUT    /api/config/providers/:type       # Update provider config
POST   /api/config/providers/:type/validate  # Validate credentials
```

#### Model Management
```
GET    /api/config/models                # All models from current provider
GET    /api/config/models/:provider      # Models for specific provider
GET    /api/config/models/current        # Currently selected model
POST   /api/config/models/current        # Set current model
```

#### Prompt Management
```
GET    /api/config/prompts               # List all agent prompts
GET    /api/config/prompts/:agentType    # Get prompt for agent
PUT    /api/config/prompts/:agentType    # Update prompt
GET    /api/config/prompts/:agentType/versions  # Version history
POST   /api/config/prompts/:agentType/revert    # Revert to version
POST   /api/config/prompts/:agentType/export    # Export prompt
POST   /api/config/prompts/:agentType/import    # Import prompt
```

#### Global Settings
```
GET    /api/config/settings              # Get all settings
PUT    /api/config/settings              # Update settings
GET    /api/config/agents/:type          # Agent-specific config
PUT    /api/config/agents/:type          # Update agent config
```

**Example Response**:
```json
{
  "providers": {
    "available": ["bedrock", "anthropic"],
    "current": "bedrock",
    "configs": {
      "bedrock": {
        "type": "bedrock",
        "region": "us-east-1",
        "modelId": "anthropic.claude-3-5-sonnet-20241022-v2:0"
      }
    }
  },
  "models": [
    {
      "id": "anthropic.claude-3-5-sonnet-20241022-v2:0",
      "name": "Claude 3.5 Sonnet",
      "provider": "Anthropic",
      "contextWindow": 200000
    }
  ]
}
```

---

### Task 29: Settings Page UI

**File**: `/packages/client/src/pages/Settings.jsx`

**Sections**:

#### 1. Provider Selection
- Dropdown to select provider (Bedrock, Anthropic)
- Provider status indicator (connected/disconnected)
- Credential configuration form per provider
- Test connection button
- Switch provider button

#### 2. Model Selection
- Model dropdown filtered by current provider
- Model details (context window, max tokens)
- Set as default button
- Per-agent model overrides

#### 3. Prompt Management
- Agent selector dropdown
- Prompt editor (code editor component)
- Template variables editor
- Save prompt button
- Version history viewer
- Revert to version button
- Export/Import prompt

#### 4. Global Settings
- Default max tokens slider
- Default temperature slider
- Streaming enabled checkbox
- Log level selector

**Components to Create**:
```
/packages/client/src/components/settings/
  ├── ProviderSelector.jsx
  ├── ModelSelector.jsx
  ├── PromptEditor.jsx
  ├── CredentialForm.jsx
  └── SettingsPanel.jsx
```

**Store**:
```javascript
// /packages/client/src/stores/configStore.js
const useConfigStore = create((set, get) => ({
  providers: [],
  currentProvider: null,
  models: [],
  currentModel: null,
  prompts: {},
  settings: {},

  fetchProviders: async () => { /* API call */ },
  setProvider: async (type, config) => { /* API call */ },
  fetchModels: async () => { /* API call */ },
  setModel: async (modelId) => { /* API call */ },
  fetchPrompt: async (agentType) => { /* API call */ },
  updatePrompt: async (agentType, prompt) => { /* API call */ },
  updateSettings: async (settings) => { /* API call */ }
}));
```

**Layout**:
```jsx
<div className="settings-page">
  <Tabs>
    <Tab label="Providers">
      <ProviderSelector />
      <CredentialForm />
    </Tab>

    <Tab label="Models">
      <ModelSelector />
      <ModelDetails />
    </Tab>

    <Tab label="Prompts">
      <AgentSelector />
      <PromptEditor />
      <VersionHistory />
    </Tab>

    <Tab label="Global Settings">
      <SettingsPanel />
    </Tab>
  </Tabs>
</div>
```

---

### Task 30: Update BaseAgent to Use Provider System

**File**: `/packages/server/src/agents/characters/BaseAgent.js`

**Changes**:

**Before**:
```javascript
import bedrockClient from '../../utils/BedrockClient.js';

class BaseAgent {
  constructor(options = {}) {
    this.bedrockClient = bedrockClient;
    this.model = config.aws.modelId;
  }
}
```

**After**:
```javascript
import providerFactory from '../../providers/ProviderFactory.js';
import configStore from '../../config/ConfigStore.js';

class BaseAgent {
  constructor(options = {}) {
    // Get current provider from config
    this.provider = providerFactory.getCurrentProvider();

    // Get agent-specific settings or use global defaults
    const agentConfig = configStore.getAgentDefaults(options.type);
    this.model = agentConfig.modelId || configStore.getCurrentModel();
    this.maxTokens = agentConfig.maxTokens || 4096;

    // Load custom prompt if exists
    this.customPrompt = promptManager.loadPrompt(options.type);
  }

  async processTask(task, options = {}) {
    // Use current provider
    const response = await this.provider.messages.create({
      model: options.model || this.model,
      max_tokens: this.maxTokens,
      system: this.getSystemPrompt(),
      messages: [{ role: 'user', content: task }]
    });
    return response;
  }
}
```

**Additional Updates**:
- Update `AgentFactory.js` to initialize with current provider
- Update `VectorSearch.js` to use provider factory
- Update `BedrockClient.js` usage (deprecated, replaced by BedrockProvider)

---

## Integration Points

### 1. Server Startup (`/packages/server/src/index.js`)
```javascript
import configStore from './config/ConfigStore.js';
import providerFactory from './providers/ProviderFactory.js';
import promptManager from './prompts/PromptManager.js';

// Initialize configuration
configStore.load();

// Set up initial provider
const providerConfig = configStore.getCurrentProvider();
const provider = providerFactory.setCurrentProvider(
  providerConfig.type,
  providerConfig
);

// Load all prompts
await promptManager.loadAll();
```

### 2. Navigation Update (`/packages/client/src/components/layout/Navigation.jsx`)
Add Settings link:
```jsx
{ path: '/settings', label: 'Settings', icon: '⚙️' }
```

### 3. App Routes (`/packages/client/src/App.jsx`)
Add Settings route:
```jsx
<Route path="settings" element={<Settings />} />
```

---

## Testing Checklist

### Provider System
- [ ] Switch from Bedrock to Anthropic
- [ ] Switch from Anthropic to Bedrock
- [ ] Validate Bedrock credentials
- [ ] Validate Anthropic credentials
- [ ] Handle invalid credentials gracefully

### Model Selection
- [ ] List models for Bedrock
- [ ] List models for Anthropic
- [ ] Switch models within same provider
- [ ] Per-agent model override works
- [ ] Agent uses correct model

### Prompt Management
- [ ] Load default prompt for agent
- [ ] Edit and save prompt
- [ ] Prompt changes reflect in agent responses
- [ ] Version history tracks changes
- [ ] Revert to previous version
- [ ] Export/import prompts

### Settings UI
- [ ] Settings page loads
- [ ] Provider selector works
- [ ] Model selector updates on provider change
- [ ] Prompt editor syntax highlighting
- [ ] Save buttons work
- [ ] Real-time config updates

### Integration
- [ ] Agent uses current provider
- [ ] Agent uses current model
- [ ] Agent uses custom prompt if set
- [ ] Configuration persists across restarts
- [ ] Multiple agents can have different models

---

## File Structure Summary

```
packages/server/src/
├── providers/
│   ├── AIProvider.js          ✅ Created
│   ├── BedrockProvider.js     ✅ Created
│   ├── AnthropicProvider.js   ✅ Created
│   └── ProviderFactory.js     ✅ Created
├── config/
│   ├── ConfigStore.js         🚧 Task 26
│   └── env.js
├── prompts/
│   └── PromptManager.js       🚧 Task 27
├── api/
│   ├── routes.js
│   └── configRoutes.js        🚧 Task 28
└── agents/
    └── BaseAgent.js           🚧 Task 30 (update)

packages/client/src/
├── pages/
│   └── Settings.jsx           🚧 Task 29
├── components/settings/       🚧 Task 29
│   ├── ProviderSelector.jsx
│   ├── ModelSelector.jsx
│   ├── PromptEditor.jsx
│   ├── CredentialForm.jsx
│   └── SettingsPanel.jsx
└── stores/
    └── configStore.js         🚧 Task 29

data/
├── config/
│   ├── providers.json         🚧 Task 26
│   └── settings.json          🚧 Task 26
└── prompts/                   🚧 Task 27
    ├── explorer.json
    ├── trader.json
    ├── navigator.json
    ├── archaeologist.json
    ├── scout.json
    └── guide.json
```

---

## Next Steps

1. **Review this implementation plan**
2. **Approve approach** for remaining tasks
3. **Implement ConfigStore** (Task 26)
4. **Implement PromptManager** (Task 27)
5. **Add API endpoints** (Task 28)
6. **Build Settings UI** (Task 29)
7. **Integrate with BaseAgent** (Task 30)
8. **Test end-to-end** functionality
9. **Document** for users

---

## Questions for Consideration

1. **Credential Storage**: Should API keys be stored in config files or only in environment variables?
2. **Prompt Templates**: Do you want Jinja2-style templating (`{{ variable }}`) or simple string interpolation?
3. **Version Control**: Should prompt versions be git-tracked or only in JSON history?
4. **UI Framework**: Want to add a UI component library (e.g., Radix UI, Headless UI) for Settings page?
5. **Real-time Sync**: Should configuration changes broadcast to all connected clients via Socket.IO?

---

Ready to proceed with implementation? Shall I continue with Tasks 26-30?
