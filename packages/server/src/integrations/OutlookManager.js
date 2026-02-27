import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import logger from '../config/logger.js';

/**
 * Microsoft Outlook Calendar Integration Manager
 * Handles OAuth2 authentication and API interactions with Microsoft Graph API
 */
class OutlookManager {
  constructor() {
    this.accessToken = null;
    this.refreshToken = null;
    this.expiresAt = null;
    this.clientId = null;
    this.clientSecret = null;
    this.tenantId = 'common'; // 'common' for multi-tenant, or specific tenant ID
    this.configured = false;

    // Rate limiting
    this.rateLimitRemaining = null;
    this.rateLimitReset = null;
    this.lastRequestTime = null;
    this.minRequestInterval = 100; // 100ms between requests

    // Caching
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes

    // Configuration file path
    this.configPath = path.join(process.cwd(), 'data', 'outlook.json');

    // Microsoft Graph API base URL
    this.baseUrl = 'https://graph.microsoft.com/v1.0';

    // Scopes needed for calendar access
    this.scopes = [
      'User.Read',
      'Calendars.ReadWrite',
      'offline_access' // For refresh token
    ];

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
        this.accessToken = config.accessToken;
        this.refreshToken = config.refreshToken;
        this.expiresAt = config.expiresAt;
        this.clientId = config.clientId;
        this.clientSecret = config.clientSecret;
        this.tenantId = config.tenantId || 'common';
        this.configured = !!(this.accessToken && this.clientId);

        if (this.configured) {
          logger.info('Outlook configuration loaded from file');
        }
      }
    } catch (error) {
      logger.error('Error loading Outlook configuration', { error: error.message });
    }
  }

  /**
   * Save configuration to file
   */
  saveConfig() {
    try {
      const config = {
        accessToken: this.accessToken,
        refreshToken: this.refreshToken,
        expiresAt: this.expiresAt,
        clientId: this.clientId,
        clientSecret: this.clientSecret,
        tenantId: this.tenantId,
        lastUpdated: new Date().toISOString()
      };

      // Ensure data directory exists
      const dataDir = path.dirname(this.configPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
      logger.info('Outlook configuration saved to file');
    } catch (error) {
      logger.error('Error saving Outlook configuration', { error: error.message });
    }
  }

  /**
   * Check if manager is configured
   */
  isConfigured() {
    return this.configured;
  }

  /**
   * Configure with client credentials
   */
  configure(clientId, clientSecret, tenantId = 'common') {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.tenantId = tenantId;
    this.saveConfig();
    logger.info('Outlook manager configured with client credentials');
  }

  /**
   * Get authorization URL for OAuth flow
   */
  getAuthUrl(redirectUri, state = null) {
    if (!this.clientId) {
      throw new Error('Client ID not configured');
    }

    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      redirect_uri: redirectUri,
      response_mode: 'query',
      scope: this.scopes.join(' '),
      state: state || Math.random().toString(36).substring(7)
    });

    const authUrl = `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0`;
    return `${authUrl}/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async authenticate(code, redirectUri) {
    try {
      const authUrl = `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0`;
      const response = await fetch(`${authUrl}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          code: code,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code'
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OAuth authentication failed: ${error}`);
      }

      const data = await response.json();

      // Store tokens
      this.accessToken = data.access_token;
      this.refreshToken = data.refresh_token;
      this.expiresAt = Date.now() + (data.expires_in * 1000);
      this.configured = true;

      this.saveConfig();
      logger.info('Outlook authentication successful');

      return {
        success: true,
        expiresIn: data.expires_in
      };
    } catch (error) {
      logger.error('Outlook authentication error', { error: error.message });
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken() {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const authUrl = `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0`;
      const response = await fetch(`${authUrl}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          refresh_token: this.refreshToken,
          grant_type: 'refresh_token'
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Token refresh failed: ${error}`);
      }

      const data = await response.json();

      // Update tokens
      this.accessToken = data.access_token;
      if (data.refresh_token) {
        this.refreshToken = data.refresh_token;
      }
      this.expiresAt = Date.now() + (data.expires_in * 1000);

      this.saveConfig();
      logger.info('Outlook access token refreshed');

      return true;
    } catch (error) {
      logger.error('Token refresh error', { error: error.message });
      throw error;
    }
  }

  /**
   * Ensure access token is valid, refresh if needed
   */
  async ensureValidToken() {
    if (!this.accessToken) {
      throw new Error('Not authenticated. Please authenticate first.');
    }

    // Refresh if token expires within 5 minutes
    const fiveMinutes = 5 * 60 * 1000;
    if (this.expiresAt && (this.expiresAt - Date.now()) < fiveMinutes) {
      logger.info('Access token expiring soon, refreshing...');
      await this.refreshAccessToken();
    }
  }

  /**
   * Make authenticated request to Microsoft Graph API
   */
  async makeRequest(endpoint, options = {}) {
    await this.ensureValidToken();

    // Rate limiting
    if (this.lastRequestTime) {
      const timeSinceLastRequest = Date.now() - this.lastRequestTime;
      if (timeSinceLastRequest < this.minRequestInterval) {
        await new Promise(resolve =>
          setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest)
        );
      }
    }

    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    this.lastRequestTime = Date.now();

    // Update rate limit info from headers
    if (response.headers.has('ratelimit-remaining')) {
      this.rateLimitRemaining = parseInt(response.headers.get('ratelimit-remaining'));
    }
    if (response.headers.has('ratelimit-reset')) {
      this.rateLimitReset = parseInt(response.headers.get('ratelimit-reset'));
    }

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Graph API request failed: ${response.status} ${error}`);
    }

    return response.json();
  }

  /**
   * Get user's calendar events for a date range
   * @param {string} startDate - ISO date string (e.g., "2026-02-27")
   * @param {string} endDate - ISO date string (e.g., "2026-03-06")
   */
  async getCalendarEvents(startDate, endDate) {
    const cacheKey = `events-${startDate}-${endDate}`;

    // Check cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        logger.info('Returning cached calendar events');
        return cached.data;
      }
    }

    try {
      // Convert dates to ISO 8601 format for Graph API
      const startDateTime = new Date(startDate).toISOString();
      const endDateTime = new Date(endDate + 'T23:59:59').toISOString();

      const params = new URLSearchParams({
        startDateTime: startDateTime,
        endDateTime: endDateTime,
        $select: 'subject,start,end,location,bodyPreview,isAllDay,isCancelled,importance,showAs,organizer,attendees',
        $orderby: 'start/dateTime',
        $top: 100
      });

      const data = await this.makeRequest(`/me/calendarview?${params.toString()}`);

      const events = data.value.map(event => ({
        id: event.id,
        subject: event.subject,
        start: event.start.dateTime,
        end: event.end.dateTime,
        timeZone: event.start.timeZone,
        location: event.location?.displayName || null,
        isAllDay: event.isAllDay,
        isCancelled: event.isCancelled,
        importance: event.importance,
        showAs: event.showAs, // free, tentative, busy, oof, workingElsewhere, unknown
        organizer: event.organizer?.emailAddress?.name || null,
        bodyPreview: event.bodyPreview,
        attendees: event.attendees?.map(a => ({
          name: a.emailAddress?.name,
          email: a.emailAddress?.address,
          status: a.status?.response // none, organizer, tentativelyAccepted, accepted, declined, notResponded
        })) || []
      }));

      // Cache results
      this.cache.set(cacheKey, {
        data: events,
        timestamp: Date.now()
      });

      logger.info('Fetched calendar events', { count: events.length, startDate, endDate });
      return events;
    } catch (error) {
      logger.error('Error fetching calendar events', { error: error.message });
      throw error;
    }
  }

  /**
   * Get user's calendar events for today
   */
  async getTodayEvents() {
    const today = new Date().toISOString().split('T')[0];
    return this.getCalendarEvents(today, today);
  }

  /**
   * Get user's calendar events for this week
   */
  async getWeekEvents() {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday

    const startDate = startOfWeek.toISOString().split('T')[0];
    const endDate = endOfWeek.toISOString().split('T')[0];

    return this.getCalendarEvents(startDate, endDate);
  }

  /**
   * Create a calendar event
   */
  async createEvent(eventData) {
    try {
      const event = {
        subject: eventData.subject,
        start: {
          dateTime: eventData.start,
          timeZone: eventData.timeZone || 'Pacific Standard Time'
        },
        end: {
          dateTime: eventData.end,
          timeZone: eventData.timeZone || 'Pacific Standard Time'
        },
        body: {
          contentType: 'HTML',
          content: eventData.body || ''
        },
        location: eventData.location ? {
          displayName: eventData.location
        } : undefined,
        isAllDay: eventData.isAllDay || false
      };

      const data = await this.makeRequest('/me/events', {
        method: 'POST',
        body: JSON.stringify(event)
      });

      logger.info('Created calendar event', { subject: eventData.subject });

      // Clear cache
      this.cache.clear();

      return {
        id: data.id,
        subject: data.subject,
        start: data.start.dateTime,
        end: data.end.dateTime
      };
    } catch (error) {
      logger.error('Error creating calendar event', { error: error.message });
      throw error;
    }
  }

  /**
   * Clear cached data
   */
  clearCache() {
    this.cache.clear();
    logger.info('Outlook cache cleared');
  }

  /**
   * Disconnect and clear all configuration
   */
  disconnect() {
    this.accessToken = null;
    this.refreshToken = null;
    this.expiresAt = null;
    this.configured = false;
    this.cache.clear();

    // Remove config file
    if (fs.existsSync(this.configPath)) {
      fs.unlinkSync(this.configPath);
    }

    logger.info('Outlook disconnected');
  }
}

// Export singleton instance
const outlookManager = new OutlookManager();
export default outlookManager;
