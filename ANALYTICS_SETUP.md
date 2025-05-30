# Analytics Setup Guide

This guide will help you set up the analytics system for your website using Supabase as the backend.

## 1. Database Setup

### Run Migrations

First, you need to run the Supabase migrations to create the analytics tables:

```bash
# Make sure you're in your project directory
cd /path/to/your/project

# Push the migrations to Supabase
supabase db push
```

This will create the following tables:
- `visitors` - Track unique visitors
- `sessions` - Track visitor sessions
- `pageviews` - Track individual page visits
- `browser_info` - Browser details
- `device_info` - Device information
- `os_info` - Operating system details
- `location_info` - Geographic data
- `events` - Custom event tracking

### Database Functions

The migrations also create several helpful functions:
- `get_analytics_summary()` - Get overall analytics stats
- `get_time_series_data()` - Get time-based data for charts
- `get_browser_stats()` - Browser usage statistics
- `get_os_stats()` - Operating system statistics
- `get_device_stats()` - Device type statistics
- `get_top_pages()` - Most visited pages
- `get_top_referrers()` - Top traffic sources
- `calculate_bounce_rate()` - Calculate bounce rate
- `get_period_comparison()` - Compare different time periods

## 2. Environment Configuration

### Set Environment Variables

Create a `.env` file in your project root (or add to your existing one):

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here

# Analytics Configuration
ANALYTICS_ENABLED=true
ANALYTICS_DEBUG=false
```

### Get Your Supabase Credentials

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to Settings > API
4. Copy the "Project URL" and "anon public" key

## 3. Frontend Integration

### Add Analytics Script to Your Base Template

Add the analytics script include just before the closing `</body>` tag in your base template:

```html
<!-- Just before </body> -->
{% include "analytics-script.njk" %}
</body>
```

### Copy the Tracker Script

Make sure the tracker script is accessible at `/assets/js/analytics/tracker.js`. The build process should handle this automatically.

## 4. Testing the Setup

### Enable Debug Mode

Set `ANALYTICS_DEBUG=true` in your environment to see analytics events in the browser console.

### Test Basic Tracking

1. Visit your website
2. Open browser developer tools (F12)
3. Check the Console tab for analytics messages
4. Navigate between pages to test page view tracking
5. Click buttons and links to test event tracking

### Verify Database Data

Check your Supabase dashboard to see if data is being inserted:

1. Go to your Supabase Dashboard
2. Navigate to Table Editor
3. Check the `visitors`, `sessions`, and `pageviews` tables
4. You should see new records being created

## 5. Customizing Analytics

### Track Custom Events

You can track custom events anywhere in your JavaScript:

```javascript
// Basic event tracking
window.analytics.trackEvent('newsletter_signup', 'conversion', 'submit', 'footer_form');

// Event with custom properties
window.analytics.trackEvent('product_view', 'engagement', 'view', 'product-123', null, {
  product_id: '123',
  category: 'electronics',
  price: 99.99
});
```

### Configure Tracking Options

Modify the options in `src/_data/analytics.js`:

```javascript
options: {
  trackPageViews: true,        // Track page views
  trackEvents: true,           // Track custom events
  trackScrollDepth: true,      // Track how far users scroll
  trackOutboundLinks: true,    // Track clicks on external links
  sessionTimeout: 30 * 60 * 1000,  // Session timeout (30 minutes)
  heartbeatInterval: 15 * 1000      // Heartbeat interval (15 seconds)
}
```

## 6. Analytics Dashboard

### Access Your Dashboard

Visit `/analytics` on your website to see the analytics dashboard with:
- Visitor and page view statistics
- Time-series charts
- Top pages and referrers
- Browser, OS, and device breakdowns
- Geographic data

### Dashboard Features

The dashboard includes:
- **Real-time stats** - Current visitors and recent activity
- **Date range filtering** - View data for different time periods
- **Export functionality** - Download data as CSV
- **Responsive design** - Works on desktop and mobile

## 7. Privacy and Compliance

### Data Collection

The analytics system collects:
- Page views and navigation patterns
- Browser and device information
- Geographic location (country/city level)
- Custom events you define
- Session duration and engagement metrics

### Privacy Considerations

- No personally identifiable information (PII) is collected
- Visitor identification uses browser fingerprinting
- IP addresses are stored but can be anonymized
- Users can clear their visitor ID by clearing localStorage

### GDPR Compliance

To make the system GDPR compliant:
1. Add a cookie/privacy notice
2. Allow users to opt-out of tracking
3. Implement data deletion requests
4. Consider anonymizing IP addresses

## 8. Performance Optimization

### Minimize Impact

The analytics system is designed to be lightweight:
- Asynchronous data collection
- Batched requests where possible
- Minimal DOM manipulation
- Error handling to prevent site breakage

### Production Considerations

For production use:
- Set `ANALYTICS_DEBUG=false`
- Monitor Supabase usage and quotas
- Consider implementing data retention policies
- Set up database backups

## 9. Troubleshooting

### Common Issues

**Analytics not working:**
- Check browser console for errors
- Verify Supabase credentials
- Ensure analytics script is loaded
- Check network requests in browser dev tools

**No data in dashboard:**
- Verify database tables exist
- Check RLS policies in Supabase
- Ensure analytics is enabled
- Test with debug mode on

**Performance issues:**
- Check Supabase quotas
- Monitor database query performance
- Consider implementing data archiving

### Debug Commands

```javascript
// Check if analytics is loaded
console.log(window.analytics);

// Manually track an event
window.analytics.trackEvent('test', 'debug', 'manual');

// Check current session
console.log(window.analytics.sessionData);
```

## 10. Advanced Features

### Custom Dashboards

You can create custom analytics views by:
1. Writing custom SQL queries
2. Using the provided database functions
3. Building additional dashboard pages
4. Integrating with external tools

### Data Export

Export analytics data:
- Use the built-in CSV export
- Query Supabase directly via API
- Set up automated reports
- Integrate with business intelligence tools

### Real-time Analytics

For real-time features:
- Use Supabase real-time subscriptions
- Implement WebSocket connections
- Create live dashboard updates
- Monitor active users

## Support

If you encounter issues:
1. Check this documentation
2. Review the browser console for errors
3. Verify your Supabase configuration
4. Test with a minimal setup first

The analytics system is designed to be robust and fail gracefully, so it shouldn't break your website even if there are configuration issues. 