/**
 * Performance Optimizations for Mobile
 * 
 * Utilities to improve performance on mobile devices:
 * - Debouncing
 * - Throttling
 * - Passive event listeners
 * - Request animation frame batching
 */

/**
 * Debounce function - delays execution until after wait time
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function - limits execution to once per wait time
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;
  let lastResult: ReturnType<T>;

  return function executedFunction(...args: Parameters<T>): ReturnType<T> {
    if (!inThrottle) {
      inThrottle = true;
      lastResult = func(...args);
      setTimeout(() => {
        inThrottle = false;
      }, wait);
    }
    return lastResult;
  };
}

/**
 * Request animation frame throttle
 * Useful for scroll/resize handlers
 */
export function rafThrottle<T extends (...args: any[]) => any>(
  func: T
): (...args: Parameters<T>) => void {
  let rafId: number | null = null;
  let lastArgs: Parameters<T> | null = null;

  return function executedFunction(...args: Parameters<T>) {
    lastArgs = args;

    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        if (lastArgs) {
          func(...lastArgs);
        }
        rafId = null;
        lastArgs = null;
      });
    }
  };
}

/**
 * Batch DOM updates using requestAnimationFrame
 */
export function batchDOMUpdates(updates: (() => void)[]): void {
  requestAnimationFrame(() => {
    updates.forEach(update => update());
  });
}

/**
 * Add passive event listener (better scroll performance)
 */
export function addPassiveEventListener(
  element: EventTarget,
  event: string,
  handler: EventListener
): void {
  element.addEventListener(event, handler, { passive: true });
}

/**
 * Remove passive event listener
 */
export function removePassiveEventListener(
  element: EventTarget,
  event: string,
  handler: EventListener
): void {
  element.removeEventListener(event, handler);
}

/**
 * Optimize scroll handler for mobile
 */
export function optimizeScrollHandler(
  element: HTMLElement | Window,
  handler: (event: Event) => void,
  throttleMs: number = 16 // ~60fps
): () => void {
  const throttledHandler = throttle(handler, throttleMs);
  const passiveHandler = throttledHandler as EventListener;

  addPassiveEventListener(element, 'scroll', passiveHandler);

  return () => {
    removePassiveEventListener(element, 'scroll', passiveHandler);
  };
}

/**
 * Optimize resize handler for mobile
 */
export function optimizeResizeHandler(
  element: Window,
  handler: (event: Event) => void,
  throttleMs: number = 100
): () => void {
  const throttledHandler = throttle(handler, throttleMs);
  const passiveHandler = throttledHandler as EventListener;

  addPassiveEventListener(element, 'resize', passiveHandler);

  return () => {
    removePassiveEventListener(element, 'resize', passiveHandler);
  };
}

/**
 * Optimize touch handler for mobile
 */
export function optimizeTouchHandler(
  element: HTMLElement,
  handler: (event: TouchEvent) => void,
  options: { passive?: boolean; throttleMs?: number } = {}
): () => void {
  const { passive = true, throttleMs = 16 } = options;
  const optimizedHandler = throttleMs > 0 
    ? throttle(handler, throttleMs) as EventListener
    : handler as EventListener;

  element.addEventListener('touchstart', optimizedHandler, { passive });
  element.addEventListener('touchmove', optimizedHandler, { passive });
  element.addEventListener('touchend', optimizedHandler, { passive });

  return () => {
    element.removeEventListener('touchstart', optimizedHandler);
    element.removeEventListener('touchmove', optimizedHandler);
    element.removeEventListener('touchend', optimizedHandler);
  };
}

/**
 * Check if device is low-end (for performance optimizations)
 */
export function isLowEndDevice(): boolean {
  // Check hardware concurrency (CPU cores)
  const cores = navigator.hardwareConcurrency || 2;
  
  // Check device memory (if available)
  const memory = (navigator as any).deviceMemory || 4;
  
  // Low-end: < 4 cores or < 4GB RAM
  return cores < 4 || memory < 4;
}

/**
 * Get recommended throttle delay based on device
 */
export function getRecommendedThrottleDelay(): number {
  if (isLowEndDevice()) {
    return 100; // Slower updates on low-end devices
  }
  return 16; // ~60fps on capable devices
}

