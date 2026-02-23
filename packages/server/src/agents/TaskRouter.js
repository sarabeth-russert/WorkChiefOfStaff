import { TaskTypes, TaskRouting } from '../../../shared/src/index.js';
import logger from '../config/logger.js';

/**
 * Routes tasks to appropriate agents based on task type and content
 */
class TaskRouter {
  constructor(agentFactory) {
    this.agentFactory = agentFactory;
  }

  /**
   * Determine which agent(s) should handle a task
   * @param {string} taskType - Type of task
   * @param {string} task - Task description
   * @returns {Array} Array of agent types
   */
  routeTask(taskType, task) {
    // First check if we have a predefined routing for this task type
    if (TaskRouting[taskType] && TaskRouting[taskType].length > 0) {
      logger.info('Task routed by type', {
        taskType,
        agents: TaskRouting[taskType]
      });
      return TaskRouting[taskType];
    }

    // For custom tasks, analyze content to determine best agent
    const agents = this.analyzeTaskContent(task);

    logger.info('Task routed by content analysis', {
      taskType,
      agents,
      taskPreview: task.substring(0, 100)
    });

    return agents;
  }

  /**
   * Analyze task content to determine appropriate agents
   * @param {string} task - Task description
   * @returns {Array} Array of agent types
   */
  analyzeTaskContent(task) {
    const taskLower = task.toLowerCase();
    const agents = [];

    // Keywords for each agent type
    const keywords = {
      explorer: ['code', 'refactor', 'architecture', 'design', 'pattern', 'structure', 'analyze', 'review'],
      trader: ['dependency', 'package', 'npm', 'optimize', 'bundle', 'performance', 'update', 'install'],
      navigator: ['git', 'commit', 'branch', 'merge', 'deploy', 'release', 'push', 'pull', 'rebase'],
      archaeologist: ['documentation', 'docs', 'api', 'search', 'find', 'history', 'legacy', 'understand'],
      scout: ['test', 'bug', 'error', 'monitor', 'debug', 'issue', 'quality', 'coverage'],
      guide: ['tutorial', 'learn', 'how to', 'explain', 'teach', 'example', 'guide', 'help', 'onboard']
    };

    // Count keyword matches for each agent
    const scores = {};
    for (const [agentType, agentKeywords] of Object.entries(keywords)) {
      scores[agentType] = 0;
      for (const keyword of agentKeywords) {
        if (taskLower.includes(keyword)) {
          scores[agentType]++;
        }
      }
    }

    // Sort agents by score and take top candidates
    const sortedAgents = Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .filter(([_, score]) => score > 0)
      .map(([agentType, _]) => agentType);

    // If we found matching agents, return top 1-2
    if (sortedAgents.length > 0) {
      agents.push(...sortedAgents.slice(0, 2));
    } else {
      // Default to Explorer for general code tasks
      agents.push('explorer');
    }

    return agents;
  }

  /**
   * Get the primary agent for a task
   * @param {string} taskType - Type of task
   * @param {string} task - Task description
   * @returns {string} Primary agent type
   */
  getPrimaryAgent(taskType, task) {
    const agents = this.routeTask(taskType, task);
    return agents[0];
  }

  /**
   * Get all suitable agents for a task
   * @param {string} taskType - Type of task
   * @param {string} task - Task description
   * @returns {Array} Array of agent instances
   */
  getSuitableAgents(taskType, task) {
    const agentTypes = this.routeTask(taskType, task);
    return agentTypes
      .filter(type => this.agentFactory.hasAgent(type))
      .map(type => this.agentFactory.getAgent(type));
  }
}

export default TaskRouter;
