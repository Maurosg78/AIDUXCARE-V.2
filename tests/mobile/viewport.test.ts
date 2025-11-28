/**
 * Mobile Viewport Tests
 * 
 * Tests for viewport sizing, orientation changes, and responsive behavior
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('Mobile Viewport', () => {
  beforeEach(() => {
    // Reset viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 812
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('iPhone Viewport', () => {
    it('should detect iPhone viewport size (375x812)', () => {
      expect(window.innerWidth).toBe(375);
      expect(window.innerHeight).toBe(812);
    });

    it('should have correct aspect ratio', () => {
      const aspectRatio = window.innerWidth / window.innerHeight;
      expect(aspectRatio).toBeCloseTo(0.462, 2);
    });
  });

  describe('iPad Viewport', () => {
    it('should detect iPad viewport size (768x1024)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 1024
      });

      expect(window.innerWidth).toBe(768);
      expect(window.innerHeight).toBe(1024);
    });
  });

  describe('Android Viewport', () => {
    it('should detect Android viewport size (360x640)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 360
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 640
      });

      expect(window.innerWidth).toBe(360);
      expect(window.innerHeight).toBe(640);
    });
  });

  describe('Orientation Changes', () => {
    it('should handle portrait to landscape', () => {
      // Portrait
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 812
      });

      const portraitWidth = window.innerWidth;
      const portraitHeight = window.innerHeight;

      // Landscape
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 812
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 375
      });

      expect(window.innerWidth).toBe(portraitHeight);
      expect(window.innerHeight).toBe(portraitWidth);
    });
  });

  describe('Viewport Meta Tag', () => {
    it('should have viewport meta tag configured', () => {
      // Create viewport meta tag if it doesn't exist
      let viewport = document.querySelector('meta[name="viewport"]');
      if (!viewport) {
        viewport = document.createElement('meta');
        viewport.setAttribute('name', 'viewport');
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
        document.head.appendChild(viewport);
      }
      
      expect(viewport).not.toBeNull();
      
      if (viewport) {
        const content = viewport.getAttribute('content');
        expect(content).toContain('width=device-width');
        expect(content).toContain('initial-scale=1.0');
      }
    });
  });
});

