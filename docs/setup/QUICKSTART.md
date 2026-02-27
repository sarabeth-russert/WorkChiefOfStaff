# 🚀 Quick Start Guide

## Prerequisites Check

Before starting, ensure you have:
- ✅ Node.js 18+ installed (`node --version`)
- ✅ npm installed (`npm --version`)
- ✅ AWS Account with Bedrock access
- ✅ AWS CLI configured (`aws configure`)

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

This will install all dependencies for the root workspace and all packages.

### 2. Configure AWS Credentials

The system now uses **AWS Bedrock** instead of direct Anthropic API.

**Option 1: AWS Profile (Recommended)**
```bash
aws configure
# Enter your AWS Access Key ID, Secret Key, and Region (e.g., us-east-1)
```

**Option 2: Environment Variables**
Edit `packages/server/.env`:
```bash
AWS_PROFILE=default
AWS_REGION=us-east-1
AWS_BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0
PORT=5554
NODE_ENV=development
DATA_DIR=./data
LOG_LEVEL=info
```

⚠️ **Important**: Ensure your AWS account has Bedrock access and Claude models enabled.

📚 **For detailed setup**, see `AWS_BEDROCK_SETUP.md`

### 3. Start Development Servers

```bash
npm run dev
```

This command will:
- Start the Express server on port 5554
- Start the Vite dev server on port 5555
- Use PM2 to manage both processes
- Show combined logs from both servers

### 4. Open the Application

Open your browser and navigate to:
```
http://localhost:5555
```

You should see the Adventureland Chief of Staff dashboard!

### 5. Test the Explorer Agent

1. Click on **Expedition** in the navigation
2. The Explorer agent should be selected by default
3. Enter a task in the textarea, for example:
   ```
   Review this code and suggest improvements:

   function calculateTotal(items) {
     var total = 0;
     for (var i = 0; i < items.length; i++) {
       total = total + items[i].price;
     }
     return total;
   }
   ```
4. Click **Submit Task**
5. Watch as the Explorer agent analyzes your code and provides feedback!

## Useful PM2 Commands

```bash
# View logs from all processes
pm2 logs

# View status of all processes
pm2 status

# Stop all processes
npm run stop

# Restart all processes
npm run restart

# Delete all PM2 processes (clean slate)
npm run delete

# Start again after deleting
npm run dev
```

## Troubleshooting

### Port Already in Use

If you see "port already in use" errors:

1. Check what's using the ports:
   ```bash
   lsof -i :5554  # Check server port
   lsof -i :5555  # Check client port
   ```

2. Kill the processes or change the ports in:
   - `packages/server/.env` (PORT=5554)
   - `ecosystem.config.js` (client env.PORT)
   - `packages/client/vite.config.js` (server.port)
   - `packages/client/.env` (VITE_API_URL, VITE_SOCKET_URL)

### API Key Errors

If you see "Missing required environment variables" error:
1. Make sure `packages/server/.env` exists
2. Verify your API key is correct (starts with `sk-ant-`)
3. No quotes needed around the API key

### Socket Connection Issues

If the client shows "Connecting to server..." forever:
1. Check that the server is running: `pm2 status`
2. Verify server logs: `pm2 logs adventureland-server`
3. Make sure ports 5554 and 5555 are accessible

### Dependencies Issues

If you see module not found errors:
```bash
# Clean install
rm -rf node_modules packages/*/node_modules
npm install
```

## Next Steps

Once you have the MVP running:

1. **Customize the API key**: Add your real Anthropic API key
2. **Try different tasks**: Test the Explorer agent with various code review tasks
3. **Explore the codebase**: Check out the agent system in `packages/server/src/agents`
4. **Next phases**: Trading Post (app management), Map Room (knowledge system), Outpost (terminal)

## Development Workflow

### Making Changes

1. **Client changes**: Vite will hot-reload automatically
2. **Server changes**: Nodemon will restart the server automatically (if watch is enabled in PM2)
3. **Both running**: Use `pm2 logs` to see output from both

### Adding New Agents

To add new agents (Trader, Navigator, etc.):

1. Create agent file: `packages/server/src/agents/characters/YourAgent.js`
2. Extend `BaseAgent` class
3. Override `getSystemPrompt()` with character-specific prompt
4. Register in `AgentFactory.js`

### Debugging

- **Server logs**: `pm2 logs adventureland-server`
- **Client logs**: Check browser console
- **API requests**: Use browser DevTools Network tab
- **Socket events**: Socket.IO events visible in Network tab (WS filter)

---

**Enjoy your Adventureland expedition!** 🗺️✨

Need help? Check the main README.md or create an issue on GitHub.
