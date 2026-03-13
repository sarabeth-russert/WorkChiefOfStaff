# Chief of Staff Documentation

Comprehensive documentation for the Adventureland Chief of Staff system.

---

## Directory Structure

### `/setup/`
Setup and configuration guides:
- **[QUICKSTART.md](setup/QUICKSTART.md)** - First-time setup instructions
- **[USER_GUIDE.md](setup/USER_GUIDE.md)** - Complete feature walkthrough
- **[AWS_BEDROCK_SETUP.md](setup/AWS_BEDROCK_SETUP.md)** - AWS Bedrock AI provider configuration
- **[JIRA_INTEGRATION_GUIDE.md](setup/JIRA_INTEGRATION_GUIDE.md)** - Jira Cloud and Server setup
- **[APP_REGISTRATION_GUIDE.md](setup/APP_REGISTRATION_GUIDE.md)** - Trading Post app management

### `/image-generation/`
AI image generation prompts for visual assets:
- **[DASHBOARD_ICONS_GUIDE.md](image-generation/DASHBOARD_ICONS_GUIDE.md)** - All dashboard, briefing, and utility icons
- **[PAGE_ILLUSTRATIONS_GUIDE.md](image-generation/PAGE_ILLUSTRATIONS_GUIDE.md)** - Page header banner illustrations (4/6 complete)
- **[CHARACTER_IMAGES_SETUP.md](image-generation/CHARACTER_IMAGES_SETUP.md)** - Agent character illustrations
- **[LOGO_GENERATION_GUIDE.md](image-generation/LOGO_GENERATION_GUIDE.md)** - App logo
- **[JIRA_BANNER_GENERATION.md](image-generation/JIRA_BANNER_GENERATION.md)** - Jira page banner
- **[JIRA_ICON_GENERATION.md](image-generation/JIRA_ICON_GENERATION.md)** - Jira ticket icon

### `/features/`
Feature documentation:
- **[CONVERSATION_HISTORY_FEATURE.md](features/CONVERSATION_HISTORY_FEATURE.md)** - Per-agent conversation memory
- **[URL_FETCHING_FEATURE.md](features/URL_FETCHING_FEATURE.md)** - Automatic URL content fetching

### `/troubleshooting/`
- **[JIRA_BEARER_AUTH_UPDATE.md](troubleshooting/JIRA_BEARER_AUTH_UPDATE.md)** - Bearer token authentication for Jira

### Outlook Calendar Integration
- **[OUTLOOK_CONNECTED_BROWSER.md](OUTLOOK_CONNECTED_BROWSER.md)** - Connected browser approach (recommended)
- **[OUTLOOK_PLAYWRIGHT.md](OUTLOOK_PLAYWRIGHT.md)** - Playwright automation (alternative)

### `/archive/`
Historical reference for architecture decisions:
- **BEDROCK_INFERENCE_PROFILES_FIX.md** - Cross-region inference profile fix
- **BEDROCK_MIGRATION_COMPLETE.md** - Migration from Anthropic API to Bedrock
- **PROVIDER_SYSTEM_COMPLETE.md** - Multi-provider system implementation

---

## Getting Started

1. Start with **[QUICKSTART.md](setup/QUICKSTART.md)** for initial setup
2. Configure AWS Bedrock: **[AWS_BEDROCK_SETUP.md](setup/AWS_BEDROCK_SETUP.md)**
3. Set up integrations as needed (Jira, Oura Ring, Outlook)
4. Generate visual assets using the `/image-generation/` guides
