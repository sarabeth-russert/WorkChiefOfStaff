# Trading Post - App Registration System ✅

## Overview

The Trading Post now has a **complete app registration and management system**! You can register, monitor, and control all your local development applications from one centralized dashboard.

---

## 🎯 Features

### ✅ Application Registration
- Register any Node.js, npm, or custom application
- Configure startup scripts, working directories, and environment variables
- Add metadata like name, description, port, category, and tags

### ✅ PM2 Integration
- Automatic PM2 process management
- Start, stop, and restart applications with one click
- View real-time status, CPU, memory, and uptime
- Track restart counts and process health

### ✅ Centralized Monitoring
- System-wide stats dashboard
- Per-app resource usage
- Status indicators (Running, Stopped, Not Running)
- Quick access to app ports

### ✅ Application Management
- Unregister apps you no longer need
- View logs (coming soon)
- Health checks (coming soon)

---

## 🚀 How to Register an Application

### Step 1: Click "+ Register App"

Navigate to **Trading Post** page and click the **"+ Register App"** button in the top right.

### Step 2: Fill Out the Registration Form

**Required Fields:**

1. **Application Name** *
   - Friendly display name (e.g., "My API Server")
   - Used for identification in the dashboard
   - Automatically converted to PM2 process name (lowercase, hyphenated)

2. **Script Path** *
   - Entry point for your application
   - Examples:
     - `./src/index.js` (Node.js file)
     - `npm start` (npm command)
     - `yarn dev` (yarn command)
     - `node server.js` (direct node command)

**Optional Fields:**

3. **Working Directory**
   - Full path to your application folder
   - Leave empty to use the current directory
   - Example: `/Users/yourname/projects/my-app`

4. **Port**
   - Port number your app listens on
   - Helps identify and link to your app
   - Example: `3000`, `8080`, `5000`

5. **Environment Variables**
   - Configuration your app needs at runtime
   - Add key-value pairs (e.g., `NODE_ENV=production`, `API_KEY=abc123`)
   - Click "Add" to add each variable
   - Useful for:
     - API keys
     - Database URLs
     - Feature flags
     - Configuration overrides

### Step 3: Submit

Click **"Register Application"** to save your app to the registry.

---

## 📋 Example Registrations

### Example 1: Express API Server

```
Name: My Express API
Script: npm start
Working Directory: /Users/yourname/projects/express-api
Port: 3000
Environment Variables:
  NODE_ENV=development
  DATABASE_URL=mongodb://localhost:27017/mydb
  API_KEY=your-secret-key
```

### Example 2: React Development Server

```
Name: React Frontend
Script: npm run dev
Working Directory: /Users/yourname/projects/react-app
Port: 5173
Environment Variables:
  VITE_API_URL=http://localhost:3000
```

### Example 3: Python Flask App

```
Name: Flask API
Script: python app.py
Working Directory: /Users/yourname/projects/flask-api
Port: 5000
Environment Variables:
  FLASK_ENV=development
  SECRET_KEY=your-flask-secret
```

### Example 4: Next.js Application

```
Name: Next.js App
Script: npm run dev
Working Directory: /Users/yourname/projects/nextjs-app
Port: 3000
Environment Variables:
  NEXT_PUBLIC_API_URL=http://localhost:4000
```

---

## 🎮 Managing Applications

### Starting an App

1. Find the app card in your dashboard
2. If status shows "Not Running" or "Stopped"
3. Click the **"Start"** button
4. App will launch via PM2
5. Status updates to "Running"

### Stopping an App

1. Find a running app (status: "Running")
2. Click the **"Stop"** button
3. PM2 gracefully stops the process
4. Status updates to "Stopped"

### Restarting an App

1. Find a running app
2. Click the **"Restart"** button
3. PM2 restarts the process (useful after code changes)
4. Restarts counter increments

### Viewing Logs

1. Find a running app
2. Click the **"Logs"** button
3. *Coming soon* - Will show real-time logs in a modal

### Unregistering an App

1. Find a stopped app (must not be running)
2. Click the **"Unregister App"** button at the bottom
3. Confirm the action
4. App is removed from registry (files are NOT deleted)

**Note**: You cannot unregister a running app - stop it first.

---

## 📊 Understanding the Dashboard

### System Stats (Top Cards)

**Total Processes**
- Number of PM2 processes registered
- Includes both your apps and system apps (like adventureland-client/server)

**Running**
- How many processes are currently online
- Green indicator = healthy

**Stopped**
- How many processes are stopped
- Red indicator = needs attention

**Total Memory**
- Combined memory usage across all running processes
- Useful for monitoring system resources

### App Cards

Each app shows:

**Status Badge**
- **Green (Running)**: App is online and healthy
- **Red (Stopped)**: App was running but has been stopped
- **Gray (Not Running)**: App never started or PM2 doesn't know about it

**Stats (when running)**
- **CPU**: Current CPU usage percentage
- **Memory**: Current RAM usage in MB
- **Restarts**: How many times PM2 has restarted the app

**Metadata**
- **Port**: Where the app is listening (click to open)
- **Category**: App type/group (if specified)
- **Tags**: Keywords for organization (if specified)

---

## 💡 Tips & Best Practices

### Naming Conventions

**Good App Names:**
- Be descriptive: "Customer API Server", "Admin Dashboard"
- Include purpose: "Dev Database", "Staging API"
- Avoid generic names: Not just "App" or "Server"

### Script Paths

**Use relative paths** when possible:
- ✅ `./src/index.js`
- ✅ `npm start`
- ❌ `/Users/yourname/hardcoded/path/index.js`

**npm/yarn commands** work great:
- `npm start`, `npm run dev`, `npm run build`
- `yarn start`, `yarn dev`

### Working Directory

**When to specify:**
- App is in a different folder than adventureland
- You want to run multiple instances with different configs
- Script uses relative paths that depend on cwd

**When to leave empty:**
- App is in current directory
- Using absolute paths in script

### Environment Variables

**Security tips:**
- ⚠️ Don't put real secrets in the UI (they're stored in plain text)
- ✅ Use for development/testing only
- ✅ For production, use environment-specific configs
- ✅ Consider using `.env` files in your app instead

**Useful variables:**
- `NODE_ENV`: Set environment (development, production, test)
- `PORT`: Override default port
- `API_URL`: Point to different backends
- `LOG_LEVEL`: Control logging verbosity

### Port Management

**Avoid conflicts:**
- adventureland-client: 5555
- adventureland-server: 5554
- Choose unique ports for each app
- Common ranges: 3000-3999, 8000-8999

---

## 🔧 Troubleshooting

### "App won't start"

**Check:**
1. Is the script path correct?
2. Does the working directory exist?
3. Are all dependencies installed? (`npm install`)
4. Are there port conflicts?
5. Check PM2 logs: `npx pm2 logs app-name`

**Common fixes:**
- Run `npm install` in the app directory
- Check for syntax errors in your code
- Verify environment variables are correct
- Make sure the port isn't already in use

### "App shows 'Not Running' after registration"

**This is normal!** Registration doesn't auto-start apps.
- Click the "Start" button to launch
- Apps don't auto-start on registration for safety

### "Can't unregister app"

**Make sure the app is stopped first:**
1. Click "Stop" button
2. Wait for status to change to "Stopped"
3. Then click "Unregister App"

### "Stats showing 0 or incorrect values"

**PM2 needs time to collect metrics:**
- Wait 5-10 seconds after starting
- Page refreshes stats every 5 seconds
- If still showing 0, check if app is actually running: `npx pm2 list`

### "Environment variables not working"

**Verify:**
1. Did you click "Add" after entering each variable?
2. Do you see them listed before submitting?
3. Try restarting the app after registration
4. Check if your app actually reads those env vars

---

## 🎯 Use Cases

### Development Workflow

**Register all your microservices:**
```
1. Backend API (port 3000)
2. Frontend Dev Server (port 5173)
3. Admin Dashboard (port 3001)
4. Database Management UI (port 8080)
```

**Start all with one click each** instead of opening 4 terminal windows!

### Multi-Project Management

**Keep different projects organized:**
- Tag apps: `personal`, `work`, `client-name`
- Categories: `api`, `frontend`, `database`, `tool`
- Quick filtering coming soon

### Testing Different Configurations

**Register multiple versions:**
- "API - Development" (port 3000)
- "API - Staging" (port 3001)
- "API - Production Mock" (port 3002)

Different env vars for each version.

---

## 🚧 Coming Soon

### Features in Development

- **📜 Log Viewer Modal**: See real-time logs in the UI
- **🏥 Health Checks**: Automatic endpoint monitoring
- **🔔 Notifications**: Get alerted when apps crash
- **📊 Analytics**: Track uptime, restart patterns
- **🏷️ Tag Filtering**: Filter apps by tags and categories
- **🔄 Auto-Restart**: Configure restart strategies
- **💾 Import/Export**: Share app configs with team
- **🔗 Quick Links**: One-click access to app URLs

---

## 🗺️ Technical Details

### How It Works

**Registration Flow:**
1. Form submits app data to `/api/apps` (POST)
2. Server saves to `/data/apps.json`
3. AppRegistry creates metadata
4. PM2Manager handles process operations
5. Dashboard polls for updates every 5 seconds

**PM2 Integration:**
- Each app gets a unique PM2 process name
- PM2 manages: starting, stopping, restarting, monitoring
- Apps persist across system reboots (if PM2 is configured)

**Data Storage:**
```
/packages/server/data/
└── apps.json        # App registry (all registered apps)
```

### API Endpoints

```
POST   /api/apps              # Register new app
GET    /api/apps              # List all apps with stats
PUT    /api/apps/:id          # Update app config
DELETE /api/apps/:id          # Unregister app
POST   /api/apps/:id/start    # Start app
POST   /api/apps/:id/stop     # Stop app
POST   /api/apps/:id/restart  # Restart app
GET    /api/apps/:id/logs     # Get app logs
```

---

## 📖 Related Documentation

- **User Guide**: `/USER_GUIDE.md` - General usage
- **PM2 Documentation**: https://pm2.keymetrics.io/docs/
- **PortOS Inspiration**: https://github.com/atomantic/PortOS

---

**Your Trading Post is now fully operational!** 💰✨

Start registering your applications and enjoy centralized dev environment management with vintage Adventureland style.
