import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import logger from '../config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import agentFactory from '../agents/AgentFactory.js';
import notificationScheduler from '../wellness/NotificationScheduler.js';
import habitStore from '../habits/HabitStore.js';
import agendaStore from '../habits/AgendaStore.js';

const router = express.Router();

/**
 * Helper function to detect and schedule notifications from user messages
 * Supports patterns like:
 * - "remind me to [message] at [time]"
 * - "remind me to [message] every [frequency]"
 * - "schedule a notification to [message] at [time]"
 * - "schedule notifications for 8am, 9am, and 10am" (multiple times)
 */
async function detectAndScheduleNotification(message) {
  let scheduledNotification = null;
  let scheduledNotifications = [];
  let modifiedMessage = message;

  // Pattern 0: Multiple times in one request
  // Matches:
  //   - "remind me to X at 8am, 9am, and 10am"
  //   - "schedule notifications for 8am, 9am, and 10am to X"
  //   - "set a reminder notification for me at 9:45AM and at 1:25PM to do X"
  let multiTimeMatch = message.match(/(?:remind me to|schedule (?:some )?(?:notifications?|reminders?)(?: to)?|set (?:a )?(?:reminder|notification)s?(?: (?:notification|reminder))?(?: for me)?)\s+(.+?)\s+(?:for|at)\s+((?:at\s+)?[\d\w:,\s]+(?:am|pm)?(?:\s*,?\s*(?:and\s+)?(?:at\s+)?[\d\w:]+(?:am|pm)?)*)/i);

  // Also try pattern: "schedule notifications for [times] to [message]"
  if (!multiTimeMatch) {
    multiTimeMatch = message.match(/(?:schedule (?:some )?(?:notifications?|reminders?)|remind me|set (?:a )?(?:reminder|notification)s?(?: for me)?)\s+(?:for|at)\s+((?:at\s+)?[\d\w:,\s]+(?:am|pm)?(?:\s*,?\s*(?:and\s+)?(?:at\s+)?[\d\w:]+(?:am|pm)?)*)\s+(?:to|for)\s+(.+)/i);
    if (multiTimeMatch) {
      // Swap order - times are in [1], message is in [2]
      multiTimeMatch = [multiTimeMatch[0], multiTimeMatch[2], multiTimeMatch[1]];
    }
  }

  if (multiTimeMatch) {
    const reminderMessage = multiTimeMatch[1]?.trim() || 'reminder';
    const timesStr = multiTimeMatch[2];

    try {
      // Split on commas and "and", also remove "at" prefix from each time
      const timeStrings = timesStr
        .split(/[,\s]+and\s+|,\s*/)
        .map(t => t.trim().replace(/^at\s+/i, ''))
        .filter(t => t);

      for (const timeStr of timeStrings) {
        const time = parseTimeString(timeStr);
        if (time) {
          const notification = await notificationScheduler.scheduleNotification({
            message: reminderMessage.trim(),
            type: 'one-time',
            time: time
          });

          scheduledNotifications.push({ notification, timeStr });

          logger.info('[NotificationHelper] Scheduled notification (multi-time)', {
            notificationId: notification.id,
            message: reminderMessage,
            time: time.toISOString()
          });
        }
      }

      if (scheduledNotifications.length > 0) {
        const timesList = scheduledNotifications.map(s => s.timeStr).join(', ');
        modifiedMessage = `${message}

[System Note: I've scheduled ${scheduledNotifications.length} notifications for "${reminderMessage}" at: ${timesList}. Please confirm this to the user in a friendly, brief way (1-2 sentences max).]`;
        scheduledNotification = scheduledNotifications[0].notification; // Return first for API response
      }
    } catch (error) {
      logger.error('[NotificationHelper] Error scheduling multi-time notifications', {
        error: error.message
      });
    }
  }

  // Pattern 1: One-time notification at specific time
  // "remind me to [message] at [time]"
  if (!scheduledNotification) {
    const oneTimeMatch = message.match(/(?:remind me to|schedule (?:a )?(?:notification|reminder) to)\s+(.+?)\s+at\s+([\d\w:]+(?:am|pm)?)\s*$/i);

    if (oneTimeMatch) {
      const [, reminderMessage, timeStr] = oneTimeMatch;

      try {
        // Parse the time string (e.g., "8am", "3:30pm", "noon")
        const time = parseTimeString(timeStr);

        if (time) {
          scheduledNotification = await notificationScheduler.scheduleNotification({
            message: reminderMessage.trim(),
            type: 'one-time',
            time: time
          });

          logger.info('[NotificationHelper] Scheduled one-time notification', {
            notificationId: scheduledNotification.id,
            message: reminderMessage,
            time: time.toISOString()
          });

          modifiedMessage = `${message}

[System Note: I've scheduled a one-time notification for "${reminderMessage}" at ${timeStr}. Please confirm this to the user in a friendly way (1-2 sentences max).]`;
        }
      } catch (error) {
        logger.error('[NotificationHelper] Error scheduling one-time notification', {
          error: error.message
        });
      }
    }
  }

  // Pattern 2: Recurring notification
  // "remind me to [message] every [frequency]"
  if (!scheduledNotification) {
    const recurringMatch = message.match(/remind\s+me\s+to\s+(.+?)\s+(?:every|once)\s+(.+?)(?:\s+(?:from|starting)\s+(.+?))?(?:\s+(?:until|to)\s+(.+?))?$/i);

    if (recurringMatch) {
      const [, reminderMessage, frequency, fromTime, untilTime] = recurringMatch;

      try {
        const cronExpression = notificationScheduler.parseToCron(frequency);

        let endTime = null;
        if (untilTime) {
          const timeRange = notificationScheduler.parseTimeRange(fromTime, untilTime);
          if (timeRange.until) {
            const now = new Date();
            endTime = new Date();
            endTime.setHours(timeRange.until.hour, timeRange.until.minute || 0, 0, 0);

            if (endTime < now) {
              endTime.setDate(endTime.getDate() + 1);
            }
          }
        }

        scheduledNotification = await notificationScheduler.scheduleNotification({
          message: reminderMessage.trim(),
          type: 'recurring',
          cronExpression,
          endTime
        });

        logger.info('[NotificationHelper] Scheduled recurring notification', {
          notificationId: scheduledNotification.id,
          message: reminderMessage,
          frequency
        });

        modifiedMessage = `${message}

[System Note: I've scheduled a recurring reminder for "${reminderMessage}" ${frequency}${untilTime ? ` until ${untilTime}` : ''}. Please confirm this to the user in a friendly way.]`;
      } catch (error) {
        logger.error('[NotificationHelper] Error scheduling recurring notification', {
          error: error.message
        });
      }
    }
  }

  return { scheduledNotification, modifiedMessage };
}

/**
 * Parse a time string like "8am", "3:30pm", "noon" into a Date object for today
 */
function parseTimeString(timeStr) {
  timeStr = timeStr.toLowerCase().trim();

  // Handle "noon"
  if (timeStr === 'noon') {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    return date;
  }

  // Handle "midnight"
  if (timeStr === 'midnight') {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }

  // Handle "3pm", "3:30pm", "15:30"
  const match = timeStr.match(/(\d+)(?::(\d+))?\s*(am|pm)?/);
  if (match) {
    let hour = parseInt(match[1]);
    const minute = match[2] ? parseInt(match[2]) : 0;
    const meridiem = match[3];

    if (meridiem === 'pm' && hour !== 12) {
      hour += 12;
    } else if (meridiem === 'am' && hour === 12) {
      hour = 0;
    }

    const date = new Date();
    date.setHours(hour, minute, 0, 0);

    // If the time is in the past, schedule for tomorrow
    if (date < new Date()) {
      date.setDate(date.getDate() + 1);
    }

    return date;
  }

  return null;
}

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
    let { agentType, taskType, task } = req.body;

    if (!task) {
      return res.status(400).json({ error: 'Task is required' });
    }

    if (!agentFactory.hasAgent(agentType)) {
      return res.status(400).json({ error: `Unknown agent type: ${agentType}` });
    }

    logger.info('Task received', { agentType, taskType, task: task.substring(0, 50) });

    // Check if the user is requesting a notification to be scheduled
    const { scheduledNotification, modifiedMessage } = await detectAndScheduleNotification(task);
    if (scheduledNotification) {
      task = modifiedMessage; // Add system note for the agent
    }

    const agent = agentFactory.getAgent(agentType);
    const result = await agent.processTask(task);

    res.json({
      success: result.success,
      taskId: Date.now(),
      response: result.response,
      agent: result.agent,
      error: result.error,
      scheduledNotification: scheduledNotification || undefined
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
    const registeredApps = appRegistry.getAllApps();
    const registeredNames = new Set(registeredApps.map(app => app.pm2Name));

    // Scope stats to only registered apps (don't report on unrelated PM2 processes)
    const allStats = await pm2Manager.getSystemStats();
    const scopedProcesses = allStats.processes.filter(p => registeredNames.has(p.name));

    res.json({
      processCount: scopedProcesses.length,
      runningCount: scopedProcesses.filter(p => p.status === 'online').length,
      stoppedCount: scopedProcesses.filter(p => p.status === 'stopped').length,
      totalCpu: scopedProcesses.reduce((sum, p) => sum + (p.cpu || 0), 0),
      totalMemory: scopedProcesses.reduce((sum, p) => sum + (p.memory || 0), 0),
      processes: scopedProcesses
    });
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

// Get user's Jira metrics (open tickets and story points)
router.get('/jira/metrics', async (req, res) => {
  try {
    const { projectKey = 'CONTECH' } = req.query;
    const metrics = await jiraManager.getUserMetrics(projectKey);
    res.json(metrics);
  } catch (error) {
    logger.error('Error fetching Jira metrics', error);
    res.status(500).json({ error: error.message });
  }
});

// Get tickets closed on a specific date
router.get('/jira/metrics/closed-on-date', async (req, res) => {
  try {
    const { projectKey = 'CONTECH', date } = req.query;
    const metrics = await jiraManager.getClosedOnDate(projectKey, date);
    res.json(metrics);
  } catch (error) {
    logger.error('Error fetching closed tickets', error);
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

// Manual wellness meeting triggers (bypass "already delivered" check)
router.post('/wellness/standup/trigger', async (req, res) => {
  try {
    // Manual trigger always creates new standup (bypasses "already delivered" check)
    const result = await wellnessMeetings.triggerManualStandup();
    res.json(result);
  } catch (error) {
    logger.error('Error triggering manual standup', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/wellness/retro/trigger', async (req, res) => {
  try {
    // Manual trigger always creates new retro (bypasses "already delivered" check)
    const result = await wellnessMeetings.triggerManualRetro();
    res.json(result);
  } catch (error) {
    logger.error('Error triggering manual retro', error);
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
    const { message, expression, fromTime, untilTime, schedule, timeStr } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }

    let notification;

    // New structured schedule mode (from reminder UI)
    if (schedule && timeStr) {
      const time = parseTimeString(timeStr);
      if (!time) {
        return res.status(400).json({ success: false, error: 'Could not parse time' });
      }

      const hour = time.getHours();
      const minute = time.getMinutes();

      if (schedule === 'once') {
        notification = await notificationScheduler.scheduleNotification({
          message,
          type: 'one-time',
          time,
          label: `Once at ${timeStr}`,
        });
      } else if (schedule === 'daily') {
        notification = await notificationScheduler.scheduleNotification({
          message,
          type: 'recurring',
          cronExpression: `${minute} ${hour} * * *`,
          label: `Daily at ${timeStr}`,
        });
      } else if (schedule === 'weekdays') {
        notification = await notificationScheduler.scheduleNotification({
          message,
          type: 'recurring',
          cronExpression: `${minute} ${hour} * * 1-5`,
          label: `Weekdays at ${timeStr}`,
        });
      } else {
        return res.status(400).json({ success: false, error: 'Invalid schedule type' });
      }
    } else if (expression) {
      // Legacy: recurring via natural language expression
      const cronExpression = notificationScheduler.parseToCron(expression);
      const timeRange = notificationScheduler.parseTimeRange(fromTime, untilTime);

      notification = await notificationScheduler.scheduleNotification({
        message,
        type: 'recurring',
        cronExpression,
        endTime: timeRange.until ? new Date().setHours(timeRange.until.hour, timeRange.until.minute, 0, 0) : null
      });
    } else {
      // Legacy: one-time notification
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
    const all = req.query.all === 'true';
    let notifications;
    if (all) {
      notifications = await notificationScheduler.loadNotifications();
    } else {
      notifications = await notificationScheduler.getActiveNotifications();
    }
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
    const history = conversationHistory || [];

    // Check if user is requesting a notification to be scheduled
    const { scheduledNotification, modifiedMessage } = await detectAndScheduleNotification(message);
    let task = modifiedMessage;

    // If this is a standup awaiting scores, provide enhanced context
    if (session?.awaitingScores && session?.type === 'standup') {
      // Extract scores from message (simple pattern matching)
      const sleepMatch = message.match(/sleep[:\s]+(\d+)/i);
      const readinessMatch = message.match(/readiness[:\s]+(\d+)/i);

      const sleepScore = sleepMatch ? parseInt(sleepMatch[1]) : null;
      const readinessScore = readinessMatch ? parseInt(readinessMatch[1]) : null;

      // Build calendar context if available from session
      let scheduleContext = '';
      if (session?.calendarEvents?.length > 0) {
        const eventLines = session.calendarEvents.map(e => {
          if (e.isAllDay) return `- All Day: ${e.subject}`;
          const startTime = new Date(e.start).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
          const endTime = e.end ? new Date(e.end).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : '';
          return `- ${startTime}${endTime ? ` - ${endTime}` : ''}: ${e.subject}`;
        });
        scheduleContext = `\nToday's schedule:\n${eventLines.join('\n')}\n`;
      }

      // Build enhanced context for Guide
      task = `The user has shared their morning wellness scores:
${sleepScore ? `- Sleep Score: ${sleepScore}/100` : ''}
${readinessScore ? `- Readiness Score: ${readinessScore}/100` : ''}
${scheduleContext}
User's message: "${message}"

Based on these scores${scheduleContext ? ' and their schedule' : ''}, please provide:
1. A brief, encouraging assessment of their recovery and readiness
2. ${scheduleContext ? 'Schedule-aware advice — flag busy stretches, suggest when to take breaks, and note any energy management tips based on meeting density' : 'One specific, actionable wellness tip for today'}
3. What to focus on for optimal performance

Keep your response warm, supportive, and concise.`;

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

// Outlook Calendar Integration routes
import outlookManager from '../integrations/OutlookManager.js';

router.post('/outlook/configure', (req, res) => {
  try {
    const { clientId, clientSecret, tenantId } = req.body;

    if (!clientId || !clientSecret) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: clientId and clientSecret'
      });
    }

    outlookManager.configure(clientId, clientSecret, tenantId);

    res.json({
      success: true,
      message: 'Outlook configured successfully'
    });
  } catch (error) {
    logger.error('Error configuring Outlook', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/outlook/auth-url', (req, res) => {
  try {
    const redirectUri = req.query.redirectUri || `${req.protocol}://${req.get('host')}/api/outlook/callback`;
    const authUrl = outlookManager.getAuthUrl(redirectUri);

    res.json({
      success: true,
      authUrl,
      redirectUri
    });
  } catch (error) {
    logger.error('Error generating auth URL', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/outlook/callback', async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code) {
      return res.status(400).send('Authorization code not provided');
    }

    const redirectUri = `${req.protocol}://${req.get('host')}/api/outlook/callback`;
    await outlookManager.authenticate(code, redirectUri);

    // Redirect to settings page with success message
    res.redirect('/settings?outlook=connected');
  } catch (error) {
    logger.error('Error in OAuth callback', error);
    res.redirect('/settings?outlook=error');
  }
});

router.get('/outlook/status', (req, res) => {
  try {
    res.json({
      configured: outlookManager.isConfigured(),
      authMethod: outlookManager.authMethod,
      hasToken: !!outlookManager.accessToken,
      hasCookies: !!outlookManager.cookies,
      cookieCount: outlookManager.cookies?.length || 0,
      expiresAt: outlookManager.expiresAt
    });
  } catch (error) {
    logger.error('Error checking Outlook status', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/outlook/events', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: startDate and endDate'
      });
    }

    const events = await outlookManager.getCalendarEvents(startDate, endDate);

    res.json({
      success: true,
      events,
      count: events.length
    });
  } catch (error) {
    logger.error('Error fetching calendar events', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/outlook/events/today', async (req, res) => {
  try {
    const events = await outlookManager.getTodayEvents();

    res.json({
      success: true,
      events,
      count: events.length
    });
  } catch (error) {
    logger.error('Error fetching today events', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/outlook/events/week', async (req, res) => {
  try {
    const events = await outlookManager.getWeekEvents();

    res.json({
      success: true,
      events,
      count: events.length
    });
  } catch (error) {
    logger.error('Error fetching week events', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/outlook/events', async (req, res) => {
  try {
    const eventData = req.body;

    if (!eventData.subject || !eventData.start || !eventData.end) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: subject, start, end'
      });
    }

    const event = await outlookManager.createEvent(eventData);

    res.json({
      success: true,
      event
    });
  } catch (error) {
    logger.error('Error creating calendar event', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/outlook/disconnect', (req, res) => {
  try {
    outlookManager.disconnect();
    res.json({
      success: true,
      message: 'Outlook disconnected successfully'
    });
  } catch (error) {
    logger.error('Error disconnecting Outlook', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Chrome cookie extraction for Outlook
router.post('/outlook/extract-cookies', async (req, res) => {
  try {
    const { port } = req.body;
    const chromePort = port || 9222;

    const result = await outlookManager.extractCookiesFromChrome(chromePort);

    res.json({
      success: true,
      message: 'Cookies extracted successfully from Chrome',
      cookieCount: result.cookieCount
    });
  } catch (error) {
    logger.error('Error extracting cookies from Chrome', error);
    res.status(500).json({
      success: false,
      error: error.message,
      hint: 'Make sure Chrome is running with: chrome --remote-debugging-port=9222'
    });
  }
});

// Set authentication method
router.post('/outlook/auth-method', (req, res) => {
  try {
    const { method } = req.body;

    if (!method || !['oauth', 'cookies'].includes(method)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid auth method. Use "oauth" or "cookies"'
      });
    }

    outlookManager.setAuthMethod(method);

    res.json({
      success: true,
      message: `Auth method set to ${method}`,
      authMethod: method
    });
  } catch (error) {
    logger.error('Error setting auth method', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Playwright-based Outlook Integration
import outlookPlaywright from '../integrations/OutlookPlaywright.js';

router.post('/outlook/playwright/initialize', async (req, res) => {
  try {
    const result = await outlookPlaywright.initialize();
    res.json({
      success: true,
      message: 'Playwright browser initialized. Check the browser window to log in to Outlook.'
    });
  } catch (error) {
    logger.error('Error initializing Playwright', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/outlook/playwright/status', async (req, res) => {
  try {
    const isConfigured = outlookPlaywright.isConfigured();

    if (isConfigured) {
      const loginStatus = await outlookPlaywright.ensureLoggedIn();
      res.json({
        configured: true,
        needsLogin: loginStatus.needsLogin,
        message: loginStatus.message
      });
    } else {
      res.json({
        configured: false,
        needsLogin: true,
        message: 'Browser not initialized. Call /api/outlook/playwright/initialize first.'
      });
    }
  } catch (error) {
    logger.error('Error checking Playwright status', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/outlook/playwright/events/today', async (req, res) => {
  try {
    const events = await outlookPlaywright.getTodayEvents();
    res.json({
      success: true,
      events,
      count: events.length
    });
  } catch (error) {
    logger.error('Error fetching today events with Playwright', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/outlook/playwright/events/week', async (req, res) => {
  try {
    const events = await outlookPlaywright.getWeekEvents();
    res.json({
      success: true,
      events,
      count: events.length
    });
  } catch (error) {
    logger.error('Error fetching week events with Playwright', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/outlook/playwright/events', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: startDate and endDate'
      });
    }

    const events = await outlookPlaywright.getCalendarEvents(startDate, endDate);
    res.json({
      success: true,
      events,
      count: events.length
    });
  } catch (error) {
    logger.error('Error fetching calendar events with Playwright', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/outlook/playwright/close', async (req, res) => {
  try {
    await outlookPlaywright.close();
    res.json({
      success: true,
      message: 'Playwright browser closed'
    });
  } catch (error) {
    logger.error('Error closing Playwright browser', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Connected Browser Approach (Recommended by Boss)
import outlookBrowser from '../integrations/OutlookBrowser.js';

router.post('/outlook/browser/connect', async (req, res) => {
  try {
    const { cdpUrl } = req.body;
    const result = await outlookBrowser.connect(cdpUrl || 'http://localhost:9222');
    res.json({
      success: true,
      message: 'Connected to browser successfully',
      ...result
    });
  } catch (error) {
    logger.error('Error connecting to browser', error);
    res.status(500).json({
      success: false,
      error: error.message,
      hint: 'Make sure Chrome is running with: chrome --remote-debugging-port=9222'
    });
  }
});

router.get('/outlook/browser/status', (req, res) => {
  try {
    const status = outlookBrowser.getStatus();
    res.json(status);
  } catch (error) {
    logger.error('Error checking browser status', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/outlook/browser/events/today', async (req, res) => {
  try {
    const events = await outlookBrowser.getTodayEvents();
    res.json({
      success: true,
      events,
      count: events.length
    });
  } catch (error) {
    logger.error('Error fetching today events via browser', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/outlook/browser/events/week', async (req, res) => {
  try {
    const events = await outlookBrowser.getWeekEvents();
    res.json({
      success: true,
      events,
      count: events.length
    });
  } catch (error) {
    logger.error('Error fetching week events via browser', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/outlook/browser/events', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: startDate and endDate'
      });
    }

    const events = await outlookBrowser.getCalendarEvents(startDate, endDate);
    res.json({
      success: true,
      events,
      count: events.length
    });
  } catch (error) {
    logger.error('Error fetching calendar events via browser', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/outlook/browser/disconnect', async (req, res) => {
  try {
    await outlookBrowser.disconnect();
    res.json({
      success: true,
      message: 'Disconnected from browser (browser stays running)'
    });
  } catch (error) {
    logger.error('Error disconnecting from browser', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Weather routes
import weatherManager from '../integrations/WeatherManager.js';

router.get('/weather/forecast', async (req, res) => {
  try {
    const forecast = await weatherManager.getForecast();
    res.json({
      success: true,
      forecast
    });
  } catch (error) {
    logger.error('Error fetching weather forecast', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================
// Manual Calendar Events
// =============================================

const calendarDir = path.resolve(__dirname, '../../data/calendar');
if (!fs.existsSync(calendarDir)) {
  fs.mkdirSync(calendarDir, { recursive: true });
}

function getManualEventsPath(dateStr) {
  return path.join(calendarDir, `manual-${dateStr}.json`);
}

function parseEventText(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const events = [];
  // Match a full time token: "9:30AM", "9:30 AM", "9AM", "14:00", etc.
  const TIME_TOKEN = /\d{1,2}(?::\d{2})?\s*(?:am|pm)/gi;

  for (const line of lines) {
    const timeMatches = [...line.matchAll(TIME_TOKEN)];

    if (timeMatches.length >= 2) {
      // Two times found — treat as start and end
      const startStr = timeMatches[0][0].trim();
      const endStr = timeMatches[1][0].trim();
      // Subject is everything outside the time tokens and separators
      const subject = line
        .replace(timeMatches[0][0], '')
        .replace(timeMatches[1][0], '')
        .replace(/^\s*[-–:]\s*|\s*[-–:]\s*$/g, '')
        .replace(/\s*[-–:]\s*[-–:]\s*/g, ' ')
        .replace(/\s*[-–]\s*/g, ' ')
        .trim();
      events.push({
        subject: subject || 'Untitled',
        start: parseTimeToISO(startStr),
        end: parseTimeToISO(endStr),
        location: null,
        isAllDay: false,
        showAs: 'busy',
        organizer: null,
        attendeeCount: 0,
        source: 'manual',
      });
    } else if (timeMatches.length === 1) {
      // One time found — use as start, default 30min duration
      const startStr = timeMatches[0][0].trim();
      const subject = line
        .replace(timeMatches[0][0], '')
        .replace(/^\s*[-–:]\s*|\s*[-–:]\s*$/g, '')
        .trim();
      const start = parseTimeToISO(startStr);
      const end = new Date(new Date(start).getTime() + 30 * 60 * 1000).toISOString();
      events.push({
        subject: subject || 'Untitled',
        start,
        end,
        location: null,
        isAllDay: false,
        showAs: 'busy',
        organizer: null,
        attendeeCount: 0,
        source: 'manual',
      });
    } else {
      // No time found, treat as all-day event
      events.push({
        subject: line,
        start: null,
        end: null,
        location: null,
        isAllDay: true,
        showAs: 'busy',
        organizer: null,
        attendeeCount: 0,
        source: 'manual',
      });
    }
  }

  return events;
}

function parseTimeToISO(timeStr) {
  const today = new Date().toISOString().split('T')[0];
  const normalized = timeStr.toLowerCase().replace(/\s+/g, '');
  const isPM = normalized.includes('pm');
  const isAM = normalized.includes('am');
  const cleaned = normalized.replace(/am|pm/g, '');

  let [hours, minutes] = cleaned.split(':').map(Number);
  if (isNaN(minutes)) minutes = 0;

  if (isPM && hours < 12) hours += 12;
  if (isAM && hours === 12) hours = 0;

  const pad = (n) => String(n).padStart(2, '0');
  return `${today}T${pad(hours)}:${pad(minutes)}:00`;
}

// Save manual events (text or structured)
router.post('/calendar/manual', async (req, res) => {
  try {
    const { text, events: structuredEvents, date } = req.body;
    const dateStr = date || new Date().toISOString().split('T')[0];

    let events;
    if (text) {
      events = parseEventText(text);
    } else if (structuredEvents) {
      events = structuredEvents;
    } else {
      return res.status(400).json({ success: false, error: 'Provide "text" or "events"' });
    }

    const filePath = getManualEventsPath(dateStr);
    fs.writeFileSync(filePath, JSON.stringify({ date: dateStr, events, updatedAt: new Date().toISOString() }, null, 2));
    logger.info('Manual calendar events saved', { date: dateStr, count: events.length });

    res.json({ success: true, date: dateStr, events });
  } catch (error) {
    logger.error('Error saving manual calendar events', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get manual events for today (or a specific date)
router.get('/calendar/manual', async (req, res) => {
  try {
    const dateStr = req.query.date || new Date().toISOString().split('T')[0];
    const filePath = getManualEventsPath(dateStr);

    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      res.json({ success: true, ...data });
    } else {
      res.json({ success: true, date: dateStr, events: [] });
    }
  } catch (error) {
    logger.error('Error reading manual calendar events', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete manual events for a date
router.delete('/calendar/manual', async (req, res) => {
  try {
    const dateStr = req.query.date || new Date().toISOString().split('T')[0];
    const filePath = getManualEventsPath(dateStr);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    res.json({ success: true, date: dateStr });
  } catch (error) {
    logger.error('Error deleting manual calendar events', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================
// Morning Briefing (aggregated dashboard data)
// =============================================

router.get('/briefing', async (req, res) => {
  const briefing = {
    timestamp: new Date().toISOString(),
    weather: null,
    wellness: null,
    events: null,
    jira: null,
    lastRetro: null,
    todayPlan: null,
    standupDone: false,
    retroDone: false,
  };

  // Fetch all data in parallel, gracefully handling failures
  const [weatherResult, wellnessResult, yesterdayResult, eventsResult, jiraResult, sessionsResult, standupResult, retroResult] = await Promise.allSettled([
    // Weather
    weatherManager.getSimpleForecast(),
    // Today's wellness
    wellnessDataStore.getDailyMetrics(new Date().toISOString().split('T')[0]),
    // Yesterday's wellness (fallback)
    wellnessDataStore.getDailyMetrics(
      new Date(Date.now() - 86400000).toISOString().split('T')[0]
    ),
    // Today's calendar events
    outlookManager.getTodayEvents().catch(() => []),
    // Active Jira tickets
    jiraManager.getIssues('CONTECH', { myIssuesOnly: true, maxResults: 100 }).catch(() => ({ issues: [] })),
    // Recent sessions (last 3 days for retro carry-forward)
    wellnessDataStore.getSessionsRange(
      new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
      new Date().toISOString().split('T')[0]
    ),
    // Standup/retro status
    wellnessMeetings.hasStandupBeenDeliveredToday().catch(() => false),
    wellnessMeetings.hasRetroBeenDeliveredToday().catch(() => false),
  ]);

  // Weather
  if (weatherResult.status === 'fulfilled') {
    briefing.weather = weatherResult.value;
  }

  // Wellness - try today, fall back to yesterday
  if (wellnessResult.status === 'fulfilled' && wellnessResult.value?.metrics) {
    const m = wellnessResult.value.metrics;
    briefing.wellness = {
      date: 'today',
      readiness: m.readiness?.data?.[0]?.score ?? null,
      sleep: m.sleep?.data?.[0]?.score ?? null,
      activity: m.activity?.data?.[0]?.score ?? null,
      sleepDuration: m.sleep?.data?.[0]?.total_sleep ?? null,
      contributors: m.readiness?.data?.[0]?.contributors ?? null,
    };
  } else if (yesterdayResult.status === 'fulfilled' && yesterdayResult.value?.metrics) {
    const m = yesterdayResult.value.metrics;
    briefing.wellness = {
      date: 'yesterday',
      readiness: m.readiness?.data?.[0]?.score ?? null,
      sleep: m.sleep?.data?.[0]?.score ?? null,
      activity: m.activity?.data?.[0]?.score ?? null,
      sleepDuration: m.sleep?.data?.[0]?.total_sleep ?? null,
      contributors: m.readiness?.data?.[0]?.contributors ?? null,
    };
  }

  // Calendar events - sorted by start time, upcoming only
  if (eventsResult.status === 'fulfilled') {
    const allEvents = eventsResult.value || [];
    const now = new Date();
    briefing.events = allEvents
      .filter(e => !e.isCancelled)
      .sort((a, b) => new Date(a.start) - new Date(b.start))
      .map(e => ({
        subject: e.subject,
        start: e.start,
        end: e.end,
        location: e.location,
        isAllDay: e.isAllDay,
        showAs: e.showAs,
        organizer: e.organizer,
        attendeeCount: e.attendees?.length || 0,
        isPast: new Date(e.end) < now,
      }));
  }

  // Fall back to manual events if Outlook returned nothing
  if (!briefing.events || briefing.events.length === 0) {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const manualPath = getManualEventsPath(todayStr);
      if (fs.existsSync(manualPath)) {
        const manualData = JSON.parse(fs.readFileSync(manualPath, 'utf-8'));
        const now = new Date();
        briefing.events = (manualData.events || [])
          .sort((a, b) => new Date(a.start || 0) - new Date(b.start || 0))
          .map(e => ({
            ...e,
            isPast: e.end ? new Date(e.end) < now : false,
          }));
        briefing.eventsSource = 'manual';
      }
    } catch (err) {
      logger.debug('No manual calendar events found', { error: err.message });
    }
  } else {
    briefing.eventsSource = 'outlook';
  }

  // Jira - group by status, prioritize In Progress
  if (jiraResult.status === 'fulfilled') {
    const issues = jiraResult.value?.issues || [];
    const inProgress = [];
    const todo = [];
    const inReview = [];

    for (const issue of issues) {
      const status = issue.fields?.status?.name?.toLowerCase() || '';
      const item = {
        key: issue.key,
        summary: issue.fields?.summary,
        status: issue.fields?.status?.name,
        priority: issue.fields?.priority?.name,
        type: issue.fields?.issuetype?.name,
      };
      if (status.includes('progress') || status.includes('development')) {
        inProgress.push(item);
      } else if (status.includes('review')) {
        inReview.push(item);
      } else if (!status.includes('done') && !status.includes('closed')) {
        todo.push(item);
      }
    }

    briefing.jira = { inProgress, inReview, todo };
  }

  // Last retro notes (carry forward)
  if (sessionsResult.status === 'fulfilled') {
    const sessions = sessionsResult.value || [];
    const completedRetros = sessions
      .filter(s => s.type === 'retro' && s.status === 'completed' && s.summary)
      .sort((a, b) => new Date(b.completedAt || b.startedAt) - new Date(a.completedAt || a.startedAt));

    if (completedRetros.length > 0) {
      const retro = completedRetros[0];
      briefing.lastRetro = {
        date: retro.date || new Date(retro.startedAt).toISOString().split('T')[0],
        accomplishments: retro.summary?.accomplishments || [],
        notesForTomorrow: retro.summary?.notesForTomorrow || null,
      };
    }

    // Also get today's standup plan if it exists
    const todayStr = new Date().toISOString().split('T')[0];
    const todayStandup = sessions
      .filter(s => s.type === 'standup' && s.status === 'completed' && s.summary)
      .sort((a, b) => new Date(b.completedAt || b.startedAt) - new Date(a.completedAt || a.startedAt))
      .find(s => (s.date || new Date(s.startedAt).toISOString().split('T')[0]) === todayStr);

    if (todayStandup?.summary?.plan) {
      briefing.todayPlan = todayStandup.summary.plan;
    }
  }

  // Session status
  briefing.standupDone = standupResult.status === 'fulfilled' ? standupResult.value : false;
  briefing.retroDone = retroResult.status === 'fulfilled' ? retroResult.value : false;

  // Habits
  try {
    const habitConfig = habitStore.getConfig();
    if (habitConfig.habits.length > 0) {
      const todayStr = new Date().toISOString().split('T')[0];
      const dayLog = habitStore.getDayLog(todayStr);
      briefing.habits = {
        habits: habitConfig.habits,
        completed: dayLog.completed,
      };
    }
  } catch (err) {
    logger.debug('Error loading habits for briefing', { error: err.message });
  }

  // Recurring agenda items for today
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const agendaItems = agendaStore.getItemsForDate(todayStr);
    if (agendaItems.length > 0) {
      briefing.agendaItems = agendaItems;
    }
  } catch (err) {
    logger.debug('Error loading agenda for briefing', { error: err.message });
  }

  res.json({ success: true, briefing });
});

router.get('/weather/simple', async (req, res) => {
  try {
    const forecast = await weatherManager.getSimpleForecast();
    res.json({
      success: true,
      forecast
    });
  } catch (error) {
    logger.error('Error fetching simple weather forecast', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== Habits ====================

// Get habit config (which habits are being tracked)
router.get('/habits/config', (req, res) => {
  try {
    const config = habitStore.getConfig();
    res.json({ success: true, config });
  } catch (error) {
    logger.error('Error getting habit config', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add a new habit
router.post('/habits/config', (req, res) => {
  try {
    const { name, icon } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Name is required' });
    }
    const habit = habitStore.addHabit({ name: name.trim(), icon });
    res.json({ success: true, habit });
  } catch (error) {
    logger.error('Error adding habit', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update a habit
router.put('/habits/config/:habitId', (req, res) => {
  try {
    const { name, icon } = req.body;
    const habit = habitStore.updateHabit(req.params.habitId, { name, icon });
    if (!habit) {
      return res.status(404).json({ success: false, error: 'Habit not found' });
    }
    res.json({ success: true, habit });
  } catch (error) {
    logger.error('Error updating habit', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Remove a habit
router.delete('/habits/config/:habitId', (req, res) => {
  try {
    habitStore.removeHabit(req.params.habitId);
    res.json({ success: true });
  } catch (error) {
    logger.error('Error removing habit', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get today's (or specific date's) habit log
router.get('/habits/day/:date?', (req, res) => {
  try {
    const date = req.params.date || new Date().toISOString().split('T')[0];
    const config = habitStore.getConfig();
    const dayLog = habitStore.getDayLog(date);
    res.json({ success: true, habits: config.habits, completed: dayLog.completed });
  } catch (error) {
    logger.error('Error getting day habits', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Toggle a habit for a date
router.post('/habits/toggle', (req, res) => {
  try {
    const { date, habitId } = req.body;
    const todayStr = date || new Date().toISOString().split('T')[0];
    const dayLog = habitStore.toggleHabit(todayStr, habitId);
    res.json({ success: true, completed: dayLog.completed });
  } catch (error) {
    logger.error('Error toggling habit', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get week summary for trend display
router.get('/habits/week/:endDate?', (req, res) => {
  try {
    const endDate = req.params.endDate || new Date().toISOString().split('T')[0];
    const config = habitStore.getConfig();
    const days = habitStore.getWeekSummary(endDate);
    res.json({ success: true, habits: config.habits, days });
  } catch (error) {
    logger.error('Error getting habit week summary', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== Recurring Agenda ====================

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Get all agenda items
router.get('/agenda', (req, res) => {
  try {
    const items = agendaStore.getItems();
    res.json({ success: true, items });
  } catch (error) {
    logger.error('Error getting agenda items', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get agenda items for today (or a specific date)
router.get('/agenda/today/:date?', (req, res) => {
  try {
    const date = req.params.date || new Date().toISOString().split('T')[0];
    const items = agendaStore.getItemsForDate(date);
    res.json({ success: true, items, date });
  } catch (error) {
    logger.error('Error getting today agenda', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add an agenda item
router.post('/agenda', (req, res) => {
  try {
    const { name, recurrence, dayOfWeek, startDate, notes } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Name is required' });
    }
    if (!['weekly', 'biweekly'].includes(recurrence)) {
      return res.status(400).json({ success: false, error: 'Recurrence must be weekly or biweekly' });
    }
    if (dayOfWeek == null || dayOfWeek < 0 || dayOfWeek > 6) {
      return res.status(400).json({ success: false, error: 'dayOfWeek must be 0-6' });
    }
    const item = agendaStore.addItem({
      name: name.trim(),
      recurrence,
      dayOfWeek: Number(dayOfWeek),
      startDate,
      notes: notes?.trim() || null,
    });
    res.json({ success: true, item });
  } catch (error) {
    logger.error('Error adding agenda item', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update an agenda item
router.put('/agenda/:id', (req, res) => {
  try {
    const { name, recurrence, dayOfWeek, startDate, notes } = req.body;
    const item = agendaStore.updateItem(req.params.id, { name, recurrence, dayOfWeek: dayOfWeek != null ? Number(dayOfWeek) : undefined, startDate, notes });
    if (!item) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }
    res.json({ success: true, item });
  } catch (error) {
    logger.error('Error updating agenda item', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Remove an agenda item
router.delete('/agenda/:id', (req, res) => {
  try {
    agendaStore.removeItem(req.params.id);
    res.json({ success: true });
  } catch (error) {
    logger.error('Error removing agenda item', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
