import express from 'express';
import configStore from '../config/ConfigStore.js';
import promptManager from '../prompts/PromptManager.js';
import providerFactory from '../providers/ProviderFactory.js';
import logger from '../config/logger.js';

const router = express.Router();

// ============================================
// Provider Management
// ============================================

/**
 * GET /api/config/providers
 * List all providers
 */
router.get('/providers', async (req, res) => {
  try {
    const providers = configStore.getAllProviders();
    const currentProvider = configStore.getCurrentProvider();

    res.json({
      success: true,
      data: {
        providers,
        currentProvider: currentProvider.type
      }
    });
  } catch (error) {
    logger.error('Failed to get providers', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/config/providers/types
 * Available provider types
 */
router.get('/providers/types', (req, res) => {
  try {
    const types = providerFactory.getAvailableProviderTypes();

    res.json({
      success: true,
      data: types
    });
  } catch (error) {
    logger.error('Failed to get provider types', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/config/providers/current
 * Get current active provider
 */
router.get('/providers/current', async (req, res) => {
  try {
    const provider = configStore.getCurrentProvider();

    res.json({
      success: true,
      data: provider
    });
  } catch (error) {
    logger.error('Failed to get current provider', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/config/providers/current
 * Set active provider
 */
router.post('/providers/current', async (req, res) => {
  try {
    const { type, config } = req.body;

    if (!type) {
      return res.status(400).json({
        success: false,
        error: 'Provider type is required'
      });
    }

    // Update config store
    const provider = await configStore.setProvider(type, config || {});

    // Update provider factory
    providerFactory.setCurrentProvider(type, provider);

    res.json({
      success: true,
      data: provider
    });
  } catch (error) {
    logger.error('Failed to set current provider', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/config/providers/:type
 * Get provider config
 */
router.get('/providers/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const config = configStore.getProviderConfig(type);

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    logger.error('Failed to get provider config', { error: error.message });
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/config/providers/:type
 * Update provider config
 */
router.put('/providers/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const updates = req.body;

    const config = await configStore.updateProviderConfig(type, updates);

    // If this is the current provider, update factory
    const currentProvider = configStore.getCurrentProvider();
    if (currentProvider.type === type) {
      providerFactory.setCurrentProvider(type, config);
    }

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    logger.error('Failed to update provider config', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/config/providers/:type/validate
 * Validate provider credentials
 */
router.post('/providers/:type/validate', async (req, res) => {
  try {
    const { type } = req.params;
    const config = req.body;

    const isValid = await providerFactory.validateProvider(type, config);

    res.json({
      success: true,
      data: { valid: isValid }
    });
  } catch (error) {
    logger.error('Failed to validate provider', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// Model Management
// ============================================

/**
 * GET /api/config/models
 * All models from current provider
 */
router.get('/models', async (req, res) => {
  try {
    const currentProvider = providerFactory.getCurrentProvider();

    if (!currentProvider) {
      return res.status(400).json({
        success: false,
        error: 'No provider configured'
      });
    }

    const models = currentProvider.getAvailableModels();

    res.json({
      success: true,
      data: models
    });
  } catch (error) {
    logger.error('Failed to get models', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/config/models/current
 * Currently selected model
 * NOTE: Must be defined BEFORE /models/:provider to avoid matching conflict
 */
router.get('/models/current', async (req, res) => {
  try {
    const modelId = configStore.getCurrentModel();
    const provider = configStore.getCurrentProvider();

    res.json({
      success: true,
      data: {
        modelId,
        provider: provider.type
      }
    });
  } catch (error) {
    logger.error('Failed to get current model', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/config/models/current
 * Set current model
 */
router.post('/models/current', async (req, res) => {
  try {
    const { modelId } = req.body;

    if (!modelId) {
      return res.status(400).json({
        success: false,
        error: 'Model ID is required'
      });
    }

    const currentProvider = configStore.getCurrentProvider();
    await configStore.updateProviderConfig(currentProvider.type, { modelId });

    res.json({
      success: true,
      data: { modelId, provider: currentProvider.type }
    });
  } catch (error) {
    logger.error('Failed to set current model', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/config/models/:provider
 * Models for specific provider
 * NOTE: Must be defined AFTER /models/current to avoid matching conflict
 */
router.get('/models/:provider', async (req, res) => {
  try {
    const { provider: providerType } = req.params;
    const config = configStore.getProviderConfig(providerType);
    const provider = providerFactory.getProvider(providerType, config);

    const models = provider.getAvailableModels();

    res.json({
      success: true,
      data: models
    });
  } catch (error) {
    logger.error('Failed to get provider models', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// Prompt Management
// ============================================

/**
 * GET /api/config/prompts
 * List all agent prompts
 */
router.get('/prompts', async (req, res) => {
  try {
    const prompts = promptManager.getAllPrompts();

    res.json({
      success: true,
      data: prompts
    });
  } catch (error) {
    logger.error('Failed to get prompts', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/config/prompts/:agentType
 * Get prompt for agent
 */
router.get('/prompts/:agentType', async (req, res) => {
  try {
    const { agentType } = req.params;
    let prompt = promptManager.getPrompt(agentType);

    if (!prompt) {
      // Try loading from disk
      prompt = await promptManager.loadPrompt(agentType);
    }

    res.json({
      success: true,
      data: prompt
    });
  } catch (error) {
    logger.error('Failed to get prompt', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/config/prompts/:agentType
 * Update prompt
 */
router.put('/prompts/:agentType', async (req, res) => {
  try {
    const { agentType } = req.params;
    const updates = req.body;

    const prompt = await promptManager.updatePrompt(agentType, updates);

    res.json({
      success: true,
      data: prompt
    });
  } catch (error) {
    logger.error('Failed to update prompt', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/config/prompts/:agentType/versions
 * Version history
 */
router.get('/prompts/:agentType/versions', async (req, res) => {
  try {
    const { agentType } = req.params;
    const versions = promptManager.listVersions(agentType);

    res.json({
      success: true,
      data: versions
    });
  } catch (error) {
    logger.error('Failed to get prompt versions', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/config/prompts/:agentType/revert
 * Revert to version
 */
router.post('/prompts/:agentType/revert', async (req, res) => {
  try {
    const { agentType } = req.params;
    const { version } = req.body;

    if (!version) {
      return res.status(400).json({
        success: false,
        error: 'Version is required'
      });
    }

    const prompt = await promptManager.revertTo(agentType, version);

    res.json({
      success: true,
      data: prompt
    });
  } catch (error) {
    logger.error('Failed to revert prompt', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/config/prompts/:agentType/export
 * Export prompt
 */
router.post('/prompts/:agentType/export', async (req, res) => {
  try {
    const { agentType } = req.params;
    const json = await promptManager.exportPrompt(agentType);

    res.json({
      success: true,
      data: { json }
    });
  } catch (error) {
    logger.error('Failed to export prompt', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/config/prompts/:agentType/import
 * Import prompt
 */
router.post('/prompts/:agentType/import', async (req, res) => {
  try {
    const { agentType } = req.params;
    const { json } = req.body;

    if (!json) {
      return res.status(400).json({
        success: false,
        error: 'JSON data is required'
      });
    }

    const prompt = await promptManager.importPrompt(agentType, json);

    res.json({
      success: true,
      data: prompt
    });
  } catch (error) {
    logger.error('Failed to import prompt', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// Global Settings
// ============================================

/**
 * GET /api/config/settings
 * Get all settings
 */
router.get('/settings', async (req, res) => {
  try {
    const settings = configStore.getGlobalSettings();

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    logger.error('Failed to get settings', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/config/settings
 * Update settings
 */
router.put('/settings', async (req, res) => {
  try {
    const updates = req.body;
    const settings = await configStore.updateGlobalSettings(updates);

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    logger.error('Failed to update settings', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/config/agents/:type
 * Agent-specific config
 */
router.get('/agents/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const config = configStore.getAgentDefaults(type);

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    logger.error('Failed to get agent config', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/config/agents/:type
 * Update agent config
 */
router.put('/agents/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const updates = req.body;

    const config = await configStore.setAgentDefault(type, updates);

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    logger.error('Failed to update agent config', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
