import cron from 'node-cron';
import logger from '../config/logger.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * NotificationScheduler manages custom notifications scheduled by Guide or user
 * Supports one-time and recurring notifications
 */
class NotificationScheduler {
  constructor(io = null) {
    this.io = io;
    this.scheduledJobs = new Map(); // Map of notification ID -> cron job
    this.notificationsPath = path.join(__dirname, '../../data/wellness/notifications.json');
  }

  /**
   * Set Socket.IO instance
   */
  setIO(io) {
    this.io = io;
  }

  /**
   * Load scheduled notifications from file
   */
  async loadNotifications() {
    try {
      const data = await fs.readFile(this.notificationsPath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      // File doesn't exist yet, return empty array
      return [];
    }
  }

  /**
   * Save notifications to file
   */
  async saveNotifications(notifications) {
    await fs.writeFile(this.notificationsPath, JSON.stringify(notifications, null, 2));
  }

  /**
   * Schedule a notification
   * @param {Object} options - Notification options
   * @param {string} options.message - Notification message
   * @param {string} options.type - 'one-time' or 'recurring'
   * @param {Date} options.time - Time for one-time notification
   * @param {string} options.cronExpression - Cron expression for recurring
   * @param {Date} options.endTime - Optional end time for recurring notifications
   */
  async scheduleNotification(options) {
    const {
      message,
      type = 'one-time',
      time,
      cronExpression,
      endTime
    } = options;

    const notificationId = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const notification = {
      id: notificationId,
      message,
      type,
      time: time ? time.toISOString() : null,
      cronExpression,
      endTime: endTime ? endTime.toISOString() : null,
      createdAt: new Date().toISOString(),
      status: 'active'
    };

    // Save to file
    const notifications = await this.loadNotifications();
    notifications.push(notification);
    await this.saveNotifications(notifications);

    // Schedule the job
    if (type === 'one-time') {
      this.scheduleOneTime(notification);
    } else if (type === 'recurring') {
      this.scheduleRecurring(notification);
    }

    logger.info('[NotificationScheduler] Scheduled notification', {
      id: notificationId,
      type,
      message: message.substring(0, 50)
    });

    return notification;
  }

  /**
   * Schedule a one-time notification
   */
  scheduleOneTime(notification) {
    const { id, message, time } = notification;
    const targetTime = new Date(time);
    const now = new Date();
    const delay = targetTime - now;

    if (delay <= 0) {
      logger.warn('[NotificationScheduler] Notification time is in the past', { id });
      return;
    }

    const timeoutId = setTimeout(async () => {
      await this.emitNotification(id, message);
      await this.markAsCompleted(id);
      this.scheduledJobs.delete(id);
    }, delay);

    this.scheduledJobs.set(id, { type: 'timeout', job: timeoutId });
  }

  /**
   * Schedule a recurring notification
   */
  scheduleRecurring(notification) {
    const { id, message, cronExpression, endTime } = notification;

    const job = cron.schedule(cronExpression, async () => {
      // Check if we've passed the end time
      if (endTime) {
        const now = new Date();
        const end = new Date(endTime);
        if (now >= end) {
          logger.info('[NotificationScheduler] Recurring notification reached end time', { id });
          await this.cancelNotification(id);
          return;
        }
      }

      await this.emitNotification(id, message);
    });

    job.start();
    this.scheduledJobs.set(id, { type: 'cron', job });

    logger.info('[NotificationScheduler] Started recurring notification', {
      id,
      cronExpression
    });
  }

  /**
   * Emit a notification via Socket.IO
   */
  async emitNotification(id, message) {
    if (this.io) {
      this.io.emit('wellness:notification', {
        id,
        type: 'scheduled',
        message,
        timestamp: new Date().toISOString()
      });

      logger.info('[NotificationScheduler] Emitted notification', {
        id,
        message: message.substring(0, 50)
      });
    }
  }

  /**
   * Mark notification as completed
   */
  async markAsCompleted(id) {
    const notifications = await this.loadNotifications();
    const notification = notifications.find(n => n.id === id);
    if (notification) {
      notification.status = 'completed';
      notification.completedAt = new Date().toISOString();
      await this.saveNotifications(notifications);
    }
  }

  /**
   * Cancel a scheduled notification
   */
  async cancelNotification(id) {
    // Stop the job
    const jobEntry = this.scheduledJobs.get(id);
    if (jobEntry) {
      if (jobEntry.type === 'timeout') {
        clearTimeout(jobEntry.job);
      } else if (jobEntry.type === 'cron') {
        jobEntry.job.stop();
      }
      this.scheduledJobs.delete(id);
    }

    // Update status in file
    const notifications = await this.loadNotifications();
    const notification = notifications.find(n => n.id === id);
    if (notification) {
      notification.status = 'cancelled';
      notification.cancelledAt = new Date().toISOString();
      await this.saveNotifications(notifications);
    }

    logger.info('[NotificationScheduler] Cancelled notification', { id });
  }

  /**
   * Get all active notifications
   */
  async getActiveNotifications() {
    const notifications = await this.loadNotifications();
    return notifications.filter(n => n.status === 'active');
  }

  /**
   * Restore scheduled notifications on startup
   */
  async restoreScheduledJobs() {
    const notifications = await this.loadNotifications();
    const active = notifications.filter(n => n.status === 'active');

    for (const notification of active) {
      try {
        if (notification.type === 'one-time') {
          const targetTime = new Date(notification.time);
          const now = new Date();
          if (targetTime > now) {
            this.scheduleOneTime(notification);
          } else {
            // Mark as missed
            notification.status = 'missed';
            await this.saveNotifications(notifications);
          }
        } else if (notification.type === 'recurring') {
          this.scheduleRecurring(notification);
        }
      } catch (error) {
        logger.error('[NotificationScheduler] Error restoring notification', {
          id: notification.id,
          error: error.message
        });
      }
    }

    logger.info('[NotificationScheduler] Restored scheduled jobs', {
      count: active.length
    });
  }

  /**
   * Parse natural language time expression to cron
   * Examples:
   *   - "every hour" -> "0 * * * *"
   *   - "every 30 minutes" -> "*/30 * * * *"
   *   - "every day at 3pm" -> "0 15 * * *"
   */
  parseToCron(expression) {
    expression = expression.toLowerCase().trim();

    // Every X minutes
    const minutesMatch = expression.match(/every\s+(\d+)\s+minutes?/);
    if (minutesMatch) {
      const interval = parseInt(minutesMatch[1]);
      return `*/${interval} * * * *`;
    }

    // Every hour
    if (expression === 'every hour' || expression === 'hourly') {
      return '0 * * * *';
    }

    // Every X hours
    const hoursMatch = expression.match(/every\s+(\d+)\s+hours?/);
    if (hoursMatch) {
      const interval = parseInt(hoursMatch[1]);
      return `0 */${interval} * * *`;
    }

    // Default to hourly if can't parse
    logger.warn('[NotificationScheduler] Could not parse expression, defaulting to hourly', { expression });
    return '0 * * * *';
  }

  /**
   * Parse time range (e.g., "from 9am to 5pm", "until noon")
   */
  parseTimeRange(fromStr, untilStr) {
    const parseTime = (str) => {
      str = str.toLowerCase().replace(/\s/g, '');

      // Handle "noon"
      if (str === 'noon') return 12;

      // Handle "midnight"
      if (str === 'midnight') return 0;

      // Handle "3pm", "3:30pm", etc
      const match = str.match(/(\d+)(?::(\d+))?(am|pm)?/);
      if (match) {
        let hour = parseInt(match[1]);
        const minute = match[2] ? parseInt(match[2]) : 0;
        const meridiem = match[3];

        if (meridiem === 'pm' && hour !== 12) hour += 12;
        if (meridiem === 'am' && hour === 12) hour = 0;

        return { hour, minute };
      }

      return null;
    };

    const from = fromStr ? parseTime(fromStr) : null;
    const until = untilStr ? parseTime(untilStr) : null;

    return { from, until };
  }
}

export default new NotificationScheduler();
