import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import fetch from 'node-fetch';
import logger from '../config/logger.js';

/**
 * Microsoft Outlook Integration using Playwright
 * Uses an authenticated browser session to access Outlook Web and make Graph API calls
 */
class OutlookPlaywright {
  constructor() {
    this.browser = null;
    this.context = null;
    this.configured = false;
    this.accessToken = null;

    // Configuration
    this.userDataDir = path.join(process.cwd(), 'data', 'playwright-outlook');
    // Use Outlook REST API instead of Graph API - tokens are compatible
    this.baseUrl = 'https://outlook.office.com/api/v2.0';

    // Cache
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes

    // Ensure user data directory exists
    if (!fs.existsSync(this.userDataDir)) {
      fs.mkdirSync(this.userDataDir, { recursive: true });
    }
  }

  /**
   * Initialize browser with persistent context
   * This keeps you logged in between restarts
   */
  async initialize() {
    try {
      logger.info('Initializing Playwright browser for Outlook');

      this.browser = await chromium.launchPersistentContext(this.userDataDir, {
        headless: false, // Set to true for production, false for initial setup
        viewport: { width: 1280, height: 720 },
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36'
      });

      this.context = this.browser;
      this.configured = true;

      logger.info('Playwright browser initialized successfully');
      return { success: true };
    } catch (error) {
      logger.error('Error initializing Playwright browser', { error: error.message });
      throw error;
    }
  }

  /**
   * Check if browser is initialized
   */
  isInitialized() {
    return this.configured && this.context && !this.context.browser()?.isConnected();
  }

  /**
   * Navigate to Outlook Web to ensure user is logged in
   * Also intercepts API calls to extract the Bearer token
   */
  async ensureLoggedIn(forceRefresh = false) {
    try {
      // If we already have a token and not forcing refresh, just return
      if (this.accessToken && !forceRefresh) {
        logger.info('Using existing access token');
        return {
          success: true,
          needsLogin: false,
          message: 'Already logged in',
          hasToken: true
        };
      }

      if (!this.context) {
        await this.initialize();
      }

      const page = await this.context.newPage();

      // Set up network interception to capture Bearer token
      let capturedToken = null;
      page.on('request', request => {
        const authHeader = request.headers()['authorization'];
        if (authHeader && authHeader.startsWith('Bearer ')) {
          capturedToken = authHeader.replace('Bearer ', '');
          logger.info('Captured Bearer token from Outlook request');
        }
      });

      await page.goto('https://outlook.office.com/calendar/', {
        waitUntil: 'domcontentloaded',
        timeout: 60000
      });

      // Wait for API calls to happen and capture token
      await page.waitForTimeout(5000);

      // Check if we're on the login page or the mail page
      const url = page.url();

      if (url.includes('login.microsoftonline.com') || url.includes('login.live.com')) {
        logger.info('User needs to log in to Outlook. Browser window is open.');
        // Keep the page open for the user to log in
        return {
          success: false,
          needsLogin: true,
          message: 'Please log in to Outlook in the browser window'
        };
      } else if (url.includes('outlook.office.com')) {
        logger.info('User is already logged in to Outlook');

        // Store the captured token
        if (capturedToken) {
          this.accessToken = capturedToken;
          logger.info('Access token captured and stored');
        }

        await page.close();
        return {
          success: true,
          needsLogin: false,
          message: 'Already logged in',
          hasToken: !!capturedToken
        };
      }

      await page.close();
      return { success: true };
    } catch (error) {
      logger.error('Error checking Outlook login status', { error: error.message });
      throw error;
    }
  }

  /**
   * Make authenticated Graph API request using captured Bearer token
   */
  async makeGraphRequest(endpoint, options = {}) {
    try {
      // Ensure we have a token
      if (!this.accessToken) {
        throw new Error('No access token available. Please initialize the browser and capture a token first by calling /api/outlook/playwright/status');
      }

      const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;

      // Use fetch with the Bearer token (node-fetch should be available)
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      if (!response.ok) {
        const text = await response.text();

        // If token expired, inform the user to recapture
        if (response.status === 401) {
          logger.warn('Access token expired. User needs to call /api/outlook/playwright/status to recapture');
          throw new Error('Access token expired. Please call /api/outlook/playwright/status to refresh the token.');
        }

        throw new Error(`Graph API request failed: ${response.status} ${text}`);
      }

      const data = await response.json();

      logger.info('Graph API request successful', {
        endpoint: endpoint.substring(0, 50),
        status: response.status
      });

      return data;
    } catch (error) {
      logger.error('Error making Graph API request', { error: error.message });
      throw error;
    }
  }

  /**
   * Get user's calendar events for a date range
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
      // Convert dates to ISO 8601 format
      const startDateTime = new Date(startDate).toISOString();
      const endDateTime = new Date(endDate + 'T23:59:59').toISOString();

      const params = new URLSearchParams({
        startDateTime: startDateTime,
        endDateTime: endDateTime,
        $select: 'Subject,Start,End,Location,BodyPreview,IsAllDay,IsCancelled,Importance,ShowAs,Organizer,Attendees',
        $orderby: 'Start/DateTime',
        $top: 100
      });

      const data = await this.makeGraphRequest(`/me/calendarview?${params.toString()}`);

      const events = (data.value || data.Value || []).map(event => ({
        id: event.Id || event.id,
        subject: event.Subject || event.subject,
        start: event.Start?.DateTime || event.start?.dateTime,
        end: event.End?.DateTime || event.end?.dateTime,
        timeZone: event.Start?.TimeZone || event.start?.timeZone,
        location: event.Location?.DisplayName || event.location?.displayName || null,
        isAllDay: event.IsAllDay || event.isAllDay,
        isCancelled: event.IsCancelled || event.isCancelled,
        importance: event.Importance || event.importance,
        showAs: event.ShowAs || event.showAs,
        organizer: event.Organizer?.EmailAddress?.Name || event.organizer?.emailAddress?.name || null,
        bodyPreview: event.BodyPreview || event.bodyPreview,
        attendees: (event.Attendees || event.attendees || []).map(a => ({
          name: a.EmailAddress?.Name || a.emailAddress?.name,
          email: a.EmailAddress?.Address || a.emailAddress?.address,
          status: a.Status?.Response || a.status?.response
        }))
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
   * Get today's calendar events
   */
  async getTodayEvents() {
    const today = new Date().toISOString().split('T')[0];
    return this.getCalendarEvents(today, today);
  }

  /**
   * Get this week's calendar events
   */
  async getWeekEvents() {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const startDate = startOfWeek.toISOString().split('T')[0];
    const endDate = endOfWeek.toISOString().split('T')[0];

    return this.getCalendarEvents(startDate, endDate);
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    logger.info('Outlook Playwright cache cleared');
  }

  /**
   * Close browser and cleanup
   */
  async close() {
    try {
      if (this.context) {
        await this.context.close();
        this.context = null;
        this.browser = null;
        this.configured = false;
        logger.info('Playwright browser closed');
      }
    } catch (error) {
      logger.error('Error closing Playwright browser', { error: error.message });
    }
  }

  /**
   * Check configuration status
   */
  isConfigured() {
    return this.configured;
  }
}

// Export singleton instance
const outlookPlaywright = new OutlookPlaywright();
export default outlookPlaywright;
