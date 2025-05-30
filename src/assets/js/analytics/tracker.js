// Import Bowser for browser detection
import Bowser from 'bowser';

// Analytics Tracker - Collects and sends data to serverless function
class AnalyticsTracker {
  constructor(options = {}) {
    this.options = {
      trackPageViews: true,
      trackEvents: true,
      trackScrollDepth: true,
      trackOutboundLinks: true,
      sessionTimeout: 1800000, // 30 minutes
      heartbeatInterval: 15 * 1000, // 15 seconds
      ...options
    };
    
    this.sessionId = null;
    this.visitorId = null;
    this.currentPageStartTime = Date.now();
    this.maxScrollDepth = 0;
    this.isFirstPageview = true;
    this.heartbeatTimer = null;
    this.sessionData = null;
    this.visitorData = null;
    this.lastActivity = Date.now();
    this.scrollDepth = 0;
    this.deviceInfo = this.getDeviceInfo();
    
    this.init();
  }

  // Initialize the tracker
  async init() {
    try {
      // Initialize session
      await this.initializeSession();
      
      // Track initial pageview
      if (this.options.trackPageViews) {
        await this.trackPageView();
      }
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Start heartbeat to keep session alive
      this.startHeartbeat();
      
      // Start session timeout check
      this.startSessionTimeoutCheck();
      
      console.log('Analytics tracker initialized');
    } catch (error) {
      console.error('Failed to initialize analytics tracker:', error);
    }
  }

  // Generate a unique session ID
  generateSessionId() {
    // Generate a UUID v4
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Get or create session ID (stored in localStorage, expires after 30 min of inactivity)
  getOrCreateSessionId() {
    const sessionKey = 'analytics_session_id';
    const sessionTsKey = 'analytics_session_last_activity';
    const now = Date.now();
    let sessionId = localStorage.getItem(sessionKey);
    let lastActivity = parseInt(localStorage.getItem(sessionTsKey), 10) || 0;
    const sessionTimeout = this.options.sessionTimeout || 1800000; // 30 min default
    if (sessionId && (now - lastActivity < sessionTimeout)) {
      // Session is still valid
      localStorage.setItem(sessionTsKey, now.toString());
      return sessionId;
    }
    // New session
    sessionId = this.generateSessionId();
    localStorage.setItem(sessionKey, sessionId);
    localStorage.setItem(sessionTsKey, now.toString());
    return sessionId;
  }

  // Get or create visitor ID (stored in localStorage)
  getOrCreateVisitorId() {
    let visitorId = localStorage.getItem('analytics_visitor_id');
    if (!visitorId) {
      visitorId = this.generateFingerprint();
      localStorage.setItem('analytics_visitor_id', visitorId);
    }
    return visitorId;
  }

  // Generate a browser fingerprint for visitor identification
  generateFingerprint() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Analytics fingerprint', 2, 2);
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL()
    ].join('|');
    
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    return 'fp_' + Math.abs(hash).toString(36);
  }

  // Send data to serverless function
  async sendAnalytics(type, data) {
    try {
      console.log('Sending analytics:', { type, data });
      const response = await fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type, data })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP error! status: ${response.status}${errorData.error ? ` - ${errorData.error}` : ''}`);
      }

      const result = await response.json();
      console.log('Analytics response:', result);
      return result;
    } catch (error) {
      console.error('Failed to send analytics:', error);
      throw error;
    }
  }

  // Initialize visitor
  async initializeVisitor() {
    this.visitorData = {
      id: this.visitorId,
      first_seen_at: new Date().toISOString()
    };
  }

  // Initialize session
  async initializeSession() {
    try {
      // Get or create session ID and visitor ID first
      this.sessionId = this.getOrCreateSessionId();
      this.visitorId = this.getOrCreateVisitorId();
      
      // Get location data
      let locationData = null;
      try {
        const response = await fetch('https://ipapi.co/json/');
        if (response.ok) {
          locationData = await response.json();
        }
      } catch (error) {
        console.warn('Failed to fetch location data:', error);
      }

      // Get device info
      const deviceInfo = this.getDeviceInfo();
      console.log('Device Info:', deviceInfo);
      
      const sessionData = {
        session_id: this.sessionId,
        visitor_id: this.visitorId,
        entry_page: window.location.pathname,
        referrer_source: document.referrer ? new URL(document.referrer).hostname : 'Internal',
        referrer_medium: document.referrer ? 'external' : 'internal',
        utm_source: this.getUTMParameter('utm_source'),
        utm_medium: this.getUTMParameter('utm_medium'),
        utm_campaign: this.getUTMParameter('utm_campaign'),
        utm_term: this.getUTMParameter('utm_term'),
        utm_content: this.getUTMParameter('utm_content'),
        browser: deviceInfo.browser.name,
        browser_version: deviceInfo.browser.version,
        engine_name: deviceInfo.browser.engine,
        engine_version: deviceInfo.browser.engine_version,
        os: deviceInfo.os.name,
        os_version: deviceInfo.os.version,
        os_architecture: deviceInfo.os.architecture,
        device: deviceInfo.device,
        screen_width: deviceInfo.screen_width,
        screen_height: deviceInfo.screen_height,
        viewport_width: deviceInfo.viewport_width,
        viewport_height: deviceInfo.viewport_height,
        pixel_ratio: deviceInfo.pixel_ratio,
        device_vendor: deviceInfo.device_vendor,
        device_model: deviceInfo.device_model,
        timezone: deviceInfo.timezone,
        // Location data
        ip_address: locationData?.ip,
        country_code: locationData?.country_code,
        country_name: locationData?.country_name,
        region_code: locationData?.region_code,
        region_name: locationData?.region,
        city: locationData?.city,
        latitude: locationData?.latitude,
        longitude: locationData?.longitude
      };

      console.log('Session Data:', sessionData);

      const response = await this.sendAnalytics('session', sessionData);

      if (!response.success) {
        throw new Error('Failed to initialize session: ' + (response.error || 'Unknown error'));
      }

      console.log('Session initialized:', this.sessionId);
    } catch (error) {
      console.error('Failed to initialize session:', error);
      throw error;
    }
  }

  // Track page view
  async trackPageView() {
    try {
      const pageData = {
        session_id: this.sessionId,
        visitor_id: this.visitorId,
        page_path: window.location.pathname,
        referrer: document.referrer,
        duration: this.isFirstPageview ? 0 : Date.now() - this.currentPageStartTime
      };

      await this.sendAnalytics('pageview', pageData);
      this.isFirstPageview = false;
      this.currentPageStartTime = Date.now();
      // Update session last activity timestamp
      localStorage.setItem('analytics_session_last_activity', Date.now().toString());
    } catch (error) {
      console.error('Failed to track pageview:', error);
    }
  }

  // Track custom events
  async trackEvent(eventName, eventCategory = null, eventAction = null, eventLabel = null, eventValue = null, customProperties = null) {
    if (!this.options.trackEvents) return;

    try {
      const eventData = {
        session_id: this.sessionId,
        visitor_id: this.visitorId,
        event_name: eventName,
        event_category: eventCategory,
        event_action: eventAction,
        event_label: eventLabel,
        event_value: eventValue,
        custom_properties: customProperties ? JSON.stringify(customProperties) : null
      };

      await this.sendAnalytics('event', eventData);
      console.log('Event tracked:', eventName);
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }

  // Send heartbeat
  async sendHeartbeat() {
    try {
      await this.sendAnalytics('heartbeat', {
        session_id: this.sessionId
      });
    } catch (error) {
      console.error('Failed to send heartbeat:', error);
    }
  }

  // Set up event listeners
  setupEventListeners() {
    // Track scroll depth
    if (this.options.trackScrollDepth) {
      let scrollTimeout;
      window.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          this.updateScrollDepth();
        }, 100);
      });
    }

    // Track outbound links
    if (this.options.trackOutboundLinks) {
      document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (link && link.href && this.isOutboundLink(link.href)) {
          this.trackEvent('outbound_link', 'navigation', 'click', link.href);
        }
      });
    }

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.updatePageDuration();
      } else {
        this.currentPageStartTime = Date.now();
      }
    });

    // Track before page unload
    window.addEventListener('beforeunload', () => {
      this.updatePageDuration();
      this.endSession();
    });

    // Track hash changes (for SPAs)
    window.addEventListener('hashchange', () => {
      this.trackPageView();
    });

    // Track popstate (for SPAs with history API)
    window.addEventListener('popstate', () => {
      this.trackPageView();
    });
  }

  // Start heartbeat to keep session alive
  startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      this.sendHeartbeat();
    }, this.options.heartbeatInterval);
  }

  // Update scroll depth
  updateScrollDepth() {
    const scrollPercent = Math.round((window.scrollY + window.innerHeight) / document.documentElement.scrollHeight * 100);
    if (scrollPercent > this.maxScrollDepth) {
      this.maxScrollDepth = scrollPercent;
      this.trackEvent('scroll_depth', 'engagement', 'scroll', null, scrollPercent);
    }
  }

  // Update page duration
  updatePageDuration() {
    const duration = Date.now() - this.currentPageStartTime;
    this.trackEvent('page_duration', 'engagement', 'duration', null, duration);
  }

  // End session
  endSession() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }
    this.updatePageDuration();
  }

  // Check if link is outbound
  isOutboundLink(href) {
    try {
      const url = new URL(href);
      return url.hostname !== window.location.hostname;
    } catch {
      return false;
    }
  }

  // Utility functions
  getReferrerSource() {
    if (!document.referrer) return 'Direct';
    
    const referrerDomain = new URL(document.referrer).hostname;
    const currentDomain = window.location.hostname;
    
    if (referrerDomain === currentDomain) return 'Internal';
    
    const sources = {
      'google.': 'Google',
      'bing.': 'Bing',
      'yahoo.': 'Yahoo',
      'duckduckgo.': 'DuckDuckGo',
      'facebook.': 'Facebook',
      'twitter.': 'Twitter',
      'linkedin.': 'LinkedIn',
      'instagram.': 'Instagram',
      'youtube.': 'YouTube',
      'pinterest.': 'Pinterest',
      'reddit.': 'Reddit',
      'tiktok.': 'TikTok'
    };
    
    for (const [domain, source] of Object.entries(sources)) {
      if (referrerDomain.includes(domain)) {
        return source;
      }
    }
    
    return referrerDomain;
  }

  getReferrerMedium() {
    const source = this.getReferrerSource();
    
    if (source === 'Direct') return 'none';
    if (source === 'Internal') return 'internal';
    
    const searchEngines = ['Google', 'Bing', 'Yahoo', 'DuckDuckGo'];
    const socialMedia = ['Facebook', 'Twitter', 'LinkedIn', 'Instagram', 'YouTube', 'Pinterest', 'Reddit', 'TikTok'];
    
    if (searchEngines.includes(source)) return 'organic';
    if (socialMedia.includes(source)) return 'social';
    
    return 'referral';
  }

  getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
  }

  getDeviceInfo() {
    const ua = navigator.userAgent;
    const browser = Bowser.getParser(ua);
    let browserName = browser.getBrowserName();
    let browserVersion = browser.getBrowserVersion();
    let osName = browser.getOSName();
    let osVersion = browser.getOSVersion();
    let platform = browser.getPlatformType();

    // Custom handling for Arc and Carbon
    if (ua.includes('Arc')) {
      browserName = 'Arc';
    } else if (ua.includes('Carbon')) {
      browserName = 'Carbon';
    }

    // Safely get screen properties with fallbacks
    const screenWidth = window.screen?.width || window.innerWidth || 0;
    const screenHeight = window.screen?.height || window.innerHeight || 0;
    const pixelRatio = window.devicePixelRatio || 1;
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;

    // Get device vendor and model (simple fallback logic)
    let deviceVendor = 'unknown';
    let deviceModel = 'unknown';
    if (/iPhone|iPad|iPod/.test(ua)) {
      deviceVendor = 'Apple';
      deviceModel = /iPhone/.test(ua) ? 'iPhone' : /iPad/.test(ua) ? 'iPad' : 'iPod';
    } else if (/Samsung|SM-/.test(ua)) {
      deviceVendor = 'Samsung';
    } else if (/Pixel/.test(ua)) {
      deviceVendor = 'Google';
    } else if (/Windows Phone|Lumia/.test(ua)) {
      deviceVendor = 'Microsoft';
    } else if (platform === 'desktop') {
      if (/Macintosh/.test(ua)) {
        deviceVendor = 'Apple';
        deviceModel = 'Mac';
      } else if (/Windows/.test(ua)) {
        deviceVendor = 'Microsoft';
        deviceModel = 'Windows PC';
      } else if (/Linux/.test(ua)) {
        deviceVendor = 'Linux';
        deviceModel = 'Linux PC';
      }
    }

    // Get timezone
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    return {
      browser: {
        name: browserName,
        version: browserVersion,
        engine: browser.getEngine().name,
        engine_version: browser.getEngine().version
      },
      os: {
        name: osName,
        version: osVersion,
        architecture: navigator.platform || 'unknown'
      },
      device: platform,
      screen_width: screenWidth,
      screen_height: screenHeight,
      viewport_width: viewportWidth,
      viewport_height: viewportHeight,
      pixel_ratio: pixelRatio,
      device_vendor: deviceVendor,
      device_model: deviceModel,
      timezone
    };
  }

  getUTMParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
  }

  // Start session timeout check
  startSessionTimeoutCheck() {
    // Implementation of startSessionTimeoutCheck method
  }
}

// Auto-initialize if configuration is available
if (typeof window !== 'undefined' && window.ANALYTICS_CONFIG) {
  window.analytics = new AnalyticsTracker(window.ANALYTICS_CONFIG.options);
} 