import fs from 'fs';
import path from 'path';
import logger from '../config/logger.js';

/**
 * Wellness Data Store
 * Persists daily wellness metrics and stress alerts
 */
class WellnessDataStore {
  constructor() {
    this.dataDir = path.join(process.cwd(), 'data', 'wellness');
    this.ensureDataDirectory();
  }

  /**
   * Ensure wellness data directory exists
   */
  ensureDataDirectory() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
        logger.info('Created wellness data directory', { path: this.dataDir });
      }
    } catch (error) {
      logger.error('Error creating wellness data directory', { error: error.message });
      throw error;
    }
  }

  /**
   * Get file path for a specific date
   * @param {string} date - Date in YYYY-MM-DD format
   */
  getFilePath(date) {
    return path.join(this.dataDir, `daily-${date}.json`);
  }

  /**
   * Validate date format
   * @param {string} date - Date string
   */
  isValidDate(date) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return false;
    }
    const parsedDate = new Date(date);
    return parsedDate instanceof Date && !isNaN(parsedDate);
  }

  /**
   * Save daily wellness metrics
   * @param {string} date - Date in YYYY-MM-DD format
   * @param {Object} metrics - Wellness metrics
   */
  async saveDailyMetrics(date, metrics) {
    try {
      if (!this.isValidDate(date)) {
        throw new Error(`Invalid date format: ${date}. Expected YYYY-MM-DD`);
      }

      const filePath = this.getFilePath(date);

      // Load existing data if file exists
      let existingData = {};
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        existingData = JSON.parse(fileContent);
      }

      // Merge with existing data
      const updatedData = {
        ...existingData,
        date,
        lastUpdated: new Date().toISOString(),
        metrics: {
          ...existingData.metrics,
          ...metrics
        }
      };

      // Write to file
      fs.writeFileSync(filePath, JSON.stringify(updatedData, null, 2), 'utf8');
      logger.info('Saved daily wellness metrics', { date, metricsKeys: Object.keys(metrics) });

      return updatedData;
    } catch (error) {
      logger.error('Error saving daily wellness metrics', { date, error: error.message });
      throw error;
    }
  }

  /**
   * Retrieve daily wellness metrics
   * @param {string} date - Date in YYYY-MM-DD format
   */
  async getDailyMetrics(date) {
    try {
      if (!this.isValidDate(date)) {
        throw new Error(`Invalid date format: ${date}. Expected YYYY-MM-DD`);
      }

      const filePath = this.getFilePath(date);

      if (!fs.existsSync(filePath)) {
        logger.info('No wellness data found for date', { date });
        return null;
      }

      const fileContent = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(fileContent);
      logger.info('Retrieved daily wellness metrics', { date });

      return data;
    } catch (error) {
      logger.error('Error retrieving daily wellness metrics', { date, error: error.message });
      throw error;
    }
  }

  /**
   * Get metrics for a date range
   * @param {string} startDate - Start date in YYYY-MM-DD format
   * @param {string} endDate - End date in YYYY-MM-DD format
   */
  async getMetricsRange(startDate, endDate) {
    try {
      if (!this.isValidDate(startDate) || !this.isValidDate(endDate)) {
        throw new Error('Invalid date format. Expected YYYY-MM-DD');
      }

      const start = new Date(startDate);
      const end = new Date(endDate);
      const results = [];

      // Iterate through date range
      for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
        const dateStr = date.toISOString().split('T')[0];
        const metrics = await this.getDailyMetrics(dateStr);
        if (metrics) {
          results.push(metrics);
        }
      }

      logger.info('Retrieved wellness metrics range', { startDate, endDate, count: results.length });
      return results;
    } catch (error) {
      logger.error('Error retrieving wellness metrics range', { startDate, endDate, error: error.message });
      throw error;
    }
  }

  /**
   * Record a stress alert
   * @param {string} date - Date in YYYY-MM-DD format
   * @param {Object} alert - Stress alert details
   */
  async recordStressAlert(date, alert) {
    try {
      if (!this.isValidDate(date)) {
        throw new Error(`Invalid date format: ${date}. Expected YYYY-MM-DD`);
      }

      const filePath = this.getFilePath(date);

      // Load existing data
      let existingData = {};
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        existingData = JSON.parse(fileContent);
      }

      // Initialize alerts array if it doesn't exist
      if (!existingData.stressAlerts) {
        existingData.stressAlerts = [];
      }

      // Add new alert with timestamp
      const newAlert = {
        ...alert,
        timestamp: new Date().toISOString(),
        id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };

      existingData.stressAlerts.push(newAlert);
      existingData.lastUpdated = new Date().toISOString();
      existingData.date = date;

      // Write to file
      fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2), 'utf8');
      logger.info('Recorded stress alert', { date, alertId: newAlert.id });

      return newAlert;
    } catch (error) {
      logger.error('Error recording stress alert', { date, error: error.message });
      throw error;
    }
  }

  /**
   * Get all stress alerts for a date
   * @param {string} date - Date in YYYY-MM-DD format
   */
  async getStressAlerts(date) {
    try {
      const data = await this.getDailyMetrics(date);
      return data?.stressAlerts || [];
    } catch (error) {
      logger.error('Error retrieving stress alerts', { date, error: error.message });
      throw error;
    }
  }

  /**
   * Get stress alerts for a date range
   * @param {string} startDate - Start date in YYYY-MM-DD format
   * @param {string} endDate - End date in YYYY-MM-DD format
   */
  async getStressAlertsRange(startDate, endDate) {
    try {
      const metricsRange = await this.getMetricsRange(startDate, endDate);
      const alerts = metricsRange
        .filter(data => data.stressAlerts && data.stressAlerts.length > 0)
        .flatMap(data => data.stressAlerts.map(alert => ({
          ...alert,
          date: data.date
        })));

      logger.info('Retrieved stress alerts range', { startDate, endDate, count: alerts.length });
      return alerts;
    } catch (error) {
      logger.error('Error retrieving stress alerts range', { startDate, endDate, error: error.message });
      throw error;
    }
  }

  /**
   * Update metrics for a specific date
   * @param {string} date - Date in YYYY-MM-DD format
   * @param {Object} updates - Partial metrics to update
   */
  async updateMetrics(date, updates) {
    try {
      if (!this.isValidDate(date)) {
        throw new Error(`Invalid date format: ${date}. Expected YYYY-MM-DD`);
      }

      const existingData = await this.getDailyMetrics(date);

      if (!existingData) {
        // If no existing data, create new entry
        return await this.saveDailyMetrics(date, updates);
      }

      // Merge updates with existing metrics
      const updatedMetrics = {
        ...existingData.metrics,
        ...updates
      };

      return await this.saveDailyMetrics(date, updatedMetrics);
    } catch (error) {
      logger.error('Error updating wellness metrics', { date, error: error.message });
      throw error;
    }
  }

  /**
   * Delete metrics for a specific date
   * @param {string} date - Date in YYYY-MM-DD format
   */
  async deleteMetrics(date) {
    try {
      if (!this.isValidDate(date)) {
        throw new Error(`Invalid date format: ${date}. Expected YYYY-MM-DD`);
      }

      const filePath = this.getFilePath(date);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logger.info('Deleted wellness metrics', { date });
        return true;
      }

      logger.info('No metrics found to delete', { date });
      return false;
    } catch (error) {
      logger.error('Error deleting wellness metrics', { date, error: error.message });
      throw error;
    }
  }

  /**
   * Get all available dates with wellness data
   */
  async getAllDates() {
    try {
      const files = fs.readdirSync(this.dataDir);
      const dates = files
        .filter(file => file.startsWith('daily-') && file.endsWith('.json'))
        .map(file => file.replace('daily-', '').replace('.json', ''))
        .sort();

      logger.info('Retrieved all wellness dates', { count: dates.length });
      return dates;
    } catch (error) {
      logger.error('Error retrieving all wellness dates', { error: error.message });
      throw error;
    }
  }

  /**
   * Get summary statistics for a date range
   * @param {string} startDate - Start date in YYYY-MM-DD format
   * @param {string} endDate - End date in YYYY-MM-DD format
   */
  async getSummaryStats(startDate, endDate) {
    try {
      const metricsRange = await this.getMetricsRange(startDate, endDate);

      if (metricsRange.length === 0) {
        return null;
      }

      // Calculate averages and totals
      const summary = {
        dateRange: { startDate, endDate },
        daysWithData: metricsRange.length,
        averages: {},
        totals: {},
        stressAlertCount: 0
      };

      // Accumulate metrics
      const metricSums = {};
      const metricCounts = {};

      metricsRange.forEach(day => {
        // Count stress alerts
        if (day.stressAlerts) {
          summary.stressAlertCount += day.stressAlerts.length;
        }

        // Accumulate numeric metrics
        if (day.metrics) {
          Object.entries(day.metrics).forEach(([key, value]) => {
            if (typeof value === 'number') {
              metricSums[key] = (metricSums[key] || 0) + value;
              metricCounts[key] = (metricCounts[key] || 0) + 1;
            }
          });
        }
      });

      // Calculate averages
      Object.keys(metricSums).forEach(key => {
        summary.averages[key] = metricSums[key] / metricCounts[key];
        summary.totals[key] = metricSums[key];
      });

      logger.info('Generated summary statistics', { startDate, endDate, daysWithData: metricsRange.length });
      return summary;
    } catch (error) {
      logger.error('Error generating summary statistics', { startDate, endDate, error: error.message });
      throw error;
    }
  }

  /**
   * Save a complete session
   * @param {string} date - Date in YYYY-MM-DD format
   * @param {Object} sessionData - Session data with id, type, initialGuidance, conversation, etc.
   */
  async saveSession(date, sessionData) {
    try {
      if (!this.isValidDate(date)) {
        throw new Error(`Invalid date format: ${date}. Expected YYYY-MM-DD`);
      }

      if (!sessionData.id) {
        sessionData.id = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }

      const filePath = this.getFilePath(date);

      // Load existing data
      let existingData = {};
      if (fs.existsSync(filePath)) {
        try {
          const fileContent = fs.readFileSync(filePath, 'utf8');
          existingData = JSON.parse(fileContent);
        } catch (parseError) {
          logger.warn('Error parsing existing wellness data, starting fresh', { date, error: parseError.message });
          existingData = {};
        }
      }

      // Initialize sessions array if it doesn't exist (backward compatibility)
      if (!existingData.sessions) {
        existingData.sessions = [];
      }

      // Add or update session
      const sessionIndex = existingData.sessions.findIndex(s => s.id === sessionData.id);
      if (sessionIndex >= 0) {
        existingData.sessions[sessionIndex] = {
          ...existingData.sessions[sessionIndex],
          ...sessionData,
          lastUpdated: new Date().toISOString()
        };
      } else {
        existingData.sessions.push({
          ...sessionData,
          startedAt: sessionData.startedAt || new Date().toISOString(),
          status: sessionData.status || 'active',
          conversation: sessionData.conversation || [],
          lastUpdated: new Date().toISOString()
        });
      }

      existingData.date = date;
      existingData.lastUpdated = new Date().toISOString();

      // Write to file
      fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2), 'utf8');
      logger.info('Saved wellness session', { date, sessionId: sessionData.id, type: sessionData.type });

      return sessionData;
    } catch (error) {
      logger.error('Error saving wellness session', { date, error: error.message });
      throw error;
    }
  }

  /**
   * Get active session if not completed
   * @param {string} date - Date in YYYY-MM-DD format
   * @param {string} type - Session type (standup/retro)
   */
  async getActiveSession(date, type) {
    try {
      if (!this.isValidDate(date)) {
        throw new Error(`Invalid date format: ${date}. Expected YYYY-MM-DD`);
      }

      const data = await this.getDailyMetrics(date);

      if (!data || !data.sessions) {
        return null;
      }

      // Find active session of the specified type
      const activeSession = data.sessions.find(
        session => session.type === type && session.status === 'active'
      );

      if (activeSession) {
        logger.info('Retrieved active wellness session', { date, type, sessionId: activeSession.id });
      }

      return activeSession || null;
    } catch (error) {
      logger.error('Error retrieving active wellness session', { date, type, error: error.message });
      throw error;
    }
  }

  /**
   * Add message to session conversation
   * @param {string} date - Date in YYYY-MM-DD format
   * @param {string} sessionId - Session ID
   * @param {Object} message - Message object with role, content, timestamp
   */
  async appendToSession(date, sessionId, message) {
    try {
      if (!this.isValidDate(date)) {
        throw new Error(`Invalid date format: ${date}. Expected YYYY-MM-DD`);
      }

      const filePath = this.getFilePath(date);

      if (!fs.existsSync(filePath)) {
        throw new Error(`No wellness data found for date: ${date}`);
      }

      let existingData;
      try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        existingData = JSON.parse(fileContent);
      } catch (parseError) {
        throw new Error(`Error parsing wellness data for date ${date}: ${parseError.message}`);
      }

      if (!existingData.sessions) {
        throw new Error(`No sessions found for date: ${date}`);
      }

      const sessionIndex = existingData.sessions.findIndex(s => s.id === sessionId);
      if (sessionIndex < 0) {
        throw new Error(`Session not found: ${sessionId}`);
      }

      // Initialize conversation array if it doesn't exist
      if (!existingData.sessions[sessionIndex].conversation) {
        existingData.sessions[sessionIndex].conversation = [];
      }

      // Add message with timestamp
      const messageWithTimestamp = {
        ...message,
        timestamp: message.timestamp || new Date().toISOString()
      };

      existingData.sessions[sessionIndex].conversation.push(messageWithTimestamp);
      existingData.sessions[sessionIndex].lastUpdated = new Date().toISOString();
      existingData.lastUpdated = new Date().toISOString();

      // Write to file
      fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2), 'utf8');
      logger.info('Appended message to wellness session', {
        date,
        sessionId,
        role: message.role,
        conversationLength: existingData.sessions[sessionIndex].conversation.length
      });

      return existingData.sessions[sessionIndex];
    } catch (error) {
      logger.error('Error appending to wellness session', { date, sessionId, error: error.message });
      throw error;
    }
  }

  /**
   * Mark session as completed
   * @param {string} date - Date in YYYY-MM-DD format
   * @param {string} sessionId - Session ID
   * @param {Object} summary - Summary object with insights, recommendations, etc.
   */
  async completeSession(date, sessionId, summary) {
    try {
      if (!this.isValidDate(date)) {
        throw new Error(`Invalid date format: ${date}. Expected YYYY-MM-DD`);
      }

      const filePath = this.getFilePath(date);

      if (!fs.existsSync(filePath)) {
        throw new Error(`No wellness data found for date: ${date}`);
      }

      let existingData;
      try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        existingData = JSON.parse(fileContent);
      } catch (parseError) {
        throw new Error(`Error parsing wellness data for date ${date}: ${parseError.message}`);
      }

      if (!existingData.sessions) {
        throw new Error(`No sessions found for date: ${date}`);
      }

      const sessionIndex = existingData.sessions.findIndex(s => s.id === sessionId);
      if (sessionIndex < 0) {
        throw new Error(`Session not found: ${sessionId}`);
      }

      // Mark session as completed
      existingData.sessions[sessionIndex].status = 'completed';
      existingData.sessions[sessionIndex].completedAt = new Date().toISOString();
      existingData.sessions[sessionIndex].summary = summary;
      existingData.sessions[sessionIndex].lastUpdated = new Date().toISOString();
      existingData.lastUpdated = new Date().toISOString();

      // Write to file
      fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2), 'utf8');
      logger.info('Completed wellness session', {
        date,
        sessionId,
        type: existingData.sessions[sessionIndex].type
      });

      return existingData.sessions[sessionIndex];
    } catch (error) {
      logger.error('Error completing wellness session', { date, sessionId, error: error.message });
      throw error;
    }
  }

  /**
   * Get sessions for a date range
   * @param {string} startDate - Start date in YYYY-MM-DD format
   * @param {string} endDate - End date in YYYY-MM-DD format
   */
  async getSessionsRange(startDate, endDate) {
    try {
      if (!this.isValidDate(startDate) || !this.isValidDate(endDate)) {
        throw new Error('Invalid date format. Expected YYYY-MM-DD');
      }

      const metricsRange = await this.getMetricsRange(startDate, endDate);

      const sessions = metricsRange
        .filter(data => data.sessions && data.sessions.length > 0)
        .flatMap(data => data.sessions.map(session => ({
          ...session,
          date: data.date
        })));

      logger.info('Retrieved wellness sessions range', {
        startDate,
        endDate,
        count: sessions.length
      });

      return sessions;
    } catch (error) {
      logger.error('Error retrieving wellness sessions range', {
        startDate,
        endDate,
        error: error.message
      });
      throw error;
    }
  }
}

// Singleton instance
const wellnessDataStore = new WellnessDataStore();
export default wellnessDataStore;
