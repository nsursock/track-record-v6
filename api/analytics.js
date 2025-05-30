import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Log environment variables (without sensitive values)
console.log('SUPABASE_URL exists:', !!process.env.SUPABASE_URL);
console.log('SUPABASE_SERVICE_ROLE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // Handle GET requests for analytics display
  if (req.method === 'GET') {
    const { type, range } = req.query;
    if (type === 'display') {
      try {
        const data = await getAnalyticsDisplayData(range || 'last7');
        return res.status(200).json(data);
      } catch (error) {
        console.error('Failed to fetch analytics display data:', error);
        return res.status(500).json({ error: 'Failed to fetch analytics display data', details: error.message });
      }
    } else {
      return res.status(400).json({ error: 'Invalid analytics type' });
    }
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type, data } = req.body;
    console.log('Received analytics request:', { type, data });

    // Validate required environment variables
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing required Supabase environment variables');
    }

    // Validate request data
    if (!type || !data) {
      return res.status(400).json({ error: 'Missing required fields: type and data' });
    }

    switch (type) {
      case 'pageview':
        await handlePageView(data);
        break;
      case 'event':
        await handleEvent(data);
        break;
      case 'session':
        await handleSession(data);
        break;
      case 'heartbeat':
        await handleHeartbeat(data);
        break;
      default:
        return res.status(400).json({ error: 'Invalid analytics type' });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Analytics error:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

async function handlePageView(data) {
  console.log('Handling pageview:', data);
  const { session_id, visitor_id, page_path, referrer, duration } = data;
  
  const { error } = await supabase
    .from('pageviews')
    .insert({
      session_id,
      visitor_id,
      page_path,
      referrer,
      duration,
      viewed_at: new Date().toISOString()
    });

  if (error) {
    console.error('Failed to insert pageview:', error);
    throw error;
  }
}

async function handleEvent(data) {
  console.log('Handling event:', data);
  const { session_id, visitor_id, event_name, event_category, event_action, event_label, event_value, custom_properties } = data;
  
  const { error } = await supabase
    .from('events')
    .insert({
      session_id,
      visitor_id,
      event_name,
      event_category,
      event_action,
      event_label,
      event_value,
      custom_properties,
      occurred_at: new Date().toISOString()
    });

  if (error) {
    console.error('Failed to insert event:', error);
    throw error;
  }
}

async function handleSession(data) {
  console.log('Handling session:', data);
  const { 
    session_id, 
    visitor_id, 
    entry_page, 
    referrer_source, 
    referrer_medium, 
    utm_source, 
    utm_medium, 
    utm_campaign, 
    utm_term, 
    utm_content,
    browser,
    os,
    os_version,
    os_architecture,
    device,
    screen_width,
    screen_height,
    pixel_ratio,
    timezone,
    // Location data
    ip_address,
    country_code,
    country_name,
    region_code,
    region_name,
    city,
    latitude,
    longitude
  } = data;

  // Debug log for OS data
  console.log('OS Data received:', {
    os,
    os_version,
    os_architecture
  });
  
  const now = new Date().toISOString();
  
  // First, ensure visitor exists
  const { error: visitorError } = await supabase
    .from('visitors')
    .upsert({
      visitor_id,
      first_seen_at: now,
      last_seen_at: now
    }, {
      onConflict: 'visitor_id',
      ignoreDuplicates: false
    });

  if (visitorError) {
    console.error('Failed to upsert visitor:', visitorError);
    throw visitorError;
  }

  // Then create or update session
  const { error: sessionError } = await supabase
    .from('sessions')
    .upsert({
      id: session_id,
      visitor_id,
      entry_page,
      referrer_source,
      referrer_medium,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_term,
      utm_content,
      started_at: now,
      last_seen_at: now
    }, { onConflict: 'id' });

  if (sessionError) {
    console.error('Failed to insert session:', sessionError);
    throw sessionError;
  }

  // Insert browser info
  const { error: browserError } = await supabase
    .from('browser_info')
    .insert({
      session_id: session_id,
      browser_name: browser,
      browser_version: data.browser_version,
      engine_name: data.engine_name,
      engine_version: data.engine_version,
      is_mobile: device === 'mobile',
      is_tablet: device === 'tablet',
      is_desktop: device === 'desktop'
    });

  if (browserError) {
    console.error('Failed to insert browser info:', browserError);
  }

  // Insert device info
  const { error: deviceError } = await supabase
    .from('device_info')
    .insert({
      session_id: session_id,
      device_type: device,
      device_vendor: data.device_vendor,
      device_model: data.device_model,
      screen_width: screen_width,
      screen_height: screen_height,
      viewport_width: data.viewport_width,
      viewport_height: data.viewport_height,
      pixel_ratio: pixel_ratio
    });

  if (deviceError) {
    console.error('Failed to insert device info:', deviceError);
  }

  // Insert OS info
  const osInfo = {
    session_id: session_id,
    os_name: os,
    os_version: os_version,
    architecture: os_architecture
  };

  // Debug log for OS info being inserted
  console.log('Inserting OS info:', osInfo);

  const { error: osError } = await supabase
    .from('os_info')
    .insert(osInfo);

  if (osError) {
    console.error('Failed to insert OS info:', osError);
  }

  // Insert location info if available
  if (ip_address || country_code) {
    const { error: locationError } = await supabase
      .from('location_info')
      .insert({
        session_id: session_id,
        ip_address,
        country_code,
        country_name,
        region_code,
        region_name,
        city,
        timezone,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null
      });

    if (locationError) {
      console.error('Failed to insert location info:', locationError);
    }
  }
}

async function handleHeartbeat(data) {
  console.log('Handling heartbeat:', data);
  const { session_id } = data;
  
  const { error } = await supabase
    .from('sessions')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('id', session_id);

  if (error) {
    console.error('Failed to update session heartbeat:', error);
    throw error;
  }
}

// --- Analytics Dashboard Aggregation ---
async function getAnalyticsDisplayData(range = 'last7') {
  // 1. Calculate date range
  const now = new Date();
  let startDate = new Date(now);
  switch (range) {
    case 'today':
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'last24':
      startDate.setDate(startDate.getDate() - 1);
      break;
    case 'thisWeek':
      const day = startDate.getDay();
      const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
      startDate.setDate(diff);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'last7':
      startDate.setDate(startDate.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'thisMonth':
    case 'last30':
      startDate.setDate(startDate.getDate() - 29);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'last90':
      startDate.setDate(startDate.getDate() - 89);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'thisYear':
      startDate.setMonth(0, 1);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'last6Months':
      startDate.setMonth(startDate.getMonth() - 5);
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'last12Months':
      startDate.setMonth(startDate.getMonth() - 11);
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'allTime':
      startDate = new Date('2020-01-01T00:00:00Z');
      break;
    default:
      startDate.setDate(startDate.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
  }

  // 2. Fetch pageviews in range
  const { data: pageviews, error: pageviewsError } = await supabase
    .from('pageviews')
    .select('*')
    .gte('viewed_at', startDate.toISOString())
    .lte('viewed_at', now.toISOString());
  if (pageviewsError) throw pageviewsError;

  // 3. Aggregate stats
  const totalViews = pageviews.length;
  const uniqueVisitors = new Set(pageviews.map(pv => pv.visitor_id)).size;
  const avgDuration = totalViews > 0
    ? Math.round(pageviews.reduce((sum, pv) => sum + (pv.duration || 0), 0) / totalViews)
    : 0;

  // Bounce rate: % of sessions with only one pageview in the range
  const sessionPageviews = {};
  pageviews.forEach(pv => {
    sessionPageviews[pv.session_id] = (sessionPageviews[pv.session_id] || 0) + 1;
  });
  const bounces = Object.values(sessionPageviews).filter(count => count === 1).length;
  const totalSessions = Object.keys(sessionPageviews).length;
  const bounceRate = totalSessions > 0 ? Math.round((bounces / totalSessions) * 100) : 0;

  // Avg session duration: average of (last pageview - first pageview) per session, only for sessions with >1 pageview
  const sessionDurations = {};
  pageviews.forEach(pv => {
    const sid = pv.session_id;
    const t = new Date(pv.viewed_at).getTime();
    if (!sessionDurations[sid]) {
      sessionDurations[sid] = { min: t, max: t };
    } else {
      sessionDurations[sid].min = Math.min(sessionDurations[sid].min, t);
      sessionDurations[sid].max = Math.max(sessionDurations[sid].max, t);
    }
  });
  const durations = Object.values(sessionDurations)
    .map(({ min, max }) => max - min)
    .filter(ms => ms > 0); // Only sessions with >1 pageview

  // Debug logging for session durations
  console.log('sessionDurations:', sessionDurations);
  console.log('durations (ms):', durations);

  let avgSessionStr = 'N/A';
  if (durations.length > 0) {
    const avgSessionMs = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
    const avgSessionSec = Math.round(avgSessionMs / 1000);
    const avgSessionMin = Math.floor(avgSessionSec / 60);
    const avgSessionRemSec = avgSessionSec % 60;
    avgSessionStr = `${avgSessionMin}m ${avgSessionRemSec}s`;
  }

  // Top pages
  const pageCounts = {};
  pageviews.forEach(pv => {
    pageCounts[pv.page_path] = (pageCounts[pv.page_path] || 0) + 1;
  });
  const topPages = Object.entries(pageCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([page, views]) => ({ page, views }));

  // Top referrers
  const referrerCounts = {};
  pageviews.forEach(pv => {
    if (pv.referrer) {
      referrerCounts[pv.referrer] = (referrerCounts[pv.referrer] || 0) + 1;
    }
  });
  const topReferrers = Object.entries(referrerCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([source, count]) => ({ source, count }));

  // --- Slot-filling logic to match frontend (demo mode) for all ranges ---
  let viewsOverTimeData;
  const toISO = (d) => d.toISOString();
  if (range === 'today') {
    // Hourly slots from midnight to current hour (local time)
    const slots = [];
    const slotMap = new Map();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const endHour = now.getHours();
    for (let i = 0; i <= endHour; i++) {
      const slot = new Date(start);
      slot.setHours(i, 0, 0, 0);
      const key = slot.toISOString();
      slots.push(key);
      slotMap.set(key, { views: 0, visitors: new Set() });
    }
    pageviews.forEach(pv => {
      const d = new Date(pv.viewed_at);
      if (d >= start && d <= now) {
        d.setMinutes(0, 0, 0, 0);
        const key = d.toISOString();
        if (slotMap.has(key)) {
          slotMap.get(key).views += 1;
          slotMap.get(key).visitors.add(pv.visitor_id);
        }
      }
    });
    viewsOverTimeData = {
      dates: slots,
      visitors: slots.map(key => slotMap.get(key).visitors.size),
      views: slots.map(key => slotMap.get(key).views)
    };
  } else if (range === 'last24') {
    // 24 hourly slots ending at current hour (local time)
    const slots = [];
    const slotMap = new Map();
    for (let i = 23; i >= 0; i--) {
      const slot = new Date(now.getTime() - i * 60 * 60 * 1000);
      slot.setMinutes(0, 0, 0, 0);
      const key = slot.toISOString();
      slots.push(key);
      slotMap.set(key, { views: 0, visitors: new Set() });
    }
    const slotStart = new Date(slots[0]);
    const slotEnd = new Date(slots[slots.length - 1]);
    slotEnd.setMinutes(59, 59, 999);
    pageviews.forEach(pv => {
      const d = new Date(pv.viewed_at);
      if (d >= slotStart && d <= slotEnd) {
        d.setMinutes(0, 0, 0, 0);
        const key = d.toISOString();
        if (slotMap.has(key)) {
          slotMap.get(key).views += 1;
          slotMap.get(key).visitors.add(pv.visitor_id);
        }
      }
    });
    viewsOverTimeData = {
      dates: slots,
      visitors: slots.map(key => slotMap.get(key).visitors.size),
      views: slots.map(key => slotMap.get(key).views)
    };
  } else if (
    range === 'thisWeek' || range === 'last7' ||
    range === 'thisMonth' || range === 'last30'
  ) {
    // Daily slots from correct start to today (UTC)
    let start;
    if (range === 'thisWeek') {
      start = new Date(now);
      const day = start.getUTCDay();
      const diff = start.getUTCDate() - day + (day === 0 ? -6 : 1);
      start.setUTCDate(diff);
      start.setUTCHours(0, 0, 0, 0);
    } else if (range === 'thisMonth') {
      start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      start.setUTCHours(0, 0, 0, 0);
    } else {
      // last7 or last30
      const daysBack = range === 'last7' ? 6 : 29;
      start = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
      start.setUTCHours(0, 0, 0, 0);
    }
    const slots = [];
    const slotMap = new Map();
    let slot = new Date(start);
    while (slot <= now) {
      const key = slot.toISOString();
      slots.push(key);
      slotMap.set(key, { views: 0, visitors: new Set() });
      slot = new Date(slot.getTime() + 24 * 60 * 60 * 1000);
    }
    const slotStart = new Date(slots[0]);
    const slotEnd = new Date(slots[slots.length - 1]);
    slotEnd.setUTCHours(23, 59, 59, 999);
    pageviews.forEach(pv => {
      const d = new Date(pv.viewed_at);
      if (d >= slotStart && d <= slotEnd) {
        d.setUTCHours(0, 0, 0, 0);
        const key = d.toISOString();
        if (slotMap.has(key)) {
          slotMap.get(key).views += 1;
          slotMap.get(key).visitors.add(pv.visitor_id);
        }
      }
    });
    viewsOverTimeData = {
      dates: slots,
      visitors: slots.map(key => slotMap.get(key).visitors.size),
      views: slots.map(key => slotMap.get(key).views)
    };
    if (range === 'last7') {
      console.log('last7 slots:', slots);
      const pageviewKeys = [];
      pageviews.forEach(pv => {
        const d = new Date(pv.viewed_at);
        d.setUTCHours(0, 0, 0, 0);
        const key = d.toISOString();
        pageviewKeys.push(key);
      });
      console.log('last7 pageview keys:', pageviewKeys);
    }
  } else if (range === 'last90') {
    // Weekly slots (UTC, 13 weeks ending this week)
    const end = new Date(now);
    end.setUTCHours(0, 0, 0, 0);
    // Set to Monday of this week (UTC)
    end.setUTCDate(end.getUTCDate() - ((end.getUTCDay() + 6) % 7));
    const slots = [];
    const slotMap = new Map();
    let slot = new Date(end.getTime() - 12 * 7 * 24 * 60 * 60 * 1000);
    slot.setUTCHours(0, 0, 0, 0);
    // Set to Monday
    slot.setUTCDate(slot.getUTCDate() - ((slot.getUTCDay() + 6) % 7));
    while (slot <= end) {
      const key = slot.toISOString();
      slots.push(key);
      slotMap.set(key, { views: 0, visitors: new Set() });
      slot = new Date(slot.getTime() + 7 * 24 * 60 * 60 * 1000);
    }
    const slotStart = new Date(slots[0]);
    const slotEnd = new Date(slots[slots.length - 1]);
    slotEnd.setUTCDate(slotEnd.getUTCDate() + 6);
    slotEnd.setUTCHours(23, 59, 59, 999);
    pageviews.forEach(pv => {
      const d = new Date(pv.viewed_at);
      // Set to Monday of that week (UTC)
      d.setUTCHours(0, 0, 0, 0);
      d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
      const key = d.toISOString();
      if (d >= slotStart && d <= slotEnd && slotMap.has(key)) {
        slotMap.get(key).views += 1;
        slotMap.get(key).visitors.add(pv.visitor_id);
      }
    });
    viewsOverTimeData = {
      dates: slots,
      visitors: slots.map(key => slotMap.get(key).visitors.size),
      views: slots.map(key => slotMap.get(key).views)
    };
  } else if (
    range === 'thisYear' || range === 'last6Months' || range === 'last12Months'
  ) {
    // Monthly slots (UTC)
    let monthsBack = 11;
    if (range === 'last6Months') monthsBack = 5;
    if (range === 'thisYear') monthsBack = now.getUTCMonth();
    const slots = [];
    const slotMap = new Map();
    let slot = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsBack, 1));
    while (slot <= now) {
      const key = slot.toISOString();
      slots.push(key);
      slotMap.set(key, { views: 0, visitors: new Set() });
      slot = new Date(Date.UTC(slot.getUTCFullYear(), slot.getUTCMonth() + 1, 1));
    }
    const slotStart = new Date(slots[0]);
    const slotEnd = new Date(slots[slots.length - 1]);
    slotEnd.setUTCMonth(slotEnd.getUTCMonth() + 1);
    slotEnd.setUTCDate(0);
    slotEnd.setUTCHours(23, 59, 59, 999);
    pageviews.forEach(pv => {
      const d = new Date(pv.viewed_at);
      const slotDate = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
      const key = slotDate.toISOString();
      if (d >= slotStart && d <= slotEnd && slotMap.has(key)) {
        slotMap.get(key).views += 1;
        slotMap.get(key).visitors.add(pv.visitor_id);
      }
    });
    viewsOverTimeData = {
      dates: slots,
      visitors: slots.map(key => slotMap.get(key).visitors.size),
      views: slots.map(key => slotMap.get(key).views)
    };
  } else if (range === 'allTime') {
    // Yearly slots from first data to now (local time)
    const years = [];
    const first = pageviews.length
      ? new Date(pageviews[0].viewed_at).getFullYear()
      : new Date().getFullYear();
    const last = new Date().getFullYear();
    const slots = [];
    const slotMap = new Map();
    for (let y = first; y <= last; y++) {
      const slot = new Date(y, 0, 1);
      const key = slot.toISOString();
      slots.push(key);
      slotMap.set(key, { views: 0, visitors: new Set() });
    }
    const slotStart = new Date(slots[0]);
    const slotEnd = new Date(slots[slots.length - 1]);
    slotEnd.setFullYear(slotEnd.getFullYear() + 1);
    slotEnd.setDate(0);
    slotEnd.setHours(23, 59, 59, 999);
    pageviews.forEach(pv => {
      const d = new Date(pv.viewed_at);
      const slot = new Date(d.getFullYear(), 0, 1);
      const key = slot.toISOString();
      if (d >= slotStart && d <= slotEnd && slotMap.has(key)) {
        slotMap.get(key).views += 1;
        slotMap.get(key).visitors.add(pv.visitor_id);
      }
    });
    viewsOverTimeData = {
      dates: slots,
      visitors: slots.map(key => slotMap.get(key).visitors.size),
      views: slots.map(key => slotMap.get(key).views)
    };
  } else {
    // Fallback: daily slots for last 7 days (local time)
    const slots = [];
    const slotMap = new Map();
    const start = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
    start.setHours(0, 0, 0, 0);
    for (let i = 0; i < 7; i++) {
      const slot = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
      slot.setHours(0, 0, 0, 0);
      const key = slot.toISOString();
      slots.push(key);
      slotMap.set(key, { views: 0, visitors: new Set() });
    }
    const slotStart = new Date(slots[0]);
    const slotEnd = new Date(slots[slots.length - 1]);
    slotEnd.setHours(23, 59, 59, 999);
    pageviews.forEach(pv => {
      const d = new Date(pv.viewed_at);
      if (d >= slotStart && d <= slotEnd) {
        d.setHours(0, 0, 0, 0);
        const key = d.toISOString();
        if (slotMap.has(key)) {
          slotMap.get(key).views += 1;
          slotMap.get(key).visitors.add(pv.visitor_id);
        }
      }
    });
    viewsOverTimeData = {
      dates: slots,
      visitors: slots.map(key => slotMap.get(key).visitors.size),
      views: slots.map(key => slotMap.get(key).views)
    };
  }

  if (range === 'last7') {
    console.log('last7 viewsOverTimeData:', viewsOverTimeData);
  }

  // --- Aggregate browsers ---
  const { data: browserInfo, error: browserError } = await supabase
    .from('browser_info')
    .select('browser_name')
    .in('session_id', pageviews.map(pv => pv.session_id));
  if (browserError) throw browserError;
  const browserCounts = {};
  browserInfo.forEach(b => {
    browserCounts[b.browser_name] = (browserCounts[b.browser_name] || 0) + 1;
  });
  const browsers = Object.entries(browserCounts)
    .map(([source, count]) => ({ source, percentage: Math.round((count / totalViews) * 100) }));

  // --- Aggregate operating systems ---
  const { data: osInfo, error: osError } = await supabase
    .from('os_info')
    .select('os_name')
    .in('session_id', pageviews.map(pv => pv.session_id));
  if (osError) throw osError;
  const osCounts = {};
  osInfo.forEach(o => {
    osCounts[o.os_name] = (osCounts[o.os_name] || 0) + 1;
  });
  const operatingSystems = Object.entries(osCounts)
    .map(([source, count]) => ({ source, percentage: Math.round((count / totalViews) * 100) }));

  // --- Aggregate devices ---
  const { data: deviceInfo, error: deviceError } = await supabase
    .from('device_info')
    .select('device_type')
    .in('session_id', pageviews.map(pv => pv.session_id));
  if (deviceError) throw deviceError;
  const deviceCounts = {};
  deviceInfo.forEach(d => {
    deviceCounts[d.device_type] = (deviceCounts[d.device_type] || 0) + 1;
  });
  const devices = Object.entries(deviceCounts)
    .map(([source, count]) => ({ source, percentage: Math.round((count / totalViews) * 100) }));

  // --- Referrer categories/subcategories (basic example) ---
  const referrerCategories = Object.entries(referrerCounts)
    .map(([category, count]) => ({ category, count }));
  const referrerSubcategories = referrerCategories; // You can refine this if you have more structure

  return {
    stats: {
      views: totalViews,
      visitors: uniqueVisitors,
      bounceRate,
      visitDuration: avgSessionStr,
      viewsChange: 0, // You can implement period-over-period change if needed
      visitorsChange: 0,
      bounceRateChange: 0,
      visitDurationChange: 0
    },
    viewsOverTime: viewsOverTimeData,
    topPages,
    topReferrers,
    referrerCategories,
    referrerSubcategories,
    browsers,
    operatingSystems,
    devices,
    pageviews
  };
} 