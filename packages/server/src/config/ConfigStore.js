import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * ConfigStore - Manages provider configurations, model preferences, and global settings
 * Persists to /data/config/providers.json
 */
class ConfigStore {
  constructor() {
    this.config = null;
    this.configPath = path.join(__dirname, '../../../data/config/providers.json');
    this.defaultConfig = {
      currentProvider: 'claude-cli',
      providers: {
        'claude-cli': {
          type: 'claude-cli',
          cliPath: 'claude',
          modelId: 'claude-3-5-sonnet-20241022',
          enabled: true
        },
        bedrock: {
          type: 'bedrock',
          region: 'us-east-1',
          modelId: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
          enabled: true
        },
        anthropic: {
          type: 'anthropic',
          apiKey: null, // Set from env or UI
          modelId: 'claude-3-5-sonnet-20241022',
          enabled: false
        }
      },
      agentDefaults: {
        explorer: { modelId: null, maxTokens: null },
        trader: { modelId: null, maxTokens: null },
        navigator: { modelId: null, maxTokens: null },
        archaeologist: { modelId: null, maxTokens: null },
        scout: { modelId: null, maxTokens: null },
        guide: { modelId: null, maxTokens: null }
      },
      globalSettings: {
        defaultMaxTokens: 4096,
        defaultTemperature: 1.0,
        streamingEnabled: true
      }
    };
  }

  /**
   * Load configuration from disk
   */
  async loadConfig() {
    try {
      // Ensure data directory exists
      await fs.mkdir(path.dirname(this.configPath), { recursive: true });
      logger.info('ConfigStore attempting to load', {
        path: this.configPath,
        defaultProvider: this.defaultConfig.currentProvider
      });

      // Try to read existing config
      try {
        const data = await fs.readFile(this.configPath, 'utf-8');
        this.config = JSON.parse(data);
        logger.info('ConfigStore loaded from disk', {
          path: this.configPath,
          currentProvider: this.config.currentProvider,
          providers: Object.keys(this.config.providers)
        });
      } catch (error) {
        // No existing config, use defaults
        logger.info('No existing config found, using defaults', {
          currentProvider: this.defaultConfig.currentProvider,
          defaultProviders: Object.keys(this.defaultConfig.providers)
        });
        this.config = JSON.parse(JSON.stringify(this.defaultConfig));
        await this.saveConfig();
        logger.info('Default config saved to disk', {
          currentProvider: this.config.currentProvider,
          path: this.configPath
        });
      }

      return this.config;
    } catch (error) {
      logger.error('Failed to load config', { error: error.message });
      this.config = JSON.parse(JSON.stringify(this.defaultConfig));
      return this.config;
    }
  }

  /**
   * Save configuration to disk
   */
  async saveConfig() {
    try {
      await fs.mkdir(path.dirname(this.configPath), { recursive: true });
      await fs.writeFile(
        this.configPath,
        JSON.stringify(this.config, null, 2),
        'utf-8'
      );
      logger.info('ConfigStore saved', { path: this.configPath });
      return true;
    } catch (error) {
      logger.error('Failed to save config', { error: error.message });
      return false;
    }
  }

  /**
   * Get current active provider configuration
   */
  getCurrentProvider() {
    if (!this.config) {
      // Return safe defaults before config is loaded - Use Claude CLI by default
      logger.info('getCurrentProvider: No config loaded yet, returning claude-cli default');
      return {
        type: 'claude-cli',
        cliPath: 'claude',
        modelId: 'claude-3-5-sonnet-20241022',
        enabled: true
      };
    }
    const providerType = this.config.currentProvider;
    logger.info('getCurrentProvider: Returning loaded config', {
      providerType,
      modelId: this.config.providers[providerType]?.modelId
    });
    return {
      type: providerType,
      ...this.config.providers[providerType]
    };
  }

  /**
   * Get current model ID
   */
  getCurrentModel() {
    if (!this.config) {
      return 'claude-3-5-sonnet-20241022';
    }
    const provider = this.getCurrentProvider();
    return provider.modelId;
  }

  /**
   * Set active provider
   */
  async setProvider(type, config = {}) {
    if (!this.config.providers[type]) {
      throw new Error(`Unknown provider type: ${type}`);
    }

    // Update provider config
    this.config.providers[type] = {
      ...this.config.providers[type],
      ...config,
      type
    };

    // Set as current
    this.config.currentProvider = type;

    await this.saveConfig();

    logger.info('Provider switched', { type, config });

    return this.getCurrentProvider();
  }

  /**
   * Get specific provider configuration
   */
  getProviderConfig(type) {
    if (!this.config.providers[type]) {
      throw new Error(`Unknown provider type: ${type}`);
    }
    return this.config.providers[type];
  }

  /**
   * Update provider configuration
   */
  async updateProviderConfig(type, updates) {
    if (!this.config.providers[type]) {
      throw new Error(`Unknown provider type: ${type}`);
    }

    this.config.providers[type] = {
      ...this.config.providers[type],
      ...updates
    };

    await this.saveConfig();

    logger.info('Provider config updated', { type, updates });

    return this.config.providers[type];
  }

  /**
   * Get agent-specific defaults
   */
  getAgentDefaults(agentType) {
    if (!this.config) {
      return {
        modelId: null,
        maxTokens: null
      };
    }
    if (!this.config.agentDefaults[agentType]) {
      return {
        modelId: null,
        maxTokens: null
      };
    }
    return this.config.agentDefaults[agentType];
  }

  /**
   * Set agent-specific defaults
   */
  async setAgentDefault(agentType, settings) {
    this.config.agentDefaults[agentType] = {
      ...this.config.agentDefaults[agentType],
      ...settings
    };

    await this.saveConfig();

    logger.info('Agent defaults updated', { agentType, settings });

    return this.config.agentDefaults[agentType];
  }

  /**
   * Get global settings
   */
  getGlobalSettings() {
    if (!this.config) {
      return {
        defaultMaxTokens: 4096,
        defaultTemperature: 1.0,
        streamingEnabled: true
      };
    }
    return this.config.globalSettings;
  }

  /**
   * Update global settings
   */
  async updateGlobalSettings(settings) {
    this.config.globalSettings = {
      ...this.config.globalSettings,
      ...settings
    };

    await this.saveConfig();

    logger.info('Global settings updated', { settings });

    return this.config.globalSettings;
  }

  /**
   * Get all providers
   */
  getAllProviders() {
    return this.config.providers;
  }

  /**
   * Get entire configuration
   */
  getConfig() {
    return this.config;
  }
}

// Export singleton instance
const configStore = new ConfigStore();
export default configStore;
