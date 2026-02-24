import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import agentFactory from './AgentFactory.js';
import TaskRouter from './TaskRouter.js';
import logger from '../config/logger.js';
import config from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Orchestrates multiple agents and manages task execution
 */
class AgentOrchestrator {
  constructor() {
    this.agentFactory = agentFactory;
    this.taskRouter = new TaskRouter(agentFactory);
    this.taskHistory = [];
    this.decisionsPath = path.resolve(__dirname, '../../data/agents/decisions.json');
    this.loadDecisions();
  }

  /**
   * Load decision history from file
   */
  loadDecisions() {
    try {
      if (fs.existsSync(this.decisionsPath)) {
        const data = fs.readFileSync(this.decisionsPath, 'utf8');
        this.decisions = JSON.parse(data);
        logger.info('Loaded decision history', { count: this.decisions.length });
      } else {
        this.decisions = [];
      }
    } catch (error) {
      logger.error('Error loading decisions', error);
      this.decisions = [];
    }
  }

  /**
   * Save decision to history
   */
  saveDecision(decision) {
    try {
      this.decisions.push(decision);

      // Keep only last 1000 decisions
      if (this.decisions.length > 1000) {
        this.decisions = this.decisions.slice(-1000);
      }

      fs.writeFileSync(
        this.decisionsPath,
        JSON.stringify(this.decisions, null, 2),
        'utf8'
      );
    } catch (error) {
      logger.error('Error saving decision', error);
    }
  }

  /**
   * Execute a task with appropriate agent(s)
   * @param {Object} options - Task options
   * @returns {Promise<Object>} Task result
   */
  async executeTask(options) {
    const {
      taskType = 'custom',
      task,
      agentType = null,
      history = null,
      stream = false,
      onChunk = null
    } = options;

    const taskId = Date.now();
    const startTime = Date.now();

    try {
      // Determine which agent to use
      let selectedAgentType = agentType;
      if (!selectedAgentType) {
        selectedAgentType = this.taskRouter.getPrimaryAgent(taskType, task);
      }

      logger.info('Orchestrator executing task', {
        taskId,
        taskType,
        selectedAgentType,
        taskPreview: task.substring(0, 100),
        historyLength: history ? history.length : 0
      });

      // Get the agent
      const agent = this.agentFactory.getAgent(selectedAgentType);

      // Log decision
      const decision = {
        taskId,
        timestamp: new Date().toISOString(),
        taskType,
        selectedAgent: selectedAgentType,
        taskPreview: task.substring(0, 200),
        reasoning: `Selected ${selectedAgentType} based on task type and content analysis`
      };

      // Prepare options for agent
      const agentOptions = history ? { history } : {};

      // Execute task
      let result;
      if (stream && onChunk) {
        result = await agent.streamTask(task, onChunk, agentOptions);
      } else {
        result = await agent.processTask(task, agentOptions);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Update decision with result
      decision.success = result.success;
      decision.duration = duration;
      decision.error = result.error;

      this.saveDecision(decision);

      // Add to task history
      this.taskHistory.push({
        taskId,
        taskType,
        agentType: selectedAgentType,
        success: result.success,
        timestamp: new Date().toISOString(),
        duration
      });

      logger.info('Task completed', {
        taskId,
        success: result.success,
        duration
      });

      return {
        taskId,
        ...result,
        duration
      };
    } catch (error) {
      logger.error('Orchestrator error', {
        taskId,
        error: error.message
      });

      // Log failed decision
      this.saveDecision({
        taskId,
        timestamp: new Date().toISOString(),
        taskType,
        success: false,
        error: error.message,
        duration: Date.now() - startTime
      });

      return {
        taskId,
        success: false,
        error: error.message,
        agent: { name: 'Orchestrator', type: 'orchestrator', icon: '🎭' },
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get task history
   * @param {number} limit - Number of recent tasks to return
   * @returns {Array} Task history
   */
  getTaskHistory(limit = 50) {
    return this.taskHistory.slice(-limit);
  }

  /**
   * Get decisions
   * @param {number} limit - Number of recent decisions to return
   * @returns {Array} Decisions
   */
  getDecisions(limit = 50) {
    return this.decisions.slice(-limit);
  }

  /**
   * Get orchestrator statistics
   * @returns {Object} Statistics
   */
  getStats() {
    const totalTasks = this.taskHistory.length;
    const successfulTasks = this.taskHistory.filter(t => t.success).length;
    const failedTasks = totalTasks - successfulTasks;

    // Count tasks by agent type
    const tasksByAgent = {};
    for (const task of this.taskHistory) {
      tasksByAgent[task.agentType] = (tasksByAgent[task.agentType] || 0) + 1;
    }

    // Calculate average duration
    const durations = this.taskHistory.map(t => t.duration);
    const avgDuration = durations.length > 0
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : 0;

    return {
      totalTasks,
      successfulTasks,
      failedTasks,
      successRate: totalTasks > 0 ? (successfulTasks / totalTasks * 100).toFixed(2) : 0,
      tasksByAgent,
      avgDuration: Math.round(avgDuration),
      availableAgents: this.agentFactory.getAllAgents().length
    };
  }

  /**
   * Get suggested agent for a task
   * @param {string} taskType - Type of task
   * @param {string} task - Task description
   * @returns {Object} Suggested agent info
   */
  suggestAgent(taskType, task) {
    const agentTypes = this.taskRouter.routeTask(taskType, task);
    const agents = agentTypes.map(type => this.agentFactory.getAgent(type).getInfo());

    return {
      primary: agents[0],
      alternatives: agents.slice(1),
      reasoning: `Based on task content, ${agents[0].name} is best suited for this task`
    };
  }
}

// Export singleton instance
const orchestrator = new AgentOrchestrator();
export default orchestrator;
