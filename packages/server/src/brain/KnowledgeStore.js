import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Stores and manages knowledge items
 */
class KnowledgeStore {
  constructor() {
    this.knowledgePath = path.resolve(__dirname, '../../data/knowledge/items.json');
    this.items = [];
    this.loadItems();
  }

  /**
   * Load knowledge items from file
   */
  loadItems() {
    try {
      if (fs.existsSync(this.knowledgePath)) {
        const data = fs.readFileSync(this.knowledgePath, 'utf8');
        this.items = JSON.parse(data);
        logger.info('Loaded knowledge items', { count: this.items.length });
      } else {
        this.items = [];
        this.saveItems();
      }
    } catch (error) {
      logger.error('Error loading knowledge items', error);
      this.items = [];
    }
  }

  /**
   * Save knowledge items to file
   */
  saveItems() {
    try {
      fs.writeFileSync(
        this.knowledgePath,
        JSON.stringify(this.items, null, 2),
        'utf8'
      );
      logger.info('Saved knowledge items', { count: this.items.length });
    } catch (error) {
      logger.error('Error saving knowledge items', error);
    }
  }

  /**
   * Add a knowledge item
   * @param {Object} itemData - Item data
   * @returns {Object} Created item
   */
  addItem(itemData) {
    const item = {
      id: itemData.id || Date.now().toString(),
      title: itemData.title,
      content: itemData.content,
      category: itemData.category || 'general',
      tags: itemData.tags || [],
      type: itemData.type || 'note', // note, code, link, doc
      metadata: itemData.metadata || {},
      source: itemData.source || 'manual',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      accessCount: 0,
      lastAccessedAt: null
    };

    this.items.push(item);
    this.saveItems();

    logger.info('Knowledge item added', { itemId: item.id, title: item.title });
    return item;
  }

  /**
   * Get an item by ID
   * @param {string} itemId - Item ID
   * @returns {Object|null} Item
   */
  getItem(itemId) {
    const item = this.items.find(i => i.id === itemId);

    if (item) {
      // Update access tracking
      item.accessCount++;
      item.lastAccessedAt = new Date().toISOString();
      this.saveItems();
    }

    return item || null;
  }

  /**
   * Update an item
   * @param {string} itemId - Item ID
   * @param {Object} updates - Updates to apply
   * @returns {Object|null} Updated item
   */
  updateItem(itemId, updates) {
    const index = this.items.findIndex(i => i.id === itemId);
    if (index === -1) {
      return null;
    }

    this.items[index] = {
      ...this.items[index],
      ...updates,
      id: itemId, // Ensure ID doesn't change
      updatedAt: new Date().toISOString()
    };

    this.saveItems();

    logger.info('Knowledge item updated', { itemId });
    return this.items[index];
  }

  /**
   * Delete an item
   * @param {string} itemId - Item ID
   * @returns {boolean} Success
   */
  deleteItem(itemId) {
    const index = this.items.findIndex(i => i.id === itemId);
    if (index === -1) {
      return false;
    }

    this.items.splice(index, 1);
    this.saveItems();

    logger.info('Knowledge item deleted', { itemId });
    return true;
  }

  /**
   * Get all items
   * @param {Object} options - Query options
   * @returns {Array} Items
   */
  getAllItems(options = {}) {
    let items = [...this.items];

    // Filter by category
    if (options.category) {
      items = items.filter(i => i.category === options.category);
    }

    // Filter by type
    if (options.type) {
      items = items.filter(i => i.type === options.type);
    }

    // Filter by tag
    if (options.tag) {
      items = items.filter(i => i.tags.includes(options.tag));
    }

    // Sort
    if (options.sortBy) {
      items.sort((a, b) => {
        const aVal = a[options.sortBy];
        const bVal = b[options.sortBy];

        if (options.sortOrder === 'desc') {
          return bVal > aVal ? 1 : -1;
        }
        return aVal > bVal ? 1 : -1;
      });
    }

    // Limit
    if (options.limit) {
      items = items.slice(0, options.limit);
    }

    return items;
  }

  /**
   * Search items by text
   * @param {string} query - Search query
   * @returns {Array} Matching items
   */
  searchItems(query) {
    const lowerQuery = query.toLowerCase();

    return this.items.filter(item =>
      item.title.toLowerCase().includes(lowerQuery) ||
      item.content.toLowerCase().includes(lowerQuery) ||
      item.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Get all categories
   * @returns {Array} Categories with counts
   */
  getCategories() {
    const categoryCounts = {};

    for (const item of this.items) {
      categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
    }

    return Object.entries(categoryCounts).map(([name, count]) => ({
      name,
      count
    }));
  }

  /**
   * Get all tags
   * @returns {Array} Tags with counts
   */
  getTags() {
    const tagCounts = {};

    for (const item of this.items) {
      for (const tag of item.tags) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
    }

    return Object.entries(tagCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Get statistics
   * @returns {Object} Statistics
   */
  getStats() {
    const totalItems = this.items.length;
    const categories = this.getCategories();
    const tags = this.getTags();

    // Count by type
    const typeCount = {};
    for (const item of this.items) {
      typeCount[item.type] = (typeCount[item.type] || 0) + 1;
    }

    // Most accessed items
    const mostAccessed = [...this.items]
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, 5)
      .map(item => ({
        id: item.id,
        title: item.title,
        accessCount: item.accessCount
      }));

    return {
      totalItems,
      categories,
      tags: tags.slice(0, 10), // Top 10 tags
      typeCount,
      mostAccessed
    };
  }
}

// Export singleton instance
const knowledgeStore = new KnowledgeStore();
export default knowledgeStore;
