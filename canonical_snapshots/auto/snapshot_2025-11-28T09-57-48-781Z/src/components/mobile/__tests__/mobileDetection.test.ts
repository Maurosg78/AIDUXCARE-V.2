/**
 * Tests for Mobile Detection
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isMobileDevice,
  isTabletDevice,
  isIOS,
  isAndroid,
  isSafari,
  isChrome,
  getDeviceType,
  hasTouchSupport,
  hasMicrophoneAccess,
  hasMediaRecorderSupport,
  getMobileInfo
} from '../../../utils/mobileDetection';

describe('mobileDetection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isMobileDevice', () => {
    it('should detect iPhone', () => {
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)'
      });
      expect(isMobileDevice()).toBe(true);
    });

    it('should detect Android', () => {
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (Linux; Android 10)'
      });
      expect(isMobileDevice()).toBe(true);
    });

    it('should not detect desktop', () => {
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      });
      expect(isMobileDevice()).toBe(false);
    });
  });

  describe('isIOS', () => {
    it('should detect iPhone', () => {
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)'
      });
      expect(isIOS()).toBe(true);
    });

    it('should detect iPad', () => {
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)'
      });
      expect(isIOS()).toBe(true);
    });
  });

  describe('isAndroid', () => {
    it('should detect Android', () => {
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (Linux; Android 10)'
      });
      expect(isAndroid()).toBe(true);
    });
  });

  describe('isSafari', () => {
    it('should detect Safari', () => {
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
      });
      expect(isSafari()).toBe(true);
    });
  });

  describe('isChrome', () => {
    it('should detect Chrome', () => {
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile'
      });
      expect(isChrome()).toBe(true);
    });
  });

  describe('getDeviceType', () => {
    it('should return mobile for small screens', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      });
      expect(getDeviceType()).toBe('mobile');
    });

    it('should return tablet for medium screens', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768
      });
      expect(getDeviceType()).toBe('tablet');
    });

    it('should return desktop for large screens', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024
      });
      expect(getDeviceType()).toBe('desktop');
    });
  });

  describe('hasTouchSupport', () => {
    it('should detect touch support', () => {
      Object.defineProperty(window, 'ontouchstart', {
        writable: true,
        configurable: true,
        value: {}
      });
      expect(hasTouchSupport()).toBe(true);
    });

    it('should detect maxTouchPoints', () => {
      Object.defineProperty(navigator, 'maxTouchPoints', {
        writable: true,
        configurable: true,
        value: 5
      });
      expect(hasTouchSupport()).toBe(true);
    });
  });

  describe('hasMicrophoneAccess', () => {
    it('should detect getUserMedia support', () => {
      Object.defineProperty(navigator, 'mediaDevices', {
        writable: true,
        configurable: true,
        value: {
          getUserMedia: vi.fn()
        }
      });
      expect(hasMicrophoneAccess()).toBe(true);
    });

    it('should return false if no mediaDevices', () => {
      Object.defineProperty(navigator, 'mediaDevices', {
        writable: true,
        configurable: true,
        value: undefined
      });
      expect(hasMicrophoneAccess()).toBe(false);
    });
  });

  describe('hasMediaRecorderSupport', () => {
    it('should detect MediaRecorder support', () => {
      (global as any).MediaRecorder = class MediaRecorder {};
      expect(hasMediaRecorderSupport()).toBe(true);
    });

    it('should return false if no MediaRecorder', () => {
      delete (global as any).MediaRecorder;
      expect(hasMediaRecorderSupport()).toBe(false);
    });
  });

  describe('getMobileInfo', () => {
    it('should return comprehensive mobile info', () => {
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)'
      });
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

      const info = getMobileInfo();
      
      expect(info).toHaveProperty('isMobile');
      expect(info).toHaveProperty('isTablet');
      expect(info).toHaveProperty('isIOS');
      expect(info).toHaveProperty('isAndroid');
      expect(info).toHaveProperty('deviceType');
      expect(info).toHaveProperty('screenWidth');
      expect(info).toHaveProperty('screenHeight');
    });
  });
});

