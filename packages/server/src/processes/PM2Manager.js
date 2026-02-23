import { exec } from 'child_process';
import { promisify } from 'util';
import logger from '../config/logger.js';

const execAsync = promisify(exec);

/**
 * Manages PM2 processes
 */
class PM2Manager {
  constructor() {
    this.pm2Available = false;
    this.checkPM2Available();
  }

  /**
   * Check if PM2 is available
   */
  async checkPM2Available() {
    try {
      await execAsync('pm2 -v');
      this.pm2Available = true;
      logger.info('PM2 is available');
    } catch (error) {
      this.pm2Available = false;
      logger.warn('PM2 is not available', { error: error.message });
    }
  }

  /**
   * Get list of all PM2 processes
   * @returns {Promise<Array>} List of processes
   */
  async listProcesses() {
    if (!this.pm2Available) {
      return [];
    }

    try {
      const { stdout } = await execAsync('pm2 jlist');
      const processes = JSON.parse(stdout);

      return processes.map(proc => ({
        id: proc.pm_id,
        name: proc.name,
        status: proc.pm2_env.status,
        pid: proc.pid,
        cpu: proc.monit.cpu,
        memory: proc.monit.memory,
        uptime: proc.pm2_env.pm_uptime,
        restarts: proc.pm2_env.restart_time,
        script: proc.pm2_env.pm_exec_path,
        cwd: proc.pm2_env.pm_cwd,
        port: proc.pm2_env.PORT || null,
        instances: proc.pm2_env.instances || 1
      }));
    } catch (error) {
      logger.error('Error listing PM2 processes', error);
      return [];
    }
  }

  /**
   * Get a specific process by name or ID
   * @param {string|number} identifier - Process name or ID
   * @returns {Promise<Object|null>} Process info
   */
  async getProcess(identifier) {
    const processes = await this.listProcesses();
    return processes.find(p =>
      p.name === identifier || p.id === parseInt(identifier)
    ) || null;
  }

  /**
   * Start a process
   * @param {string} nameOrId - Process name or ID
   * @returns {Promise<Object>} Result
   */
  async startProcess(nameOrId) {
    if (!this.pm2Available) {
      throw new Error('PM2 is not available');
    }

    try {
      await execAsync(`pm2 start ${nameOrId}`);
      logger.info('Process started', { process: nameOrId });

      return {
        success: true,
        message: `Process ${nameOrId} started successfully`
      };
    } catch (error) {
      logger.error('Error starting process', { process: nameOrId, error: error.message });
      throw new Error(`Failed to start process: ${error.message}`);
    }
  }

  /**
   * Stop a process
   * @param {string} nameOrId - Process name or ID
   * @returns {Promise<Object>} Result
   */
  async stopProcess(nameOrId) {
    if (!this.pm2Available) {
      throw new Error('PM2 is not available');
    }

    try {
      await execAsync(`pm2 stop ${nameOrId}`);
      logger.info('Process stopped', { process: nameOrId });

      return {
        success: true,
        message: `Process ${nameOrId} stopped successfully`
      };
    } catch (error) {
      logger.error('Error stopping process', { process: nameOrId, error: error.message });
      throw new Error(`Failed to stop process: ${error.message}`);
    }
  }

  /**
   * Restart a process
   * @param {string} nameOrId - Process name or ID
   * @returns {Promise<Object>} Result
   */
  async restartProcess(nameOrId) {
    if (!this.pm2Available) {
      throw new Error('PM2 is not available');
    }

    try {
      await execAsync(`pm2 restart ${nameOrId}`);
      logger.info('Process restarted', { process: nameOrId });

      return {
        success: true,
        message: `Process ${nameOrId} restarted successfully`
      };
    } catch (error) {
      logger.error('Error restarting process', { process: nameOrId, error: error.message });
      throw new Error(`Failed to restart process: ${error.message}`);
    }
  }

  /**
   * Delete a process
   * @param {string} nameOrId - Process name or ID
   * @returns {Promise<Object>} Result
   */
  async deleteProcess(nameOrId) {
    if (!this.pm2Available) {
      throw new Error('PM2 is not available');
    }

    try {
      await execAsync(`pm2 delete ${nameOrId}`);
      logger.info('Process deleted', { process: nameOrId });

      return {
        success: true,
        message: `Process ${nameOrId} deleted successfully`
      };
    } catch (error) {
      logger.error('Error deleting process', { process: nameOrId, error: error.message });
      throw new Error(`Failed to delete process: ${error.message}`);
    }
  }

  /**
   * Get logs for a process
   * @param {string} nameOrId - Process name or ID
   * @param {number} lines - Number of lines to retrieve
   * @returns {Promise<Object>} Logs
   */
  async getLogs(nameOrId, lines = 100) {
    if (!this.pm2Available) {
      throw new Error('PM2 is not available');
    }

    try {
      const { stdout } = await execAsync(`pm2 logs ${nameOrId} --nostream --lines ${lines}`);

      return {
        success: true,
        logs: stdout
      };
    } catch (error) {
      logger.error('Error getting logs', { process: nameOrId, error: error.message });
      throw new Error(`Failed to get logs: ${error.message}`);
    }
  }

  /**
   * Check if PM2 is available
   * @returns {boolean}
   */
  isAvailable() {
    return this.pm2Available;
  }

  /**
   * Get system resource usage
   * @returns {Promise<Object>} Resource usage
   */
  async getSystemStats() {
    const processes = await this.listProcesses();

    const totalCpu = processes.reduce((sum, p) => sum + (p.cpu || 0), 0);
    const totalMemory = processes.reduce((sum, p) => sum + (p.memory || 0), 0);

    return {
      processCount: processes.length,
      runningCount: processes.filter(p => p.status === 'online').length,
      stoppedCount: processes.filter(p => p.status === 'stopped').length,
      totalCpu: Math.round(totalCpu * 100) / 100,
      totalMemory: Math.round(totalMemory / 1024 / 1024), // Convert to MB
      processes: processes.map(p => ({
        name: p.name,
        status: p.status,
        cpu: p.cpu,
        memory: Math.round(p.memory / 1024 / 1024) // MB
      }))
    };
  }
}

// Export singleton instance
const pm2Manager = new PM2Manager();
export default pm2Manager;
