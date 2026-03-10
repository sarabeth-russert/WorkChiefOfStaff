import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import logger from '../config/logger.js';
import WebSocket from 'ws';

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

    // Chrome remote debugging
    this.cookies = null;
    this.authMethod = 'oauth'; // 'oauth' or 'cookies'
    this.chromeDebugPort = 9222;

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
        this.authMethod = config.authMethod || 'oauth';
        this.cookies = config.cookies || null;
        this.chromeDebugPort = config.chromeDebugPort || 9222;

        // Configured if we have either OAuth tokens or cookies
        this.configured = !!(
          (this.accessToken && this.clientId) ||
          (this.cookies && this.authMethod === 'cookies')
        );

        if (this.configured) {
          logger.info('Outlook configuration loaded from file', { authMethod: this.authMethod });
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
        authMethod: this.authMethod,
        cookies: this.cookies,
        chromeDebugPort: this.chromeDebugPort,
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
   * Connect to Chrome remote debugging and extract access token from Outlook session
   * @param {number} port - Chrome remote debugging port (default: 9222)
   */
  async extractCookiesFromChrome(port = 9222) {
    try {
      this.chromeDebugPort = port;

      // Get list of targets (tabs) from Chrome
      const targetsResponse = await fetch(`http://localhost:${port}/json`);
      if (!targetsResponse.ok) {
        throw new Error(`Chrome remote debugging not available on port ${port}. Start Chrome with: chrome --remote-debugging-port=${port}`);
      }

      const targets = await targetsResponse.json();

      // Find an Outlook tab
      let targetTab = targets.find(t =>
        t.type === 'page' &&
        (t.url?.includes('outlook.office.com') ||
         t.url?.includes('outlook.live.com'))
      );

      if (!targetTab) {
        throw new Error('No Outlook tab found. Please open outlook.office.com in Chrome and log in.');
      }

      logger.info('Connecting to Outlook tab', {
        title: targetTab.title,
        url: targetTab.url
      });

      // Connect to the tab via WebSocket
      const ws = new WebSocket(targetTab.webSocketDebuggerUrl);

      return new Promise((resolve, reject) => {
        let messageId = 1;
        const pendingRequests = new Map();
        let extractedToken = null;
        let extractedCookies = null;

        ws.on('open', () => {
          logger.info('WebSocket connection established');

          // Enable Runtime domain for executing JavaScript
          const enableRuntimeMsg = {
            id: messageId++,
            method: 'Runtime.enable'
          };
          ws.send(JSON.stringify(enableRuntimeMsg));

          // Enable Network domain
          const enableNetworkMsg = {
            id: messageId++,
            method: 'Network.enable'
          };
          ws.send(JSON.stringify(enableNetworkMsg));

          // Get all cookies
          const getCookiesMsg = {
            id: messageId++,
            method: 'Network.getAllCookies'
          };
          pendingRequests.set(getCookiesMsg.id, 'getCookies');
          ws.send(JSON.stringify(getCookiesMsg));

          // Try to extract access token from localStorage/sessionStorage
          const extractTokenScript = `
            (function() {
              try {
                let token = null;

                // Helper to extract token from MSAL cache structure
                function extractFromMsalCache(cacheStr) {
                  try {
                    const cache = JSON.parse(cacheStr);

                    // MSAL cache structure: { AccessToken: { key: { secret: 'token', ... } } }
                    if (cache.AccessToken) {
                      const tokens = Object.values(cache.AccessToken);
                      if (tokens.length > 0 && tokens[0].secret) {
                        // Make sure it's a JWT (starts with eyJ)
                        if (tokens[0].secret.startsWith('eyJ')) {
                          return tokens[0].secret;
                        }
                      }
                    }

                    // Try alternative structures
                    if (cache.accessToken) return cache.accessToken;
                    if (cache.access_token) return cache.access_token;

                    // Check for nested token objects
                    for (const value of Object.values(cache)) {
                      if (value && typeof value === 'object') {
                        if (value.secret && value.secret.startsWith('eyJ')) {
                          return value.secret;
                        }
                        if (value.accessToken && value.accessToken.startsWith('eyJ')) {
                          return value.accessToken;
                        }
                      }
                    }
                  } catch (e) {
                    return null;
                  }
                  return null;
                }

                // Search localStorage
                for (let i = 0; i < localStorage.length; i++) {
                  const key = localStorage.key(i);
                  if (key && (key.includes('msal') || key.includes('token'))) {
                    const value = localStorage.getItem(key);
                    if (value) {
                      // Try to parse as MSAL cache
                      const extracted = extractFromMsalCache(value);
                      if (extracted) {
                        token = extracted;
                        break;
                      }
                      // Try direct value if it's a JWT
                      if (value.startsWith('eyJ')) {
                        token = value;
                        break;
                      }
                    }
                  }
                }

                // If not found, search sessionStorage
                if (!token) {
                  for (let i = 0; i < sessionStorage.length; i++) {
                    const key = sessionStorage.key(i);
                    if (key && (key.includes('msal') || key.includes('token'))) {
                      const value = sessionStorage.getItem(key);
                      if (value) {
                        const extracted = extractFromMsalCache(value);
                        if (extracted) {
                          token = extracted;
                          break;
                        }
                        if (value.startsWith('eyJ')) {
                          token = value;
                          break;
                        }
                      }
                    }
                  }
                }

                return { success: true, token: token };
              } catch (error) {
                return { success: false, error: error.message };
              }
            })();
          `;

          const evalMsg = {
            id: messageId++,
            method: 'Runtime.evaluate',
            params: {
              expression: extractTokenScript,
              returnByValue: true
            }
          };
          pendingRequests.set(evalMsg.id, 'extractToken');
          ws.send(JSON.stringify(evalMsg));
        });

        ws.on('message', (data) => {
          const message = JSON.parse(data.toString());

          if (message.id && pendingRequests.has(message.id)) {
            const requestType = pendingRequests.get(message.id);

            if (requestType === 'getCookies' && message.result?.cookies) {
              // Filter cookies for Microsoft domains
              extractedCookies = message.result.cookies.filter(cookie =>
                cookie.domain.includes('microsoft.com') ||
                cookie.domain.includes('microsoftonline.com') ||
                cookie.domain.includes('office.com') ||
                cookie.domain.includes('outlook.com') ||
                cookie.domain.includes('live.com')
              );

              logger.info('Extracted cookies from Chrome', {
                count: extractedCookies.length,
                domains: [...new Set(extractedCookies.map(c => c.domain))]
              });

              // Check if we have both token and cookies
              if (extractedToken !== null) {
                this.finishExtraction(extractedToken, extractedCookies, ws, resolve);
              }
            } else if (requestType === 'extractToken' && message.result?.result?.value) {
              const result = message.result.result.value;
              extractedToken = result.token;

              logger.info('Token extraction result', {
                hasToken: !!extractedToken,
                tokenPreview: (extractedToken && typeof extractedToken === 'string')
                  ? extractedToken.substring(0, 20) + '...'
                  : null
              });

              // Check if we have both token and cookies
              if (extractedCookies !== null) {
                this.finishExtraction(extractedToken, extractedCookies, ws, resolve);
              }
            }
          }
        });

        ws.on('error', (error) => {
          logger.error('WebSocket error', { error: error.message });
          reject(new Error(`Failed to connect to Chrome: ${error.message}`));
        });

        ws.on('close', () => {
          logger.info('WebSocket connection closed');
        });

        // Timeout after 15 seconds
        setTimeout(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.close();
            reject(new Error('Token extraction timeout'));
          }
        }, 15000);
      });
    } catch (error) {
      logger.error('Error extracting token from Chrome', { error: error.message });
      throw error;
    }
  }

  /**
   * Helper to finish the extraction process
   */
  finishExtraction(token, cookies, ws, resolve) {
    // Store cookies
    this.cookies = cookies;

    if (token && typeof token === 'string' && token.length > 0) {
      // Validate token format (JWT should have exactly 2 dots for JWS or 4 dots for JWE)
      const dotCount = (token.match(/\./g) || []).length;
      const isValidJWT = dotCount === 2 || dotCount === 4;

      if (!isValidJWT) {
        logger.warn('Extracted token is not a valid JWT format', {
          dotCount,
          tokenStart: token.substring(0, 30) + '...',
          tokenLength: token.length
        });
        // Fall back to cookie mode
        this.authMethod = 'cookies';
        this.configured = true;
        logger.warn('Using cookie-based auth instead (may not work with Graph API)');
      } else {
        // If we got a valid token, use OAuth mode
        this.accessToken = token;
        this.authMethod = 'oauth';
        this.configured = true;
        logger.info('Successfully extracted valid access token from browser session', {
          dotCount,
          tokenLength: token.length
        });
      }
    } else {
      // Fall back to cookie mode
      this.authMethod = 'cookies';
      this.configured = true;
      logger.warn('No access token found in browser storage, using cookie-based auth (may not work with Graph API)', {
        tokenType: typeof token,
        tokenValue: token
      });
    }

    this.saveConfig();
    ws.close();
    resolve({
      success: true,
      cookieCount: cookies.length,
      hasToken: !!(token && typeof token === 'string' && token.length > 0),
      isValidToken: token && typeof token === 'string' && ((token.match(/\./g) || []).length === 2 || (token.match(/\./g) || []).length === 4)
    });
  }

  /**
   * Set authentication method
   */
  setAuthMethod(method) {
    if (!['oauth', 'cookies'].includes(method)) {
      throw new Error('Invalid auth method. Use "oauth" or "cookies"');
    }
    this.authMethod = method;
    this.saveConfig();
    logger.info('Auth method set', { method });
  }

  /**
   * Make authenticated request to Microsoft Graph API
   */
  async makeRequest(endpoint, options = {}) {
    // Ensure we have valid authentication
    if (this.authMethod === 'oauth') {
      await this.ensureValidToken();
    } else if (this.authMethod === 'cookies' && !this.cookies) {
      throw new Error('No cookies available. Please extract cookies from Chrome first.');
    }

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

    // Build headers based on auth method
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (this.authMethod === 'oauth') {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    } else if (this.authMethod === 'cookies') {
      // Convert cookies to Cookie header
      const cookieHeader = this.cookies
        .map(c => `${c.name}=${c.value}`)
        .join('; ');
      headers['Cookie'] = cookieHeader;

      // Add common headers that browsers send
      headers['User-Agent'] = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
      headers['Accept'] = 'application/json';
      headers['Accept-Language'] = 'en-US,en;q=0.9';
      headers['Sec-Fetch-Site'] = 'same-origin';
      headers['Sec-Fetch-Mode'] = 'cors';
      headers['Sec-Fetch-Dest'] = 'empty';
    }

    const response = await fetch(url, {
      ...options,
      headers
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

      // If using cookies and we get a 401, cookies might have expired
      if (this.authMethod === 'cookies' && response.status === 401) {
        logger.warn('Cookie authentication failed. Cookies may have expired. Please re-extract cookies from Chrome.');
      }

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
