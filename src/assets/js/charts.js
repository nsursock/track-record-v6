import { fetchAnalyticsData, exportToCSV } from './analytics/data.js';
import { fetchRealAnalyticsData } from './analytics/data.js';

export default function () {
  return {
    data: null,
    isLoading: true,
    chartInstances: {},
    pageviews: null,
    demoMode: false,
    _watcherSet: false,

    init() {
      // Set up the watcher only once
      if (!this._watcherSet && this.$watch) {
        this.$watch('demoMode', () => {
          console.log('[DemoMode Switch] Toggled. New value:', this.demoMode);
          // Always pass a valid range
          const range = this.data && this.data.range ? this.data.range : 'last24';
          this.reloadData(range);
        });
        this._watcherSet = true;
      }
      this.reloadData('last24');
    },

    async reloadData(range = 'last24') {
      console.log('[ReloadData] Source:', this.demoMode ? 'DEMO' : 'REAL', 'Range:', range);
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
      console.log('Exporting data...');
      console.log('Current pageviews:', this.pageviews);
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

      // Debug logs for backend data
      console.log('viewsOverTime from backend:', this.data.viewsOverTime);
      if (this.data.viewsOverTime) {
        console.log('dates:', this.data.viewsOverTime.dates);
        console.log('views:', this.data.viewsOverTime.views, 'types:', this.data.viewsOverTime.views.map(v => typeof v));
        console.log('visitors:', this.data.viewsOverTime.visitors, 'types:', this.data.viewsOverTime.visitors.map(v => typeof v));
      }

      let aggregatedData;
      if (this.demoMode) {
        aggregatedData = aggregateData(this.pageviews, this.data.range);
      } else {
        aggregatedData = {
          dates: this.data.viewsOverTime.dates.map(d => new Date(d)),
          visitors: this.data.viewsOverTime.visitors,
          views: this.data.viewsOverTime.views
        };
      }

      // Debug log for chart series data
      console.log('aggregatedData for chart:', aggregatedData);

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