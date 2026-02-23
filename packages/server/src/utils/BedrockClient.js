import { BedrockRuntimeClient, InvokeModelCommand, InvokeModelWithResponseStreamCommand } from '@aws-sdk/client-bedrock-runtime';
import logger from '../config/logger.js';
import config from '../config/env.js';

/**
 * AWS Bedrock client wrapper for Claude invocation
 * Provides Anthropic SDK-like interface using AWS Bedrock Runtime
 */
class BedrockClient {
  constructor() {
    // Initialize AWS Bedrock Runtime Client
    // Uses default credential chain: environment vars, ~/.aws/credentials, IAM role
    this.client = new BedrockRuntimeClient({
      region: config.aws.region || 'us-east-1',
      // If AWS_PROFILE is set, it will be used automatically
      // If running on EC2/ECS, IAM role credentials will be used
    });

    this.modelId = config.aws.modelId || 'anthropic.claude-3-5-sonnet-20241022-v2:0';

    logger.info('BedrockClient initialized', {
      region: config.aws.region,
      modelId: this.modelId
    });
  }

  /**
   * Create a message (non-streaming)
   * @param {Object} params - Message parameters
   * @returns {Promise<Object>} Response
   */
  async createMessage(params) {
    try {
      const { model, max_tokens, system, messages, temperature = 1.0 } = params;

      // Convert to Bedrock format
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

      // Convert Bedrock response to Anthropic SDK format
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
      logger.error('BedrockClient error in createMessage', {
        error: error.message,
        code: error.name
      });
      throw error;
    }
  }

  /**
   * Create a streaming message
   * @param {Object} params - Message parameters
   * @returns {AsyncGenerator} Streaming response
   */
  async *createStreamingMessage(params) {
    try {
      const { model, max_tokens, system, messages, temperature = 1.0 } = params;

      // Convert to Bedrock format
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

      // Process the event stream
      for await (const event of response.body) {
        if (event.chunk) {
          const chunk = JSON.parse(new TextDecoder().decode(event.chunk.bytes));

          // Convert Bedrock events to Anthropic SDK format
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
      logger.error('BedrockClient error in createStreamingMessage', {
        error: error.message,
        code: error.name
      });
      throw error;
    }
  }

  /**
   * Messages API wrapper (mimics Anthropic SDK interface)
   */
  get messages() {
    return {
      create: async (params) => {
        if (params.stream) {
          // Return async generator for streaming
          return this.createStreamingMessage(params);
        } else {
          // Return promise for non-streaming
          return this.createMessage(params);
        }
      }
    };
  }
}

// Export singleton instance
const bedrockClient = new BedrockClient();
export default bedrockClient;
