/**
 * Tests for Mobile Helpers
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  preventIOSZoom,
  restoreIOSZoom,
  getSafeAreaInsets,
  needsViewportHeightFix,
  getActualViewportHeight,
  setViewportHeight,
  initMobileFixes
} from '../../../utils/mobileHelpers';

describe('mobileHelpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset viewport meta tag
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('preventIOSZoom', () => {
    it('should not throw error', () => {
      expect(() => preventIOSZoom()).not.toThrow();
    });
  });

  describe('restoreIOSZoom', () => {
    it('should not throw error', () => {
      expect(() => restoreIOSZoom()).not.toThrow();
    });
  });

  describe('getSafeAreaInsets', () => {
    it('should return safe area insets object', () => {
      const insets = getSafeAreaInsets();
      
      expect(insets).toHaveProperty('top');
      expect(insets).toHaveProperty('bottom');
      expect(insets).toHaveProperty('left');
      expect(insets).toHaveProperty('right');
      expect(typeof insets.top).toBe('number');
      expect(typeof insets.bottom).toBe('number');
      expect(typeof insets.left).toBe('number');
      expect(typeof insets.right).toBe('number');
    });
  });

  describe('needsViewportHeightFix', () => {
    it('should detect iOS Safari', () => {
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
      });
      
      expect(needsViewportHeightFix()).toBe(true);
    });

    it('should not detect Chrome on iOS', () => {
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/91.0.4472.80 Mobile/15E148 Safari/604.1'
      });
      
      expect(needsViewportHeightFix()).toBe(false);
    });

    it('should not detect Android', () => {
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (Linux; Android 10)'
      });
      
      expect(needsViewportHeightFix()).toBe(false);
    });
  });

  describe('getActualViewportHeight', () => {
    it('should return viewport height', () => {
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 812
      });
      
      const height = getActualViewportHeight();
      expect(height).toBeGreaterThan(0);
    });
  });

  describe('setViewportHeight', () => {
    it('should set CSS custom property', () => {
      setViewportHeight();
      
      const vh = document.documentElement.style.getPropertyValue('--vh');
      expect(vh).toBeTruthy();
    });
  });

  describe('initMobileFixes', () => {
    it('should initialize mobile fixes', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      
      initMobileFixes();
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('orientationchange', expect.any(Function));
    });
  });
});

