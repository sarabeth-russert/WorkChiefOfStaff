import logger from '../config/logger.js';
import ouraManager from '../integrations/OuraManager.js';
import wellnessDataStore from './WellnessDataStore.js';
import orchestrator from '../agents/AgentOrchestrator.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * WellnessMeetings manages wellness check-ins and meetings
 * Integrates with Oura data, AI agents, and Socket.IO
 */
class WellnessMeetings {
  constructor(io = null) {
    this.io = io;
  }

  /**
   * Set Socket.IO instance
   * @param {Object} io - Socket.IO server instance
   */
  setIO(io) {
    this.io = io;
  }

  /**
   * Load wellness settings from file
   */
  async loadSettings() {
    try {
      const settingsPath = path.join(__dirname, '../../data/wellness/settings.json');
      const data = await fs.readFile(settingsPath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      logger.warn('[WellnessMeetings] Could not load settings, using defaults', { error: error.message });
      return { timezone: 'America/Los_Angeles' };
    }
  }

  /**
   * Get today's date in YYYY-MM-DD format using configured timezone
   */
  getTodayDate() {
    try {
      // Load settings synchronously (cached after first load)
      let timezone = 'America/Los_Angeles';
      try {
        const settingsPath = path.join(__dirname, '../../data/wellness/settings.json');
        const data = require('fs').readFileSync(settingsPath, 'utf-8');
        const settings = JSON.parse(data);
        timezone = settings.timezone || timezone;
      } catch (e) {
        // Use default timezone if settings can't be loaded
      }

      // Use Intl.DateTimeFormat for reliable timezone conversion
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });

      const parts = formatter.formatToParts(new Date());
      const year = parts.find(p => p.type === 'year').value;
      const month = parts.find(p => p.type === 'month').value;
      const day = parts.find(p => p.type === 'day').value;

      return `${year}-${month}-${day}`;
    } catch (error) {
      logger.error('[WellnessMeetings] Error getting today date', {
        error: error.message,
        stack: error.stack
      });
      // Fallback to UTC if timezone conversion fails
      return new Date().toISOString().split('T')[0];
    }
  }

  /**
   * Get yesterday's date in YYYY-MM-DD format using configured timezone
   */
  getYesterdayDate() {
    try {
      // Load settings synchronously (cached after first load)
      let timezone = 'America/Los_Angeles';
      try {
        const settingsPath = path.join(__dirname, '../../data/wellness/settings.json');
        const data = require('fs').readFileSync(settingsPath, 'utf-8');
        const settings = JSON.parse(data);
        timezone = settings.timezone || timezone;
      } catch (e) {
        // Use default timezone if settings can't be loaded
      }

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      // Use Intl.DateTimeFormat for reliable timezone conversion
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });

      const parts = formatter.formatToParts(yesterday);
      const year = parts.find(p => p.type === 'year').value;
      const month = parts.find(p => p.type === 'month').value;
      const day = parts.find(p => p.type === 'day').value;

      return `${year}-${month}-${day}`;
    } catch (error) {
      logger.error('[WellnessMeetings] Error getting yesterday date', {
        error: error.message,
        stack: error.stack
      });
      // Fallback to UTC if timezone conversion fails
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return yesterday.toISOString().split('T')[0];
    }
  }

  /**
   * Build wellness context from Oura data
   * @param {Object} metrics - Oura metrics object
   * @returns {string} Formatted wellness context
   */
  buildWellnessContext(metrics) {
    const { sleep, activity, readiness, heartRate } = metrics;

    let context = '# Wellness Data Summary\n\n';

    // Sleep data
    if (sleep && sleep.data && sleep.data.length > 0) {
      const sleepData = sleep.data[0];
      context += '## Sleep\n';
      context += `- Score: ${sleepData.score || 'N/A'}\n`;
      context += `- Total Sleep: ${sleepData.total_sleep_duration ? Math.round(sleepData.total_sleep_duration / 3600) : 'N/A'} hours\n`;
      context += `- Deep Sleep: ${sleepData.deep_sleep_duration ? Math.round(sleepData.deep_sleep_duration / 60) : 'N/A'} minutes\n`;
      context += `- REM Sleep: ${sleepData.rem_sleep_duration ? Math.round(sleepData.rem_sleep_duration / 60) : 'N/A'} minutes\n`;
      context += `- Sleep Efficiency: ${sleepData.efficiency || 'N/A'}%\n\n`;
    }

    // Activity data
    if (activity && activity.data && activity.data.length > 0) {
      const activityData = activity.data[0];
      context += '## Activity\n';
      context += `- Score: ${activityData.score || 'N/A'}\n`;
      context += `- Steps: ${activityData.steps ? activityData.steps.toLocaleString() : 'N/A'}\n`;
      context += `- Active Calories: ${activityData.active_calories || 'N/A'} kcal\n`;
      context += `- Total Calories: ${activityData.total_calories || 'N/A'} kcal\n\n`;
    }

    // Readiness data
    if (readiness && readiness.data && readiness.data.length > 0) {
      const readinessData = readiness.data[0];
      context += '## Readiness\n';
      context += `- Score: ${readinessData.score || 'N/A'}\n`;
      context += `- HRV Balance: ${readinessData.contributors?.hrv_balance || 'N/A'}\n`;
      context += `- Body Temperature: ${readinessData.contributors?.body_temperature || 'N/A'}\n`;
      context += `- Resting Heart Rate: ${readinessData.contributors?.resting_heart_rate || 'N/A'}\n\n`;
    }

    // Heart rate data summary
    if (heartRate && heartRate.data && heartRate.data.length > 0) {
      const hrData = heartRate.data[0];
      context += '## Heart Rate\n';
      context += `- Timestamp: ${hrData.timestamp || 'N/A'}\n`;
      context += `- BPM: ${hrData.bpm || 'N/A'}\n\n`;
    }

    return context;
  }

  /**
   * Check if standup has already been delivered today
   */
  async hasStandupBeenDeliveredToday() {
    try {
      const today = this.getTodayDate();
      const data = await wellnessDataStore.getDailyMetrics(today);
      // Check both root level and nested in metrics for backwards compatibility
      return (data && data.standupDelivered === true) ||
             (data && data.metrics && data.metrics.standupDelivered === true);
    } catch (error) {
      logger.error('[WellnessMeetings] Error checking standup delivery status', { error: error.message });
      return false;
    }
  }

  /**
   * Check if retro has already been delivered today
   */
  async hasRetroBeenDeliveredToday() {
    try {
      const today = this.getTodayDate();
      const data = await wellnessDataStore.getDailyMetrics(today);
      // Check both root level and nested in metrics for backwards compatibility
      return (data && data.retroDelivered === true) ||
             (data && data.metrics && data.metrics.retroDelivered === true);
    } catch (error) {
      logger.error('[WellnessMeetings] Error checking retro delivery status', { error: error.message });
      return false;
    }
  }

  /**
   * Trigger standup meeting on-demand (if not already delivered today)
   */
  async triggerStandupOnDemand() {
    logger.info('[WellnessMeetings] On-demand standup requested');

    // Check if already delivered today
    const alreadyDelivered = await this.hasStandupBeenDeliveredToday();
    if (alreadyDelivered) {
      logger.info('[WellnessMeetings] Standup already delivered today, skipping');
      return {
        success: true,
        message: 'Standup already delivered today',
        alreadyDelivered: true
      };
    }

    return await this.triggerStandupMeeting();
  }

  /**
   * Trigger retro meeting on-demand (if not already delivered today)
   */
  async triggerRetroOnDemand() {
    logger.info('[WellnessMeetings] On-demand retro requested');

    // Check if already delivered today
    const alreadyDelivered = await this.hasRetroBeenDeliveredToday();
    if (alreadyDelivered) {
      logger.info('[WellnessMeetings] Retro already delivered today, skipping');
      return {
        success: true,
        message: 'Retro already delivered today',
        alreadyDelivered: true
      };
    }

    return await this.triggerRetroMeeting();
  }

  /**
   * Trigger morning standup meeting
   * Fetches daily wellness data, calls Guide agent, and emits Socket.IO event
   */
  async triggerStandupMeeting() {
    try {
      logger.info('[WellnessMeetings] Starting standup meeting');

      const today = this.getTodayDate();
      const yesterday = this.getYesterdayDate();

      // Mark standup as delivered
      await wellnessDataStore.saveDailyMetrics(today, {
        standupDelivered: true,
        standupDeliveredAt: new Date().toISOString()
      });

      // Get yesterday's notes for today
      let yesterdayNotes = null;
      try {
        const yesterdayMetrics = await wellnessDataStore.getDailyMetrics(yesterday);
        if (yesterdayMetrics && yesterdayMetrics.sessions) {
          // Find the most recent completed retro with notes
          const retrosWithNotes = yesterdayMetrics.sessions.filter(
            s => s.type === 'retro' && s.status === 'completed' && s.summary && s.summary.notesForTomorrow
          );

          if (retrosWithNotes.length > 0) {
            const lastRetro = retrosWithNotes[retrosWithNotes.length - 1];
            yesterdayNotes = lastRetro.summary.notesForTomorrow;
            logger.info('[WellnessMeetings] Retrieved yesterday\'s notes for tomorrow', {
              notesLength: yesterdayNotes.length
            });
          }
        }
      } catch (error) {
        logger.warn('[WellnessMeetings] Could not retrieve yesterday\'s notes', { error: error.message });
      }

      // Create initial prompt asking user for their scores
      let initialPrompt = `Good morning! 🌅

Since Oura Ring readiness data takes 24 hours to sync, let's start with what you're seeing in your Oura app right now.
`;

      // Add yesterday's notes if available
      if (yesterdayNotes) {
        initialPrompt += `
**Quick Reminder from Yesterday Evening:**
${yesterdayNotes}

`;
      }

      initialPrompt += `
**Please share your scores from today:**
- What's your **Sleep Score**? (0-100)
- What's your **Readiness Score**? (0-100)

Once you share these, I can provide personalized guidance for your day!`;

      // Create session with prompt (without calling Guide agent yet)
      const sessionData = {
        type: 'standup',
        initialGuidance: initialPrompt,
        conversation: [
          {
            role: 'assistant',
            content: initialPrompt,
            timestamp: new Date().toISOString()
          }
        ],
        status: 'active',
        startedAt: new Date().toISOString(),
        awaitingScores: true // Flag to indicate we need user's scores first
      };

      const session = await wellnessDataStore.saveSession(today, sessionData);
      logger.info('[WellnessMeetings] Created standup session (awaiting user scores)', { sessionId: session.id });

      // Emit Socket.IO event with sessionId
      if (this.io) {
        this.io.emit('wellness:standup', {
          date: today,
          sessionId: session.id,
          guidance: initialPrompt,
          awaitingScores: true,
          timestamp: new Date().toISOString()
        });
        logger.info('[WellnessMeetings] Emitted wellness:standup event');
      }

      return {
        success: true,
        date: today,
        sessionId: session.id,
        guidance: initialPrompt
      };

    } catch (error) {
      logger.error('[WellnessMeetings] Error in standup meeting', { error: error.message });

      // Emit error event
      if (this.io) {
        this.io.emit('wellness:error', {
          type: 'standup',
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Fetch Jira statistics for today
   * Returns story points added and closed
   */
  async getJiraStatsForToday() {
    let jiraManager;
    try {
      jiraManager = require('../integrations/JiraManager.js').default;

      // Check if Jira is configured
      if (!jiraManager.configured) {
        logger.info('[WellnessMeetings] Jira not configured, skipping stats');
        return null;
      }

      // JQL to find issues created today assigned to current user
      const createdTodayJQL = 'created >= startOfDay(0d) AND assignee = currentUser()';

      // JQL to find issues moved to Done today assigned to current user
      const closedTodayJQL = 'status changed to Done DURING (startOfDay(0d), endOfDay(0d)) AND assignee = currentUser()';

      const [createdResults, closedResults] = await Promise.all([
        jiraManager.searchIssues(createdTodayJQL, { maxResults: 100 }),
        jiraManager.searchIssues(closedTodayJQL, { maxResults: 100 })
      ]);

      // Sum story points (checking common field names)
      const sumStoryPoints = (issues) => {
        return issues.reduce((sum, issue) => {
          const storyPoints =
            issue.fields?.customfield_10016 || // Common story points field
            issue.fields?.storyPoints ||
            issue.fields?.['Story Points'] ||
            0;
          return sum + (parseFloat(storyPoints) || 0);
        }, 0);
      };

      const createdIssues = createdResults?.issues || [];
      const closedIssues = closedResults?.issues || [];

      logger.info('[WellnessMeetings] Fetched Jira stats', {
        issuesCreated: createdIssues.length,
        issuesClosed: closedIssues.length
      });

      return {
        issuesCreated: createdIssues.length,
        storyPointsAdded: sumStoryPoints(createdIssues),
        issuesClosed: closedIssues.length,
        storyPointsClosed: sumStoryPoints(closedIssues)
      };
    } catch (error) {
      logger.warn('[WellnessMeetings] Could not fetch Jira stats', {
        error: error.message,
        stack: error.stack,
        configured: jiraManager?.configured
      });
      return null;
    }
  }

  /**
   * Trigger evening retro meeting
   * Reviews the day's wellness data and provides insights
   */
  async triggerRetroMeeting() {
    try {
      logger.info('[WellnessMeetings] Starting retro meeting');

      // Check if Oura is configured
      if (!ouraManager.isConfigured()) {
        logger.warn('[WellnessMeetings] Oura not configured, skipping retro');
        return {
          success: false,
          message: 'Oura Ring not configured'
        };
      }

      const today = this.getTodayDate();

      logger.info('[WellnessMeetings] Fetching today\'s wellness metrics', { date: today });

      // Fetch today's activity and heart rate data (sleep/readiness come next morning)
      const activityData = await ouraManager.getDailyActivity(today, today);
      const heartRateData = await ouraManager.getHeartRate(today, today);

      // Fetch Jira statistics for today
      const jiraStats = await this.getJiraStatsForToday();

      // Get morning standup session to include morning plan context
      let morningPlan = null;
      try {
        // Get today's daily metrics to search all standup sessions
        const dailyMetrics = await wellnessDataStore.getDailyMetrics(today);
        logger.info('[WellnessMeetings] Retrieved daily metrics for standup search', {
          hasSessions: !!dailyMetrics?.sessions,
          sessionCount: dailyMetrics?.sessions?.length || 0
        });

        if (dailyMetrics && dailyMetrics.sessions) {
          // Find the most recent standup with a plan (prioritize completed)
          const standupsWithPlan = dailyMetrics.sessions.filter(
            s => s.type === 'standup' && s.summary && s.summary.plan
          );

          logger.info('[WellnessMeetings] Filtered standups with plans', {
            count: standupsWithPlan.length
          });

          if (standupsWithPlan.length > 0) {
            // Get the last (most recent) standup with a plan
            const standupSession = standupsWithPlan[standupsWithPlan.length - 1];
            morningPlan = standupSession.summary.plan;

            logger.info('[WellnessMeetings] Retrieved morning plan from standup', {
              sessionId: standupSession.id,
              planLength: morningPlan.length
            });
          } else {
            logger.info('[WellnessMeetings] No standup with plan found today');
          }
        }
      } catch (error) {
        logger.warn('[WellnessMeetings] Could not retrieve morning standup session', {
          error: error.message,
          stack: error.stack
        });
      }

      // Save to data store with retroDelivered flag
      await wellnessDataStore.saveDailyMetrics(today, {
        activity: activityData,
        heartRate: heartRateData,
        retroDelivered: true,
        retroDeliveredAt: new Date().toISOString()
      });

      // Build context for retro
      let context = '# Today\'s Activity Summary\n\n';

      if (activityData && activityData.data && activityData.data.length > 0) {
        const activity = activityData.data[0];
        context += '## Activity\n';
        context += `- Score: ${activity.score || 'N/A'}\n`;
        context += `- Steps: ${activity.steps ? activity.steps.toLocaleString() : 'N/A'}\n`;
        context += `- Active Calories: ${activity.active_calories || 'N/A'} kcal\n`;
        context += `- Total Calories: ${activity.total_calories || 'N/A'} kcal\n\n`;
      } else {
        // Oura doesn't provide final activity summaries until the day is complete
        context += '## Activity\n';
        context += 'Note: Oura Ring provides final daily activity summaries the following morning. The activity data for today will be available in tomorrow\'s standup.\n\n';
        context += 'You can still provide encouragement and evening wind-down suggestions based on the user\'s overall wellness journey.\n\n';
      }

      // Add morning plan context if available
      if (morningPlan) {
        context += `## Morning Plan\n`;
        context += `This morning, the user shared: "${morningPlan}"\n\n`;
      }

      // Add Jira stats if available
      if (jiraStats) {
        context += `## Jira Progress Today\n`;
        context += `- Issues Created: ${jiraStats.issuesCreated} (${jiraStats.storyPointsAdded} story points)\n`;
        context += `- Issues Closed: ${jiraStats.issuesClosed} (${jiraStats.storyPointsClosed} story points completed)\n\n`;
      }

      // Create task for Guide agent with morning plan context
      const task = morningPlan
        ? `You're conducting the evening wellness retro. Here's today's activity data:

${context}

Please provide:
1. A brief reflection on today's activity level and how it relates to their morning plan
2. One suggestion for winding down this evening to optimize recovery
3. What to keep in mind for tomorrow

Keep your response warm, supportive, and under 150 words. Focus on recovery and preparing for restful sleep.`
        : `You're conducting the evening wellness retro. Here's today's activity data:

${context}

Please provide:
1. A brief reflection on today's activity level
2. One suggestion for winding down this evening to optimize recovery
3. What to keep in mind for tomorrow

Keep your response warm, supportive, and under 150 words. Focus on recovery and preparing for restful sleep.`;

      logger.info('[WellnessMeetings] Calling Guide agent for retro analysis');

      // Execute task with Guide agent
      const result = await orchestrator.executeTask({
        taskType: 'wellness',
        task,
        agentType: 'guide',
        stream: false
      });

      const response = result.success ? result.response : 'Unable to generate wellness retro at this time.';

      // Create session with Guide's initial guidance
      const retroSessionData = {
        type: 'retro',
        initialGuidance: response,
        conversation: [
          {
            role: 'assistant',
            content: response,
            timestamp: new Date().toISOString()
          }
        ],
        status: 'active',
        startedAt: new Date().toISOString(),
        metrics: {
          activity: activityData?.data?.[0]
        },
        morningPlan: morningPlan || null,
        jiraStats: jiraStats || null
      };

      const retroSession = await wellnessDataStore.saveSession(today, retroSessionData);
      logger.info('[WellnessMeetings] Created retro session', { sessionId: retroSession.id });

      // Emit Socket.IO event with sessionId, morningPlan, and jiraStats
      if (this.io) {
        this.io.emit('wellness:retro', {
          date: today,
          sessionId: retroSession.id,
          metrics: {
            activity: activityData?.data?.[0]
          },
          guidance: response,
          morningPlan: morningPlan || null,
          jiraStats: jiraStats || null,
          timestamp: new Date().toISOString()
        });
        logger.info('[WellnessMeetings] Emitted wellness:retro event');
      }

      return {
        success: true,
        date: today,
        sessionId: retroSession.id,
        metrics: { activity: activityData, heartRate: heartRateData },
        guidance: response,
        morningPlan: morningPlan || null
      };

    } catch (error) {
      logger.error('[WellnessMeetings] Error in retro meeting', { error: error.message });

      // Emit error event
      if (this.io) {
        this.io.emit('wellness:error', {
          type: 'retro',
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Check stress levels based on HRV data
   * @param {number} threshold - Stress threshold (0-10, default 7)
   */
  async checkStressLevels(threshold = 7) {
    try {
      logger.info('[WellnessMeetings] Checking stress levels', { threshold });

      // Check if Oura is configured
      if (!ouraManager.isConfigured()) {
        logger.warn('[WellnessMeetings] Oura not configured, skipping stress check');
        return {
          success: false,
          message: 'Oura Ring not configured'
        };
      }

      const today = this.getTodayDate();

      // Fetch today's readiness data (includes HRV)
      const readinessData = await ouraManager.getDailyReadiness(today, today);

      if (!readinessData || !readinessData.data || readinessData.data.length === 0) {
        logger.info('[WellnessMeetings] No readiness data available for stress check');
        return {
          success: false,
          message: 'No readiness data available yet'
        };
      }

      const readiness = readinessData.data[0];
      const hrvBalance = readiness.contributors?.hrv_balance || null;
      const readinessScore = readiness.score || null;

      // Determine if stress alert should be triggered
      // Lower HRV balance or readiness score indicates higher stress
      let stressLevel = 0;
      if (readinessScore !== null) {
        // Convert readiness score (0-100) to stress level (0-10, inverted)
        stressLevel = Math.round((100 - readinessScore) / 10);
      }

      const isStressed = stressLevel >= threshold;

      logger.info('[WellnessMeetings] Stress check complete', {
        date: today,
        hrvBalance,
        readinessScore,
        stressLevel,
        threshold,
        isStressed
      });

      if (isStressed) {
        // Record stress alert
        const alert = await wellnessDataStore.recordStressAlert(today, {
          stressLevel,
          hrvBalance,
          readinessScore,
          threshold,
          type: 'automated_check'
        });

        // Create task for Guide agent
        const task = `The user is showing signs of elevated stress. Here are the indicators:

- Readiness Score: ${readinessScore}
- HRV Balance: ${hrvBalance}
- Stress Level: ${stressLevel}/10

Please provide a brief, supportive message (under 100 words) that:
1. Acknowledges the stress indicators
2. Suggests ONE simple stress-relief action they can take right now
3. Encourages self-care

Keep it warm, non-judgmental, and actionable.`;

        logger.info('[WellnessMeetings] Calling Guide agent for stress guidance');

        // Execute task with Guide agent
        const result = await orchestrator.executeTask({
          taskType: 'wellness',
          task,
          agentType: 'guide',
          stream: false
        });

        const guidance = result.success ? result.response : 'Consider taking a short break to breathe and reset.';

        // Emit Socket.IO event
        if (this.io) {
          this.io.emit('wellness:stress-alert', {
            date: today,
            stressLevel,
            hrvBalance,
            readinessScore,
            alert,
            guidance,
            timestamp: new Date().toISOString()
          });
          logger.info('[WellnessMeetings] Emitted wellness:stress-alert event');
        }

        return {
          success: true,
          alert: true,
          stressLevel,
          hrvBalance,
          readinessScore,
          guidance
        };
      }

      // No stress alert needed
      return {
        success: true,
        alert: false,
        stressLevel,
        hrvBalance,
        readinessScore,
        message: 'Stress levels within normal range'
      };

    } catch (error) {
      logger.error('[WellnessMeetings] Error checking stress levels', { error: error.message });

      // Emit error event
      if (this.io) {
        this.io.emit('wellness:error', {
          type: 'stress-check',
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Manual trigger for standup meeting (for testing)
   */
  async triggerManualStandup() {
    logger.info('[WellnessMeetings] Manual standup trigger');
    return await this.triggerStandupMeeting();
  }

  /**
   * Sync Oura data (fetch and save latest metrics)
   * Called hourly by scheduler to keep data fresh
   */
  async syncOuraData() {
    try {
      logger.info('[WellnessMeetings] Starting Oura data sync');

      const today = this.getTodayDate();
      const yesterday = this.getYesterdayDate();

      // Fetch all available metrics for yesterday and today
      // Yesterday: complete sleep/readiness/activity
      // Today: partial activity and heart rate (sleep/readiness not ready yet)
      const [yesterdayMetrics, todayActivity, todayHeartRate, todayReadiness] = await Promise.all([
        ouraManager.getAllMetrics(yesterday, yesterday),
        ouraManager.getDailyActivity(today, today),
        ouraManager.getHeartRate(today, today),
        ouraManager.getDailyReadiness(today, today)
      ]);

      // Save yesterday's complete data (if not already saved)
      const existingYesterday = await wellnessDataStore.getDailyMetrics(yesterday);
      if (!existingYesterday || !existingYesterday.sleep) {
        await wellnessDataStore.saveDailyMetrics(yesterday, yesterdayMetrics);
        logger.info('[WellnessMeetings] Saved yesterday\'s complete metrics', { date: yesterday });
      }

      // Save/update today's partial data
      await wellnessDataStore.saveDailyMetrics(today, {
        activity: todayActivity,
        heartRate: todayHeartRate,
        readiness: todayReadiness,
        lastSyncedAt: new Date().toISOString()
      });

      logger.info('[WellnessMeetings] Oura data sync completed successfully', {
        yesterday,
        today,
        todayHasActivity: !!(todayActivity?.data?.length > 0),
        todayHasHeartRate: !!(todayHeartRate?.data?.length > 0),
        todayHasReadiness: !!(todayReadiness?.data?.length > 0)
      });

      return {
        success: true,
        message: 'Oura data synced successfully',
        synced: {
          yesterday: {
            sleep: !!(yesterdayMetrics.sleep?.data?.length > 0),
            activity: !!(yesterdayMetrics.activity?.data?.length > 0),
            readiness: !!(yesterdayMetrics.readiness?.data?.length > 0)
          },
          today: {
            activity: !!(todayActivity?.data?.length > 0),
            heartRate: !!(todayHeartRate?.data?.length > 0),
            readiness: !!(todayReadiness?.data?.length > 0)
          }
        }
      };
    } catch (error) {
      logger.error('[WellnessMeetings] Error syncing Oura data', error);
      return {
        success: false,
        message: 'Failed to sync Oura data',
        error: error.message
      };
    }
  }

  /**
   * Manual trigger for retro meeting (for testing)
   */
  async triggerManualRetro() {
    logger.info('[WellnessMeetings] Manual retro trigger');
    return await this.triggerRetroMeeting();
  }

  /**
   * Manual trigger for stress check (for testing)
   */
  async triggerManualStressCheck(threshold = 7) {
    logger.info('[WellnessMeetings] Manual stress check trigger', { threshold });
    return await this.checkStressLevels(threshold);
  }
}

// Export singleton instance
const wellnessMeetings = new WellnessMeetings();
export default wellnessMeetings;
