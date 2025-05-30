import { getAnalyticsData, exportToCSV } from './display.js';

// Export the main function
export const fetchAnalyticsData = async (range = 'last7') => {
  // Clear cachedData to force fresh demo data generation
  if (typeof window !== 'undefined') {
    if (window.cachedData !== undefined) window.cachedData = null;
  }
  if (typeof globalThis !== 'undefined' && globalThis.cachedData !== undefined) {
    globalThis.cachedData = null;
  }
  // Also try to clear module-scoped cachedData if possible
  try {
    const display = await import('./display.js');
    if ('cachedData' in display) display.cachedData = null;
  } catch (e) {}
  return await getAnalyticsData(range);
};

// Fetch real analytics data from backend
export const fetchRealAnalyticsData = async (range = 'last7') => {
  const response = await fetch(`/api/analytics?type=display&range=${encodeURIComponent(range)}`);
  if (!response.ok) {
    throw new Error('Failed to fetch real analytics data');
  }
  return await response.json();
};

// Re-export the exportToCSV function
export { exportToCSV }; 