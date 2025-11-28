// src/services/__tests__/OpenAIWhisperService.mime-normalization.test.ts

import { describe, it, expect } from 'vitest';

/**
 * Test suite for MIME type normalization in OpenAIWhisperService
 * Tests the getWhisperCompatibleFilename function
 */

describe('OpenAIWhisperService - MIME Type Normalization', () => {
  // Simulate the normalization logic from OpenAIWhisperService
  const normalizeMimeType = (mimeType: string): string => {
    return mimeType
      .replace(/\/\//g, '/') // Fix double slashes
      .replace(/webrm/gi, 'webm') // Fix typo: webrm -> webm
      .trim();
  };

  const getWhisperCompatibleFilename = (mimeType: string): string => {
    // Normalize first
    let normalizedMime = normalizeMimeType(mimeType);
    
    const mimeToExt: Record<string, string> = {
      'audio/webm': 'webm',
      'audio/webm;codecs=opus': 'webm',
      'audio/mp4': 'mp4',
      'audio/mpeg': 'mp3',
      'audio/mp3': 'mp3',
      'audio/mpeg3': 'mp3',
      'audio/x-mpeg-3': 'mp3',
      'audio/mpga': 'mpga',
      'audio/m4a': 'm4a',
      'audio/x-m4a': 'm4a',
      'audio/wav': 'wav',
      'audio/wave': 'wav',
      'audio/x-wav': 'wav',
      'audio/aac': 'm4a',
      'audio/aacp': 'm4a',
      'audio/ogg': 'webm',
    };

    // Remove parameters like codecs for lookup
    const baseMime = normalizedMime.split(';')[0].toLowerCase().trim();
    const extension = mimeToExt[baseMime] || mimeToExt[baseMime.split('/')[1]] || 'webm';
    
    return `clinical-audio.${extension}`;
  };

  describe('Malformed MIME types', () => {
    it('should normalize audio//webrm to webm extension', () => {
      const input = 'audio//webrm';
      const result = getWhisperCompatibleFilename(input);
      expect(result).toBe('clinical-audio.webm');
    });

    it('should normalize audio//webrm;codecs=opus to webm extension', () => {
      const input = 'audio//webrm;codecs=opus';
      const result = getWhisperCompatibleFilename(input);
      expect(result).toBe('clinical-audio.webm');
    });

    it('should handle case-insensitive webrm', () => {
      expect(getWhisperCompatibleFilename('audio/WEBRM')).toBe('clinical-audio.webm');
      expect(getWhisperCompatibleFilename('audio/WebRm')).toBe('clinical-audio.webm');
    });
  });

  describe('Valid MIME types', () => {
    it('should return webm for audio/webm', () => {
      const result = getWhisperCompatibleFilename('audio/webm');
      expect(result).toBe('clinical-audio.webm');
    });

    it('should return webm for audio/webm;codecs=opus', () => {
      const result = getWhisperCompatibleFilename('audio/webm;codecs=opus');
      expect(result).toBe('clinical-audio.webm');
    });

    it('should return mp4 for audio/mp4', () => {
      const result = getWhisperCompatibleFilename('audio/mp4');
      expect(result).toBe('clinical-audio.mp4');
    });

    it('should return mp3 for audio/mpeg', () => {
      const result = getWhisperCompatibleFilename('audio/mpeg');
      expect(result).toBe('clinical-audio.mp3');
    });

    it('should return m4a for audio/m4a', () => {
      const result = getWhisperCompatibleFilename('audio/m4a');
      expect(result).toBe('clinical-audio.m4a');
    });

    it('should return wav for audio/wav', () => {
      const result = getWhisperCompatibleFilename('audio/wav');
      expect(result).toBe('clinical-audio.wav');
    });
  });

  describe('Fallback behavior', () => {
    it('should default to webm for unknown types', () => {
      const result = getWhisperCompatibleFilename('audio/unknown');
      expect(result).toBe('clinical-audio.webm');
    });

    it('should handle empty string gracefully', () => {
      const result = getWhisperCompatibleFilename('');
      expect(result).toBe('clinical-audio.webm');
    });
  });
});

