import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import logger from '../config/logger.js';

/**
 * Oura Ring Integration Manager
 * Handles OAuth2 authentication and API interactions with Oura Ring API v2
 */
class OuraManager {
  constructor() {
    this.accessToken = null;
    this.refreshToken = null;
    this.expiresAt = null;
    this.clientId = null;
    this.clientSecret = null;
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
    this.configPath = path.join(process.cwd(), 'data', 'oura.json');

    // API base URL
    this.baseUrl = 'https://api.ouraring.com/v2/usercollection';

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
        this.configured = !!(this.accessToken && this.clientId);

        if (this.configured) {
          logger.info('Oura configuration loaded from file');
        }
      }
    } catch (error) {
      logger.error('Error loading Oura configuration', { error: error.message });
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
        lastUpdated: new Date().toISOString()
      };

      // Ensure data directory exists
      const dataDir = path.dirname(this.configPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2), 'utf8');
      logger.info('Oura configuration saved to file');
    } catch (error) {
      logger.error('Error saving Oura configuration', { error: error.message });
    }
  }

  /**
   * Configure Oura connection
   * @param {Object} config - Oura configuration
   */
  configure(config) {
    this.accessToken = config.accessToken;
    this.refreshToken = config.refreshToken;
    this.expiresAt = config.expiresAt;
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;

    this.configured = !!(this.accessToken && this.clientId);

    if (this.configured) {
      logger.info('Oura configured', {
        hasAccessToken: !!this.accessToken,
        hasRefreshToken: !!this.refreshToken,
        expiresAt: this.expiresAt
      });

      // Save configuration to file
      this.saveConfig();
    }
  }

  /**
   * Get OAuth2 authorization URL
   * @param {string} redirectUri - The callback URL for OAuth
   * @param {string} state - Optional state parameter for CSRF protection
   * @returns {string} Authorization URL
   */
  getAuthorizationUrl(redirectUri, state = null) {
    if (!this.clientId) {
      throw new Error('Client ID not configured');
    }

    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'daily heartrate workout tag personal'
    });

    if (state) {
      params.append('state', state);
    }

    return `https://cloud.ouraring.com/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   * @param {string} code - Authorization code from OAuth callback
   * @param {string} redirectUri - The same redirect URI used in authorization
   */
  async exchangeCodeForToken(code, redirectUri) {
    if (!this.clientId || !this.clientSecret) {
      throw new Error('Client ID and Secret must be configured first');
    }

    try {
      logger.info('Exchanging authorization code for access token');

      const response = await fetch('https://api.ouraring.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: redirectUri,
          client_id: this.clientId,
          client_secret: this.clientSecret
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Token exchange failed', { status: response.status, error: errorText });
        throw new Error(`Token exchange failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      // Store tokens
      this.accessToken = data.access_token;
      this.refreshToken = data.refresh_token;
      this.expiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString();
      this.configured = true;

      // Save configuration
      this.saveConfig();

      logger.info('Oura OAuth2 authorization successful');
      return {
        accessToken: this.accessToken,
        refreshToken: this.refreshToken,
        expiresAt: this.expiresAt
      };
    } catch (error) {
      logger.error('Error exchanging authorization code', { error: error.message });
      throw error;
    }
  }

  /**
   * Check if token needs refresh
   */
  needsTokenRefresh() {
    if (!this.expiresAt) return false;
    // Refresh if token expires within 5 minutes
    const fiveMinutesFromNow = Date.now() + 5 * 60 * 1000;
    return new Date(this.expiresAt).getTime() < fiveMinutesFromNow;
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken() {
    if (!this.refreshToken || !this.clientId || !this.clientSecret) {
      throw new Error('Missing credentials for token refresh');
    }

    try {
      logger.info('Refreshing Oura access token');

      const response = await fetch('https://api.ouraring.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.refreshToken,
          client_id: this.clientId,
          client_secret: this.clientSecret
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Token refresh failed', { status: response.status, error: errorText });
        throw new Error(`Token refresh failed: ${response.status}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      this.refreshToken = data.refresh_token || this.refreshToken;
      this.expiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString();

      // Save updated tokens
      this.saveConfig();

      logger.info('Oura access token refreshed successfully');
      return true;
    } catch (error) {
      logger.error('Error refreshing Oura access token', { error: error.message });
      throw error;
    }
  }

  /**
   * Wait for rate limit if necessary
   */
  async waitForRateLimit() {
    // Wait minimum interval between requests
    if (this.lastRequestTime) {
      const timeSinceLastRequest = Date.now() - this.lastRequestTime;
      if (timeSinceLastRequest < this.minRequestInterval) {
        await new Promise(resolve => setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest));
      }
    }

    // Wait for rate limit reset if needed
    if (this.rateLimitRemaining !== null && this.rateLimitRemaining <= 0 && this.rateLimitReset) {
      const waitTime = this.rateLimitReset - Date.now();
      if (waitTime > 0) {
        logger.info('Rate limit reached, waiting', { waitMs: waitTime });
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  /**
   * Update rate limit info from response headers
   */
  updateRateLimit(headers) {
    const remaining = headers.get('x-ratelimit-remaining');
    const reset = headers.get('x-ratelimit-reset');

    if (remaining !== null) {
      this.rateLimitRemaining = parseInt(remaining, 10);
    }
    if (reset !== null) {
      this.rateLimitReset = parseInt(reset, 10) * 1000; // Convert to milliseconds
    }
  }

  /**
   * Get from cache if available and not expired
   */
  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      logger.info('Returning cached data', { key });
      return cached.data;
    }
    return null;
  }

  /**
   * Save to cache
   */
  saveToCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Make Oura API request with retry logic and exponential backoff
   */
  async makeRequest(endpoint, options = {}) {
    if (!this.configured) {
      throw new Error('Oura not configured. Please add credentials in Settings.');
    }

    // Refresh token if needed
    if (this.needsTokenRefresh()) {
      await this.refreshAccessToken();
    }

    const maxRetries = 3;
    let retryCount = 0;
    let backoffMs = 1000; // Start with 1 second

    while (retryCount <= maxRetries) {
      try {
        // Wait for rate limit
        await this.waitForRateLimit();

        const url = `${this.baseUrl}${endpoint}`;
        logger.info('Oura API request', { url, attempt: retryCount + 1 });

        this.lastRequestTime = Date.now();

        const response = await fetch(url, {
          ...options,
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Accept': 'application/json',
            ...options.headers
          }
        });

        // Update rate limit info
        this.updateRateLimit(response.headers);

        if (!response.ok) {
          const errorText = await response.text();

          // Handle rate limiting with retry
          if (response.status === 429) {
            const retryAfter = response.headers.get('retry-after');
            const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : backoffMs;

            if (retryCount < maxRetries) {
              logger.warn('Rate limited, retrying', { waitMs: waitTime, attempt: retryCount + 1 });
              await new Promise(resolve => setTimeout(resolve, waitTime));
              retryCount++;
              backoffMs *= 2; // Exponential backoff
              continue;
            }
          }

          // Handle token expiration
          if (response.status === 401 && this.refreshToken) {
            logger.info('Token expired, refreshing and retrying');
            await this.refreshAccessToken();
            retryCount++;
            continue;
          }

          logger.error('Oura API error', {
            url,
            status: response.status,
            statusText: response.statusText,
            error: errorText
          });
          throw new Error(`Oura API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data;
      } catch (error) {
        if (retryCount >= maxRetries) {
          logger.error('Max retries reached', { endpoint, error: error.message });
          throw error;
        }

        // Retry on network errors
        logger.warn('Request failed, retrying', {
          endpoint,
          error: error.message,
          attempt: retryCount + 1,
          backoffMs
        });
        await new Promise(resolve => setTimeout(resolve, backoffMs));
        retryCount++;
        backoffMs *= 2;
      }
    }
  }

  /**
   * Test connection
   */
  async testConnection() {
    try {
      // Test with personal info endpoint
      const data = await this.makeRequest('/personal_info');
      return {
        success: true,
        message: 'Connected to Oura Ring successfully',
        user: data
      };
    } catch (error) {
      logger.error('Oura connection test failed', { error: error.message });
      return {
        success: false,
        message: `Connection failed: ${error.message}`
      };
    }
  }

  /**
   * Get daily sleep data
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   */
  async getDailySleep(startDate, endDate = null) {
    try {
      const cacheKey = `sleep-${startDate}-${endDate}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      let endpoint = `/daily_sleep?start_date=${startDate}`;
      if (endDate) {
        endpoint += `&end_date=${endDate}`;
      }

      const data = await this.makeRequest(endpoint);
      this.saveToCache(cacheKey, data);
      return data;
    } catch (error) {
      logger.error('Error fetching sleep data', { startDate, endDate, error: error.message });
      throw error;
    }
  }

  /**
   * Get daily activity data
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   */
  async getDailyActivity(startDate, endDate = null) {
    try {
      const cacheKey = `activity-${startDate}-${endDate}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      let endpoint = `/daily_activity?start_date=${startDate}`;
      if (endDate) {
        endpoint += `&end_date=${endDate}`;
      }

      const data = await this.makeRequest(endpoint);
      this.saveToCache(cacheKey, data);
      return data;
    } catch (error) {
      logger.error('Error fetching activity data', { startDate, endDate, error: error.message });
      throw error;
    }
  }

  /**
   * Get daily readiness data
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   */
  async getDailyReadiness(startDate, endDate = null) {
    try {
      const cacheKey = `readiness-${startDate}-${endDate}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      let endpoint = `/daily_readiness?start_date=${startDate}`;
      if (endDate) {
        endpoint += `&end_date=${endDate}`;
      }

      const data = await this.makeRequest(endpoint);
      this.saveToCache(cacheKey, data);
      return data;
    } catch (error) {
      logger.error('Error fetching readiness data', { startDate, endDate, error: error.message });
      throw error;
    }
  }

  /**
   * Get heart rate data
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   */
  async getHeartRate(startDate, endDate = null) {
    try {
      const cacheKey = `heartrate-${startDate}-${endDate}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      let endpoint = `/heartrate?start_date=${startDate}`;
      if (endDate) {
        endpoint += `&end_date=${endDate}`;
      }

      const data = await this.makeRequest(endpoint);
      this.saveToCache(cacheKey, data);
      return data;
    } catch (error) {
      logger.error('Error fetching heart rate data', { startDate, endDate, error: error.message });
      throw error;
    }
  }

  /**
   * Get all wellness metrics for a date range
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   */
  async getAllMetrics(startDate, endDate = null) {
    try {
      const [sleep, activity, readiness, heartRate] = await Promise.all([
        this.getDailySleep(startDate, endDate),
        this.getDailyActivity(startDate, endDate),
        this.getDailyReadiness(startDate, endDate),
        this.getHeartRate(startDate, endDate)
      ]);

      return {
        sleep,
        activity,
        readiness,
        heartRate
      };
    } catch (error) {
      logger.error('Error fetching all metrics', { startDate, endDate, error: error.message });
      throw error;
    }
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    logger.info('Oura cache cleared');
  }

  /**
   * Check if configured
   */
  isConfigured() {
    return this.configured;
  }
}

// Singleton instance
const ouraManager = new OuraManager();
export default ouraManager;
