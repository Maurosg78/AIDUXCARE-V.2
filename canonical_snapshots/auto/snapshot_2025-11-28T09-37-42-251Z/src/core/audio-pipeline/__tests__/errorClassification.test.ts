/**
 * Tests for Error Classification
 */

import { describe, it, expect } from 'vitest';
import { classifyError, getUserFriendlyMessage, type ClassifiedError } from '../errorClassification';

describe('errorClassification', () => {
  describe('classifyError', () => {
    it('should classify timeout errors', () => {
      const error = new Error('Request timeout');
      const classified = classifyError(error);
      
      expect(classified.type).toBe('timeout');
      expect(classified.message).toBe('Request timeout');
    });

    it('should classify network errors', () => {
      const error = new Error('Failed to fetch');
      const classified = classifyError(error);
      
      expect(classified.type).toBe('network_error');
    });

    it('should classify storage errors', () => {
      const error = { message: 'Firebase Storage error', code: 'storage/unauthorized' };
      const classified = classifyError(error);
      
      expect(classified.type).toBe('storage_error');
    });

    it('should classify whisper errors', () => {
      const error = new Error('Whisper transcription failed');
      const classified = classifyError(error);
      
      expect(classified.type).toBe('whisper_error');
    });

    it('should classify GPT errors', () => {
      const error = { message: 'Vertex AI error', code: 'RESOURCE_EXHAUSTED' };
      const classified = classifyError(error);
      
      expect(classified.type).toBe('gpt_error');
    });

    it('should default to network_error for unclassified errors', () => {
      const error = new Error('Unknown error');
      const classified = classifyError(error);
      
      expect(classified.type).toBe('network_error');
      expect(classified.metadata?.unclassified).toBe(true);
    });

    it('should handle error objects with status codes', () => {
      const error = { message: 'Server error', status: 500 };
      const classified = classifyError(error);
      
      expect(classified.type).toBe('network_error');
    });

    it('should handle AbortError as timeout', () => {
      const error = { name: 'AbortError', message: 'Request aborted' };
      const classified = classifyError(error);
      
      expect(classified.type).toBe('timeout');
    });
  });

  describe('getUserFriendlyMessage', () => {
    it('should return friendly message for timeout', () => {
      const classified: ClassifiedError = {
        type: 'timeout',
        originalError: new Error('timeout'),
        message: 'timeout'
      };
      
      const message = getUserFriendlyMessage(classified);
      expect(message).toContain('too long');
    });

    it('should return friendly message for network_error', () => {
      const classified: ClassifiedError = {
        type: 'network_error',
        originalError: new Error('network'),
        message: 'network'
      };
      
      const message = getUserFriendlyMessage(classified);
      expect(message).toContain('connection');
    });

    it('should return friendly message for storage_error', () => {
      const classified: ClassifiedError = {
        type: 'storage_error',
        originalError: new Error('storage'),
        message: 'storage'
      };
      
      const message = getUserFriendlyMessage(classified);
      expect(message).toContain('upload');
    });

    it('should return friendly message for whisper_error', () => {
      const classified: ClassifiedError = {
        type: 'whisper_error',
        originalError: new Error('whisper'),
        message: 'whisper'
      };
      
      const message = getUserFriendlyMessage(classified);
      expect(message).toContain('transcription');
    });

    it('should return friendly message for gpt_error', () => {
      const classified: ClassifiedError = {
        type: 'gpt_error',
        originalError: new Error('gpt'),
        message: 'gpt'
      };
      
      const message = getUserFriendlyMessage(classified);
      expect(message).toContain('AI processing');
    });
  });
});

