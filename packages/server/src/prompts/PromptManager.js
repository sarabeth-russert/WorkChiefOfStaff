import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * PromptManager - Manages agent system prompts with versioning
 * Persists to /data/prompts/{agentType}.json
 */
class PromptManager {
  constructor() {
    this.prompts = new Map();
    this.promptsDir = path.join(__dirname, '../../../data/prompts');
  }

  /**
   * Get prompt file path for agent
   */
  getPromptPath(agentType) {
    return path.join(this.promptsDir, `${agentType}.json`);
  }

  /**
   * Load prompt for specific agent
   */
  async loadPrompt(agentType) {
    try {
      const promptPath = this.getPromptPath(agentType);
      const data = await fs.readFile(promptPath, 'utf-8');
      const prompt = JSON.parse(data);
      this.prompts.set(agentType, prompt);

      logger.info('Prompt loaded', { agentType, version: prompt.version });

      return prompt;
    } catch (error) {
      // Prompt doesn't exist, return null (will use default from agent class)
      logger.info('No custom prompt found, will use default', { agentType });
      return null;
    }
  }

  /**
   * Load all prompts from disk
   */
  async loadAll() {
    try {
      await fs.mkdir(this.promptsDir, { recursive: true });

      const files = await fs.readdir(this.promptsDir);
      const jsonFiles = files.filter(f => f.endsWith('.json'));

      for (const file of jsonFiles) {
        const agentType = file.replace('.json', '');
        await this.loadPrompt(agentType);
      }

      logger.info('All prompts loaded', { count: this.prompts.size });
    } catch (error) {
      logger.error('Failed to load all prompts', { error: error.message });
    }
  }

  /**
   * Save prompt for agent
   */
  async savePrompt(agentType, promptData) {
    try {
      await fs.mkdir(this.promptsDir, { recursive: true });

      // Add to history if updating existing prompt
      const existing = this.prompts.get(agentType);
      if (existing) {
        if (!promptData.history) {
          promptData.history = existing.history || [];
        }
        promptData.history.push({
          version: existing.version,
          timestamp: new Date().toISOString(),
          changes: 'Updated via PromptManager'
        });
      } else {
        // Initialize history for new prompt
        promptData.history = [{
          version: promptData.version || '1.0.0',
          timestamp: new Date().toISOString(),
          changes: 'Initial version'
        }];
      }

      // Increment version
      if (!promptData.version) {
        promptData.version = '1.0.0';
      }

      const promptPath = this.getPromptPath(agentType);
      await fs.writeFile(
        promptPath,
        JSON.stringify(promptData, null, 2),
        'utf-8'
      );

      this.prompts.set(agentType, promptData);

      logger.info('Prompt saved', {
        agentType,
        version: promptData.version
      });

      return promptData;
    } catch (error) {
      logger.error('Failed to save prompt', {
        agentType,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get prompt for agent (specific version or latest)
   */
  getPrompt(agentType, version = null) {
    const prompt = this.prompts.get(agentType);

    if (!prompt) {
      return null;
    }

    if (version && prompt.history) {
      // Find specific version in history
      const historical = prompt.history.find(h => h.version === version);
      if (historical) {
        return historical;
      }
    }

    return prompt;
  }

  /**
   * Update prompt for agent
   */
  async updatePrompt(agentType, updates) {
    const existing = this.prompts.get(agentType) || {
      agentType,
      version: '1.0.0',
      prompts: {},
      templates: {},
      variables: {},
      history: []
    };

    const updated = {
      ...existing,
      ...updates,
      agentType // Ensure agentType is preserved
    };

    // Increment version
    const [major, minor, patch] = existing.version.split('.').map(Number);
    updated.version = `${major}.${minor}.${patch + 1}`;

    return await this.savePrompt(agentType, updated);
  }

  /**
   * List all versions for agent
   */
  listVersions(agentType) {
    const prompt = this.prompts.get(agentType);

    if (!prompt || !prompt.history) {
      return [];
    }

    return prompt.history.map(h => ({
      version: h.version,
      timestamp: h.timestamp,
      changes: h.changes
    }));
  }

  /**
   * Revert to specific version
   */
  async revertTo(agentType, version) {
    const prompt = this.prompts.get(agentType);

    if (!prompt || !prompt.history) {
      throw new Error(`No prompt history found for ${agentType}`);
    }

    const historical = prompt.history.find(h => h.version === version);

    if (!historical) {
      throw new Error(`Version ${version} not found for ${agentType}`);
    }

    // Create new version based on historical one
    const reverted = {
      ...prompt,
      ...historical,
      version: `${version}-restored`,
      history: [...prompt.history, {
        version: prompt.version,
        timestamp: new Date().toISOString(),
        changes: `Reverted to version ${version}`
      }]
    };

    return await this.savePrompt(agentType, reverted);
  }

  /**
   * Compile prompt with variables
   */
  compilePrompt(agentType, variables = {}) {
    const prompt = this.prompts.get(agentType);

    if (!prompt) {
      return null;
    }

    // Simple string interpolation for templates
    const compiled = { ...prompt };

    if (prompt.templates) {
      compiled.compiledTemplates = {};

      for (const [key, template] of Object.entries(prompt.templates)) {
        let result = template;

        // Replace {variable} with values
        for (const [varKey, varValue] of Object.entries(variables)) {
          result = result.replace(new RegExp(`\\{${varKey}\\}`, 'g'), varValue);
        }

        // Also use prompt.variables as defaults
        if (prompt.variables) {
          for (const [varKey, varValue] of Object.entries(prompt.variables)) {
            result = result.replace(new RegExp(`\\{${varKey}\\}`, 'g'), varValue);
          }
        }

        compiled.compiledTemplates[key] = result;
      }
    }

    return compiled;
  }

  /**
   * Export prompt as JSON
   */
  async exportPrompt(agentType) {
    const prompt = this.prompts.get(agentType);

    if (!prompt) {
      throw new Error(`No prompt found for ${agentType}`);
    }

    return JSON.stringify(prompt, null, 2);
  }

  /**
   * Import prompt from JSON
   */
  async importPrompt(agentType, data) {
    try {
      const prompt = typeof data === 'string' ? JSON.parse(data) : data;

      // Ensure agentType matches
      prompt.agentType = agentType;

      return await this.savePrompt(agentType, prompt);
    } catch (error) {
      logger.error('Failed to import prompt', {
        agentType,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get all loaded prompts
   */
  getAllPrompts() {
    return Object.fromEntries(this.prompts);
  }

  /**
   * Check if agent has custom prompt
   */
  hasCustomPrompt(agentType) {
    return this.prompts.has(agentType);
  }
}

// Export singleton instance
const promptManager = new PromptManager();
export default promptManager;
