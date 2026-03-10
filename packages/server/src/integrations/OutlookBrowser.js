import { chromium } from 'playwright';
import fetch from 'node-fetch';
import logger from '../config/logger.js';

/**
 * Outlook Integration via Connected Browser
 * Connects to a running Chrome instance that you've already logged into
 */
class OutlookBrowser {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
    this.configured = false;
    this.cdpUrl = null;
    this.accessToken = null;

    // Cache
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Connect to existing Chrome instance via CDP
   * @param {string} cdpUrl - Chrome DevTools Protocol URL (e.g., "http://localhost:9222")
   */
  async connect(cdpUrl = 'http://localhost:9222') {
    try {
      this.cdpUrl = cdpUrl;

      logger.info('Connecting to Chrome via CDP', { cdpUrl });

      // Connect to the browser
      this.browser = await chromium.connectOverCDP(cdpUrl);

      // Get the default context (this is the user's existing browser session)
      const contexts = this.browser.contexts();
      if (contexts.length === 0) {
        throw new Error('No browser contexts found. Please ensure Chrome is running with remote debugging enabled.');
      }

      this.context = contexts[0];

      // Find or create an Outlook page
      const pages = this.context.pages();
      const outlookPage = pages.find(p =>
        p.url().includes('outlook.office.com') ||
        p.url().includes('outlook.live.com')
      );

      if (outlookPage) {
        this.page = outlookPage;
        logger.info('Found existing Outlook page');
      } else {
        logger.info('No Outlook page found, will create one when needed');
      }

      this.configured = true;
      logger.info('Successfully connected to browser via CDP');

      return {
        success: true,
        message: 'Connected to browser',
        hasOutlookPage: !!this.page
      };
    } catch (error) {
      logger.error('Error connecting to browser via CDP', { error: error.message });
      throw error;
    }
  }

  /**
   * Ensure we have an Outlook calendar page open
   */
  async ensureOutlookPage() {
    if (!this.context) {
      throw new Error('Not connected to browser. Call connect() first.');
    }

    if (!this.page || this.page.isClosed()) {
      logger.info('Opening Outlook calendar page');
      this.page = await this.context.newPage();
      await this.page.goto('https://outlook.office.com/calendar/', {
        waitUntil: 'domcontentloaded',
        timeout: 60000
      });
    }

    return this.page;
  }

  /**
   * Capture access token from Outlook page network requests
   */
  async captureAccessToken() {
    try {
      const page = await this.ensureOutlookPage();

      return new Promise((resolve, reject) => {
        let capturedToken = null;
        const timeout = setTimeout(() => {
          page.removeListener('request', requestHandler);
          if (capturedToken) {
            resolve(capturedToken);
          } else {
            reject(new Error('No access token captured. Try refreshing the Outlook page.'));
          }
        }, 10000);

        const requestHandler = (request) => {
          const authHeader = request.headers()['authorization'];
          if (authHeader && authHeader.startsWith('Bearer ')) {
            capturedToken = authHeader.replace('Bearer ', '');
            logger.info('Captured access token from Outlook page request');
            clearTimeout(timeout);
            page.removeListener('request', requestHandler);
            resolve(capturedToken);
          }
        };

        page.on('request', requestHandler);

        // Trigger a page action to generate API calls
        page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {
          // Ignore reload errors, we just want to trigger network requests
        });
      });
    } catch (error) {
      logger.error('Error capturing access token', { error: error.message });
      throw error;
    }
  }

  /**
   * Execute code in the Outlook page context to fetch calendar data
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
      const page = await this.ensureOutlookPage();

      // Try to capture an access token from network requests
      let accessToken = this.accessToken;
      if (!accessToken) {
        logger.info('No cached token, attempting to capture from page');
        accessToken = await this.captureAccessToken();
        this.accessToken = accessToken;
      }

      // Use the captured token to call Graph API directly with fetch
      const startDateTime = new Date(startDate).toISOString();
      const endDateTime = new Date(endDate + 'T23:59:59').toISOString();

      const params = new URLSearchParams({
        startDateTime: startDateTime,
        endDateTime: endDateTime,
        $select: 'subject,start,end,location,bodyPreview,isAllDay,isCancelled,importance,showAs,organizer,attendees',
        $orderby: 'start/dateTime',
        $top: 100
      });

      const url = `https://graph.microsoft.com/v1.0/me/calendarview?${params.toString()}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const text = await response.text();

        // If token expired, try to recapture
        if (response.status === 401) {
          logger.info('Token expired, recapturing');
          this.accessToken = null;
          accessToken = await this.captureAccessToken();
          this.accessToken = accessToken;

          // Retry with new token
          return this.getCalendarEvents(startDate, endDate);
        }

        throw new Error(`API request failed: ${response.status} - ${text}`);
      }

      const data = await response.json();
      const events = data.value || [];

      // Transform to our format
      const formattedEvents = events.map(event => ({
        id: event.Id || event.id,
        subject: event.Subject || event.subject,
        start: event.Start?.DateTime || event.start?.dateTime,
        end: event.End?.DateTime || event.end?.dateTime,
        timeZone: event.Start?.TimeZone || event.start?.timeZone,
        location: event.Location?.DisplayName || event.location?.displayName || null,
        isAllDay: event.IsAllDay || event.isAllDay || false,
        isCancelled: event.IsCancelled || event.isCancelled || false,
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
        data: formattedEvents,
        timestamp: Date.now()
      });

      logger.info('Fetched calendar events', { count: formattedEvents.length, startDate, endDate });
      return formattedEvents;
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
    logger.info('Calendar cache cleared');
  }

  /**
   * Disconnect from browser (doesn't close the browser, just disconnects)
   */
  async disconnect() {
    try {
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
        this.context = null;
        this.page = null;
        this.configured = false;
        logger.info('Disconnected from browser');
      }
    } catch (error) {
      logger.error('Error disconnecting from browser', { error: error.message });
    }
  }

  /**
   * Check configuration status
   */
  isConfigured() {
    return this.configured;
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      configured: this.configured,
      connected: !!this.browser,
      hasOutlookPage: !!this.page && !this.page.isClosed(),
      cdpUrl: this.cdpUrl
    };
  }
}

// Export singleton instance
const outlookBrowser = new OutlookBrowser();
export default outlookBrowser;
