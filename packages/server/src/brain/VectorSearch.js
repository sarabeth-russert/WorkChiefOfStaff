import providerFactory from '../providers/ProviderFactory.js';
import configStore from '../config/ConfigStore.js';
import logger from '../config/logger.js';
import knowledgeStore from './KnowledgeStore.js';

/**
 * Semantic search using Claude for relevance scoring
 */
class VectorSearch {
  constructor() {
    this.provider = providerFactory.getCurrentProvider();

    // If no provider set, create default
    if (!this.provider) {
      const defaultConfig = configStore.getCurrentProvider();
      this.provider = providerFactory.setCurrentProvider(defaultConfig.type, defaultConfig);
    }

    this.model = configStore.getCurrentModel();
  }

  /**
   * Perform semantic search on knowledge items
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Sorted results
   */
  async search(query, options = {}) {
    const {
      limit = 10,
      category = null,
      type = null,
      minRelevance = 0.5
    } = options;

    try {
      // Get all items (with optional filters)
      let items = knowledgeStore.getAllItems({ category, type });

      if (items.length === 0) {
        return [];
      }

      // If query is short, do simple text search
      if (query.length < 10) {
        return knowledgeStore.searchItems(query).slice(0, limit);
      }

      // Use Claude to rank items by relevance
      const itemTexts = items.map(item => ({
        id: item.id,
        text: `Title: ${item.title}\nContent: ${item.content}\nTags: ${item.tags.join(', ')}`
      }));

      // Create prompt for Claude to rank items
      const prompt = `Given the following search query and list of knowledge items, rate each item's relevance to the query on a scale of 0.0 to 1.0.

Query: "${query}"

Items:
${itemTexts.map((item, idx) => `[${idx}] ${item.text.substring(0, 500)}`).join('\n\n')}

Return ONLY a JSON array with objects containing "index" (0-based) and "relevance" (0.0-1.0) for each item.
Format: [{"index": 0, "relevance": 0.9}, {"index": 1, "relevance": 0.7}, ...]`;

      const response = await this.provider.messages.create({
        model: this.model,
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const responseText = response.content[0].text;

      // Parse JSON response
      let scores;
      try {
        // Extract JSON from response (handle markdown code blocks)
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          scores = JSON.parse(jsonMatch[0]);
        } else {
          scores = JSON.parse(responseText);
        }
      } catch (error) {
        logger.error('Error parsing Claude relevance scores', { error: error.message });
        // Fallback to text search
        return knowledgeStore.searchItems(query).slice(0, limit);
      }

      // Combine scores with items
      const rankedItems = scores
        .filter(score => score.relevance >= minRelevance)
        .map(score => ({
          ...items[score.index],
          relevance: score.relevance
        }))
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, limit);

      logger.info('Semantic search completed', {
        query,
        resultsCount: rankedItems.length,
        totalItems: items.length
      });

      return rankedItems;

    } catch (error) {
      logger.error('Error in semantic search', {
        query,
        error: error.message
      });

      // Fallback to simple text search
      return knowledgeStore.searchItems(query).slice(0, limit);
    }
  }

  /**
   * Auto-classify a knowledge item
   * @param {string} title - Item title
   * @param {string} content - Item content
   * @returns {Promise<Object>} Classification result
   */
  async classifyItem(title, content) {
    try {
      const prompt = `Given this knowledge item, suggest:
1. An appropriate category (choose from: code, documentation, tutorial, reference, note, idea, link, general)
2. Relevant tags (3-5 tags)

Title: ${title}
Content: ${content.substring(0, 1000)}

Return ONLY a JSON object with "category" (string) and "tags" (array of strings).
Format: {"category": "code", "tags": ["javascript", "react", "hooks"]}`;

      const response = await this.provider.messages.create({
        model: this.model,
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const responseText = response.content[0].text;

      // Parse JSON response
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
        return JSON.parse(responseText);
      } catch (error) {
        logger.error('Error parsing classification result', { error: error.message });
        return {
          category: 'general',
          tags: []
        };
      }

    } catch (error) {
      logger.error('Error classifying item', { error: error.message });
      return {
        category: 'general',
        tags: []
      };
    }
  }

  /**
   * Get similar items to a given item
   * @param {string} itemId - Item ID
   * @param {number} limit - Number of similar items to return
   * @returns {Promise<Array>} Similar items
   */
  async findSimilar(itemId, limit = 5) {
    const item = knowledgeStore.getItem(itemId);
    if (!item) {
      return [];
    }

    const query = `${item.title} ${item.tags.join(' ')}`;
    const results = await this.search(query, { limit: limit + 1 });

    // Remove the original item from results
    return results.filter(r => r.id !== itemId).slice(0, limit);
  }
}

// Export singleton instance
const vectorSearch = new VectorSearch();
export default vectorSearch;
