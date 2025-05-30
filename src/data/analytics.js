// Debug logging
console.log('Loading analytics data...')
console.log('ANALYTICS_ENABLED:', process.env.ANALYTICS_ENABLED)
console.log('ANALYTICS_DEBUG:', process.env.ANALYTICS_DEBUG)

// Force boolean values to ensure proper template evaluation
const analyticsData = {
  enabled: String(process.env.ANALYTICS_ENABLED).toLowerCase() === 'true',
  debug: String(process.env.ANALYTICS_DEBUG).toLowerCase() === 'true',
  options: {
    trackPageViews: true,
    trackEvents: true,
    trackScrollDepth: true,
    trackOutboundLinks: true,
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
    heartbeatInterval: 15 * 1000 // 15 seconds
  }
};

console.log('Analytics data:', analyticsData)

export default analyticsData; 