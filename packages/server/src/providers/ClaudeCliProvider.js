import { spawn } from 'child_process';
import AIProvider from './AIProvider.js';
import logger from '../config/logger.js';

/**
 * Claude CLI provider - spawns local Claude CLI for agent execution
 * Uses the Claude Desktop CLI with full tool support
 */
class ClaudeCliProvider extends AIProvider {
  constructor(config = {}) {
    super(config);
    this.name = 'Claude CLI';
    this.type = 'claude-cli';
    this.cliPath = config.cliPath || 'claude';
  }

  /**
   * Get available models
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
        id: 'claude-opus-4',
        name: 'Claude Opus 4',
        provider: 'Anthropic',
        contextWindow: 200000,
        maxOutput: 8192
      }
    ];
  }

  /**
   * Create streaming message using Claude CLI
   */
  async *createStreamingMessage(params) {
    const { system, messages } = params;
    // Note: Claude CLI has its own built-in tools (Read, Write, Edit, Bash, Glob, Grep)
    // We don't pass custom tool definitions - it uses its own tools automatically

    // Build the prompt for Claude CLI
    const lastMessage = messages[messages.length - 1];
    const userPrompt = lastMessage.content;

    // Combine system prompt with user message
    const fullPrompt = system ? `${system}\n\n${userPrompt}` : userPrompt;

    // Build CLI args
    const args = [
      '--output-format', 'stream-json',
      '--verbose',
      '--dangerously-skip-permissions',  // Skip permission checks for agents
      '--'
    ];

    logger.info('Claude CLI executing with built-in tools (permissions skipped)');

    logger.info('Spawning Claude CLI process', {
      cliPath: this.cliPath,
      args: args.join(' '),
      promptLength: fullPrompt.length
    });

    // Spawn Claude CLI
    const cliProcess = spawn(this.cliPath, args, {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // Write prompt to stdin
    cliProcess.stdin.write(fullPrompt);
    cliProcess.stdin.end();

    logger.info('Prompt sent to Claude CLI, waiting for response...');

    // Parse Claude CLI's stream-json output
    // Format is: {"type":"system"}, {"type":"assistant","message":{...}}, {"type":"result"}
    let buffer = '';
    let messageReceived = false;

    for await (const chunk of cliProcess.stdout) {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;

        try {
          const event = JSON.parse(line);

          // Handle Claude CLI event types
          if (event.type === 'system' && event.subtype === 'init') {
            // Initialization - send message_start
            logger.info('Claude CLI initialized');
            yield {
              type: 'message_start',
              message: {
                id: event.session_id || `msg_${Date.now()}`,
                type: 'message',
                role: 'assistant',
                content: [],
                model: event.model || 'claude-3-5-sonnet-20241022'
              }
            };
          } else if (event.type === 'assistant' && event.message) {
            // Assistant response - convert to streaming format
            // IMPORTANT: Claude CLI executes tools automatically and includes them in the response
            // We should ONLY emit TEXT blocks, not tool_use blocks (those are already executed)
            messageReceived = true;
            const message = event.message;

            logger.info('Claude CLI assistant response received', {
              contentBlocks: message.content?.length || 0
            });

            // Only emit TEXT content blocks - skip tool_use blocks
            if (message.content && Array.isArray(message.content)) {
              let textIndex = 0;
              for (const block of message.content) {
                if (block.type === 'text') {
                  // Content block start
                  yield {
                    type: 'content_block_start',
                    index: textIndex,
                    content_block: {
                      type: 'text',
                      text: ''
                    }
                  };

                  // Content block delta
                  yield {
                    type: 'content_block_delta',
                    index: textIndex,
                    delta: {
                      type: 'text_delta',
                      text: block.text
                    }
                  };

                  // Content block stop
                  yield {
                    type: 'content_block_stop',
                    index: textIndex
                  };

                  textIndex++;
                } else if (block.type === 'tool_use') {
                  // Log for debugging but don't emit - Claude CLI already executed this
                  logger.info('🔧 Claude CLI executed tool', { tool: block.name, input: block.input });
                }
              }
            }

            // Message delta (stop reason)
            yield {
              type: 'message_delta',
              delta: {
                stop_reason: message.stop_reason || 'end_turn'
              },
              usage: message.usage || {}
            };
          } else if (event.type === 'result') {
            // Final result - send message_stop
            logger.info('Claude CLI completed', {
              duration: event.duration_ms,
              turns: event.num_turns
            });
          }
        } catch (e) {
          logger.error('Error parsing Claude CLI output', { line, error: e.message });
        }
      }
    }

    // Always send message_stop at the end
    if (messageReceived) {
      yield {
        type: 'message_stop'
      };
    }

    // Handle any errors from stderr
    let errorOutput = '';
    for await (const chunk of cliProcess.stderr) {
      errorOutput += chunk.toString();
    }

    if (errorOutput) {
      logger.error('Claude CLI stderr output', { error: errorOutput });
    }

    // Wait for process to exit
    await new Promise((resolve, reject) => {
      cliProcess.on('close', (code) => {
        if (code !== 0 && code !== null) {
          logger.error('Claude CLI exited with error', { code });
          reject(new Error(`Claude CLI exited with code ${code}: ${errorOutput}`));
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Create non-streaming message (uses streaming internally)
   */
  async createMessage(params) {
    const chunks = [];
    let fullText = '';

    for await (const event of this.createStreamingMessage(params)) {
      if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
        fullText += event.delta.text;
      }
      chunks.push(event);
    }

    return {
      id: `msg_${Date.now()}`,
      type: 'message',
      role: 'assistant',
      content: [
        {
          type: 'text',
          text: fullText
        }
      ],
      model: 'claude-3-5-sonnet-20241022',
      stop_reason: 'end_turn',
      usage: {
        input_tokens: 0,
        output_tokens: 0
      }
    };
  }

  /**
   * Validate that Claude CLI is available
   */
  async validateCredentials() {
    try {
      const testProcess = spawn(this.cliPath, ['--version'], { stdio: 'pipe' });

      return new Promise((resolve) => {
        testProcess.on('close', (code) => {
          if (code === 0) {
            logger.info('Claude CLI validated successfully');
            resolve(true);
          } else {
            logger.error('Claude CLI validation failed', { code });
            resolve(false);
          }
        });

        testProcess.on('error', (err) => {
          logger.error('Claude CLI not found', { error: err.message });
          resolve(false);
        });
      });
    } catch (error) {
      logger.error('Error validating Claude CLI', { error: error.message });
      return false;
    }
  }

  /**
   * Requires Claude CLI to be installed
   */
  requiresCredentials() {
    return true;
  }
}

export default ClaudeCliProvider;
