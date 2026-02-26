import logger from '../config/logger.js';
import ouraManager from '../integrations/OuraManager.js';
import wellnessDataStore from './WellnessDataStore.js';
import orchestrator from '../agents/AgentOrchestrator.js';

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
   * Get today's date in YYYY-MM-DD format
   */
  getTodayDate() {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Get yesterday's date in YYYY-MM-DD format
   */
  getYesterdayDate() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
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
      const metrics = await wellnessDataStore.getDailyMetrics(today);
      return metrics && metrics.standupDelivered === true;
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
      const metrics = await wellnessDataStore.getDailyMetrics(today);
      return metrics && metrics.retroDelivered === true;
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

      // Check if Oura is configured
      if (!ouraManager.isConfigured()) {
        logger.warn('[WellnessMeetings] Oura not configured, skipping standup');
        return {
          success: false,
          message: 'Oura Ring not configured'
        };
      }

      // Get yesterday's data (Oura provides previous day's complete data)
      const yesterday = this.getYesterdayDate();
      const today = this.getTodayDate();

      logger.info('[WellnessMeetings] Fetching wellness metrics', { date: yesterday });

      // Fetch all wellness metrics
      const metrics = await ouraManager.getAllMetrics(yesterday, yesterday);

      // Save to data store with standupDelivered flag
      await wellnessDataStore.saveDailyMetrics(today, {
        sleep: metrics.sleep,
        activity: metrics.activity,
        readiness: metrics.readiness,
        heartRate: metrics.heartRate,
        standupDelivered: true,
        standupDeliveredAt: new Date().toISOString()
      });

      // Build wellness context for Guide agent
      const wellnessContext = this.buildWellnessContext(metrics);

      // Create task for Guide agent
      const task = `You're conducting the morning wellness standup. Here's the wellness data from yesterday:

${wellnessContext}

Please provide:
1. A brief, encouraging summary of the user's recovery and readiness
2. One specific, actionable wellness tip based on the data
3. What to focus on today for optimal performance

Keep your response warm, supportive, and under 150 words.`;

      logger.info('[WellnessMeetings] Calling Guide agent for standup analysis');

      // Execute task with Guide agent
      const result = await orchestrator.executeTask({
        taskType: 'wellness',
        task,
        agentType: 'guide',
        stream: false
      });

      const response = result.success ? result.response : 'Unable to generate wellness summary at this time.';

      // Create session with Guide's initial guidance
      const sessionData = {
        type: 'standup',
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
          sleep: metrics.sleep?.data?.[0],
          activity: metrics.activity?.data?.[0],
          readiness: metrics.readiness?.data?.[0]
        }
      };

      const session = await wellnessDataStore.saveSession(today, sessionData);
      logger.info('[WellnessMeetings] Created standup session', { sessionId: session.id });

      // Emit Socket.IO event with sessionId
      if (this.io) {
        this.io.emit('wellness:standup', {
          date: today,
          sessionId: session.id,
          metrics: {
            sleep: metrics.sleep?.data?.[0],
            activity: metrics.activity?.data?.[0],
            readiness: metrics.readiness?.data?.[0]
          },
          guidance: response,
          timestamp: new Date().toISOString()
        });
        logger.info('[WellnessMeetings] Emitted wellness:standup event');
      }

      return {
        success: true,
        date: today,
        sessionId: session.id,
        metrics,
        guidance: response
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

      // Get morning standup session to include morning plan context
      let morningPlan = null;
      let standupSession = null;
      try {
        standupSession = await wellnessDataStore.getActiveSession(today, 'standup');
        if (!standupSession) {
          // Also check completed standup sessions from today
          const dailyMetrics = await wellnessDataStore.getDailyMetrics(today);
          if (dailyMetrics && dailyMetrics.sessions) {
            standupSession = dailyMetrics.sessions.find(s => s.type === 'standup');
          }
        }

        if (standupSession && standupSession.conversation) {
          // Extract morning plan from standup conversation
          const planMessage = standupSession.conversation.find(msg =>
            msg.role === 'user' && msg.content && msg.content.toLowerCase().includes('plan')
          );
          if (planMessage) {
            morningPlan = planMessage.content;
          }
        }
      } catch (error) {
        logger.warn('[WellnessMeetings] Could not retrieve morning standup session', { error: error.message });
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
      }

      // Add morning plan context if available
      if (morningPlan) {
        context += `## Morning Plan\n`;
        context += `This morning, the user shared: "${morningPlan}"\n\n`;
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
        morningPlan: morningPlan || null
      };

      const retroSession = await wellnessDataStore.saveSession(today, retroSessionData);
      logger.info('[WellnessMeetings] Created retro session', { sessionId: retroSession.id });

      // Emit Socket.IO event with sessionId and morningPlan
      if (this.io) {
        this.io.emit('wellness:retro', {
          date: today,
          sessionId: retroSession.id,
          metrics: {
            activity: activityData?.data?.[0]
          },
          guidance: response,
          morningPlan: morningPlan || null,
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
