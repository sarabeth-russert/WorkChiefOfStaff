import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import logger from '../config/logger.js';

/**
 * Jira Integration Manager
 * Handles interaction with both Jira Cloud and Jira Server/Data Center APIs
 */
class JiraManager {
  constructor() {
    this.domain = null;
    this.username = null; // email for Cloud, username for Server
    this.apiToken = null; // API token for Cloud, password/token for Server
    this.jiraType = null; // 'cloud' or 'server'
    this.authMethod = 'bearer'; // 'bearer' or 'basic'
    this.configured = false;

    // Configuration file path
    this.configPath = path.join(process.cwd(), 'data', 'jira.json');

    // Load saved configuration on startup
    this.loadConfig();
  }

  /**
   * Load configuration from file
   */
  loadConfig() {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, 'utf8');
        const config = JSON.parse(data);

        // Restore configuration
        this.domain = config.domain;
        this.username = config.username;
        this.apiToken = config.apiToken;
        this.authMethod = config.authMethod || 'bearer';
        this.jiraType = config.jiraType;
        this.configured = !!(this.domain && this.apiToken);

        if (this.configured) {
          logger.info('Jira configuration loaded from file', {
            domain: this.domain,
            type: this.jiraType,
            authMethod: this.authMethod
          });
        }
      }
    } catch (error) {
      logger.error('Error loading Jira configuration', { error: error.message });
    }
  }

  /**
   * Save configuration to file
   */
  saveConfig() {
    try {
      const config = {
        domain: this.domain,
        username: this.username,
        apiToken: this.apiToken,
        authMethod: this.authMethod,
        jiraType: this.jiraType,
        lastUpdated: new Date().toISOString()
      };

      // Ensure data directory exists
      const dataDir = path.dirname(this.configPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2), 'utf8');
      logger.info('Jira configuration saved to file');
    } catch (error) {
      logger.error('Error saving Jira configuration', { error: error.message });
    }
  }

  /**
   * Configure Jira connection
   * @param {Object} config - Jira configuration
   */
  configure(config) {
    this.domain = config.domain; // e.g., "yourcompany.atlassian.net" or "jira.company.com"
    this.username = config.username || config.email; // Accept both for compatibility
    this.apiToken = config.apiToken;

    // Detect authentication method
    // PAT (Personal Access Token) = Bearer auth
    // API Token/Password = Basic auth
    this.authMethod = config.authMethod || 'bearer'; // Default to Bearer for PAT

    // Auto-detect Jira type based on domain
    if (config.jiraType) {
      this.jiraType = config.jiraType;
    } else {
      this.jiraType = this.domain?.includes('atlassian.net') ? 'cloud' : 'server';
    }

    this.configured = !!(this.domain && this.apiToken);
    // Username only required for Basic auth
    if (this.authMethod === 'basic' && !this.username) {
      this.configured = false;
    }

    if (this.configured) {
      logger.info('Jira configured', {
        domain: this.domain,
        username: this.username,
        type: this.jiraType,
        authMethod: this.authMethod
      });

      // Save configuration to file
      this.saveConfig();
    }
  }

  /**
   * Get authorization header
   * Supports both Bearer (PAT) and Basic (username:password) auth
   */
  getAuthHeader() {
    if (this.authMethod === 'bearer') {
      // PAT (Personal Access Token) - Bearer authentication
      return `Bearer ${this.apiToken}`;
    } else {
      // Basic authentication (username:password or username:token)
      const auth = Buffer.from(`${this.username}:${this.apiToken}`).toString('base64');
      return `Basic ${auth}`;
    }
  }

  /**
   * Get API version based on Jira type
   */
  getApiVersion() {
    return this.jiraType === 'cloud' ? '3' : '2';
  }

  /**
   * Make Jira API request
   */
  async makeRequest(endpoint, options = {}) {
    if (!this.configured) {
      throw new Error('Jira not configured. Please add credentials in Settings.');
    }

    const apiVersion = this.getApiVersion();
    const url = `https://${this.domain}/rest/api/${apiVersion}${endpoint}`;

    // Log request details for debugging
    logger.info('Jira API request', {
      url,
      endpoint,
      apiVersion,
      type: this.jiraType,
      username: this.username,
      method: options.method || 'GET'
    });

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': this.getAuthHeader(),
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Jira API error', {
        url,
        endpoint,
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        type: this.jiraType,
        username: this.username,
        authMethod: this.authMethod
      });
      throw new Error(`Jira API error: ${response.status} ${response.statusText}`);
    }

    // Get response text first to check if it's HTML (expired token)
    const responseText = await response.text();

    // Check if we got an HTML login page instead of JSON (token expired)
    if (responseText.includes('<!DOCTYPE') || responseText.includes('<html')) {
      logger.error('Jira returned HTML instead of JSON - token may be expired');
      throw new Error('JIRA token expired or invalid — received login page instead of JSON. Please regenerate your PAT.');
    }

    // Parse as JSON
    try {
      return JSON.parse(responseText);
    } catch (parseError) {
      logger.error('Failed to parse Jira response', { responseText });
      throw new Error('Invalid JSON response from Jira');
    }
  }

  /**
   * Format description based on Jira type
   * Cloud uses Atlassian Document Format (ADF), Server uses plain text
   */
  formatDescription(text) {
    if (this.jiraType === 'cloud') {
      // Cloud API v3 - Atlassian Document Format
      return {
        type: 'doc',
        version: 1,
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: text || ''
              }
            ]
          }
        ]
      };
    } else {
      // Server API v2 - Plain text
      return text || '';
    }
  }

  /**
   * Test connection
   */
  async testConnection() {
    try {
      // Try /myself endpoint first
      try {
        await this.makeRequest('/myself');
        return {
          success: true,
          message: `Connected to Jira ${this.jiraType === 'cloud' ? 'Cloud' : 'Server'} successfully`
        };
      } catch (firstError) {
        // If /myself fails with 403, try /serverInfo (often more permissive)
        if (firstError.message.includes('403')) {
          logger.info('Testing alternate endpoint /serverInfo');
          await this.makeRequest('/serverInfo');
          return {
            success: true,
            message: `Connected to Jira ${this.jiraType === 'cloud' ? 'Cloud' : 'Server'} successfully (using /serverInfo)`
          };
        }
        throw firstError;
      }
    } catch (error) {
      logger.error('Jira connection test failed', {
        error: error.message,
        domain: this.domain,
        username: this.username,
        type: this.jiraType
      });

      // Provide more helpful error messages
      let helpfulMessage = error.message;
      if (error.message.includes('403')) {
        helpfulMessage = `Authentication failed (403 Forbidden). Please check:\n• Username is correct (not email)\n• Personal Access Token is valid and not expired\n• Your account has API access permissions`;
      } else if (error.message.includes('401')) {
        helpfulMessage = `Invalid credentials (401 Unauthorized). Double-check your username and PAT.`;
      } else if (error.message.includes('404')) {
        helpfulMessage = `Cannot reach Jira (404 Not Found). Verify domain: ${this.domain}`;
      }

      return { success: false, message: helpfulMessage };
    }
  }

  /**
   * Get all projects
   */
  async getProjects() {
    try {
      if (this.jiraType === 'cloud') {
        const data = await this.makeRequest('/project/search?maxResults=100');
        return data.values || [];
      } else {
        // Server API returns array directly
        const data = await this.makeRequest('/project');
        return data || [];
      }
    } catch (error) {
      logger.error('Error fetching Jira projects', { error: error.message });
      throw error;
    }
  }

  /**
   * Get issues for a project
   * @param {string} projectKey - Project key (e.g., "PROJ")
   * @param {Object} options - Query options
   */
  async getIssues(projectKey, options = {}) {
    try {
      const {
        maxResults = 1000, // High limit to get all relevant tickets
        startAt = 0,
        status = null,
        assignee = null,
        myIssuesOnly = false // New option to filter by current user
      } = options;

      let jql = `project = ${projectKey}`;

      // Filter to only show tickets where user is assignee OR reporter
      if (myIssuesOnly) {
        jql += ` AND (assignee = currentUser() OR reporter = currentUser())`;
      } else if (assignee) {
        jql += ` AND assignee = "${assignee}"`;
      }

      if (status) {
        jql += ` AND status = "${status}"`;
      } else {
        // Always exclude "Done" tickets unless specifically requested
        jql += ` AND status != "Done"`;
      }

      jql += ' ORDER BY updated DESC';

      const params = new URLSearchParams({
        jql,
        maxResults,
        startAt,
        fields: 'summary,status,assignee,priority,created,updated,issuetype,description'
      });

      const data = await this.makeRequest(`/search?${params}`);
      return {
        issues: data.issues || [],
        total: data.total || 0,
        startAt: data.startAt || 0,
        maxResults: data.maxResults || 50
      };
    } catch (error) {
      logger.error('Error fetching Jira issues', { error: error.message });
      throw error;
    }
  }

  /**
   * Get a single issue
   * @param {string} issueKey - Issue key (e.g., "PROJ-123")
   */
  async getIssue(issueKey) {
    try {
      const data = await this.makeRequest(`/issue/${issueKey}`);
      return data;
    } catch (error) {
      logger.error('Error fetching Jira issue', { issueKey, error: error.message });
      throw error;
    }
  }

  /**
   * Create a new issue
   * @param {Object} issueData - Issue data
   */
  async createIssue(issueData) {
    try {
      const {
        projectKey,
        summary,
        description,
        issueType = 'Task',
        priority = 'Medium',
        assignee = null,
        labels = []
      } = issueData;

      const body = {
        fields: {
          project: {
            key: projectKey
          },
          summary,
          description: this.formatDescription(description),
          issuetype: {
            name: issueType
          },
          priority: {
            name: priority
          },
          labels: labels
        }
      };

      // Add assignee if provided
      if (assignee) {
        if (this.jiraType === 'cloud') {
          body.fields.assignee = { accountId: assignee };
        } else {
          body.fields.assignee = { name: assignee };
        }
      }

      const data = await this.makeRequest('/issue', {
        method: 'POST',
        body: JSON.stringify(body)
      });

      logger.info('Jira issue created', { issueKey: data.key, type: this.jiraType });
      return data;
    } catch (error) {
      logger.error('Error creating Jira issue', { error: error.message });
      throw error;
    }
  }

  /**
   * Update an issue
   * @param {string} issueKey - Issue key
   * @param {Object} updates - Fields to update
   */
  async updateIssue(issueKey, updates) {
    try {
      const body = { fields: {} };

      if (updates.summary) body.fields.summary = updates.summary;
      if (updates.description) {
        body.fields.description = this.formatDescription(updates.description);
      }
      if (updates.status) {
        // Status updates require a transition
        await this.transitionIssue(issueKey, updates.status);
        delete updates.status;
      }
      if (updates.assignee) {
        if (this.jiraType === 'cloud') {
          body.fields.assignee = { accountId: updates.assignee };
        } else {
          body.fields.assignee = { name: updates.assignee };
        }
      }
      if (updates.priority) body.fields.priority = { name: updates.priority };
      if (updates.labels) body.fields.labels = updates.labels;

      if (Object.keys(body.fields).length > 0) {
        await this.makeRequest(`/issue/${issueKey}`, {
          method: 'PUT',
          body: JSON.stringify(body)
        });
      }

      logger.info('Jira issue updated', { issueKey, type: this.jiraType });
      return { success: true, issueKey };
    } catch (error) {
      logger.error('Error updating Jira issue', { issueKey, error: error.message });
      throw error;
    }
  }

  /**
   * Transition issue to new status
   * @param {string} issueKey - Issue key
   * @param {string} statusName - Target status name
   */
  async transitionIssue(issueKey, statusName) {
    try {
      // Get available transitions
      const transitions = await this.makeRequest(`/issue/${issueKey}/transitions`);

      // Find transition matching status name
      const transition = transitions.transitions.find(
        t => t.name.toLowerCase() === statusName.toLowerCase()
      );

      if (!transition) {
        throw new Error(`Status "${statusName}" not available for this issue`);
      }

      // Execute transition
      await this.makeRequest(`/issue/${issueKey}/transitions`, {
        method: 'POST',
        body: JSON.stringify({
          transition: {
            id: transition.id
          }
        })
      });

      logger.info('Jira issue transitioned', { issueKey, status: statusName });
      return { success: true };
    } catch (error) {
      logger.error('Error transitioning Jira issue', { issueKey, error: error.message });
      throw error;
    }
  }

  /**
   * Add comment to issue
   * @param {string} issueKey - Issue key
   * @param {string} comment - Comment text
   */
  async addComment(issueKey, comment) {
    try {
      const body = {
        body: this.formatDescription(comment)
      };

      await this.makeRequest(`/issue/${issueKey}/comment`, {
        method: 'POST',
        body: JSON.stringify(body)
      });

      logger.info('Comment added to Jira issue', { issueKey, type: this.jiraType });
      return { success: true };
    } catch (error) {
      logger.error('Error adding comment to Jira issue', { issueKey, error: error.message });
      throw error;
    }
  }

  /**
   * Get issue types for a project
   * @param {string} projectKey - Project key
   */
  async getIssueTypes(projectKey) {
    try {
      const data = await this.makeRequest(`/project/${projectKey}`);
      return data.issueTypes || [];
    } catch (error) {
      logger.error('Error fetching issue types', { projectKey, error: error.message });
      throw error;
    }
  }

  /**
   * Search issues with JQL
   * @param {string} jql - JQL query
   * @param {Object} options - Query options
   */
  async searchIssues(jql, options = {}) {
    try {
      const {
        maxResults = 50,
        startAt = 0
      } = options;

      const params = new URLSearchParams({
        jql,
        maxResults,
        startAt,
        fields: 'summary,status,assignee,priority,created,updated,issuetype,description'
      });

      const data = await this.makeRequest(`/search?${params}`);
      return {
        issues: data.issues || [],
        total: data.total || 0
      };
    } catch (error) {
      logger.error('Error searching Jira issues', { jql, error: error.message });
      throw error;
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser() {
    try {
      const data = await this.makeRequest('/myself');
      return data;
    } catch (error) {
      logger.error('Error fetching current user', { error: error.message });
      throw error;
    }
  }

  /**
   * Check if configured
   */
  isConfigured() {
    return this.configured;
  }
}

// Singleton instance
const jiraManager = new JiraManager();
export default jiraManager;
