import Explorer from './characters/Explorer.js';
import Trader from './characters/Trader.js';
import Navigator from './characters/Navigator.js';
import Archaeologist from './characters/Archaeologist.js';
import Scout from './characters/Scout.js';
import Guide from './characters/Guide.js';
import logger from '../config/logger.js';

/**
 * Factory for creating agent instances
 */
class AgentFactory {
  constructor() {
    this.agents = new Map();
    this.initializeAgents();
  }

  initializeAgents() {
    // Initialize all character agents
    const explorer = new Explorer();
    const trader = new Trader();
    const navigator = new Navigator();
    const archaeologist = new Archaeologist();
    const scout = new Scout();
    const guide = new Guide();

    this.agents.set('explorer', explorer);
    this.agents.set('trader', trader);
    this.agents.set('navigator', navigator);
    this.agents.set('archaeologist', archaeologist);
    this.agents.set('scout', scout);
    this.agents.set('guide', guide);

    logger.info('Agents initialized', {
      count: this.agents.size,
      types: Array.from(this.agents.keys())
    });
  }

  /**
   * Get an agent by type
   * @param {string} type - Agent type
   * @returns {BaseAgent} Agent instance
   */
  getAgent(type) {
    if (!this.agents.has(type)) {
      throw new Error(`Unknown agent type: ${type}`);
    }
    return this.agents.get(type);
  }

  /**
   * Get all available agents
   * @returns {Array} Array of agent info objects
   */
  getAllAgents() {
    return Array.from(this.agents.values()).map(agent => agent.getInfo());
  }

  /**
   * Check if an agent type exists
   * @param {string} type - Agent type
   * @returns {boolean}
   */
  hasAgent(type) {
    return this.agents.has(type);
  }
}

// Export singleton instance
const agentFactory = new AgentFactory();
export default agentFactory;
