/**
 * Mobile Instrumentation
 * 
 * Tracks mobile-specific performance metrics:
 * - FPS tracking
 * - Scroll jank
 * - Initial render times
 * - Touch event latency
 * - Frame drops
 */

export interface MobileMetrics {
  fps: number;
  scrollJank: number;
  initialRenderTime: number;
  touchLatency: number;
  frameDrops: number;
  domPerformance: {
    layoutTime: number;
    paintTime: number;
    compositeTime: number;
  };
}

class MobileInstrumentation {
  private fps: number = 60;
  private frameCount: number = 0;
  private lastTime: number = 0;
  private frameDrops: number = 0;
  private touchLatency: number[] = [];
  private scrollJank: number[] = [];
  private initialRenderTime: number = 0;
  private rafId: number | null = null;
  private scrollStartTime: number = 0;
  private lastScrollTime: number = 0;

  /**
   * Initialize FPS tracking
   */
  startFPSTracking(): void {
    if (this.rafId !== null) return;

    this.lastTime = performance.now();
    this.frameCount = 0;
    this.frameDrops = 0;

    const measureFPS = (currentTime: number) => {
      this.frameCount++;
      const delta = currentTime - this.lastTime;

      if (delta >= 1000) {
        this.fps = Math.round((this.frameCount * 1000) / delta);
        this.frameCount = 0;
        this.lastTime = currentTime;

        // Detect frame drops (FPS < 55 is considered janky)
        if (this.fps < 55) {
          this.frameDrops++;
        }
      }

      this.rafId = requestAnimationFrame(measureFPS);
    };

    this.rafId = requestAnimationFrame(measureFPS);
  }

  /**
   * Stop FPS tracking
   */
  stopFPSTracking(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * Track touch event latency
   */
  trackTouchLatency(event: TouchEvent): void {
    const touchStartTime = performance.now();
    
    const handleTouchEnd = () => {
      const touchEndTime = performance.now();
      const latency = touchEndTime - touchStartTime;
      this.touchLatency.push(latency);
      
      // Keep only last 50 measurements
      if (this.touchLatency.length > 50) {
        this.touchLatency.shift();
      }
      
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchEnd);
    };

    document.addEventListener('touchend', handleTouchEnd, { once: true });
    document.addEventListener('touchcancel', handleTouchEnd, { once: true });
  }

  /**
   * Track scroll jank
   */
  startScrollTracking(): void {
    let lastScrollTop = 0;
    let scrollTimeout: number | null = null;

    const handleScroll = () => {
      const currentTime = performance.now();
      const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;

      if (this.lastScrollTime > 0) {
        const timeDelta = currentTime - this.lastScrollTime;
        const scrollDelta = Math.abs(currentScrollTop - lastScrollTop);
        
        // Calculate scroll velocity
        const velocity = scrollDelta / timeDelta;
        
        // Detect jank (sudden velocity changes or very slow scrolling)
        if (velocity > 5 || (velocity < 0.1 && scrollDelta > 10)) {
          this.scrollJank.push(currentTime);
        }
      }

      this.lastScrollTime = currentTime;
      lastScrollTop = currentScrollTop;

      // Clear timeout
      if (scrollTimeout !== null) {
        clearTimeout(scrollTimeout);
      }

      // Reset after scroll stops
      scrollTimeout = window.setTimeout(() => {
        this.lastScrollTime = 0;
      }, 150);
    };

    // Use requestAnimationFrame for better performance
    let rafId: number | null = null;
    const optimizedScrollHandler = () => {
      if (rafId === null) {
        rafId = requestAnimationFrame(() => {
          handleScroll();
          rafId = null;
        });
      }
    };
    
    window.addEventListener('scroll', optimizedScrollHandler, { passive: true });
  }

  /**
   * Measure initial render time
   */
  measureInitialRender(): void {
    if (this.initialRenderTime > 0) return;

    const getNavigationStart = (): number => {
      // Try performance.timing (legacy)
      if (performance.timing && performance.timing.navigationStart) {
        return performance.timing.navigationStart;
      }
      // Try performance.getEntriesByType (modern)
      const navEntries = performance.getEntriesByType('navigation');
      if (navEntries.length > 0) {
        const navEntry = navEntries[0] as PerformanceNavigationTiming;
        return navEntry.fetchStart;
      }
      // Fallback: use current time if navigation timing not available
      return performance.now();
    };

    if (document.readyState === 'complete') {
      const navStart = getNavigationStart();
      this.initialRenderTime = Math.max(0, performance.now() - navStart);
    } else {
      window.addEventListener('load', () => {
        const navStart = getNavigationStart();
        this.initialRenderTime = Math.max(0, performance.now() - navStart);
      }, { once: true });
    }
  }

  /**
   * Measure DOM performance using Performance Observer
   */
  measureDOMPerformance(): {
    layoutTime: number;
    paintTime: number;
    compositeTime: number;
  } {
    let layoutTime = 0;
    let paintTime = 0;
    let compositeTime = 0;

    if ('PerformanceObserver' in window) {
      try {
        // Measure layout shifts
        const layoutObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
              layoutTime += (entry as any).value;
            }
          }
        });
        layoutObserver.observe({ entryTypes: ['layout-shift'] });

        // Measure paint times
        const paintObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'paint') {
              paintTime = entry.startTime;
            }
          }
        });
        paintObserver.observe({ entryTypes: ['paint'] });

        // Measure composite times
        const measureObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'measure') {
              compositeTime += entry.duration;
            }
          }
        });
        measureObserver.observe({ entryTypes: ['measure'] });
      } catch (e) {
        console.warn('Performance Observer not fully supported:', e);
      }
    }

    return {
      layoutTime,
      paintTime,
      compositeTime
    };
  }

  /**
   * Get current metrics
   */
  getMetrics(): MobileMetrics {
    const avgTouchLatency = this.touchLatency.length > 0
      ? this.touchLatency.reduce((a, b) => a + b, 0) / this.touchLatency.length
      : 0;

    const scrollJankCount = this.scrollJank.length;

    const domPerformance = this.measureDOMPerformance();

    return {
      fps: this.fps,
      scrollJank: scrollJankCount,
      initialRenderTime: this.initialRenderTime,
      touchLatency: avgTouchLatency,
      frameDrops: this.frameDrops,
      domPerformance
    };
  }

  /**
   * Initialize all tracking
   */
  initialize(): void {
    this.startFPSTracking();
    this.startScrollTracking();
    this.measureInitialRender();

    // Track touch events
    document.addEventListener('touchstart', (e) => {
      this.trackTouchLatency(e);
    }, { passive: true });

    console.log('📱 Mobile instrumentation initialized');
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.fps = 60;
    this.frameCount = 0;
    this.frameDrops = 0;
    this.touchLatency = [];
    this.scrollJank = [];
    this.initialRenderTime = 0;
    this.lastScrollTime = 0;
  }
}

// Singleton instance
export const mobileInstrumentation = new MobileInstrumentation();

