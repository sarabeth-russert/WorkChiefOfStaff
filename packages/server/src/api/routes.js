import express from 'express';
import logger from '../config/logger.js';
import agentFactory from '../agents/AgentFactory.js';
import notificationScheduler from '../wellness/NotificationScheduler.js';

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'adventureland-server'
  });
});

// Agent routes
router.get('/agents', (req, res) => {
  const agents = agentFactory.getAllAgents();
  res.json({ agents });
});

router.post('/agents/task', async (req, res) => {
  try {
    const { agentType, taskType, task } = req.body;

    if (!task) {
      return res.status(400).json({ error: 'Task is required' });
    }

    if (!agentFactory.hasAgent(agentType)) {
      return res.status(400).json({ error: `Unknown agent type: ${agentType}` });
    }

    logger.info('Task received', { agentType, taskType, task: task.substring(0, 50) });

    const agent = agentFactory.getAgent(agentType);
    const result = await agent.processTask(task);

    res.json({
      success: result.success,
      taskId: Date.now(),
      response: result.response,
      agent: result.agent,
      error: result.error
    });
  } catch (error) {
    logger.error('Error processing task', error);
    res.status(500).json({ error: 'Failed to process task' });
  }
});

// App management routes
import pm2Manager from '../processes/PM2Manager.js';
import appRegistry from '../processes/AppRegistry.js';
import portChecker from '../processes/PortChecker.js';

router.get('/apps', async (req, res) => {
  try {
    const registeredApps = appRegistry.getAllApps();
    const pm2Processes = await pm2Manager.listProcesses();

    // Check ports for all apps
    const portsToCheck = registeredApps
      .filter(app => app.port)
      .map(app => app.port);

    const portStatuses = await portChecker.checkPorts(portsToCheck);
    const portMap = Object.fromEntries(
      portStatuses.map(ps => [ps.port, ps])
    );

    // Merge registry data with PM2 process data and port status
    const apps = registeredApps.map(app => {
      const process = pm2Processes.find(p => p.name === app.pm2Name);
      const portStatus = app.port ? portMap[app.port] : null;

      // Determine status: PM2 process status takes priority, then port check
      let status = 'not_running';
      if (process) {
        status = process.status;
      } else if (portStatus?.inUse) {
        status = 'running';
      }

      return {
        ...app,
        status,
        pid: process?.pid || portStatus?.process?.pid || null,
        cpu: process?.cpu || 0,
        memory: process?.memory || 0,
        uptime: process?.uptime || null,
        restarts: process?.restarts || 0,
        portInUse: portStatus?.inUse || false
      };
    });

    res.json({ apps, pm2Available: pm2Manager.isAvailable() });
  } catch (error) {
    logger.error('Error getting apps', error);
    res.status(500).json({ error: 'Failed to get apps' });
  }
});

router.post('/apps', async (req, res) => {
  try {
    const app = appRegistry.registerApp(req.body);
    res.json({ success: true, app });
  } catch (error) {
    logger.error('Error registering app', error);
    res.status(500).json({ error: 'Failed to register app' });
  }
});

router.put('/apps/:id', async (req, res) => {
  try {
    const app = appRegistry.updateApp(req.params.id, req.body);
    if (!app) {
      return res.status(404).json({ error: 'App not found' });
    }
    res.json({ success: true, app });
  } catch (error) {
    logger.error('Error updating app', error);
    res.status(500).json({ error: 'Failed to update app' });
  }
});

router.delete('/apps/:id', async (req, res) => {
  try {
    const success = appRegistry.unregisterApp(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'App not found' });
    }
    res.json({ success: true });
  } catch (error) {
    logger.error('Error unregistering app', error);
    res.status(500).json({ error: 'Failed to unregister app' });
  }
});

router.post('/apps/:id/start', async (req, res) => {
  try {
    const app = appRegistry.getApp(req.params.id);
    if (!app) {
      return res.status(404).json({ error: 'App not found' });
    }

    const result = await pm2Manager.startProcess(app.pm2Name);
    res.json(result);
  } catch (error) {
    logger.error('Error starting app', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/apps/:id/stop', async (req, res) => {
  try {
    const app = appRegistry.getApp(req.params.id);
    if (!app) {
      return res.status(404).json({ error: 'App not found' });
    }

    const result = await pm2Manager.stopProcess(app.pm2Name);
    res.json(result);
  } catch (error) {
    logger.error('Error stopping app', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/apps/:id/restart', async (req, res) => {
  try {
    const app = appRegistry.getApp(req.params.id);
    if (!app) {
      return res.status(404).json({ error: 'App not found' });
    }

    const result = await pm2Manager.restartProcess(app.pm2Name);
    res.json(result);
  } catch (error) {
    logger.error('Error restarting app', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/apps/:id/logs', async (req, res) => {
  try {
    const app = appRegistry.getApp(req.params.id);
    if (!app) {
      return res.status(404).json({ error: 'App not found' });
    }

    const lines = parseInt(req.query.lines) || 100;
    const result = await pm2Manager.getLogs(app.pm2Name, lines);
    res.json(result);
  } catch (error) {
    logger.error('Error getting app logs', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/system/stats', async (req, res) => {
  try {
    const stats = await pm2Manager.getSystemStats();
    res.json(stats);
  } catch (error) {
    logger.error('Error getting system stats', error);
    res.status(500).json({ error: 'Failed to get system stats' });
  }
});

// Knowledge routes
import knowledgeStore from '../brain/KnowledgeStore.js';
import vectorSearch from '../brain/VectorSearch.js';

router.get('/knowledge', (req, res) => {
  try {
    const options = {
      category: req.query.category,
      type: req.query.type,
      tag: req.query.tag,
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: req.query.sortOrder || 'desc',
      limit: parseInt(req.query.limit) || undefined
    };

    const items = knowledgeStore.getAllItems(options);
    res.json({ items });
  } catch (error) {
    logger.error('Error getting knowledge items', error);
    res.status(500).json({ error: 'Failed to get knowledge items' });
  }
});

router.get('/knowledge/stats', (req, res) => {
  try {
    const stats = knowledgeStore.getStats();
    res.json(stats);
  } catch (error) {
    logger.error('Error getting knowledge stats', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

router.get('/knowledge/:id', (req, res) => {
  try {
    const item = knowledgeStore.getItem(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json({ item });
  } catch (error) {
    logger.error('Error getting knowledge item', error);
    res.status(500).json({ error: 'Failed to get item' });
  }
});

router.post('/knowledge', async (req, res) => {
  try {
    let itemData = req.body;

    // Auto-classify if requested
    if (req.body.autoClassify) {
      const classification = await vectorSearch.classifyItem(
        req.body.title,
        req.body.content
      );
      itemData = {
        ...itemData,
        category: itemData.category || classification.category,
        tags: [...(itemData.tags || []), ...classification.tags]
      };
    }

    const item = knowledgeStore.addItem(itemData);
    res.json({ success: true, item });
  } catch (error) {
    logger.error('Error adding knowledge item', error);
    res.status(500).json({ error: 'Failed to add item' });
  }
});

router.put('/knowledge/:id', (req, res) => {
  try {
    const item = knowledgeStore.updateItem(req.params.id, req.body);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json({ success: true, item });
  } catch (error) {
    logger.error('Error updating knowledge item', error);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

router.delete('/knowledge/:id', (req, res) => {
  try {
    const success = knowledgeStore.deleteItem(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json({ success: true });
  } catch (error) {
    logger.error('Error deleting knowledge item', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

router.get('/knowledge/search', async (req, res) => {
  try {
    const query = req.query.q || '';
    const options = {
      limit: parseInt(req.query.limit) || 10,
      category: req.query.category,
      type: req.query.type,
      minRelevance: parseFloat(req.query.minRelevance) || 0.5
    };

    const results = await vectorSearch.search(query, options);
    res.json({ results });
  } catch (error) {
    logger.error('Error searching knowledge', error);
    res.status(500).json({ error: 'Failed to search knowledge' });
  }
});

router.get('/knowledge/:id/similar', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const similar = await vectorSearch.findSimilar(req.params.id, limit);
    res.json({ similar });
  } catch (error) {
    logger.error('Error finding similar items', error);
    res.status(500).json({ error: 'Failed to find similar items' });
  }
});

// Git routes
import gitManager from '../git/GitManager.js';

router.get('/git/status', async (req, res) => {
  try {
    const status = await gitManager.getStatus();
    res.json(status);
  } catch (error) {
    logger.error('Error getting git status', error);
    res.status(500).json({ error: 'Failed to get git status' });
  }
});

router.get('/git/branches', async (req, res) => {
  try {
    const branches = await gitManager.getBranches();
    res.json(branches);
  } catch (error) {
    logger.error('Error getting branches', error);
    res.status(500).json({ error: 'Failed to get branches' });
  }
});

router.get('/git/log', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const log = await gitManager.getLog(limit);
    res.json({ commits: log });
  } catch (error) {
    logger.error('Error getting git log', error);
    res.status(500).json({ error: 'Failed to get git log' });
  }
});

router.get('/git/remotes', async (req, res) => {
  try {
    const remotes = await gitManager.getRemotes();
    res.json({ remotes });
  } catch (error) {
    logger.error('Error getting remotes', error);
    res.status(500).json({ error: 'Failed to get remotes' });
  }
});

router.get('/git/is-repo', async (req, res) => {
  try {
    const isRepo = await gitManager.isRepo();
    res.json({ isRepo });
  } catch (error) {
    res.json({ isRepo: false });
  }
});

// Jira routes
import jiraManager from '../integrations/JiraManager.js';

router.post('/jira/configure', (req, res) => {
  try {
    jiraManager.configure(req.body);
    res.json({ success: true, configured: jiraManager.isConfigured() });
  } catch (error) {
    logger.error('Error configuring Jira', error);
    res.status(500).json({ error: 'Failed to configure Jira' });
  }
});

router.get('/jira/test', async (req, res) => {
  try {
    const result = await jiraManager.testConnection();
    res.json(result);
  } catch (error) {
    logger.error('Error testing Jira connection', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/jira/user', async (req, res) => {
  try {
    const user = await jiraManager.getCurrentUser();
    res.json({ user });
  } catch (error) {
    logger.error('Error fetching current Jira user', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/jira/projects', async (req, res) => {
  try {
    const projects = await jiraManager.getProjects();
    res.json({ projects });
  } catch (error) {
    logger.error('Error fetching Jira projects', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/jira/projects/:projectKey/issues', async (req, res) => {
  try {
    const { projectKey } = req.params;
    const options = {
      maxResults: parseInt(req.query.maxResults) || 1000,
      startAt: parseInt(req.query.startAt) || 0,
      status: req.query.status,
      assignee: req.query.assignee,
      myIssuesOnly: req.query.myIssuesOnly === 'true' // Filter by assignee OR reporter
    };
    const result = await jiraManager.getIssues(projectKey, options);
    res.json(result);
  } catch (error) {
    logger.error('Error fetching Jira issues', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/jira/issues/:issueKey', async (req, res) => {
  try {
    const issue = await jiraManager.getIssue(req.params.issueKey);
    res.json({ issue });
  } catch (error) {
    logger.error('Error fetching Jira issue', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/jira/issues', async (req, res) => {
  try {
    const issue = await jiraManager.createIssue(req.body);
    res.json({ success: true, issue });
  } catch (error) {
    logger.error('Error creating Jira issue', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/jira/issues/:issueKey', async (req, res) => {
  try {
    const result = await jiraManager.updateIssue(req.params.issueKey, req.body);
    res.json(result);
  } catch (error) {
    logger.error('Error updating Jira issue', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/jira/issues/:issueKey/comment', async (req, res) => {
  try {
    const result = await jiraManager.addComment(req.params.issueKey, req.body.comment);
    res.json(result);
  } catch (error) {
    logger.error('Error adding comment', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/jira/issues/:issueKey/transition', async (req, res) => {
  try {
    const result = await jiraManager.transitionIssue(req.params.issueKey, req.body.status);
    res.json(result);
  } catch (error) {
    logger.error('Error transitioning issue', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/jira/projects/:projectKey/issue-types', async (req, res) => {
  try {
    const issueTypes = await jiraManager.getIssueTypes(req.params.projectKey);
    res.json({ issueTypes });
  } catch (error) {
    logger.error('Error fetching issue types', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/jira/search', async (req, res) => {
  try {
    const { jql, maxResults, startAt } = req.body;
    const result = await jiraManager.searchIssues(jql, { maxResults, startAt });
    res.json(result);
  } catch (error) {
    logger.error('Error searching Jira', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/jira/me', async (req, res) => {
  try {
    const user = await jiraManager.getCurrentUser();
    res.json({ user });
  } catch (error) {
    logger.error('Error fetching current user', error);
    res.status(500).json({ error: error.message });
  }
});

// Wellness routes
import ouraManager from '../integrations/OuraManager.js';
import wellnessDataStore from '../wellness/WellnessDataStore.js';
import wellnessScheduler from '../wellness/WellnessScheduler.js';
import wellnessMeetings from '../wellness/WellnessMeetings.js';
import orchestrator from '../agents/AgentOrchestrator.js';

router.post('/wellness/configure', (req, res) => {
  try {
    ouraManager.configure(req.body);
    res.json({ success: true, configured: ouraManager.isConfigured() });
  } catch (error) {
    logger.error('Error configuring wellness', error);
    res.status(500).json({ error: 'Failed to configure wellness' });
  }
});

router.get('/wellness/test', async (req, res) => {
  try {
    const result = await ouraManager.testConnection();
    res.json(result);
  } catch (error) {
    logger.error('Error testing wellness connection', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/wellness/daily/:date?', async (req, res) => {
  try {
    const date = req.params.date || new Date().toISOString().split('T')[0];
    const metrics = await wellnessDataStore.getDailyMetrics(date);
    res.json({ success: true, metrics, date });
  } catch (error) {
    logger.error('Error fetching daily wellness metrics', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/wellness/trends', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const trends = await wellnessDataStore.getMetricsRange(startDate, endDate);
    res.json({ success: true, trends, startDate, endDate, days });
  } catch (error) {
    logger.error('Error fetching wellness trends', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/wellness/refresh', async (req, res) => {
  try {
    // Force sync data from Oura
    const date = new Date().toISOString().split('T')[0];
    const dailyData = await ouraManager.getDailySleep(date, date);

    if (dailyData && dailyData.data && dailyData.data.length > 0) {
      const sleepData = dailyData.data[0];
      await wellnessDataStore.saveDailyMetrics(date, {
        sleep: sleepData,
        lastSync: new Date().toISOString()
      });
    }

    res.json({ success: true, message: 'Data synced successfully', date });
  } catch (error) {
    logger.error('Error refreshing wellness data', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/wellness/settings', async (req, res) => {
  try {
    const settings = await wellnessScheduler.loadSettings();
    res.json({ success: true, settings });
  } catch (error) {
    logger.error('Error fetching wellness settings', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/wellness/settings', async (req, res) => {
  try {
    const settings = await wellnessScheduler.updateSettings(req.body);
    res.json({ success: true, settings });
  } catch (error) {
    logger.error('Error updating wellness settings', error);
    res.status(500).json({ error: error.message });
  }
});

// OAuth2 routes for Oura
router.post('/wellness/oauth/init', (req, res) => {
  try {
    const { clientId, clientSecret, redirectUri } = req.body;

    if (!clientId || !clientSecret || !redirectUri) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: clientId, clientSecret, redirectUri'
      });
    }

    // Store client credentials
    ouraManager.configure({
      clientId,
      clientSecret,
      accessToken: null,
      refreshToken: null,
      expiresAt: null
    });

    // Generate authorization URL
    const state = Math.random().toString(36).substring(7); // Simple state for CSRF protection
    const authUrl = ouraManager.getAuthorizationUrl(redirectUri, state);

    res.json({
      success: true,
      authUrl,
      state
    });
  } catch (error) {
    logger.error('Error initializing OAuth', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/wellness/oauth/callback', async (req, res) => {
  try {
    const { code, redirectUri } = req.body;

    if (!code || !redirectUri) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: code, redirectUri'
      });
    }

    // Exchange code for tokens
    const tokens = await ouraManager.exchangeCodeForToken(code, redirectUri);

    res.json({
      success: true,
      configured: true,
      expiresAt: tokens.expiresAt
    });
  } catch (error) {
    logger.error('Error handling OAuth callback', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// On-demand wellness meeting triggers
router.post('/wellness/standup/trigger', async (req, res) => {
  try {
    const result = await wellnessMeetings.triggerStandupOnDemand();
    res.json(result);
  } catch (error) {
    logger.error('Error triggering on-demand standup', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/wellness/retro/trigger', async (req, res) => {
  try {
    const result = await wellnessMeetings.triggerRetroOnDemand();
    res.json(result);
  } catch (error) {
    logger.error('Error triggering on-demand retro', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/wellness/sync', async (req, res) => {
  try {
    const result = await wellnessMeetings.syncOuraData();
    res.json(result);
  } catch (error) {
    logger.error('Error syncing Oura data', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Notification scheduler endpoints
router.post('/wellness/notifications/schedule', async (req, res) => {
  try {
    const { message, expression, fromTime, untilTime } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }

    // Parse the time expression
    let notification;

    if (expression) {
      // Recurring notification
      const cronExpression = notificationScheduler.parseToCron(expression);
      const timeRange = notificationScheduler.parseTimeRange(fromTime, untilTime);

      notification = await notificationScheduler.scheduleNotification({
        message,
        type: 'recurring',
        cronExpression,
        endTime: timeRange.until ? new Date().setHours(timeRange.until.hour, timeRange.until.minute, 0, 0) : null
      });
    } else {
      // One-time notification
      const targetTime = new Date(req.body.time);
      notification = await notificationScheduler.scheduleNotification({
        message,
        type: 'one-time',
        time: targetTime
      });
    }

    res.json({ success: true, notification });
  } catch (error) {
    logger.error('Error scheduling notification', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/wellness/notifications', async (req, res) => {
  try {
    const notifications = await notificationScheduler.getActiveNotifications();
    res.json({ success: true, notifications });
  } catch (error) {
    logger.error('Error getting notifications', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/wellness/notifications/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await notificationScheduler.cancelNotification(id);
    res.json({ success: true });
  } catch (error) {
    logger.error('Error cancelling notification', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Check if standup/retro delivered today
router.get('/wellness/standup/status', async (req, res) => {
  try {
    const delivered = await wellnessMeetings.hasStandupBeenDeliveredToday();
    res.json({ success: true, delivered });
  } catch (error) {
    logger.error('Error checking standup status', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/wellness/retro/status', async (req, res) => {
  try {
    const delivered = await wellnessMeetings.hasRetroBeenDeliveredToday();
    res.json({ success: true, delivered });
  } catch (error) {
    logger.error('Error checking retro status', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Session management routes
router.get('/wellness/session/active', async (req, res) => {
  try {
    const { date, type } = req.query;

    if (!date || !type) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: date and type'
      });
    }

    if (!['standup', 'retro'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid type. Must be standup or retro'
      });
    }

    const activeSession = await wellnessDataStore.getActiveSession(date, type);
    res.json({
      success: true,
      session: activeSession,
      hasActiveSession: !!activeSession
    });
  } catch (error) {
    logger.error('Error checking active session', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/wellness/session/start', async (req, res) => {
  try {
    const { date, type, initialGuidance } = req.body;

    if (!date || !type) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: date and type'
      });
    }

    if (!['standup', 'retro'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid type. Must be standup or retro'
      });
    }

    // Check if there's already an active session
    const existingSession = await wellnessDataStore.getActiveSession(date, type);
    if (existingSession) {
      return res.json({
        success: true,
        session: existingSession,
        message: 'Active session already exists'
      });
    }

    // Create new session
    const sessionData = {
      type,
      initialGuidance: initialGuidance || '',
      conversation: [],
      status: 'active',
      startedAt: new Date().toISOString()
    };

    const session = await wellnessDataStore.saveSession(date, sessionData);
    logger.info('Created new wellness session', { date, type, sessionId: session.id });

    res.json({ success: true, session });
  } catch (error) {
    logger.error('Error starting session', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/wellness/session/message', async (req, res) => {
  try {
    const { date, sessionId, message, conversationHistory } = req.body;

    if (!date || !sessionId || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: date, sessionId, and message'
      });
    }

    // Get current session to check if awaiting scores
    const dailyData = await wellnessDataStore.getDailyMetrics(date);
    const session = dailyData?.sessions?.find(s => s.id === sessionId);

    // Append user message to session
    const userMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };

    await wellnessDataStore.appendToSession(date, sessionId, userMessage);

    // Build task for Guide agent
    let task = message;
    const history = conversationHistory || [];

    // Check if user is requesting a notification to be scheduled
    let scheduledNotification = null;
    const scheduleMatch = message.match(/remind\s+me\s+to\s+(.+?)\s+(?:every|once)\s+(.+?)(?:\s+(?:from|starting)\s+(.+?))?(?:\s+(?:until|to)\s+(.+?))?$/i);

    if (scheduleMatch) {
      const [, reminderMessage, frequency, fromTime, untilTime] = scheduleMatch;

      try {
        // Parse the frequency expression
        const cronExpression = notificationScheduler.parseToCron(frequency);

        // Parse time range if provided
        let endTime = null;
        if (untilTime) {
          const timeRange = notificationScheduler.parseTimeRange(fromTime, untilTime);
          if (timeRange.until) {
            const now = new Date();
            endTime = new Date();
            endTime.setHours(timeRange.until.hour, timeRange.until.minute || 0, 0, 0);

            // If the end time is in the past, set it for today
            if (endTime < now) {
              endTime.setDate(endTime.getDate() + 1);
            }
          }
        }

        // Schedule the notification
        scheduledNotification = await notificationScheduler.scheduleNotification({
          message: reminderMessage.trim(),
          type: 'recurring',
          cronExpression,
          endTime
        });

        logger.info('[WellnessSession] Scheduled notification from user request', {
          notificationId: scheduledNotification.id,
          message: reminderMessage,
          frequency
        });

        // Add context for Guide so they know the reminder was scheduled
        task = `${message}

[System Note: I've scheduled a reminder for "${reminderMessage}" ${frequency}${untilTime ? ` until ${untilTime}` : ''}. Please confirm this to the user in a friendly way.]`;
      } catch (error) {
        logger.error('[WellnessSession] Error scheduling notification', {
          error: error.message
        });
      }
    }

    // If this is a standup awaiting scores, provide enhanced context
    if (session?.awaitingScores && session?.type === 'standup') {
      // Extract scores from message (simple pattern matching)
      const sleepMatch = message.match(/sleep[:\s]+(\d+)/i);
      const readinessMatch = message.match(/readiness[:\s]+(\d+)/i);

      const sleepScore = sleepMatch ? parseInt(sleepMatch[1]) : null;
      const readinessScore = readinessMatch ? parseInt(readinessMatch[1]) : null;

      // Build enhanced context for Guide
      task = `The user has shared their morning wellness scores:
${sleepScore ? `- Sleep Score: ${sleepScore}/100` : ''}
${readinessScore ? `- Readiness Score: ${readinessScore}/100` : ''}

User's message: "${message}"

Based on these scores, please provide:
1. A brief, encouraging assessment of their recovery and readiness
2. One specific, actionable wellness tip for today
3. What to focus on for optimal performance

Keep your response warm, supportive, and under 150 words.`;

      // Mark session as no longer awaiting scores
      await wellnessDataStore.updateSession(date, sessionId, { awaitingScores: false });
    }

    // Call Guide agent via orchestrator
    const guideResponse = await orchestrator.executeTask({
      taskType: 'wellness',
      task,
      agentType: 'guide',
      history
    });

    // Append Guide response to session
    const assistantMessage = {
      role: 'assistant',
      content: guideResponse.response || guideResponse.error || 'I encountered an issue processing your message.',
      timestamp: new Date().toISOString()
    };

    const updatedSession = await wellnessDataStore.appendToSession(date, sessionId, assistantMessage);

    logger.info('Processed wellness session message', {
      date,
      sessionId,
      guideSuccess: guideResponse.success
    });

    res.json({
      success: true,
      session: updatedSession,
      response: assistantMessage.content
    });
  } catch (error) {
    logger.error('Error processing session message', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/wellness/session/complete', async (req, res) => {
  try {
    const { date, sessionId, summary } = req.body;

    if (!date || !sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: date and sessionId'
      });
    }

    const completedSession = await wellnessDataStore.completeSession(
      date,
      sessionId,
      summary || {}
    );

    logger.info('Completed wellness session', { date, sessionId });

    res.json({ success: true, session: completedSession });
  } catch (error) {
    logger.error('Error completing session', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/wellness/session/:sessionId', async (req, res) => {
  try {
    const { date } = req.query;
    const { sessionId } = req.params;

    if (!date) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: date'
      });
    }

    const dailyData = await wellnessDataStore.getDailyMetrics(date);

    if (!dailyData || !dailyData.sessions) {
      return res.status(404).json({
        success: false,
        error: 'No sessions found for this date'
      });
    }

    const session = dailyData.sessions.find(s => s.id === sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    res.json({ success: true, session });
  } catch (error) {
    logger.error('Error retrieving session', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/wellness/sessions', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: startDate and endDate'
      });
    }

    const sessions = await wellnessDataStore.getSessionsRange(startDate, endDate);

    logger.info('Retrieved wellness sessions', {
      startDate,
      endDate,
      count: sessions.length
    });

    res.json({ success: true, sessions, count: sessions.length });
  } catch (error) {
    logger.error('Error retrieving sessions', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
