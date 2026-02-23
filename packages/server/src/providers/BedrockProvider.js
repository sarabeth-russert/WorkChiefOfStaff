import { BedrockRuntimeClient, InvokeModelCommand, InvokeModelWithResponseStreamCommand } from '@aws-sdk/client-bedrock-runtime';
import AIProvider from './AIProvider.js';
import logger from '../config/logger.js';

/**
 * AWS Bedrock provider implementation
 */
class BedrockProvider extends AIProvider {
  constructor(config = {}) {
    super(config);
    this.name = 'AWS Bedrock';
    this.type = 'bedrock';

    // Initialize Bedrock client
    this.client = new BedrockRuntimeClient({
      region: config.region || 'us-east-1',
      credentials: config.credentials
    });

    // Use cross-region inference profile for on-demand access
    this.modelId = config.modelId || 'us.anthropic.claude-3-5-sonnet-20241022-v2:0';

    logger.info('BedrockProvider initialized', {
      region: config.region,
      modelId: this.modelId
    });
  }

  /**
   * Get available Bedrock models
   */
  getAvailableModels() {
    return [
      {
        id: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
        name: 'Claude 3.5 Sonnet (US Cross-Region)',
        provider: 'Anthropic',
        contextWindow: 200000,
        maxOutput: 8192
      },
      {
        id: 'us.anthropic.claude-3-5-sonnet-20240620-v1:0',
        name: 'Claude 3.5 Sonnet v1 (US Cross-Region)',
        provider: 'Anthropic',
        contextWindow: 200000,
        maxOutput: 8192
      },
      {
        id: 'us.anthropic.claude-3-opus-20240229-v1:0',
        name: 'Claude 3 Opus (US Cross-Region)',
        provider: 'Anthropic',
        contextWindow: 200000,
        maxOutput: 4096
      },
      {
        id: 'us.anthropic.claude-3-sonnet-20240229-v1:0',
        name: 'Claude 3 Sonnet (US Cross-Region)',
        provider: 'Anthropic',
        contextWindow: 200000,
        maxOutput: 4096
      },
      {
        id: 'us.anthropic.claude-3-haiku-20240307-v1:0',
        name: 'Claude 3 Haiku (US Cross-Region)',
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

      const bedrockRequest = {
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: max_tokens || 4096,
        temperature: temperature,
        messages: messages,
        system: system
      };

      const command = new InvokeModelCommand({
        modelId: model || this.modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify(bedrockRequest)
      });

      const response = await this.client.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));

      return {
        id: responseBody.id || `msg_${Date.now()}`,
        type: 'message',
        role: 'assistant',
        content: responseBody.content,
        model: model || this.modelId,
        stop_reason: responseBody.stop_reason,
        usage: responseBody.usage || {
          input_tokens: 0,
          output_tokens: 0
        }
      };
    } catch (error) {
      logger.error('BedrockProvider error in createMessage', {
        error: error.message,
        code: error.name,
        stack: error.stack
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

      const bedrockRequest = {
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: max_tokens || 4096,
        temperature: temperature,
        messages: messages,
        system: system
      };

      const command = new InvokeModelWithResponseStreamCommand({
        modelId: model || this.modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify(bedrockRequest)
      });

      const response = await this.client.send(command);

      for await (const event of response.body) {
        if (event.chunk) {
          const chunk = JSON.parse(new TextDecoder().decode(event.chunk.bytes));

          if (chunk.type === 'message_start') {
            yield {
              type: 'message_start',
              message: {
                id: chunk.message?.id || `msg_${Date.now()}`,
                type: 'message',
                role: 'assistant',
                content: [],
                model: model || this.modelId
              }
            };
          } else if (chunk.type === 'content_block_start') {
            yield {
              type: 'content_block_start',
              index: chunk.index || 0,
              content_block: {
                type: 'text',
                text: ''
              }
            };
          } else if (chunk.type === 'content_block_delta') {
            yield {
              type: 'content_block_delta',
              index: chunk.index || 0,
              delta: {
                type: 'text_delta',
                text: chunk.delta?.text || ''
              }
            };
          } else if (chunk.type === 'content_block_stop') {
            yield {
              type: 'content_block_stop',
              index: chunk.index || 0
            };
          } else if (chunk.type === 'message_delta') {
            yield {
              type: 'message_delta',
              delta: {
                stop_reason: chunk.delta?.stop_reason
              },
              usage: chunk.usage || {}
            };
          } else if (chunk.type === 'message_stop') {
            yield {
              type: 'message_stop'
            };
          }
        }
      }
    } catch (error) {
      logger.error('BedrockProvider error in createStreamingMessage', {
        error: error.message,
        code: error.name
      });
      throw error;
    }
  }

  /**
   * Validate AWS credentials
   */
  async validateCredentials() {
    try {
      // Try a simple health check
      const testMessage = {
        model: this.modelId,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hi' }]
      };
      await this.createMessage(testMessage);
      return true;
    } catch (error) {
      logger.error('BedrockProvider credential validation failed', {
        error: error.message,
        code: error.name,
        region: this.client.config.region,
        modelId: this.modelId
      });
      return false;
    }
  }

  /**
   * Requires AWS credentials
   */
  requiresCredentials() {
    return true;
  }
}

export default BedrockProvider;
