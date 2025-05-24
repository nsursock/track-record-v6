/**
 * Custom Debug Screens Implementation
 * Shows current Tailwind CSS breakpoint in development mode
 */

class DebugScreens {
  constructor() {
    this.breakpoints = {
      'xs': 0,
      'sm': 640,
      'md': 768,
      'lg': 1024,
      'xl': 1280,
      '2xl': 1536
    };
    
    this.badge = null;
    this.init();
  }

  init() {
    // Only show in development mode
    if (!this.isDevelopment()) {
      return;
    }

    this.createBadge();
    this.updateBreakpoint();
    this.setupResizeListener();
  }

  isDevelopment() {
    // Check if we're in development based on URL or environment
    return window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1' || 
           window.location.port !== '';
  }

  createBadge() {
    this.badge = document.createElement('div');
    this.badge.id = 'debug-screens-badge';
    this.badge.className = 'badge badge-soft badge-info';
    this.badge.style.cssText = `
      position: fixed;
      bottom: 1rem;
      right: 1rem;
      z-index: 9999;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    `;
    
    document.body.appendChild(this.badge);
  }

  getCurrentBreakpoint() {
    const width = window.innerWidth;
    let currentBreakpoint = 'xs';
    
    for (const [breakpoint, minWidth] of Object.entries(this.breakpoints)) {
      if (width >= minWidth) {
        currentBreakpoint = breakpoint;
      }
    }
    
    return currentBreakpoint;
  }

  updateBreakpoint() {
    if (!this.badge) return;
    
    const breakpoint = this.getCurrentBreakpoint();
    this.badge.textContent = breakpoint;
  }

  setupResizeListener() {
    let resizeTimeout;
    
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        this.updateBreakpoint();
      }, 100);
    });
  }
}

// Initialize debug screens when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new DebugScreens();
  });
} else {
  new DebugScreens();
} 