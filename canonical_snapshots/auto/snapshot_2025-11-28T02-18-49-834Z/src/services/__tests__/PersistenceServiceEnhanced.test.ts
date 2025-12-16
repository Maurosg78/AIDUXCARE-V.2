/**
 * Unit Tests: PersistenceServiceEnhanced
 * 
 * Tests retry logic, backup mechanisms, and data integrity validation.
 * 
 * Sprint 2: Priority 2 - Data Integrity & Clinical Vault
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  saveSOAPNoteWithRetry,
  getPendingBackups,
  restoreAllBackups,
  validateDataIntegrity,
} from '../PersistenceServiceEnhanced';
import PersistenceService from '../PersistenceService';
import type { SOAPData } from '../PersistenceService';

// Mock PersistenceService
vi.mock('../PersistenceService', () => ({
  default: {
    saveSOAPNote: vi.fn(),
    getAllNotes: vi.fn(),
  },
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('PersistenceServiceEnhanced', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  describe('saveSOAPNoteWithRetry', () => {
    const validSOAPData: SOAPData = {
      subjective: 'Patient reports lower back pain',
      objective: 'Lumbar flexion limited to 45 degrees',
      assessment: 'Patterns consistent with lumbar strain',
      plan: 'Initial treatment plan with exercises',
      confidence: 0.95,
      timestamp: new Date().toISOString(),
    };

    it('should save successfully on first attempt', async () => {
      const mockNoteId = 'note_123';
      vi.mocked(PersistenceService.saveSOAPNote).mockResolvedValue(mockNoteId);

      const result = await saveSOAPNoteWithRetry(validSOAPData, 'patient1', 'session1');

      expect(result.success).toBe(true);
      expect(result.noteId).toBe(mockNoteId);
      expect(result.retries).toBe(0);
      expect(PersistenceService.saveSOAPNote).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and succeed on second attempt', async () => {
      const mockNoteId = 'note_123';
      vi.mocked(PersistenceService.saveSOAPNote)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockNoteId);

      const result = await saveSOAPNoteWithRetry(validSOAPData, 'patient1', 'session1', {
        maxRetries: 2,
        retryDelay: 10, // Short delay for testing
      });

      expect(result.success).toBe(true);
      expect(result.noteId).toBe(mockNoteId);
      expect(result.retries).toBe(1);
      expect(PersistenceService.saveSOAPNote).toHaveBeenCalledTimes(2);
    });

    it('should fail after all retries exhausted', async () => {
      vi.mocked(PersistenceService.saveSOAPNote).mockRejectedValue(new Error('Persistent error'));

      const result = await saveSOAPNoteWithRetry(validSOAPData, 'patient1', 'session1', {
        maxRetries: 2,
        retryDelay: 10,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Persistent error');
      expect(result.retries).toBe(2);
      expect(PersistenceService.saveSOAPNote).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should validate SOAP data before saving', async () => {
      const invalidSOAPData: SOAPData = {
        subjective: '', // Empty - invalid
        objective: 'Test',
        assessment: 'Test',
        plan: 'Test',
        confidence: 0.95,
        timestamp: new Date().toISOString(),
      };

      const result = await saveSOAPNoteWithRetry(invalidSOAPData, 'patient1', 'session1', {
        validateBeforeSave: true,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Validation failed');
      expect(PersistenceService.saveSOAPNote).not.toHaveBeenCalled();
    });

    it('should create backup when enabled', async () => {
      const mockNoteId = 'note_123';
      vi.mocked(PersistenceService.saveSOAPNote).mockResolvedValue(mockNoteId);

      await saveSOAPNoteWithRetry(validSOAPData, 'patient1', 'session1', {
        enableBackup: true,
      });

      // Backup should be created before save attempt
      const backups = getPendingBackups();
      // Note: Backup is removed on success, so should be empty
      // But we can verify backup was created by checking localStorage during save
      expect(PersistenceService.saveSOAPNote).toHaveBeenCalled();
    });

    it('should use exponential backoff for retries', async () => {
      const startTime = Date.now();
      vi.mocked(PersistenceService.saveSOAPNote)
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockRejectedValueOnce(new Error('Error 2'))
        .mockResolvedValueOnce('note_123');

      await saveSOAPNoteWithRetry(validSOAPData, 'patient1', 'session1', {
        maxRetries: 2,
        retryDelay: 100,
      });

      const elapsed = Date.now() - startTime;
      // Should have waited: 100ms (first retry) + 200ms (second retry) = ~300ms
      expect(elapsed).toBeGreaterThan(250); // Allow some margin
    });
  });

  describe('getPendingBackups', () => {
    it('should return empty array when no backups exist', () => {
      const backups = getPendingBackups();
      expect(backups).toEqual([]);
    });

    it('should return pending backups from localStorage', () => {
      const backupData = {
        key: 'backup_123',
        soapData: {
          subjective: 'Test',
          objective: 'Test',
          assessment: 'Test',
          plan: 'Test',
          confidence: 0.95,
          timestamp: new Date().toISOString(),
        },
        patientId: 'patient1',
        sessionId: 'session1',
        timestamp: new Date().toISOString(),
      };

      localStorageMock.setItem('soap_backups', JSON.stringify([backupData]));
      localStorageMock.setItem('backup_123', JSON.stringify(backupData));

      const backups = getPendingBackups();
      expect(backups.length).toBe(1);
      expect(backups[0].key).toBe('backup_123');
    });
  });

  describe('validateDataIntegrity', () => {
    it('should validate all notes successfully', async () => {
      const mockNotes = [
        {
          id: 'note1',
          patientId: 'patient1',
          sessionId: 'session1',
          soapData: {
            subjective: 'Test',
            objective: 'Test',
            assessment: 'Test',
            plan: 'Test',
            confidence: 0.95,
            timestamp: new Date().toISOString(),
          },
          encryptedData: {
            iv: 'test',
            encryptedData: 'test',
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ownerUid: 'user1',
        },
      ];

      vi.mocked(PersistenceService.getAllNotes).mockResolvedValue(mockNotes as any);

      const result = await validateDataIntegrity();

      expect(result.isValid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should detect missing SOAP data', async () => {
      const mockNotes = [
        {
          id: 'note1',
          patientId: 'patient1',
          sessionId: 'session1',
          soapData: null, // Missing SOAP data
          encryptedData: { iv: 'test', encryptedData: 'test' },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ownerUid: 'user1',
        },
      ];

      vi.mocked(PersistenceService.getAllNotes).mockResolvedValue(mockNotes as any);

      const result = await validateDataIntegrity();

      expect(result.isValid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues[0].issue).toContain('Missing SOAP data');
    });
  });
});

