import { exec } from 'child_process';
import { promisify } from 'util';
import logger from '../config/logger.js';

const execAsync = promisify(exec);

/**
 * Utility for checking if ports are in use
 */
class PortChecker {
  /**
   * Check if a port is in use
   * @param {number} port - Port number to check
   * @returns {Promise<Object>} Port status and process info
   */
  async checkPort(port) {
    try {
      const { stdout } = await execAsync(`lsof -i :${port} -P -n -sTCP:LISTEN`);

      if (!stdout) {
        return {
          inUse: false,
          port
        };
      }

      // Parse lsof output
      const lines = stdout.trim().split('\n');
      if (lines.length > 1) {
        const processLine = lines[1]; // Skip header
        const parts = processLine.split(/\s+/);

        return {
          inUse: true,
          port,
          process: {
            command: parts[0],
            pid: parseInt(parts[1]),
            user: parts[2]
          }
        };
      }

      return {
        inUse: false,
        port
      };
    } catch (error) {
      // lsof returns non-zero exit code when port is not in use
      if (error.code === 1) {
        return {
          inUse: false,
          port
        };
      }

      logger.error('Error checking port', { port, error: error.message });
      return {
        inUse: false,
        port,
        error: error.message
      };
    }
  }

  /**
   * Check multiple ports
   * @param {Array<number>} ports - Array of port numbers
   * @returns {Promise<Array>} Array of port statuses
   */
  async checkPorts(ports) {
    const results = await Promise.all(
      ports.map(port => this.checkPort(port))
    );
    return results;
  }

  /**
   * Check if a URL is accessible
   * @param {string} url - URL to check
   * @returns {Promise<Object>} URL accessibility status
   */
  async checkUrl(url) {
    try {
      const { stdout } = await execAsync(`curl -s -o /dev/null -w "%{http_code}" -m 5 "${url}"`);
      const statusCode = parseInt(stdout.trim());

      return {
        accessible: statusCode >= 200 && statusCode < 400,
        statusCode,
        url
      };
    } catch (error) {
      return {
        accessible: false,
        url,
        error: error.message
      };
    }
  }
}

// Export singleton instance
const portChecker = new PortChecker();
export default portChecker;
