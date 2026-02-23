import { spawn } from 'child_process';
import { promisify } from 'util';
import { exec } from 'child_process';
import logger from '../config/logger.js';

const execAsync = promisify(exec);

/**
 * Manages terminal sessions for command execution
 */
class TerminalSession {
  constructor(sessionId, socket) {
    this.sessionId = sessionId;
    this.socket = socket;
    this.process = null;
    this.cwd = process.cwd();
    this.env = { ...process.env };
  }

  /**
   * Execute a command
   * @param {string} command - Command to execute
   */
  async executeCommand(command) {
    try {
      logger.info('Executing command', {
        sessionId: this.sessionId,
        command: command.substring(0, 100)
      });

      // Handle cd command specially
      if (command.trim().startsWith('cd ')) {
        await this.handleCdCommand(command);
        return;
      }

      // Execute command
      const child = spawn(command, {
        shell: true,
        cwd: this.cwd,
        env: this.env
      });

      this.process = child;

      // Stream stdout
      child.stdout.on('data', (data) => {
        this.socket.emit('terminal:output', {
          sessionId: this.sessionId,
          data: data.toString()
        });
      });

      // Stream stderr
      child.stderr.on('data', (data) => {
        this.socket.emit('terminal:output', {
          sessionId: this.sessionId,
          data: data.toString(),
          isError: true
        });
      });

      // Handle exit
      child.on('exit', (code) => {
        this.socket.emit('terminal:exit', {
          sessionId: this.sessionId,
          code
        });
        this.process = null;

        logger.info('Command completed', {
          sessionId: this.sessionId,
          exitCode: code
        });
      });

      // Handle errors
      child.on('error', (error) => {
        this.socket.emit('terminal:error', {
          sessionId: this.sessionId,
          error: error.message
        });
        this.process = null;

        logger.error('Command error', {
          sessionId: this.sessionId,
          error: error.message
        });
      });

    } catch (error) {
      logger.error('Error executing command', {
        sessionId: this.sessionId,
        error: error.message
      });

      this.socket.emit('terminal:error', {
        sessionId: this.sessionId,
        error: error.message
      });
    }
  }

  /**
   * Handle cd command
   * @param {string} command - cd command
   */
  async handleCdCommand(command) {
    try {
      const path = command.substring(3).trim();

      if (path) {
        const { stdout } = await execAsync(`cd "${path}" && pwd`, {
          cwd: this.cwd,
          shell: true
        });
        this.cwd = stdout.trim();
      } else {
        // cd with no args goes to home
        this.cwd = process.env.HOME || process.env.USERPROFILE;
      }

      this.socket.emit('terminal:output', {
        sessionId: this.sessionId,
        data: ''
      });

      this.socket.emit('terminal:cwd', {
        sessionId: this.sessionId,
        cwd: this.cwd
      });

      this.socket.emit('terminal:exit', {
        sessionId: this.sessionId,
        code: 0
      });

    } catch (error) {
      this.socket.emit('terminal:error', {
        sessionId: this.sessionId,
        error: `cd: ${error.message}`
      });
    }
  }

  /**
   * Kill the current process
   */
  kill() {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
  }

  /**
   * Get current working directory
   * @returns {string} Current directory
   */
  getCwd() {
    return this.cwd;
  }

  /**
   * Set environment variable
   * @param {string} key - Variable name
   * @param {string} value - Variable value
   */
  setEnv(key, value) {
    this.env[key] = value;
  }

  /**
   * Get terminal info
   * @returns {Object} Terminal info
   */
  getInfo() {
    return {
      sessionId: this.sessionId,
      cwd: this.cwd,
      hasActiveProcess: this.process !== null
    };
  }
}

export default TerminalSession;
