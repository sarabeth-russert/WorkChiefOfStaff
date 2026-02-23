import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Registry for managing application metadata
 */
class AppRegistry {
  constructor() {
    this.registryPath = path.resolve(__dirname, '../../data/apps.json');
    this.apps = [];
    this.loadApps();
  }

  /**
   * Load apps from registry file
   */
  loadApps() {
    try {
      if (fs.existsSync(this.registryPath)) {
        const data = fs.readFileSync(this.registryPath, 'utf8');
        this.apps = JSON.parse(data);
        logger.info('Loaded app registry', { count: this.apps.length });
      } else {
        this.apps = [];
        this.saveApps();
      }
    } catch (error) {
      logger.error('Error loading app registry', error);
      this.apps = [];
    }
  }

  /**
   * Save apps to registry file
   */
  saveApps() {
    try {
      fs.writeFileSync(
        this.registryPath,
        JSON.stringify(this.apps, null, 2),
        'utf8'
      );
      logger.info('Saved app registry', { count: this.apps.length });
    } catch (error) {
      logger.error('Error saving app registry', error);
    }
  }

  /**
   * Get all registered apps
   * @returns {Array} List of apps
   */
  getAllApps() {
    return this.apps;
  }

  /**
   * Get an app by ID
   * @param {string} appId - App ID
   * @returns {Object|null} App info
   */
  getApp(appId) {
    return this.apps.find(app => app.id === appId) || null;
  }

  /**
   * Register a new app
   * @param {Object} appData - App data
   * @returns {Object} Registered app
   */
  registerApp(appData) {
    const app = {
      id: appData.id || Date.now().toString(),
      name: appData.name,
      description: appData.description || '',
      pm2Name: appData.pm2Name || appData.name,
      port: appData.port || null,
      type: appData.type || 'node', // node, npm, static, etc.
      script: appData.script || null,
      cwd: appData.cwd || null,
      env: appData.env || {},
      tags: appData.tags || [],
      category: appData.category || 'general',
      icon: appData.icon || '📦',
      healthCheck: appData.healthCheck || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.apps.push(app);
    this.saveApps();

    logger.info('App registered', { appId: app.id, name: app.name });
    return app;
  }

  /**
   * Update an app
   * @param {string} appId - App ID
   * @param {Object} updates - Updates to apply
   * @returns {Object|null} Updated app
   */
  updateApp(appId, updates) {
    const index = this.apps.findIndex(app => app.id === appId);
    if (index === -1) {
      return null;
    }

    this.apps[index] = {
      ...this.apps[index],
      ...updates,
      id: appId, // Ensure ID doesn't change
      updatedAt: new Date().toISOString()
    };

    this.saveApps();

    logger.info('App updated', { appId, updates: Object.keys(updates) });
    return this.apps[index];
  }

  /**
   * Unregister an app
   * @param {string} appId - App ID
   * @returns {boolean} Success
   */
  unregisterApp(appId) {
    const index = this.apps.findIndex(app => app.id === appId);
    if (index === -1) {
      return false;
    }

    this.apps.splice(index, 1);
    this.saveApps();

    logger.info('App unregistered', { appId });
    return true;
  }

  /**
   * Search apps by query
   * @param {string} query - Search query
   * @returns {Array} Matching apps
   */
  searchApps(query) {
    const lowerQuery = query.toLowerCase();
    return this.apps.filter(app =>
      app.name.toLowerCase().includes(lowerQuery) ||
      app.description.toLowerCase().includes(lowerQuery) ||
      app.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Get apps by category
   * @param {string} category - Category name
   * @returns {Array} Apps in category
   */
  getAppsByCategory(category) {
    return this.apps.filter(app => app.category === category);
  }

  /**
   * Get all categories
   * @returns {Array} List of categories
   */
  getCategories() {
    const categories = new Set(this.apps.map(app => app.category));
    return Array.from(categories);
  }
}

// Export singleton instance
const appRegistry = new AppRegistry();
export default appRegistry;
