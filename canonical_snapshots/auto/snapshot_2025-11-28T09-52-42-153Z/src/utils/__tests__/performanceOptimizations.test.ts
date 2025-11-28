/**
 * Tests for Performance Optimizations
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  debounce,
  throttle,
  rafThrottle,
  batchDOMUpdates,
  isLowEndDevice,
  getRecommendedThrottleDelay
} from '../performanceOptimizations';

describe('performanceOptimizations', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('debounce', () => {
    it('should delay execution', () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      debounced();
      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should cancel previous calls', () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      debounced();
      debounced();
      debounced();

      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('throttle', () => {
    it('should limit execution frequency', () => {
      const fn = vi.fn();
      const throttled = throttle(fn, 100);

      throttled();
      throttled();
      throttled();

      expect(fn).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(100);
      throttled();
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('rafThrottle', () => {
    it('should use requestAnimationFrame', () => {
      const fn = vi.fn();
      const throttled = rafThrottle(fn);

      throttled();
      throttled();
      throttled();

      // Should only call once per frame
      expect(fn).not.toHaveBeenCalled();

      // Advance animation frame
      vi.advanceTimersByTime(16);
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('batchDOMUpdates', () => {
    it('should batch updates in requestAnimationFrame', () => {
      const update1 = vi.fn();
      const update2 = vi.fn();

      batchDOMUpdates([update1, update2]);

      expect(update1).not.toHaveBeenCalled();
      expect(update2).not.toHaveBeenCalled();

      vi.advanceTimersByTime(16);
      expect(update1).toHaveBeenCalledTimes(1);
      expect(update2).toHaveBeenCalledTimes(1);
    });
  });

  describe('isLowEndDevice', () => {
    it('should detect low-end device', () => {
      Object.defineProperty(navigator, 'hardwareConcurrency', {
        writable: true,
        configurable: true,
        value: 2
      });
      Object.defineProperty(navigator, 'deviceMemory', {
        writable: true,
        configurable: true,
        value: 2
      });

      expect(isLowEndDevice()).toBe(true);
    });

    it('should detect high-end device', () => {
      Object.defineProperty(navigator, 'hardwareConcurrency', {
        writable: true,
        configurable: true,
        value: 8
      });
      Object.defineProperty(navigator, 'deviceMemory', {
        writable: true,
        configurable: true,
        value: 8
      });

      expect(isLowEndDevice()).toBe(false);
    });
  });

  describe('getRecommendedThrottleDelay', () => {
    it('should return higher delay for low-end devices', () => {
      Object.defineProperty(navigator, 'hardwareConcurrency', {
        writable: true,
        configurable: true,
        value: 2
      });

      const delay = getRecommendedThrottleDelay();
      expect(delay).toBe(100);
    });

    it('should return lower delay for high-end devices', () => {
      Object.defineProperty(navigator, 'hardwareConcurrency', {
        writable: true,
        configurable: true,
        value: 8
      });

      const delay = getRecommendedThrottleDelay();
      expect(delay).toBe(16);
    });
  });
});

