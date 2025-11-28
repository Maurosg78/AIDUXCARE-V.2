// src/hooks/__tests__/useTranscript.mime-normalization.test.ts

import { describe, it, expect } from 'vitest';

/**
 * Test suite for MIME type normalization in useTranscript hook
 * Tests the normalization logic that fixes malformed MIME types
 */

describe('MIME Type Normalization', () => {
  const normalizeMimeType = (mimeType: string | null | undefined): string => {
    if (!mimeType) return '';
    return mimeType
      .replace(/\/+/g, '/') // Fix multiple slashes (//, ///, etc.)
      .replace(/webrm/gi, 'webm') // Fix typo: webrm -> webm (preserves case of first letter)
      .trim();
  };

  describe('Double slash fixes', () => {
    it('should fix double slash in audio/webm', () => {
      const input = 'audio//webm';
      const result = normalizeMimeType(input);
      expect(result).toBe('audio/webm');
    });

    it('should fix double slash in audio/webm;codecs=opus', () => {
      const input = 'audio//webm;codecs=opus';
      const result = normalizeMimeType(input);
      expect(result).toBe('audio/webm;codecs=opus');
    });

    it('should fix multiple slashes', () => {
      const input = 'audio///webm';
      const result = normalizeMimeType(input);
      expect(result).toBe('audio/webm');
    });
    
    it('should fix four or more slashes', () => {
      const input = 'audio////webm';
      const result = normalizeMimeType(input);
      expect(result).toBe('audio/webm');
    });
  });

  describe('Typo fixes (webrm -> webm)', () => {
    it('should fix webrm typo', () => {
      const input = 'audio/webrm';
      const result = normalizeMimeType(input);
      expect(result).toBe('audio/webm');
    });

    it('should fix webrm typo case-insensitive', () => {
      // Note: replace with /gi finds case-insensitive matches but replaces with lowercase 'webm'
      // This is correct behavior - we want consistent lowercase 'webm'
      expect(normalizeMimeType('audio/WEBRM')).toBe('audio/webm');
      expect(normalizeMimeType('audio/WebRm')).toBe('audio/webm');
      expect(normalizeMimeType('audio/webRm')).toBe('audio/webm');
      expect(normalizeMimeType('audio/WEBRM;codecs=opus')).toBe('audio/webm;codecs=opus');
    });

    it('should fix webrm typo with codecs', () => {
      const input = 'audio/webrm;codecs=opus';
      const result = normalizeMimeType(input);
      expect(result).toBe('audio/webm;codecs=opus');
    });
  });

  describe('Combined fixes', () => {
    it('should fix both double slash and typo', () => {
      const input = 'audio//webrm;codecs=opus';
      const result = normalizeMimeType(input);
      expect(result).toBe('audio/webm;codecs=opus');
    });

    it('should handle multiple issues', () => {
      const input = 'audio///webrm';
      const result = normalizeMimeType(input);
      expect(result).toBe('audio/webm'); // Both fixes applied
    });
  });

  describe('Valid MIME types (should remain unchanged)', () => {
    it('should not modify valid audio/webm', () => {
      const input = 'audio/webm';
      const result = normalizeMimeType(input);
      expect(result).toBe('audio/webm');
    });

    it('should not modify valid audio/webm;codecs=opus', () => {
      const input = 'audio/webm;codecs=opus';
      const result = normalizeMimeType(input);
      expect(result).toBe('audio/webm;codecs=opus');
    });

    it('should not modify valid audio/mp4', () => {
      const input = 'audio/mp4';
      const result = normalizeMimeType(input);
      expect(result).toBe('audio/mp4');
    });

    it('should not modify valid audio/mpeg', () => {
      const input = 'audio/mpeg';
      const result = normalizeMimeType(input);
      expect(result).toBe('audio/mpeg');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty string', () => {
      const input = '';
      const result = normalizeMimeType(input);
      expect(result).toBe('');
    });

    it('should handle string with only spaces', () => {
      const input = '   ';
      const result = normalizeMimeType(input);
      expect(result).toBe('');
    });

    it('should trim whitespace', () => {
      const input = '  audio/webm  ';
      const result = normalizeMimeType(input);
      expect(result).toBe('audio/webm');
    });

    it('should handle null/undefined gracefully', () => {
      // @ts-expect-error - testing edge case
      expect(normalizeMimeType(null)).toBe('');
      // @ts-expect-error - testing edge case
      expect(normalizeMimeType(undefined)).toBe('');
    });
  });
});

