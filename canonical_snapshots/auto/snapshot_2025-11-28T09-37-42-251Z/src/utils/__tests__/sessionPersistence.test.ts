/**
 * Session Persistence Utilities Tests
 * 
 * Unit tests for session state persistence functions
 * Sprint 2B Expanded - Day 1-2: Navigation & Routing Foundation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  saveSessionState,
  loadSessionState,
  updateSessionState,
  deleteSessionState,
  listSessionStates,
  clearExpiredSessions,
  getCurrentSessionId,
} from '../sessionPersistence';
import type { SessionState } from '../../types/sessionState';

// Mock localStorage (similar to aiModeStore.spec.ts pattern)
const store: Record<string, string> = {};
const localStorageMock = {
  getItem: vi.fn((key: string) => store[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    store[key] = String(value);
  }),
  removeItem: vi.fn((key: string) => {
    delete store[key];
  }),
  clear: vi.fn(() => {
    Object.keys(store).forEach(key => delete store[key]);
  }),
  get length() {
    return Object.keys(store).length;
  },
  key: vi.fn((index: number) => {
    const keys = Object.keys(store);
    return keys[index] || null;
  }),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true,
});

describe('Session Persistence Utilities', () => {
  beforeEach(() => {
    // Clear store and reset mocks before each test
    Object.keys(store).forEach(key => delete store[key]);
    vi.clearAllMocks();
    
    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        pathname: '/workflow',
        search: '',
      },
      writable: true,
      configurable: true,
    });
  });

  describe('saveSessionState', () => {
    it('should save session state to localStorage', async () => {
      const sessionState: SessionState = {
        sessionId: 'test-session-123',
        patientId: 'patient-456',
        patientName: 'John Doe',
        sessionType: 'initial',
        additionalOutputs: [],
        transcript: 'Test transcript',
        isRecording: false,
        startTime: new Date('2024-01-15T10:00:00Z'),
        lastUpdated: new Date('2024-01-15T10:00:00Z'),
        status: 'in-progress',
      };

      await saveSessionState(sessionState);

      const stored = localStorage.getItem('aiduxcare_session_test-session-123');
      expect(stored).toBeTruthy();
      
      const parsed = JSON.parse(stored!);
      expect(parsed.sessionId).toBe('test-session-123');
      expect(parsed.patientId).toBe('patient-456');
      expect(parsed.patientName).toBe('John Doe');
    });

    it('should handle errors gracefully', async () => {
      // Mock localStorage.setItem to throw error
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error('Storage quota exceeded');
      }) as any;

      const sessionState: SessionState = {
        sessionId: 'test-session-123',
        patientId: 'patient-456',
        sessionType: 'initial',
        additionalOutputs: [],
        transcript: '',
        isRecording: false,
        startTime: new Date(),
        lastUpdated: new Date(),
        status: 'in-progress',
      };

      await expect(saveSessionState(sessionState)).rejects.toThrow();
      
      // Restore
      localStorage.setItem = originalSetItem;
    });
  });

  describe('loadSessionState', () => {
    it('should load session state from localStorage', async () => {
      const sessionState: SessionState = {
        sessionId: 'test-session-123',
        patientId: 'patient-456',
        sessionType: 'initial',
        additionalOutputs: [],
        transcript: 'Test transcript',
        isRecording: false,
        startTime: new Date('2024-01-15T10:00:00Z'),
        lastUpdated: new Date('2024-01-15T10:00:00Z'),
        status: 'in-progress',
      };

      await saveSessionState(sessionState);
      const loaded = await loadSessionState('test-session-123');

      expect(loaded).toBeTruthy();
      expect(loaded?.sessionId).toBe('test-session-123');
      expect(loaded?.patientId).toBe('patient-456');
      expect(loaded?.startTime).toBeInstanceOf(Date);
      expect(loaded?.lastUpdated).toBeInstanceOf(Date);
    });

    it('should return null if session not found', async () => {
      const loaded = await loadSessionState('non-existent-session');
      expect(loaded).toBeNull();
    });

    it('should return null for expired sessions', async () => {
      const expiredDate = new Date();
      expiredDate.setTime(expiredDate.getTime() - 25 * 60 * 60 * 1000); // 25 hours ago

      const expiredState = {
        sessionId: 'expired-session',
        patientId: 'patient-456',
        sessionType: 'initial' as const,
        additionalOutputs: [] as any[],
        transcript: '',
        isRecording: false,
        startTime: expiredDate.toISOString(),
        lastUpdated: expiredDate.toISOString(),
        status: 'in-progress' as const,
        savedAt: expiredDate.toISOString(),
      };

      localStorage.setItem(
        'aiduxcare_session_expired-session',
        JSON.stringify(expiredState)
      );

      const loaded = await loadSessionState('expired-session');
      expect(loaded).toBeNull();
      // Should be removed from storage
      expect(localStorage.getItem('aiduxcare_session_expired-session')).toBeNull();
    });

    it('should handle corrupted data gracefully', async () => {
      localStorage.setItem('aiduxcare_session_corrupted', 'invalid json');

      const loaded = await loadSessionState('corrupted');
      expect(loaded).toBeNull();
    });
  });

  describe('updateSessionState', () => {
    it('should update existing session state', async () => {
      const sessionState: SessionState = {
        sessionId: 'test-session-123',
        patientId: 'patient-456',
        sessionType: 'initial',
        additionalOutputs: [],
        transcript: 'Original transcript',
        isRecording: false,
        startTime: new Date('2024-01-15T10:00:00Z'),
        lastUpdated: new Date('2024-01-15T10:00:00Z'),
        status: 'in-progress',
      };

      await saveSessionState(sessionState);
      
      await updateSessionState('test-session-123', {
        transcript: 'Updated transcript',
        status: 'completed',
      });

      const updated = await loadSessionState('test-session-123');
      expect(updated?.transcript).toBe('Updated transcript');
      expect(updated?.status).toBe('completed');
      expect(updated?.lastUpdated.getTime()).toBeGreaterThan(sessionState.lastUpdated.getTime());
    });

    it('should throw error if session not found', async () => {
      await expect(
        updateSessionState('non-existent', { transcript: 'test' })
      ).rejects.toThrow('Session non-existent not found');
    });
  });

  describe('deleteSessionState', () => {
    it('should delete session state from localStorage', async () => {
      const sessionState: SessionState = {
        sessionId: 'test-session-123',
        patientId: 'patient-456',
        sessionType: 'initial',
        additionalOutputs: [],
        transcript: '',
        isRecording: false,
        startTime: new Date(),
        lastUpdated: new Date(),
        status: 'in-progress',
      };

      await saveSessionState(sessionState);
      await deleteSessionState('test-session-123');

      const loaded = await loadSessionState('test-session-123');
      expect(loaded).toBeNull();
    });

    it('should handle deletion of non-existent session gracefully', async () => {
      await expect(deleteSessionState('non-existent')).resolves.not.toThrow();
    });
  });

  describe('listSessionStates', () => {
    it('should list all session states', async () => {
      const session1: SessionState = {
        sessionId: 'session-1',
        patientId: 'patient-1',
        sessionType: 'initial',
        additionalOutputs: [],
        transcript: '',
        isRecording: false,
        startTime: new Date('2024-01-15T10:00:00Z'),
        lastUpdated: new Date('2024-01-15T10:00:00Z'),
        status: 'in-progress',
      };

      const session2: SessionState = {
        sessionId: 'session-2',
        patientId: 'patient-2',
        sessionType: 'followup',
        additionalOutputs: [],
        transcript: '',
        isRecording: false,
        startTime: new Date('2024-01-15T11:00:00Z'),
        lastUpdated: new Date('2024-01-15T11:00:00Z'),
        status: 'completed',
      };

      await saveSessionState(session1);
      await saveSessionState(session2);

      const sessions = await listSessionStates();
      expect(sessions.length).toBe(2);
      expect(sessions[0].sessionId).toBe('session-2'); // Should be sorted by lastUpdated (newest first)
      expect(sessions[1].sessionId).toBe('session-1');
    });

    it('should return empty array when no sessions exist', async () => {
      const sessions = await listSessionStates();
      expect(sessions).toEqual([]);
    });

    it('should exclude expired sessions', async () => {
      const validState: SessionState = {
        sessionId: 'valid-session',
        patientId: 'patient-1',
        sessionType: 'initial',
        additionalOutputs: [],
        transcript: '',
        isRecording: false,
        startTime: new Date(),
        lastUpdated: new Date(),
        status: 'in-progress',
      };

      const expiredDate = new Date();
      expiredDate.setTime(expiredDate.getTime() - 25 * 60 * 60 * 1000);

      const expiredState = {
        sessionId: 'expired-session',
        patientId: 'patient-2',
        sessionType: 'initial' as const,
        additionalOutputs: [] as any[],
        transcript: '',
        isRecording: false,
        startTime: expiredDate.toISOString(),
        lastUpdated: expiredDate.toISOString(),
        status: 'in-progress' as const,
        savedAt: expiredDate.toISOString(),
      };

      await saveSessionState(validState);
      localStorage.setItem(
        'aiduxcare_session_expired-session',
        JSON.stringify(expiredState)
      );

      const sessions = await listSessionStates();
      expect(sessions.length).toBe(1);
      expect(sessions[0].sessionId).toBe('valid-session');
    });
  });

  describe('clearExpiredSessions', () => {
    it('should remove expired sessions from localStorage', async () => {
      const validState: SessionState = {
        sessionId: 'valid-session',
        patientId: 'patient-1',
        sessionType: 'initial',
        additionalOutputs: [],
        transcript: '',
        isRecording: false,
        startTime: new Date(),
        lastUpdated: new Date(),
        status: 'in-progress',
      };

      // Create expired date (25 hours ago)
      const expiredDate = new Date();
      expiredDate.setTime(expiredDate.getTime() - 25 * 60 * 60 * 1000);

      const expiredState = {
        sessionId: 'expired-session',
        patientId: 'patient-2',
        sessionType: 'initial' as const,
        additionalOutputs: [] as any[],
        transcript: '',
        isRecording: false,
        startTime: expiredDate.toISOString(),
        lastUpdated: expiredDate.toISOString(),
        status: 'in-progress' as const,
        savedAt: expiredDate.toISOString(),
      };

      await saveSessionState(validState);
      localStorage.setItem(
        'aiduxcare_session_expired-session',
        JSON.stringify(expiredState)
      );

      await clearExpiredSessions();

      expect(localStorage.getItem('aiduxcare_session_valid-session')).toBeTruthy();
      expect(localStorage.getItem('aiduxcare_session_expired-session')).toBeNull();
    });

    it('should handle invalid JSON gracefully', async () => {
      localStorage.setItem('aiduxcare_session_invalid', 'invalid json');
      
      await expect(clearExpiredSessions()).resolves.not.toThrow();
      
      // Invalid JSON should be removed
      expect(localStorage.getItem('aiduxcare_session_invalid')).toBeNull();
    });
  });

  describe('getCurrentSessionId', () => {
    it('should extract session ID from URL query parameter', () => {
      Object.defineProperty(window, 'location', {
        value: {
          pathname: '/workflow',
          search: '?sessionId=test-session-123',
        },
        writable: true,
        configurable: true,
      });

      const sessionId = getCurrentSessionId();
      expect(sessionId).toBe('test-session-123');
    });

    it('should extract session ID from URL path parameter', () => {
      Object.defineProperty(window, 'location', {
        value: {
          pathname: '/workflow/test-session-456',
          search: '',
        },
        writable: true,
        configurable: true,
      });

      const sessionId = getCurrentSessionId();
      expect(sessionId).toBe('test-session-456');
    });

    it('should return null if no session ID found', () => {
      Object.defineProperty(window, 'location', {
        value: {
          pathname: '/command-center',
          search: '',
        },
        writable: true,
        configurable: true,
      });

      const sessionId = getCurrentSessionId();
      expect(sessionId).toBeNull();
    });

    it('should prioritize query parameter over path parameter', () => {
      Object.defineProperty(window, 'location', {
        value: {
          pathname: '/workflow/path-session',
          search: '?sessionId=query-session',
        },
        writable: true,
        configurable: true,
      });

      const sessionId = getCurrentSessionId();
      expect(sessionId).toBe('query-session');
    });
  });
});
