import cron from 'node-cron';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * WellnessScheduler manages automated wellness tasks using cron jobs
 * Handles daily standups, retros, and hourly stress checks
 */
class WellnessScheduler {
  constructor() {
    this.jobs = {
      standup: null,
      retro: null,
      stressCheck: null,
      ouraSync: null
    };
    this.settings = null;
    this.callbacks = {
      onStandup: null,
      onRetro: null,
      onStressCheck: null,
      onOuraSync: null
    };
  }

  /**
   * Load wellness settings from data/wellness/settings.json
   */
  async loadSettings() {
    try {
      const settingsPath = path.join(__dirname, '../../data/wellness/settings.json');
      const data = await fs.readFile(settingsPath, 'utf-8');
      this.settings = JSON.parse(data);
      return this.settings;
    } catch (error) {
      console.error('Failed to load wellness settings:', error);
      // Return default settings if file doesn't exist
      this.settings = {
        standupTime: '08:30',
        retroTime: '18:00',
        stressCheckStartHour: 9,
        stressCheckEndHour: 18,
        stressThreshold: 7,
        timezone: 'America/New_York',
        enabled: true
      };
      return this.settings;
    }
  }

  /**
   * Save current settings to disk
   */
  async saveSettings(newSettings) {
    try {
      const settingsPath = path.join(__dirname, '../../data/wellness/settings.json');
      this.settings = { ...this.settings, ...newSettings };
      await fs.writeFile(settingsPath, JSON.stringify(this.settings, null, 2));
      return this.settings;
    } catch (error) {
      console.error('Failed to save wellness settings:', error);
      throw error;
    }
  }

  /**
   * Register callback functions for scheduled events
   */
  registerCallbacks({ onStandup, onRetro, onStressCheck, onOuraSync }) {
    if (onStandup) this.callbacks.onStandup = onStandup;
    if (onRetro) this.callbacks.onRetro = onRetro;
    if (onStressCheck) this.callbacks.onStressCheck = onStressCheck;
    if (onOuraSync) this.callbacks.onOuraSync = onOuraSync;
  }

  /**
   * Convert time string (HH:MM) to cron expression
   * @param {string} timeStr - Time in format "HH:MM"
   * @returns {string} Cron expression
   */
  timeToCron(timeStr) {
    const [hours, minutes] = timeStr.split(':');
    return `${minutes} ${hours} * * *`;
  }

  /**
   * Create cron expression for hourly checks between start and end hours
   * @param {number} startHour - Start hour (0-23)
   * @param {number} endHour - End hour (0-23)
   * @returns {string} Cron expression
   */
  hourlyRangeCron(startHour, endHour) {
    // Run at the top of every hour between startHour and endHour
    if (startHour === endHour) {
      return `0 ${startHour} * * *`;
    }
    return `0 ${startHour}-${endHour} * * *`;
  }

  /**
   * Start the daily standup cron job
   */
  startStandupJob() {
    if (!this.settings) {
      console.error('Settings not loaded. Call loadSettings() first.');
      return false;
    }

    const cronExpression = this.timeToCron(this.settings.standupTime);

    this.jobs.standup = cron.schedule(
      cronExpression,
      async () => {
        console.log(`[WellnessScheduler] Daily standup triggered at ${new Date().toISOString()}`);
        if (this.callbacks.onStandup) {
          try {
            await this.callbacks.onStandup();
          } catch (error) {
            console.error('Error in standup callback:', error);
          }
        }
      },
      {
        scheduled: false,
        timezone: this.settings.timezone
      }
    );

    console.log(`[WellnessScheduler] Standup scheduled for ${this.settings.standupTime} (${this.settings.timezone})`);
    return true;
  }

  /**
   * Start the daily retro cron job
   */
  startRetroJob() {
    if (!this.settings) {
      console.error('Settings not loaded. Call loadSettings() first.');
      return false;
    }

    const cronExpression = this.timeToCron(this.settings.retroTime);

    this.jobs.retro = cron.schedule(
      cronExpression,
      async () => {
        console.log(`[WellnessScheduler] Daily retro triggered at ${new Date().toISOString()}`);
        if (this.callbacks.onRetro) {
          try {
            await this.callbacks.onRetro();
          } catch (error) {
            console.error('Error in retro callback:', error);
          }
        }
      },
      {
        scheduled: false,
        timezone: this.settings.timezone
      }
    );

    console.log(`[WellnessScheduler] Retro scheduled for ${this.settings.retroTime} (${this.settings.timezone})`);
    return true;
  }

  /**
   * Start the hourly stress check cron job
   */
  startStressCheckJob() {
    if (!this.settings) {
      console.error('Settings not loaded. Call loadSettings() first.');
      return false;
    }

    const cronExpression = this.hourlyRangeCron(
      this.settings.stressCheckStartHour,
      this.settings.stressCheckEndHour
    );

    this.jobs.stressCheck = cron.schedule(
      cronExpression,
      async () => {
        console.log(`[WellnessScheduler] Stress check triggered at ${new Date().toISOString()}`);
        if (this.callbacks.onStressCheck) {
          try {
            await this.callbacks.onStressCheck(this.settings.stressThreshold);
          } catch (error) {
            console.error('Error in stress check callback:', error);
          }
        }
      },
      {
        scheduled: false,
        timezone: this.settings.timezone
      }
    );

    console.log(`[WellnessScheduler] Stress checks scheduled hourly from ${this.settings.stressCheckStartHour}:00 to ${this.settings.stressCheckEndHour}:00 (${this.settings.timezone})`);
    return true;
  }

  /**
   * Start the Oura data sync cron job (runs every hour)
   */
  startOuraSyncJob() {
    if (!this.settings) {
      console.error('Settings not loaded. Call loadSettings() first.');
      return false;
    }

    // Run every hour at the top of the hour
    const cronExpression = '0 * * * *';

    this.jobs.ouraSync = cron.schedule(
      cronExpression,
      async () => {
        console.log(`[WellnessScheduler] Oura data sync triggered at ${new Date().toISOString()}`);
        if (this.callbacks.onOuraSync) {
          try {
            await this.callbacks.onOuraSync();
          } catch (error) {
            console.error('Error in Oura sync callback:', error);
          }
        }
      },
      {
        scheduled: false,
        timezone: this.settings.timezone
      }
    );

    console.log(`[WellnessScheduler] Oura data sync scheduled hourly (${this.settings.timezone})`);
    return true;
  }

  /**
   * Start all scheduled wellness jobs
   */
  async start() {
    await this.loadSettings();

    if (!this.settings.enabled) {
      console.log('[WellnessScheduler] Wellness scheduling is disabled in settings');
      return false;
    }

    // Create all jobs
    this.startStandupJob();
    this.startRetroJob();
    this.startStressCheckJob();
    this.startOuraSyncJob();

    // Start all jobs
    if (this.jobs.standup) this.jobs.standup.start();
    if (this.jobs.retro) this.jobs.retro.start();
    if (this.jobs.stressCheck) this.jobs.stressCheck.start();
    if (this.jobs.ouraSync) this.jobs.ouraSync.start();

    console.log('[WellnessScheduler] All wellness jobs started successfully');
    return true;
  }

  /**
   * Stop all scheduled wellness jobs
   */
  stop() {
    let stoppedCount = 0;

    if (this.jobs.standup) {
      this.jobs.standup.stop();
      stoppedCount++;
    }
    if (this.jobs.retro) {
      this.jobs.retro.stop();
      stoppedCount++;
    }
    if (this.jobs.stressCheck) {
      this.jobs.stressCheck.stop();
      stoppedCount++;
    }
    if (this.jobs.ouraSync) {
      this.jobs.ouraSync.stop();
      stoppedCount++;
    }

    console.log(`[WellnessScheduler] Stopped ${stoppedCount} wellness jobs`);
    return stoppedCount;
  }

  /**
   * Restart all jobs (useful after settings change)
   */
  async restart() {
    this.stop();
    await this.start();
    console.log('[WellnessScheduler] Jobs restarted with new settings');
  }

  /**
   * Update settings and optionally restart jobs
   */
  async updateSettings(newSettings, restartJobs = true) {
    await this.saveSettings(newSettings);
    if (restartJobs) {
      await this.restart();
    }
    return this.settings;
  }

  /**
   * Get current scheduler status
   */
  getStatus() {
    return {
      settings: this.settings,
      jobs: {
        standup: {
          active: this.jobs.standup ? true : false,
          schedule: this.settings ? this.timeToCron(this.settings.standupTime) : null
        },
        retro: {
          active: this.jobs.retro ? true : false,
          schedule: this.settings ? this.timeToCron(this.settings.retroTime) : null
        },
        stressCheck: {
          active: this.jobs.stressCheck ? true : false,
          schedule: this.settings ? this.hourlyRangeCron(
            this.settings.stressCheckStartHour,
            this.settings.stressCheckEndHour
          ) : null
        },
        ouraSync: {
          active: this.jobs.ouraSync ? true : false,
          schedule: '0 * * * *' // Every hour at the top of the hour
        }
      }
    };
  }

  /**
   * Trigger a specific job manually (for testing)
   */
  async triggerManual(jobType) {
    switch (jobType) {
      case 'standup':
        if (this.callbacks.onStandup) {
          await this.callbacks.onStandup();
          return true;
        }
        break;
      case 'retro':
        if (this.callbacks.onRetro) {
          await this.callbacks.onRetro();
          return true;
        }
        break;
      case 'stressCheck':
        if (this.callbacks.onStressCheck) {
          await this.callbacks.onStressCheck(this.settings?.stressThreshold || 7);
          return true;
        }
        break;
      case 'ouraSync':
        if (this.callbacks.onOuraSync) {
          await this.callbacks.onOuraSync();
          return true;
        }
        break;
      default:
        throw new Error(`Unknown job type: ${jobType}`);
    }
    return false;
  }
}

// Export singleton instance
export default new WellnessScheduler();
