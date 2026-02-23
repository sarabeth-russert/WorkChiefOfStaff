/**
 * Abstract base class for AI providers
 * Provides consistent interface across different AI services
 */
class AIProvider {
  constructor(config = {}) {
    this.config = config;
    this.name = 'base';
    this.type = 'base';
  }

  /**
   * Get provider information
   * @returns {Object} Provider info
   */
  getInfo() {
    return {
      name: this.name,
      type: this.type,
      models: this.getAvailableModels(),
      requiresCredentials: this.requiresCredentials()
    };
  }

  /**
   * Create a non-streaming message
   * @param {Object} params - Message parameters
   * @returns {Promise<Object>} Response
   */
  async createMessage(params) {
    throw new Error('createMessage() must be implemented by subclass');
  }

  /**
   * Create a streaming message
   * @param {Object} params - Message parameters
   * @returns {AsyncGenerator} Streaming response
   */
  async *createStreamingMessage(params) {
    throw new Error('createStreamingMessage() must be implemented by subclass');
  }

  /**
   * Get available models for this provider
   * @returns {Array} List of model objects
   */
  getAvailableModels() {
    throw new Error('getAvailableModels() must be implemented by subclass');
  }

  /**
   * Validate provider credentials/configuration
   * @returns {Promise<boolean>} True if valid
   */
  async validateCredentials() {
    throw new Error('validateCredentials() must be implemented by subclass');
  }

  /**
   * Check if provider requires credentials
   * @returns {boolean}
   */
  requiresCredentials() {
    return true;
  }

  /**
   * Get default model for this provider
   * @returns {string} Model ID
   */
  getDefaultModel() {
    const models = this.getAvailableModels();
    return models.length > 0 ? models[0].id : null;
  }

  /**
   * Messages API wrapper (mimics Anthropic SDK interface)
   */
  get messages() {
    return {
      create: async (params) => {
        if (params.stream) {
          return this.createStreamingMessage(params);
        } else {
          return this.createMessage(params);
        }
      }
    };
  }
}

export default AIProvider;
