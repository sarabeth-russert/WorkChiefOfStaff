import providerFactory from '../../providers/ProviderFactory.js';
import configStore from '../../config/ConfigStore.js';
import promptManager from '../../prompts/PromptManager.js';
import logger from '../../config/logger.js';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import TurndownService from 'turndown';
import agentTools from '../tools/AgentTools.js';

class BaseAgent {
  constructor(options = {}) {
    this.name = options.name || 'Base Agent';
    this.type = options.type || 'base';
    this.icon = options.icon || '🤖';
    this.imagePath = options.imagePath || `/images/characters/${options.type}.png`;
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
    this.maxTokens = agentConfig.maxTokens || globalSettings.defaultMaxTokens || 8192;

    // Temperature from global settings
    this.temperature = globalSettings.defaultTemperature ?? 0.4;

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
    // Use fully custom system prompt if provided
    if (this.customPrompt?.prompts?.system) {
      return this.customPrompt.prompts.system;
    }

    // Build custom instructions if provided
    let customInstructions = '';
    if (this.customPrompt?.prompts?.instructions?.length) {
      customInstructions = this.customPrompt.prompts.instructions
        .map((inst, i) => `${i + 1}. ${inst}`)
        .join('\n');
    }

    const personality = this.customPrompt?.prompts?.personality || this.personality;

    return `You are ${this.name}, an AI agent in Chief of Staff — a personal productivity app with a vintage 1950s-60s Adventureland theme. "COS" = "Chief of Staff" = this application.

ROLE: ${this.role}
PERSONALITY: ${personality}
SKILLS: ${this.skills.join(', ')}

## Project Context

This is a JavaScript/React monorepo. Know these paths:

FRONTEND (packages/client/):
- Pages: packages/client/src/pages/ (Dashboard.jsx, Expedition.jsx, Jira.jsx, etc.)
- Components: packages/client/src/components/
- Stores: packages/client/src/stores/

BACKEND (packages/server/):
- API routes: packages/server/src/api/routes.js
- Agents: packages/server/src/agents/
- Integrations: packages/server/src/integrations/ (Jira, Outlook, Oura)
- Knowledge base: packages/server/src/brain/ (KnowledgeStore, VectorSearch)

Key integrations: Jira (task tracking), Outlook (calendar), Oura Ring (wellness/sleep), AI agents (Claude-powered).

## How to Work

Use your tools to take action. Read files before modifying them. Explain what you did after.

When asked about code: use read_file first, then edit_file or write_file, then explain.
When asked a knowledge question: use search_knowledge to check the user's saved notes first.

Available tools: read_file, write_file, edit_file, list_directory, search_code, run_command, search_knowledge

${customInstructions ? `## Custom Instructions\n${customInstructions}\n\n` : ''}Keep responses focused and useful. Use markdown formatting. Maintain your ${this.name} personality naturally without overdoing the theme.`;
  }

  /**
   * Fetch and parse a URL
   * @param {string} url - The URL to fetch
   * @returns {Promise<Object>} Parsed content
   */
  async fetchUrl(url) {
    try {
      logger.info(`${this.name} fetching URL`, { url });

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; AdventurelandBot/1.0)'
        },
        timeout: 10000
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      // Remove scripts, styles, and other non-content elements
      $('script, style, nav, footer, iframe, noscript').remove();

      // Get page title
      const title = $('title').text().trim();

      // Convert to markdown for better readability
      const turndownService = new TurndownService({
        headingStyle: 'atx',
        codeBlockStyle: 'fenced'
      });

      // Get main content (try various selectors)
      let content = '';
      const mainSelectors = [
        'main',
        'article',
        '[role="main"]',
        '.main-content',
        '#content',
        '.content',
        'body'
      ];

      for (const selector of mainSelectors) {
        const element = $(selector).first();
        if (element.length > 0) {
          content = element.html();
          break;
        }
      }

      // Convert HTML to Markdown
      const markdown = turndownService.turndown(content || html);

      // Limit content size (max 50,000 chars to avoid token limits)
      const limitedContent = markdown.length > 50000
        ? markdown.substring(0, 50000) + '\n\n[Content truncated for length...]'
        : markdown;

      logger.info(`${this.name} successfully fetched URL`, {
        url,
        title,
        contentLength: limitedContent.length
      });

      return {
        success: true,
        url,
        title,
        content: limitedContent
      };
    } catch (error) {
      logger.error(`${this.name} error fetching URL`, {
        url,
        error: error.message
      });

      return {
        success: false,
        url,
        error: error.message
      };
    }
  }

  /**
   * Detect URLs in task and fetch them if needed
   * @param {string} task - The task text
   * @returns {Promise<Object>} Task with fetched content
   */
  async detectAndFetchUrls(task) {
    // Regex to detect URLs
    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    const urls = task.match(urlRegex);

    if (!urls || urls.length === 0) {
      return { task, fetchedContent: [] };
    }

    logger.info(`${this.name} detected ${urls.length} URL(s) in task`);

    // Fetch all URLs
    const fetchPromises = urls.map(url => this.fetchUrl(url));
    const fetchedContent = await Promise.all(fetchPromises);

    // Build enhanced task with fetched content
    let enhancedTask = task;

    fetchedContent.forEach((result, index) => {
      if (result.success) {
        enhancedTask += `\n\n---\n**Fetched Content from ${result.url}:**\n\n# ${result.title}\n\n${result.content}\n---\n`;
      } else {
        enhancedTask += `\n\n[Note: Failed to fetch ${result.url}: ${result.error}]`;
      }
    });

    return { task: enhancedTask, fetchedContent };
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

      // Detect and fetch URLs if present
      const { task: enhancedTask } = await this.detectAndFetchUrls(task);

      const systemPrompt = this.getSystemPrompt();
      const messages = [
        {
          role: 'user',
          content: enhancedTask
        }
      ];

      // Add conversation history if provided
      if (options.history && Array.isArray(options.history)) {
        messages.unshift(...options.history);
      }

      // Get tool definitions
      const tools = agentTools.getToolDefinitions();

      logger.info(`${this.name} has ${tools.length} tools available`, {
        toolNames: tools.map(t => t.name)
      });

      // Tool use loop - continue until we get a final response
      let finalResponse = null;
      let totalUsage = { input_tokens: 0, output_tokens: 0 };

      while (!finalResponse) {
        logger.info(`${this.name} calling Claude API with tools enabled`);

        const response = await this.provider.messages.create({
          model: this.model,
          max_tokens: this.maxTokens,
          temperature: this.temperature,
          system: systemPrompt,
          messages: messages,
          tools: tools
          // Removed tool_choice - let Claude decide when to stop using tools
        });

        logger.info(`${this.name} received response`, {
          contentBlocks: response.content.length,
          types: response.content.map(b => b.type)
        });

        // Track usage
        if (response.usage) {
          totalUsage.input_tokens += response.usage.input_tokens || 0;
          totalUsage.output_tokens += response.usage.output_tokens || 0;
        }

        // Check if Claude wants to use a tool
        const toolUse = response.content.find(block => block.type === 'tool_use');

        if (toolUse) {
          // Claude wants to use a tool - execute it
          logger.info(`${this.name} ✅ USING TOOL`, {
            tool: toolUse.name,
            input: toolUse.input
          });

          // Execute the tool
          const toolResult = await agentTools.executeTool(toolUse.name, toolUse.input);

          // Add assistant message with tool use
          messages.push({
            role: 'assistant',
            content: response.content
          });

          // Add tool result
          messages.push({
            role: 'user',
            content: [
              {
                type: 'tool_result',
                tool_use_id: toolUse.id,
                content: JSON.stringify(toolResult)
              }
            ]
          });

          // Continue loop to get next response
        } else {
          // No tool use - this is the final response
          const textContent = response.content.find(block => block.type === 'text');
          finalResponse = textContent ? textContent.text : '';
        }
      }

      // Fix spacing after periods in final response
      if (finalResponse) {
        finalResponse = finalResponse.replace(/\.([A-Z])/g, '. $1');
      }

      logger.info(`${this.name} completed task`, {
        type: this.type,
        responseLength: finalResponse.length,
        usage: totalUsage
      });

      return {
        success: true,
        agent: {
          name: this.name,
          type: this.type,
          icon: this.icon
        },
        response: finalResponse,
        usage: totalUsage,
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

      // Detect and fetch URLs if present
      const { task: enhancedTask } = await this.detectAndFetchUrls(task);

      const systemPrompt = this.getSystemPrompt();
      const messages = [
        {
          role: 'user',
          content: enhancedTask
        }
      ];

      // Add conversation history if provided
      if (options.history && Array.isArray(options.history)) {
        messages.unshift(...options.history);
      }

      // Get tool definitions
      const tools = agentTools.getToolDefinitions();

      logger.info(`${this.name} has ${tools.length} tools available for streaming`, {
        toolNames: tools.map(t => t.name)
      });

      // Tool use loop - continue until we get a final response
      let finalResponse = '';
      let continueLoop = true;

      while (continueLoop) {
        logger.info(`${this.name} calling Claude API with tools (streaming)`);

        const stream = await this.provider.messages.create({
          model: this.model,
          max_tokens: this.maxTokens,
          temperature: this.temperature,
          system: systemPrompt,
          messages: messages,
          tools: tools,
          // Removed tool_choice - let Claude decide when to stop using tools
          stream: true
        });

        let currentResponse = [];
        let toolUseBlock = null;
        let textBlock = '';

        for await (const event of stream) {
          if (event.type === 'content_block_start') {
            logger.info(`${this.name} content block started: ${event.content_block?.type}`);
            if (event.content_block.type === 'tool_use') {
              logger.info(`${this.name} 🔧 TOOL USE DETECTED: ${event.content_block.name}`);
              toolUseBlock = {
                type: 'tool_use',
                id: event.content_block.id,
                name: event.content_block.name,
                input: ''
              };
            }
          }

          if (event.type === 'content_block_delta') {
            if (event.delta.type === 'text_delta') {
              let chunk = event.delta.text;

              // Fix spacing after periods - ensure there's a space after period before capital letter
              chunk = chunk.replace(/\.([A-Z])/g, '. $1');

              textBlock += chunk;
              finalResponse += chunk;

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
            } else if (event.delta.type === 'input_json_delta' && toolUseBlock) {
              toolUseBlock.input += event.delta.partial_json;
            }
          }

          if (event.type === 'content_block_stop') {
            if (toolUseBlock) {
              try {
                toolUseBlock.input = JSON.parse(toolUseBlock.input);
                currentResponse.push(toolUseBlock);
              } catch (e) {
                logger.error(`${this.name} error parsing tool input`, {
                  error: e.message
                });
              }
              toolUseBlock = null;
            } else if (textBlock) {
              currentResponse.push({
                type: 'text',
                text: textBlock
              });
              textBlock = '';
            }
          }

          if (event.type === 'message_stop') {
            // Check if we have tool use
            logger.info(`${this.name} message complete, checking for tool use`, {
              contentBlocks: currentResponse.length,
              types: currentResponse.map(b => b.type)
            });

            const toolUse = currentResponse.find(block => block.type === 'tool_use');

            if (toolUse) {
              // Claude wants to use a tool
              logger.info(`${this.name} ✅ EXECUTING TOOL`, {
                tool: toolUse.name,
                input: toolUse.input
              });

              // Send tool use notification to client
              if (onChunk) {
                onChunk({
                  type: 'tool_use',
                  tool: toolUse.name,
                  agent: {
                    name: this.name,
                    type: this.type,
                    icon: this.icon
                  }
                });
              }

              // Execute the tool
              const toolResult = await agentTools.executeTool(toolUse.name, toolUse.input);

              // Add assistant message with tool use
              messages.push({
                role: 'assistant',
                content: currentResponse
              });

              // Add tool result
              messages.push({
                role: 'user',
                content: [
                  {
                    type: 'tool_result',
                    tool_use_id: toolUse.id,
                    content: JSON.stringify(toolResult)
                  }
                ]
              });

              // Continue loop
            } else {
              // No tool use - we're done
              logger.info(`${this.name} ❌ NO TOOL USE - returning text only`);
              continueLoop = false;

              // Fix spacing after periods in final response
              const cleanedResponse = finalResponse.replace(/\.([A-Z])/g, '. $1');

              logger.info(`${this.name} completed streaming task`, {
                type: this.type,
                responseLength: cleanedResponse.length
              });

              if (onChunk) {
                onChunk({
                  type: 'complete',
                  data: cleanedResponse,
                  agent: {
                    name: this.name,
                    type: this.type,
                    icon: this.icon
                  }
                });
              }

              // Update finalResponse for return value
              finalResponse = cleanedResponse;
            }
          }
        }
      }

      return {
        success: true,
        response: finalResponse
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
      imagePath: this.imagePath,
      personality: this.personality,
      role: this.role,
      skills: this.skills,
      catchphrase: this.catchphrase
    };
  }
}

export default BaseAgent;
