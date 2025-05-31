import { fetchAnalyticsData, exportToCSV } from './analytics/data.js';
import { fetchRealAnalyticsData } from './analytics/data.js';

export default function () {
  return {
    data: null,
    isLoading: true,
    chartInstances: {},
    pageviews: null,
    demoMode: true,
    _watcherSet: false,
    _mapInitializing: false,

    init() {
      // Set up the watcher only once
      if (!this._watcherSet && this.$watch) {
        this.$watch('demoMode', () => {
          // Always pass a valid range
          const range = this.data && this.data.range ? this.data.range : 'last24';
          this.reloadData(range);
        });
        this._watcherSet = true;
      }
      this.reloadData('last24');
    },

    async reloadData(range = 'last24') {
      this.isLoading = true;
      // Clear previous data and charts to prevent flash
      this.data = null;
      this.pageviews = null;
      // Destroy existing charts if any
      Object.values(this.chartInstances).forEach(chart => {
        if (chart && typeof chart.destroy === 'function') chart.destroy();
      });
      this.chartInstances = {};
      try {
        let result;
        if (this.demoMode) {
          result = await fetchAnalyticsData(range);
        } else {
          result = await fetchRealAnalyticsData(range);
        }
        this.data = result;
        this.pageviews = result.pageviews;
        this.data.range = range;
        this.buildCharts();
      } catch (error) {
        console.error('Error loading charts:', error);
      } finally {
        this.isLoading = false;
      }
    },

    async updateCharts(event) {
      await this.reloadData(event.detail.range);
    },

    async exportData() {
      if (this.pageviews) {
        try {
          await exportToCSV(this.pageviews);
        } catch (error) {
          console.error('Error exporting data:', error);
        }
      } else {
        console.error('No pageviews data available for export');
      }
    },

    buildCharts() {
      if (!this.data) return;

      // Views and Visitors Over Time Chart
      this.buildViewsChart();
      this.buildPagesChart();
      this.buildReferrersChart();
      this.buildBrowsersChart();
      this.buildOSChart();
      this.buildDevicesChart();
      this.buildWorldMap();
    },

    buildViewsChart() {
      const formatDate = (date, range) => {
        const d = new Date(date);
        switch (range) {
          case 'last24':
          case 'today':
            return d.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
          case 'thisWeek':
          case 'last7':
          case 'thisMonth':
          case 'last30':
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          case 'last90':
            return `Week ${getWeekNumber(d)}`;
          case 'thisYear':
          case 'last6Months':
          case 'last12Months':
            return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
          case 'allTime':
            return d.getFullYear().toString();
          default:
            return d.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
        }
      };

      // Refactored aggregateData for demo mode: accepts (pageviews, range)
      const aggregateData = (pageviews, range) => {
        const now = new Date();
        let slots = [];
        let slotMap = new Map();
        if (["last24", "today"].includes(range)) {
          // Hourly slots (local time)
          let start;
          if (range === "today") {
            start = new Date(now);
            start.setHours(0, 0, 0, 0);
            const endHour = now.getHours();
            for (let i = 0; i <= endHour; i++) {
              const slot = new Date(start);
              slot.setHours(i, 0, 0, 0);
              const key = slot.toISOString();
              slots.push(key);
              slotMap.set(key, { views: 0, visitors: new Set() });
            }
          } else {
            // last24
            for (let i = 23; i >= 0; i--) {
              const slot = new Date(now.getTime() - i * 60 * 60 * 1000);
              slot.setMinutes(0, 0, 0, 0);
              const key = slot.toISOString();
              slots.push(key);
              slotMap.set(key, { views: 0, visitors: new Set() });
            }
          }
          // Assign pageviews to slots
          pageviews.forEach(pv => {
            const d = new Date(pv.timestamp || pv.viewed_at);
            d.setMinutes(0, 0, 0, 0);
            const key = d.toISOString();
            if (slotMap.has(key)) {
              slotMap.get(key).views += 1;
              slotMap.get(key).visitors.add(pv.visitorId || pv.visitor_id);
            }
          });
        } else if (["thisWeek", "last7", "thisMonth", "last30"].includes(range)) {
          // Daily slots (UTC)
          let start;
          if (range === "thisWeek") {
            start = new Date(now);
            const day = start.getUTCDay();
            const diff = start.getUTCDate() - day + (day === 0 ? -6 : 1);
            start.setUTCDate(diff);
            start.setUTCHours(0, 0, 0, 0);
          } else if (range === "thisMonth") {
            start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
            start.setUTCHours(0, 0, 0, 0);
          } else {
            // last7 or last30
            const daysBack = range === "last7" ? 6 : 29;
            start = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
            start.setUTCHours(0, 0, 0, 0);
          }
          let slot = new Date(start);
          while (slot <= now) {
            const key = slot.toISOString();
            slots.push(key);
            slotMap.set(key, { views: 0, visitors: new Set() });
            slot = new Date(slot.getTime() + 24 * 60 * 60 * 1000);
          }
          // Assign pageviews to slots
          pageviews.forEach(pv => {
            const d = new Date(pv.timestamp || pv.viewed_at);
            d.setUTCHours(0, 0, 0, 0);
            const key = d.toISOString();
            if (slotMap.has(key)) {
              slotMap.get(key).views += 1;
              slotMap.get(key).visitors.add(pv.visitorId || pv.visitor_id);
            }
          });
        } else if (range === "last90") {
          // Weekly slots (UTC, 13 weeks ending this week)
          const end = new Date(now);
          end.setUTCHours(0, 0, 0, 0);
          end.setUTCDate(end.getUTCDate() - ((end.getUTCDay() + 6) % 7));
          let slot = new Date(end.getTime() - 12 * 7 * 24 * 60 * 60 * 1000);
          slot.setUTCHours(0, 0, 0, 0);
          slot.setUTCDate(slot.getUTCDate() - ((slot.getUTCDay() + 6) % 7));
          while (slot <= end) {
            const key = slot.toISOString();
            slots.push(key);
            slotMap.set(key, { views: 0, visitors: new Set() });
            slot = new Date(slot.getTime() + 7 * 24 * 60 * 60 * 1000);
          }
          // Assign pageviews to slots
          pageviews.forEach(pv => {
            const d = new Date(pv.timestamp || pv.viewed_at);
            d.setUTCHours(0, 0, 0, 0);
            d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
            const key = d.toISOString();
            if (slotMap.has(key)) {
              slotMap.get(key).views += 1;
              slotMap.get(key).visitors.add(pv.visitorId || pv.visitor_id);
            }
          });
        } else if (["thisYear", "last6Months", "last12Months"].includes(range)) {
          // Monthly slots (UTC)
          let monthsBack = 11;
          if (range === "last6Months") monthsBack = 5;
          if (range === "thisYear") monthsBack = now.getUTCMonth();
          let slot = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsBack, 1));
          while (slot <= now) {
            const key = slot.toISOString();
            slots.push(key);
            slotMap.set(key, { views: 0, visitors: new Set() });
            slot = new Date(Date.UTC(slot.getUTCFullYear(), slot.getUTCMonth() + 1, 1));
          }
          // Assign pageviews to slots
          pageviews.forEach(pv => {
            const d = new Date(pv.timestamp || pv.viewed_at);
            const slotDate = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
            const key = slotDate.toISOString();
            if (slotMap.has(key)) {
              slotMap.get(key).views += 1;
              slotMap.get(key).visitors.add(pv.visitorId || pv.visitor_id);
            }
          });
        } else if (range === "allTime") {
          // Yearly slots (UTC)
          let firstYear = pageviews.length ? new Date(pageviews[0].timestamp || pageviews[0].viewed_at).getUTCFullYear() : now.getUTCFullYear();
          let lastYear = now.getUTCFullYear();
          for (let y = firstYear; y <= lastYear; y++) {
            const slot = new Date(Date.UTC(y, 0, 1));
            const key = slot.toISOString();
            slots.push(key);
            slotMap.set(key, { views: 0, visitors: new Set() });
          }
          // Assign pageviews to slots
          pageviews.forEach(pv => {
            const d = new Date(pv.timestamp || pv.viewed_at);
            const slotDate = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
            const key = slotDate.toISOString();
            if (slotMap.has(key)) {
              slotMap.get(key).views += 1;
              slotMap.get(key).visitors.add(pv.visitorId || pv.visitor_id);
            }
          });
        }
        return {
          dates: slots.map(d => new Date(d)),
          visitors: slots.map(key => slotMap.get(key).visitors.size),
          views: slots.map(key => slotMap.get(key).views)
        };
      };

      if (!this.data.viewsOverTime) {
        console.error('Invalid viewsOverTime data:', this.data.viewsOverTime);
        return;
      }

      const aggregatedData = aggregateData(this.pageviews, this.data.range);

      if (aggregatedData.dates.length === 0) {
        return;
      }

      const chart = buildChart('#views-chart', mode => ({
        chart: {
          type: 'bar',
          height: 350,
          stacked: true,
          toolbar: { show: false },
          fontFamily: 'inherit',
          animations: {
            enabled: true,
            easing: 'easeinout',
            speed: 800,
            animateGradually: {
              enabled: true,
              delay: 150
            },
            dynamicAnimation: {
              enabled: true,
              speed: 350
            }
          }
        },
        grid: {
          show: true,
          borderColor: 'color-mix(in oklab, var(--color-base-content) 20%, transparent)',
          strokeDashArray: 4,
          position: 'back',
          xaxis: {
            lines: {
              show: true
            }
          },
          yaxis: {
            lines: {
              show: true
            }
          },
          padding: {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0
          }
        },
        series: [{
          name: 'Visitors',
          data: aggregatedData.visitors
        }, {
          name: 'Views',
          data: aggregatedData.views
        }],
        xaxis: {
          categories: aggregatedData.dates.map(date => formatDate(date, this.data.range)),
          labels: {
            style: {
              colors: 'color-mix(in oklab, var(--color-base-content) 50%, transparent)'
            },
            rotate: -45,
            rotateAlways: true
          },
          axisBorder: {
            show: true,
            color: 'color-mix(in oklab, var(--color-base-content) 20%, transparent)'
          },
          axisTicks: {
            show: true,
            color: 'color-mix(in oklab, var(--color-base-content) 20%, transparent)'
          }
        },
        yaxis: {
          labels: {
            style: {
              colors: 'color-mix(in oklab, var(--color-base-content) 50%, transparent)'
            }
          },
          axisBorder: {
            show: true,
            color: 'color-mix(in oklab, var(--color-base-content) 20%, transparent)'
          },
          axisTicks: {
            show: true,
            color: 'color-mix(in oklab, var(--color-base-content) 20%, transparent)'
          }
        },
        colors: [
          'var(--color-primary)',
          'color-mix(in oklab, var(--color-secondary) 80%, transparent)'
        ],
        legend: {
          position: 'bottom',
          horizontalAlign: 'center',
          labels: {
            colors: 'color-mix(in oklab, var(--color-base-content) 50%, transparent)',
            useSeriesColors: false
          }
        },
        tooltip: {
          theme: 'dark',
          style: { 
            fontFamily: 'inherit',
            backgroundColor: 'var(--color-base-200)',
            color: 'var(--color-base-content)',
            border: '1px solid var(--color-base-300)'
          },
          y: { formatter: value => value.toLocaleString() }
        }
      }));
      this.chartInstances['views'] = chart;
    },

    buildPagesChart() {
      const chart = buildChart('#pages-chart', mode => ({
        chart: {
          type: 'pie',
          height: 350,
          toolbar: { show: false },
          fontFamily: 'inherit',
          animations: {
            enabled: true,
            easing: 'easeinout',
            speed: 800,
            animateGradually: {
              enabled: true,
              delay: 150
            },
            dynamicAnimation: {
              enabled: true,
              speed: 350
            }
          }
        },
        series: this.data.topPages.map(page => page.views),
        labels: this.data.topPages.map(page => page.page),
        colors: [
          'var(--color-primary)',
          'color-mix(in oklab, var(--color-secondary) 80%, transparent)',
          'color-mix(in oklab, var(--color-primary) 60%, transparent)',
          'color-mix(in oklab, var(--color-secondary) 40%, transparent)',
          'color-mix(in oklab, var(--color-primary) 20%, transparent)'
        ],
        stroke: {
          width: 1,
          colors: ['color-mix(in oklab, var(--color-base-content) 20%, transparent)']
        },
        legend: {
          position: 'bottom',
          horizontalAlign: 'center',
          labels: {
            colors: 'color-mix(in oklab, var(--color-base-content) 50%, transparent)',
            useSeriesColors: false
          }
        },
        tooltip: {
          theme: 'light',
          style: { fontFamily: 'inherit' },
          y: { formatter: value => value.toLocaleString() + ' visits' }
        }
      }));
      this.chartInstances['pages'] = chart;
    },

    buildReferrersChart() {
      // Debug logging with full content and detailed mapping
      const categories = JSON.parse(JSON.stringify(this.data.referrerCategories));
      
      // Ensure we have valid data
      if (!this.data.referrerCategories || !Array.isArray(this.data.referrerCategories)) {
        console.error('Invalid referrerCategories data:', this.data.referrerCategories);
        return;
      }

      const chart = buildChart('#referrers-chart', mode => ({
        chart: {
          type: 'pie',
          height: 350,
          toolbar: { show: false },
          fontFamily: 'inherit',
          animations: {
            enabled: true,
            easing: 'easeinout',
            speed: 800,
            animateGradually: {
              enabled: true,
              delay: 150
            },
            dynamicAnimation: {
              enabled: true,
              speed: 350
            }
          }
        },
        series: this.data.referrerCategories.map(category => category.count || category.percentage || 0),
        labels: this.data.referrerCategories.map(category => {
          const source = category.source || category.category || category.name || category.type;
          return this.mapSourceToLabel(source);
        }),
        colors: [
          'var(--color-primary)',
          'color-mix(in oklab, var(--color-secondary) 80%, transparent)',
          'color-mix(in oklab, var(--color-primary) 60%, transparent)',
          'color-mix(in oklab, var(--color-secondary) 40%, transparent)',
          'color-mix(in oklab, var(--color-primary) 20%, transparent)'
        ],
        stroke: {
          width: 1,
          colors: ['color-mix(in oklab, var(--color-base-content) 20%, transparent)']
        },
        legend: {
          position: 'bottom',
          horizontalAlign: 'center',
          labels: {
            colors: 'color-mix(in oklab, var(--color-base-content) 50%, transparent)',
            useSeriesColors: false
          }
        },
        tooltip: {
          theme: 'light',
          style: { fontFamily: 'inherit' },
          y: { formatter: value => value + ' visits' }
        }
      }));
      this.chartInstances['referrers'] = chart;
    },

    mapSourceToLabel(source) {
      const sourceMap = {
        // Direct traffic
        'direct': 'Direct Traffic',
        'direct_traffic': 'Direct Traffic',
        'none': 'Direct Traffic',
        '': 'Direct Traffic',
        
        // Organic search
        'organic': 'Organic Search',
        'search_organic': 'Organic Search',
        'search': 'Organic Search',
        'google': 'Organic Search',
        'bing': 'Organic Search',
        
        // Social media
        'social': 'Social Media',
        'social_media': 'Social Media',
        'social_network': 'Social Media',
        'facebook': 'Social Media',
        'twitter': 'Social Media',
        'instagram': 'Social Media',
        'linkedin': 'Social Media',
        
        // Internal navigation
        'internal': 'Internal Navigation',
        
        // Technical
        'technical': 'Technical Sites',
        
        // Content
        'content': 'Content Sites',
        
        // Product
        'product': 'Product Sites',
        
        // Other
        'other': 'Other',
        'unknown': 'Other'
      };
      
      return sourceMap[source] || source || 'Other';
    },

    buildBrowsersChart() {
      const chart = buildChart('#browsers-chart', mode => ({
        chart: {
          type: 'pie',
          height: 350,
          toolbar: { show: false },
          fontFamily: 'inherit',
          animations: {
            enabled: true,
            easing: 'easeinout',
            speed: 800,
            animateGradually: {
              enabled: true,
              delay: 150
            },
            dynamicAnimation: {
              enabled: true,
              speed: 350
            }
          }
        },
        series: this.data.browsers.map(browser => browser.percentage),
        labels: this.data.browsers.map(browser => browser.source),
        colors: [
          'var(--color-primary)',
          'color-mix(in oklab, var(--color-secondary) 80%, transparent)',
          'color-mix(in oklab, var(--color-primary) 60%, transparent)',
          'color-mix(in oklab, var(--color-secondary) 40%, transparent)'
        ],
        stroke: {
          width: 1,
          colors: ['color-mix(in oklab, var(--color-base-content) 20%, transparent)']
        },
        legend: {
          position: 'bottom',
          horizontalAlign: 'center',
          labels: {
            colors: 'color-mix(in oklab, var(--color-base-content) 50%, transparent)',
            useSeriesColors: false
          }
        },
        tooltip: {
          theme: 'light',
          style: { fontFamily: 'inherit' },
          y: { formatter: value => {
            const totalVisits = this.data.stats.visits;
            const visits = Math.round((value / 100) * totalVisits);
            return visits.toLocaleString() + ' visits';
          }}
        }
      }));
      this.chartInstances['browsers'] = chart;
    },

    buildOSChart() {
      const chart = buildChart('#os-chart', mode => ({
        chart: {
          type: 'pie',
          height: 350,
          toolbar: { show: false },
          fontFamily: 'inherit',
          animations: {
            enabled: true,
            easing: 'easeinout',
            speed: 800,
            animateGradually: {
              enabled: true,
              delay: 150
            },
            dynamicAnimation: {
              enabled: true,
              speed: 350
            }
          }
        },
        series: this.data.operatingSystems.map(os => os.percentage),
        labels: this.data.operatingSystems.map(os => os.source),
        colors: [
          'var(--color-primary)',
          'color-mix(in oklab, var(--color-secondary) 80%, transparent)',
          'color-mix(in oklab, var(--color-primary) 60%, transparent)'
        ],
        stroke: {
          width: 1,
          colors: ['color-mix(in oklab, var(--color-base-content) 20%, transparent)']
        },
        legend: {
          position: 'bottom',
          horizontalAlign: 'center',
          labels: {
            colors: 'color-mix(in oklab, var(--color-base-content) 50%, transparent)',
            useSeriesColors: false
          }
        },
        tooltip: {
          theme: 'light',
          style: { fontFamily: 'inherit' },
          y: { formatter: value => {
            const totalVisits = this.data.stats.visits;
            const visits = Math.round((value / 100) * totalVisits);
            return visits.toLocaleString() + ' visits';
          }}
        }
      }));
      this.chartInstances['os'] = chart;
    },

    buildDevicesChart() {
      const chart = buildChart('#devices-chart', mode => ({
        chart: {
          type: 'pie',
          height: 350,
          toolbar: { show: false },
          fontFamily: 'inherit',
          animations: {
            enabled: true,
            easing: 'easeinout',
            speed: 800,
            animateGradually: {
              enabled: true,
              delay: 150
            },
            dynamicAnimation: {
              enabled: true,
              speed: 350
            }
          }
        },
        series: this.data.devices.map(device => device.percentage),
        labels: this.data.devices.map(device => device.source),
        colors: [
          'var(--color-primary)',
          'color-mix(in oklab, var(--color-secondary) 80%, transparent)',
          'color-mix(in oklab, var(--color-primary) 60%, transparent)'
        ],
        stroke: {
          width: 1,
          colors: ['color-mix(in oklab, var(--color-base-content) 20%, transparent)']
        },
        legend: {
          position: 'bottom',
          horizontalAlign: 'center',
          labels: {
            colors: 'color-mix(in oklab, var(--color-base-content) 50%, transparent)',
            useSeriesColors: false
          }
        },
        tooltip: {
          theme: 'light',
          style: { fontFamily: 'inherit' },
          y: { formatter: value => {
            const totalVisits = this.data.stats.visits;
            const visits = Math.round((value / 100) * totalVisits);
            return visits.toLocaleString() + ' visits';
          }}
        }
      }));
      this.chartInstances['devices'] = chart;
    },

    buildWorldMap() {
      // Prevent double initialization
      if (this._mapInitializing) {
        console.log('Map initialization already in progress, skipping...');
        return;
      }
      this._mapInitializing = true;

      if (!this.pageviews || !this.data) {
        console.log('Waiting for data to be available...', {
          hasPageviews: !!this.pageviews,
          hasData: !!this.data,
          dataKeys: this.data ? Object.keys(this.data) : []
        });
        this._mapInitializing = false;
        return;
      }

      // Clean up existing map if it exists
      if (this.chartInstances.worldMap) {
        console.log('Cleaning up existing map...');
        this.chartInstances.worldMap.destroy();
        this.chartInstances.worldMap = null;
      }

      // Debug logging for data sources
      console.log('=== Map Data Debug ===');
      console.log('1. Initial Data Check:', JSON.stringify({
        hasData: !!this.data,
        hasPageviews: !!this.pageviews,
        dataKeys: this.data ? Object.keys(this.data) : [],
        pageviewsLength: this.pageviews.length,
        dataStats: this.data?.stats || null,
        currentRange: this.data.range || 'last24'
      }, null, 2));

      // Ensure the map container exists and has dimensions
      const mapContainer = document.getElementById('world-map');
      if (!mapContainer) {
        console.error('Map container not found');
        this._mapInitializing = false;
        return;
      }

      // Clear the container
      mapContainer.innerHTML = '';
      
      // Set initial dimensions
      mapContainer.style.width = '100%';
      mapContainer.style.height = '400px';

      // Process pageviews to get country data
      const dataSet = {};
      const visitorMap = new Map(); // Track unique visitors per country
      const previousVisitorMap = new Map(); // Track previous period visitors
      const previousViewMap = new Map(); // Track previous period views
      
      // Get the current period's timestamp range
      const now = new Date();
      let startTime, endTime, previousStartTime, previousEndTime;
      
      // Ensure we have a valid range
      const currentRange = this.data.range || 'last24';
      console.log('Using range:', currentRange);
      
      // Use the same data source as the stats
      const pageviews = this.data.pageviews || this.pageviews;
      console.log('Using pageviews source:', {
        fromData: !!this.data.pageviews,
        fromThis: !!this.pageviews,
        length: pageviews.length
      });

      try {
        switch (currentRange) {
          case 'last24':
            endTime = now;
            startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            previousEndTime = startTime;
            previousStartTime = new Date(startTime.getTime() - 24 * 60 * 60 * 1000);
            break;
          case 'today':
            endTime = now;
            startTime = new Date(now);
            startTime.setHours(0, 0, 0, 0);
            previousEndTime = startTime;
            previousStartTime = new Date(startTime.getTime() - 24 * 60 * 60 * 1000);
            break;
          case 'last7':
            endTime = now;
            startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            previousEndTime = startTime;
            previousStartTime = new Date(startTime.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'last30':
            endTime = now;
            startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            previousEndTime = startTime;
            previousStartTime = new Date(startTime.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case 'last90':
            endTime = now;
            startTime = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            previousEndTime = startTime;
            previousStartTime = new Date(startTime.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
          case 'thisWeek':
            endTime = now;
            startTime = new Date(now);
            startTime.setDate(startTime.getDate() - startTime.getDay());
            startTime.setHours(0, 0, 0, 0);
            previousEndTime = startTime;
            previousStartTime = new Date(startTime.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'thisMonth':
            endTime = now;
            startTime = new Date(now.getFullYear(), now.getMonth(), 1);
            previousEndTime = startTime;
            previousStartTime = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            break;
          case 'last6Months':
            endTime = now;
            startTime = new Date(now.getFullYear(), now.getMonth() - 6, 1);
            previousEndTime = startTime;
            previousStartTime = new Date(now.getFullYear(), now.getMonth() - 12, 1);
            break;
          case 'last12Months':
            endTime = now;
            startTime = new Date(now.getFullYear(), now.getMonth() - 12, 1);
            previousEndTime = startTime;
            previousStartTime = new Date(now.getFullYear(), now.getMonth() - 24, 1);
            break;
          case 'thisYear':
            endTime = now;
            startTime = new Date(now.getFullYear(), 0, 1);
            previousEndTime = startTime;
            previousStartTime = new Date(now.getFullYear() - 1, 0, 1);
            break;
          case 'allTime':
            // For all time, we'll use the entire dataset and compare with the first half
            endTime = now;
            startTime = new Date(0); // Beginning of time
            const midPoint = new Date((endTime.getTime() - startTime.getTime()) / 2);
            previousEndTime = midPoint;
            previousStartTime = startTime;
            break;
          default:
            endTime = now;
            startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            previousEndTime = startTime;
            previousStartTime = new Date(startTime.getTime() - 24 * 60 * 60 * 1000);
        }

        // Debug logging for time ranges
        console.log('Time Ranges:', {
          range: currentRange,
          currentPeriod: {
            start: startTime.toISOString(),
            end: endTime.toISOString()
          },
          previousPeriod: {
            start: previousStartTime.toISOString(),
            end: previousEndTime.toISOString()
          }
        });

        // First pass: collect unique visitors and views for both current and previous periods
        let currentPeriodCount = 0;
        let previousPeriodCount = 0;

        pageviews.forEach(pageview => {
          const timestamp = new Date(pageview.visitedAt || pageview.timestamp);
          const countryCode = pageview.location?.countryCode || 'Unknown';
          const [countryCode3, countryCode2] = countryCode.split('-');
          const code3 = countryCode3 || 'UNKNOWN';
          const visitorId = pageview.visitorId || pageview.visitor_id;
          
          // Process current period
          if (timestamp >= startTime && timestamp <= endTime) {
            currentPeriodCount++;
            if (!visitorMap.has(code3)) {
              visitorMap.set(code3, new Set());
            }
            visitorMap.get(code3).add(visitorId);
          }
          
          // Process previous period
          if (timestamp >= previousStartTime && timestamp < previousEndTime) {
            previousPeriodCount++;
            if (!previousVisitorMap.has(code3)) {
              previousVisitorMap.set(code3, new Set());
              previousViewMap.set(code3, 0);
            }
            previousVisitorMap.get(code3).add(visitorId);
            previousViewMap.set(code3, previousViewMap.get(code3) + 1);
          }
        });

        console.log('Period counts:', {
          currentPeriod: currentPeriodCount,
          previousPeriod: previousPeriodCount,
          totalPageviews: pageviews.length
        });

        // Second pass: process pageviews and use visitor counts
        pageviews.forEach(pageview => {
          const timestamp = new Date(pageview.visitedAt || pageview.timestamp);
          if (timestamp < startTime || timestamp > endTime) return;

          const countryCode = pageview.location?.countryCode || 'Unknown';
          const [countryCode3, countryCode2] = countryCode.split('-');
          const code3 = countryCode3 || 'UNKNOWN';
          
          if (!dataSet[code3]) {
            const previousVisitors = previousVisitorMap.get(code3)?.size || 0;
            const previousViews = previousViewMap.get(code3) || 0;
            const currentVisitors = visitorMap.get(code3)?.size || 0;
            
            dataSet[code3] = {
              visitors: {
                value: '0',
                percent: '0',
                isGrown: previousVisitors === 0 ? true : currentVisitors > previousVisitors
              },
              views: {
                value: '0',
                percent: '0',
                isGrown: previousViews === 0 ? true : 0 > previousViews
              },
              fillKey: 'MAJOR',
              short: countryCode2?.toLowerCase() || 'unknown',
              customName: pageview.location?.country || 'Unknown',
              _rawVisitors: currentVisitors,
              _rawViews: 0,
              _previousVisitors: previousVisitors,
              _previousViews: previousViews
            };
          }

          // Increment view count
          dataSet[code3]._rawViews++;
        });

        // Calculate percentages based on total stats
        const totalVisitors = this.data.stats.visitors;
        const totalViews = this.data.stats.views;

        // Log the totals we're using for percentages
        console.log('2. Total Stats:', {
          totalVisitors,
          totalViews,
          stats: this.data.stats,
          calculatedTotalVisitors: Array.from(visitorMap.values()).reduce((sum, set) => sum + set.size, 0),
          calculatedTotalViews: Object.values(dataSet).reduce((sum, data) => sum + data._rawViews, 0)
        });

        // Format values and calculate percentages
        Object.values(dataSet).forEach(data => {
          data.visitors.value = data._rawVisitors.toLocaleString();
          data.views.value = data._rawViews.toLocaleString();
          
          // Calculate percentages
          const visitorPercent = totalVisitors ? Math.round((data._rawVisitors / totalVisitors) * 100) : 0;
          const viewPercent = totalViews ? Math.round((data._rawViews / totalViews) * 100) : 0;
          
          data.visitors.percent = visitorPercent.toString();
          data.views.percent = viewPercent.toString();

          // Calculate growth indicators
          data.visitors.isGrown = data._previousVisitors === 0 ? true : data._rawVisitors > data._previousVisitors;
          data.views.isGrown = data._previousViews === 0 ? true : data._rawViews > data._previousViews;
        });

        // Debug logging for processed data
        console.log('3. Final Processed Data:', JSON.stringify(Object.entries(dataSet).slice(0, 3).map(([code, data]) => ({
          code,
          visitors: data._rawVisitors,
          views: data._rawViews,
          previousVisitors: data._previousVisitors,
          previousViews: data._previousViews,
          name: data.customName,
          formattedVisitors: data.visitors.value,
          formattedViews: data.views.value,
          visitorPercent: data.visitors.percent,
          viewPercent: data.views.percent,
          visitorsIsGrown: data.visitors.isGrown,
          viewsIsGrown: data.views.isGrown
        })), null, 2));

        // Initialize the map with a slight delay to ensure container is ready
        setTimeout(() => {
          try {
            const map = new Datamap({
              element: mapContainer,
              projection: 'mercator',
              responsive: true,
              fills: {
                defaultFill: `color-mix(in oklab, var(--color-base-200) 60%, transparent)`,
                MAJOR: `color-mix(in oklab, var(--color-neutral) 30%, transparent)`
              },
              data: dataSet,
              geographyConfig: {
                borderColor: `color-mix(in oklab, var(--color-base-content) 50%, transparent)`,
                highlightFillColor: `color-mix(in oklab, var(--color-primary) 20%, transparent)`,
                highlightBorderColor: `var(--color-primary)`,
                popupTemplate: function(geo, data) {
                  if (!data) return '';
                  const growUp = `<span class="icon-[tabler--trending-up] text-success size-4"></span>`;
                  const growDown = `<span class="icon-[tabler--trending-down] text-error size-4"></span>`;
                  return `
                    <div class="bg-base-100 rounded-lg overflow-hidden shadow-base-300/20 shadow-sm min-w-48 me-2">
                      <div class="flex items-center gap-2 bg-base-200 p-2">
                        <div class="flex items-center">
                          <span class="fi fi-${data.short} h-4 w-5 rounded-sm"></span>
                        </div>
                        <span class="text-sm font-medium text-base-content">${data.customName || geo.properties.name}</span>
                      </div>
                      <div class="p-2 space-y-1">
                        <div class="flex items-center justify-between text-xs gap-2">
                          <div class="text-base-content/80 text-nowrap">Visitors: <span class="font-medium">${data.visitors.value}</span></div>
                          <span class="flex items-center gap-0.5 ${data.visitors.isGrown ? 'text-success' : 'text-error'}">${data.visitors.percent}%${data.visitors.isGrown ? growUp : growDown}</span>
                        </div>
                        <div class="flex items-center justify-between text-xs gap-2">
                          <div class="text-base-content/80 text-nowrap">Views: <span class="font-medium">${data.views.value}</span></div>
                          <span class="flex items-center gap-0.5 ${data.views.isGrown ? 'text-success' : 'text-error'}">${data.views.percent}%${data.views.isGrown ? growUp : growDown}</span>
                        </div>
                      </div>
                    </div>`;
                }
              }
            });

            // Handle window resize with debounce
            let resizeTimeout;
            window.addEventListener('resize', () => {
              clearTimeout(resizeTimeout);
              resizeTimeout = setTimeout(() => {
                if (mapContainer.offsetWidth > 0) {
                  map.resize();
                }
              }, 250);
            });

            // Store the map instance
            this.chartInstances.worldMap = map;

            // Update countries list using the same data
            const countriesList = document.getElementById('countries-list');
            if (countriesList) {
              const sortedCountries = Object.entries(dataSet)
                .sort(([, a], [, b]) => b._rawVisitors - a._rawVisitors)
                .slice(0, 10);

              console.log('4. Final Countries List Data:', JSON.stringify(sortedCountries.map(([code, data]) => ({
                code,
                visitors: data._rawVisitors,
                views: data._rawViews,
                name: data.customName
              })), null, 2));

              countriesList.innerHTML = sortedCountries
                .map(([code3, data]) => {
                  return `
                    <div class="flex justify-between items-center p-2 rounded hover:bg-base-200">
                      <div class="flex items-center gap-2">
                        <span class="fi fi-${data.short} h-4 w-5 rounded-sm"></span>
                        <span>${data.customName}</span>
                      </div>
                      <div class="flex items-center gap-2">
                        <span class="text-xs text-base-content/60">${data.views.value}</span>
                        <span class="font-medium">${data.visitors.value}</span>
                      </div>
                    </div>
                  `;
                })
                .join('');
            }
          } catch (error) {
            console.error('Error initializing map:', error);
          } finally {
            this._mapInitializing = false;
          }
        }, 100);
      } catch (error) {
        console.error('Error processing map data:', error);
        this._mapInitializing = false;
      }
    }
  }
}

const getWeekNumber = (date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}; 