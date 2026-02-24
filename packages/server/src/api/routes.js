import express from 'express';
import logger from '../config/logger.js';
import agentFactory from '../agents/AgentFactory.js';

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

router.get('/apps', async (req, res) => {
  try {
    const registeredApps = appRegistry.getAllApps();
    const pm2Processes = await pm2Manager.listProcesses();

    // Merge registry data with PM2 process data
    const apps = registeredApps.map(app => {
      const process = pm2Processes.find(p => p.name === app.pm2Name);
      return {
        ...app,
        status: process?.status || 'not_running',
        pid: process?.pid || null,
        cpu: process?.cpu || 0,
        memory: process?.memory || 0,
        uptime: process?.uptime || null,
        restarts: process?.restarts || 0
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

export default router;
