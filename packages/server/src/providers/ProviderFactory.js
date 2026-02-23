import BedrockProvider from './BedrockProvider.js';
import AnthropicProvider from './AnthropicProvider.js';
import logger from '../config/logger.js';

/**
 * Factory for creating AI provider instances
 * Manages provider instantiation and configuration
 */
class ProviderFactory {
  constructor() {
    this.providers = new Map();
    this.currentProvider = null;
  }

  /**
   * Create and register a provider
   * @param {string} type - Provider type (bedrock, anthropic)
   * @param {Object} config - Provider configuration
   * @returns {AIProvider} Provider instance
   */
  createProvider(type, config = {}) {
    let provider;

    switch (type) {
      case 'bedrock':
        provider = new BedrockProvider(config);
        break;

      case 'anthropic':
        provider = new AnthropicProvider(config);
        break;

      default:
        throw new Error(`Unknown provider type: ${type}`);
    }

    // Store provider instance
    this.providers.set(type, provider);

    logger.info('Provider created', {
      type,
      name: provider.name
    });

    return provider;
  }

  /**
   * Get an existing provider or create if not exists
   * @param {string} type - Provider type
   * @param {Object} config - Provider configuration
   * @returns {AIProvider} Provider instance
   */
  getProvider(type, config = {}) {
    if (!this.providers.has(type)) {
      return this.createProvider(type, config);
    }
    return this.providers.get(type);
  }

  /**
   * Set the current active provider
   * @param {string} type - Provider type
   * @param {Object} config - Provider configuration
   * @returns {AIProvider} Active provider instance
   */
  setCurrentProvider(type, config = {}) {
    this.currentProvider = this.getProvider(type, config);

    logger.info('Current provider set', {
      type: this.currentProvider.type,
      name: this.currentProvider.name
    });

    return this.currentProvider;
  }

  /**
   * Get the current active provider
   * @returns {AIProvider|null} Current provider or null
   */
  getCurrentProvider() {
    return this.currentProvider;
  }

  /**
   * List all available provider types
   * @returns {Array} Provider type information
   */
  getAvailableProviderTypes() {
    return [
      {
        type: 'bedrock',
        name: 'AWS Bedrock',
        description: 'AWS Bedrock Runtime for Claude models',
        requiresCredentials: true,
        credentialFields: ['region', 'profile']
      },
      {
        type: 'anthropic',
        name: 'Anthropic',
        description: 'Direct Anthropic API access',
        requiresCredentials: true,
        credentialFields: ['apiKey']
      }
    ];
  }

  /**
   * Get information about all registered providers
   * @returns {Array} Provider information
   */
  getRegisteredProviders() {
    return Array.from(this.providers.values()).map(provider => provider.getInfo());
  }

  /**
   * Validate credentials for a provider
   * @param {string} type - Provider type
   * @param {Object} config - Provider configuration
   * @returns {Promise<boolean>} True if valid
   */
  async validateProvider(type, config) {
    try {
      const provider = this.createProvider(type, config);
      const isValid = await provider.validateCredentials();
      return isValid;
    } catch (error) {
      logger.error('Provider validation failed', {
        type,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Clear all providers
   */
  clearProviders() {
    this.providers.clear();
    this.currentProvider = null;
  }
}

// Export singleton instance
const providerFactory = new ProviderFactory();
export default providerFactory;
