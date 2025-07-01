// Performance monitoring utilities for PWA
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.startTime = performance.now();
    this.isEnabled = process.env.NODE_ENV === 'development' || localStorage.getItem('performance-debug') === 'true';
  }

  // Start measuring a performance metric
  startMeasure(name) {
    if (!this.isEnabled) return;
    
    this.metrics.set(name, {
      start: performance.now(),
      end: null,
      duration: null
    });
    
    if (this.isEnabled) {
      console.log(`[Performance] Started measuring: ${name}`);
    }
  }

  // End measuring a performance metric
  endMeasure(name) {
    if (!this.isEnabled) return;
    
    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`[Performance] No start time found for: ${name}`);
      return null;
    }

    metric.end = performance.now();
    metric.duration = metric.end - metric.start;
    
    if (this.isEnabled) {
      console.log(`[Performance] ${name}: ${metric.duration.toFixed(2)}ms`);
    }

    // Log slow operations
    if (metric.duration > 1000) {
      console.warn(`[Performance] Slow operation detected: ${name} took ${metric.duration.toFixed(2)}ms`);
    }

    return metric.duration;
  }

  // Measure a function execution time
  async measureFunction(name, fn) {
    this.startMeasure(name);
    try {
      const result = await fn();
      this.endMeasure(name);
      return result;
    } catch (error) {
      this.endMeasure(name);
      throw error;
    }
  }

  // Get all metrics
  getMetrics() {
    const result = {};
    for (const [name, metric] of this.metrics) {
      result[name] = metric;
    }
    return result;
  }

  // Log performance summary
  logSummary() {
    if (!this.isEnabled) return;
    
    console.group('[Performance] Summary');
    
    // Overall app load time
    const appLoadTime = performance.now() - this.startTime;
    console.log(`App load time: ${appLoadTime.toFixed(2)}ms`);
    
    // Individual metrics
    for (const [name, metric] of this.metrics) {
      if (metric.duration !== null) {
        console.log(`${name}: ${metric.duration.toFixed(2)}ms`);
      }
    }
    
    // Web Vitals if available
    if ('web-vitals' in window) {
      this.logWebVitals();
    }
    
    console.groupEnd();
  }

  // Log Web Vitals metrics
  logWebVitals() {
    // This would integrate with web-vitals library if installed
    console.log('[Performance] Web Vitals integration available');
    
    // Basic navigation timing
    if (performance.timing) {
      const timing = performance.timing;
      const loadTime = timing.loadEventEnd - timing.navigationStart;
      const domReady = timing.domContentLoadedEventEnd - timing.navigationStart;
      
      console.log(`Navigation timing - Load: ${loadTime}ms, DOM Ready: ${domReady}ms`);
    }
  }

  // Monitor bundle size and lazy loading
  monitorBundlePerformance() {
    if (!this.isEnabled) return;
    
    // Monitor script loading
    const scripts = document.querySelectorAll('script[src]');
    console.log(`[Performance] Loaded scripts: ${scripts.length}`);
    
    // Monitor CSS loading
    const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
    console.log(`[Performance] Loaded stylesheets: ${stylesheets.length}`);
    
    // Monitor image loading
    const images = document.querySelectorAll('img');
    console.log(`[Performance] Total images: ${images.length}`);
  }

  // Monitor memory usage (if available)
  monitorMemoryUsage() {
    if (!this.isEnabled || !performance.memory) return;
    
    const memory = performance.memory;
    console.log('[Performance] Memory usage:', {
      used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
      total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
      limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`
    });
  }

  // Monitor network requests
  monitorNetworkRequests() {
    if (!this.isEnabled) return;
    
    // Override fetch to monitor API calls
    const originalFetch = window.fetch;
    const monitor = this;
    
    window.fetch = async function(...args) {
      const url = args[0];
      const requestName = `API: ${typeof url === 'string' ? url : url.url}`;
      
      monitor.startMeasure(requestName);
      
      try {
        const response = await originalFetch.apply(this, args);
        monitor.endMeasure(requestName);
        
        // Log slow API calls
        const metric = monitor.metrics.get(requestName);
        if (metric && metric.duration > 2000) {
          console.warn(`[Performance] Slow API call: ${requestName} took ${metric.duration.toFixed(2)}ms`);
        }
        
        return response;
      } catch (error) {
        monitor.endMeasure(requestName);
        throw error;
      }
    };
  }

  // Enable debug mode
  enableDebug() {
    localStorage.setItem('performance-debug', 'true');
    this.isEnabled = true;
    console.log('[Performance] Debug mode enabled');
  }

  // Disable debug mode
  disableDebug() {
    localStorage.removeItem('performance-debug');
    this.isEnabled = false;
    console.log('[Performance] Debug mode disabled');
  }
}

// Global performance monitor instance
const performanceMonitor = new PerformanceMonitor();

// Auto-start monitoring in development
if (process.env.NODE_ENV === 'development') {
  performanceMonitor.monitorNetworkRequests();
  performanceMonitor.monitorBundlePerformance();
  
  // Log summary after page load
  window.addEventListener('load', () => {
    setTimeout(() => {
      performanceMonitor.logSummary();
      performanceMonitor.monitorMemoryUsage();
    }, 1000);
  });
}

// Make it available globally for debugging
window.performanceMonitor = performanceMonitor;

export default performanceMonitor;