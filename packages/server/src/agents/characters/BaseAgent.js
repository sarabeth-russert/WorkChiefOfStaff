import providerFactory from '../../providers/ProviderFactory.js';
import configStore from '../../config/ConfigStore.js';
import promptManager from '../../prompts/PromptManager.js';
import logger from '../../config/logger.js';

class BaseAgent {
  constructor(options = {}) {
    this.name = options.name || 'Base Agent';
    this.type = options.type || 'base';
    this.icon = options.icon || '🤖';
    this.personality = options.personality || 'Helpful and professional';
    this.role = options.role || 'General assistant';
    this.skills = options.skills || [];
    this.catchphrase = options.catchphrase || 'Ready to help!';

    // Get current provider from factory (might be null initially)
    this.provider = providerFactory.getCurrentProvider();

    // If no provider set, create default bedrock provider
    if (!this.provider) {
      const defaultConfig = configStore.getCurrentProvider();
      this.provider = providerFactory.setCurrentProvider(defaultConfig.type, defaultConfig);
    }

    // Get agent-specific settings or use global defaults
    const agentConfig = configStore.getAgentDefaults(this.type);
    const globalSettings = configStore.getGlobalSettings();

    // Use agent-specific model or current model from config
    this.model = agentConfig.modelId || configStore.getCurrentModel();

    // Use agent-specific maxTokens or global default
    this.maxTokens = agentConfig.maxTokens || globalSettings.defaultMaxTokens || 4096;

    // Temperature from global settings
    this.temperature = globalSettings.defaultTemperature || 1.0;

    // Custom prompt (if exists)
    this.customPrompt = null;
    this.loadCustomPrompt();
  }

  /**
   * Load custom prompt from PromptManager if it exists
   */
  async loadCustomPrompt() {
    try {
      const prompt = promptManager.getPrompt(this.type);
      if (prompt && prompt.prompts) {
        this.customPrompt = prompt;
        logger.info(`${this.name} loaded custom prompt`, {
          version: prompt.version
        });
      }
    } catch (error) {
      logger.error(`${this.name} failed to load custom prompt`, {
        error: error.message
      });
    }
  }

  /**
   * Get the system prompt for this agent
   * Override this in subclasses for character-specific prompts
   */
  getSystemPrompt() {
    // Use custom prompt if available
    if (this.customPrompt && this.customPrompt.prompts) {
      const custom = this.customPrompt.prompts;

      // If custom system prompt exists, use it
      if (custom.system) {
        return custom.system;
      }

      // Otherwise build from custom parts
      let prompt = `You are ${this.name}, an AI agent in the Adventureland Chief of Staff system.\n\n`;

      if (custom.personality) {
        prompt += `PERSONALITY: ${custom.personality}\n`;
      } else {
        prompt += `PERSONALITY: ${this.personality}\n`;
      }

      prompt += `ROLE: ${this.role}\n`;
      prompt += `SKILLS: ${this.skills.join(', ')}\n\n`;
      prompt += `Your catchphrase is: "${this.catchphrase}"\n\n`;

      if (custom.instructions && Array.isArray(custom.instructions)) {
        prompt += `As ${this.name}, you should:\n`;
        custom.instructions.forEach((instruction, i) => {
          prompt += `${i + 1}. ${instruction}\n`;
        });
      } else {
        prompt += `As ${this.name}, you should:\n`;
        prompt += `1. Stay in character and embody your personality traits\n`;
        prompt += `2. Use your catchphrase occasionally when appropriate\n`;
        prompt += `3. Focus on tasks that match your role and skills\n`;
        prompt += `4. Be helpful, clear, and concise in your responses\n`;
        prompt += `5. Use markdown formatting for better readability\n`;
      }

      prompt += `\nRemember: You are part of a vintage 1950s-60s Adventureland themed system, so maintain that adventurous, exploratory spirit in your communication style.`;

      return prompt;
    }

    // Default prompt
    return `You are ${this.name}, an AI agent in the Adventureland Chief of Staff system.

PERSONALITY: ${this.personality}
ROLE: ${this.role}
SKILLS: ${this.skills.join(', ')}

Your catchphrase is: "${this.catchphrase}"

As ${this.name}, you should:
1. Stay in character and embody your personality traits
2. Use your catchphrase occasionally when appropriate
3. Focus on tasks that match your role and skills
4. Be helpful, clear, and concise in your responses
5. Use markdown formatting for better readability

Remember: You are part of a vintage 1950s-60s Adventureland themed system, so maintain that adventurous, exploratory spirit in your communication style.`;
  }

  /**
   * Process a task and return a response
   * @param {string} task - The task to process
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Response object
   */
  async processTask(task, options = {}) {
    try {
      logger.info(`${this.name} processing task`, {
        type: this.type,
        taskLength: task.length
      });

      const systemPrompt = this.getSystemPrompt();
      const messages = [
        {
          role: 'user',
          content: task
        }
      ];

      // Add conversation history if provided
      if (options.history && Array.isArray(options.history)) {
        messages.unshift(...options.history);
      }

      const response = await this.provider.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        system: systemPrompt,
        messages: messages
      });

      const responseText = response.content[0].text;

      logger.info(`${this.name} completed task`, {
        type: this.type,
        responseLength: responseText.length,
        usage: response.usage
      });

      return {
        success: true,
        agent: {
          name: this.name,
          type: this.type,
          icon: this.icon
        },
        response: responseText,
        usage: response.usage,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`${this.name} error processing task`, {
        type: this.type,
        error: error.message
      });

      return {
        success: false,
        agent: {
          name: this.name,
          type: this.type,
          icon: this.icon
        },
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Stream a task response
   * @param {string} task - The task to process
   * @param {Function} onChunk - Callback for each chunk
   * @param {Object} options - Additional options
   */
  async streamTask(task, onChunk, options = {}) {
    try {
      logger.info(`${this.name} streaming task`, {
        type: this.type,
        taskLength: task.length
      });

      const systemPrompt = this.getSystemPrompt();
      const messages = [
        {
          role: 'user',
          content: task
        }
      ];

      // Add conversation history if provided
      if (options.history && Array.isArray(options.history)) {
        messages.unshift(...options.history);
      }

      const stream = await this.provider.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        system: systemPrompt,
        messages: messages,
        stream: true
      });

      let fullResponse = '';

      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          const chunk = event.delta.text;
          fullResponse += chunk;

          // Call the chunk callback
          if (onChunk) {
            onChunk({
              type: 'chunk',
              data: chunk,
              agent: {
                name: this.name,
                type: this.type,
                icon: this.icon
              }
            });
          }
        }

        if (event.type === 'message_stop') {
          logger.info(`${this.name} completed streaming task`, {
            type: this.type,
            responseLength: fullResponse.length
          });

          if (onChunk) {
            onChunk({
              type: 'complete',
              data: fullResponse,
              agent: {
                name: this.name,
                type: this.type,
                icon: this.icon
              }
            });
          }
        }
      }

      return {
        success: true,
        response: fullResponse
      };
    } catch (error) {
      logger.error(`${this.name} error streaming task`, {
        type: this.type,
        error: error.message
      });

      if (onChunk) {
        onChunk({
          type: 'error',
          error: error.message,
          agent: {
            name: this.name,
            type: this.type,
            icon: this.icon
          }
        });
      }

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get agent info
   */
  getInfo() {
    return {
      name: this.name,
      type: this.type,
      icon: this.icon,
      personality: this.personality,
      role: this.role,
      skills: this.skills,
      catchphrase: this.catchphrase
    };
  }
}

export default BaseAgent;
