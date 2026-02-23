import simpleGit from 'simple-git';
import logger from '../config/logger.js';

/**
 * Manages Git operations
 */
class GitManager {
  constructor(cwd = process.cwd()) {
    this.git = simpleGit(cwd);
    this.cwd = cwd;
  }

  /**
   * Get Git status
   * @returns {Promise<Object>} Git status
   */
  async getStatus() {
    try {
      const status = await this.git.status();

      return {
        current: status.current,
        tracking: status.tracking,
        ahead: status.ahead,
        behind: status.behind,
        modified: status.modified,
        created: status.created,
        deleted: status.deleted,
        renamed: status.renamed,
        staged: status.staged,
        conflicts: status.conflicted,
        isClean: status.isClean()
      };
    } catch (error) {
      logger.error('Error getting git status', error);
      throw error;
    }
  }

  /**
   * Get branch list
   * @returns {Promise<Object>} Branches
   */
  async getBranches() {
    try {
      const branches = await this.git.branch();

      return {
        all: branches.all,
        current: branches.current,
        branches: branches.branches
      };
    } catch (error) {
      logger.error('Error getting branches', error);
      throw error;
    }
  }

  /**
   * Get commit log
   * @param {number} limit - Number of commits
   * @returns {Promise<Array>} Commits
   */
  async getLog(limit = 10) {
    try {
      const log = await this.git.log({ maxCount: limit });

      return log.all.map(commit => ({
        hash: commit.hash,
        date: commit.date,
        message: commit.message,
        author: commit.author_name,
        email: commit.author_email
      }));
    } catch (error) {
      logger.error('Error getting git log', error);
      throw error;
    }
  }

  /**
   * Check if directory is a git repository
   * @returns {Promise<boolean>}
   */
  async isRepo() {
    try {
      await this.git.status();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get remote info
   * @returns {Promise<Array>} Remotes
   */
  async getRemotes() {
    try {
      const remotes = await this.git.getRemotes(true);

      return remotes.map(remote => ({
        name: remote.name,
        fetch: remote.refs.fetch,
        push: remote.refs.push
      }));
    } catch (error) {
      logger.error('Error getting remotes', error);
      throw error;
    }
  }
}

// Export singleton instance
const gitManager = new GitManager();
export default gitManager;
