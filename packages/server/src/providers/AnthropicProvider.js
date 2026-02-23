import Anthropic from '@anthropic-ai/sdk';
import AIProvider from './AIProvider.js';
import logger from '../config/logger.js';

/**
 * Anthropic direct API provider implementation
 */
class AnthropicProvider extends AIProvider {
  constructor(config = {}) {
    super(config);
    this.name = 'Anthropic';
    this.type = 'anthropic';

    // Initialize Anthropic SDK
    this.client = new Anthropic({
      apiKey: config.apiKey
    });

    this.modelId = config.modelId || 'claude-3-5-sonnet-20241022';

    logger.info('AnthropicProvider initialized', {
      modelId: this.modelId
    });
  }

  /**
   * Get available Anthropic models
   */
  getAvailableModels() {
    return [
      {
        id: 'claude-3-5-sonnet-20241022',
        name: 'Claude 3.5 Sonnet',
        provider: 'Anthropic',
        contextWindow: 200000,
        maxOutput: 8192
      },
      {
        id: 'claude-3-opus-20240229',
        name: 'Claude 3 Opus',
        provider: 'Anthropic',
        contextWindow: 200000,
        maxOutput: 4096
      },
      {
        id: 'claude-3-sonnet-20240229',
        name: 'Claude 3 Sonnet',
        provider: 'Anthropic',
        contextWindow: 200000,
        maxOutput: 4096
      },
      {
        id: 'claude-3-haiku-20240307',
        name: 'Claude 3 Haiku',
        provider: 'Anthropic',
        contextWindow: 200000,
        maxOutput: 4096
      }
    ];
  }

  /**
   * Create non-streaming message
   */
  async createMessage(params) {
    try {
      const { model, max_tokens, system, messages, temperature = 1.0 } = params;

      const response = await this.client.messages.create({
        model: model || this.modelId,
        max_tokens: max_tokens || 4096,
        temperature: temperature,
        system: system,
        messages: messages
      });

      return response;
    } catch (error) {
      logger.error('AnthropicProvider error in createMessage', {
        error: error.message,
        code: error.type
      });
      throw error;
    }
  }

  /**
   * Create streaming message
   */
  async *createStreamingMessage(params) {
    try {
      const { model, max_tokens, system, messages, temperature = 1.0 } = params;

      const stream = await this.client.messages.create({
        model: model || this.modelId,
        max_tokens: max_tokens || 4096,
        temperature: temperature,
        system: system,
        messages: messages,
        stream: true
      });

      for await (const event of stream) {
        yield event;
      }
    } catch (error) {
      logger.error('AnthropicProvider error in createStreamingMessage', {
        error: error.message,
        code: error.type
      });
      throw error;
    }
  }

  /**
   * Validate Anthropic API key
   */
  async validateCredentials() {
    try {
      // Try a minimal request to validate API key
      await this.createMessage({
        model: this.modelId,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hi' }]
      });
      return true;
    } catch (error) {
      logger.error('AnthropicProvider credential validation failed', {
        error: error.message
      });
      return false;
    }
  }

  /**
   * Requires API key
   */
  requiresCredentials() {
    return true;
  }
}

export default AnthropicProvider;
