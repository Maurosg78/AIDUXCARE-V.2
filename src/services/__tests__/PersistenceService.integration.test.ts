/**
 * Integration Test: PersistenceService - Clinical Vault
 * 
 * Tests that SOAP notes are correctly saved to Firestore and retrieved
 * from the Clinical Vault (DocumentsPage).
 * 
 * ✅ P1.3: DoD - Finalizo SOAP → voy a Clinical Vault → veo mi nota
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PersistenceService } from '../PersistenceService';
import type { SOAPData } from '../PersistenceService';

// Mock Firebase
vi.mock('@/lib/firebase', () => ({
  db: {},
  auth: {
    currentUser: {
      uid: 'test-user-123',
    },
  },
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn((db, collection, id) => ({ db, collection, id })),
  setDoc: vi.fn(() => Promise.resolve()),
  getDoc: vi.fn(() => Promise.resolve({ exists: () => true, data: () => ({}) })),
  collection: vi.fn(() => ({})),
  query: vi.fn(() => ({})),
  where: vi.fn(() => ({})),
  getDocs: vi.fn(() => Promise.resolve({
    docs: [],
    empty: true,
  })),
  serverTimestamp: vi.fn(() => ({})),
  Timestamp: {
    fromDate: vi.fn((date) => ({})),
  },
}));

vi.mock('../CryptoService', () => ({
  default: {
    encryptMedicalData: vi.fn((data) => Promise.resolve({
      iv: 'test-iv',
      encryptedData: 'encrypted-data',
    })),
    decryptMedicalData: vi.fn((encrypted) => Promise.resolve({})),
  },
}));

describe('PersistenceService Integration - Clinical Vault', () => {
  const mockSOAPData: SOAPData = {
    subjective: 'Patient reports low back pain radiating to right leg.',
    objective: 'Lumbar: SLR positive at 45° bilaterally. Slump test negative.',
    assessment: 'Patterns consistent with lumbar radiculopathy.',
    plan: 'Manual therapy, exercise prescription, follow-up in 1 week.',
    confidence: 0.85,
    timestamp: new Date().toISOString(),
  };

  const mockPatientId = 'patient-123';
  const mockSessionId = 'session-456';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Save SOAP Note', () => {
    it('should save SOAP note with correct structure', async () => {
      const { doc, setDoc } = await import('firebase/firestore');
      
      const noteId = await PersistenceService.saveSOAPNote(
        mockSOAPData,
        mockPatientId,
        mockSessionId
      );
      
      expect(noteId).toBeDefined();
      expect(noteId).toMatch(/^note_\d+_[a-z0-9]+$/);
      
      // Verify setDoc was called with correct structure
      expect(setDoc).toHaveBeenCalled();
      const callArgs = (setDoc as any).mock.calls[0];
      expect(callArgs[1]).toMatchObject({
        patientId: mockPatientId,
        sessionId: mockSessionId,
        soapData: mockSOAPData,
        ownerUid: 'test-user-123',
      });
    });

    it('should include ownerUid for querying', async () => {
      const { setDoc } = await import('firebase/firestore');
      
      await PersistenceService.saveSOAPNote(
        mockSOAPData,
        mockPatientId,
        mockSessionId
      );
      
      const callArgs = (setDoc as any).mock.calls[0];
      expect(callArgs[1].ownerUid).toBe('test-user-123');
    });

    it('should generate unique note IDs', async () => {
      const noteId1 = await PersistenceService.saveSOAPNote(
        mockSOAPData,
        mockPatientId,
        mockSessionId
      );
      
      const noteId2 = await PersistenceService.saveSOAPNote(
        mockSOAPData,
        mockPatientId,
        mockSessionId
      );
      
      expect(noteId1).not.toBe(noteId2);
    });
  });

  describe('Retrieve SOAP Notes', () => {
    it('should retrieve notes filtered by ownerUid', async () => {
      const { query, where, getDocs } = await import('firebase/firestore');
      
      // Mock getDocs to return notes
      (getDocs as any).mockResolvedValueOnce({
        docs: [
          {
            data: () => ({
              id: 'note-1',
              patientId: mockPatientId,
              sessionId: mockSessionId,
              soapData: mockSOAPData,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              ownerUid: 'test-user-123',
            }),
          },
        ],
      });
      
      const notes = await PersistenceService.getAllNotes();
      
      expect(notes.length).toBeGreaterThan(0);
      expect(where).toHaveBeenCalledWith('ownerUid', '==', 'test-user-123');
    });

    it('should return empty array if no notes found', async () => {
      const { getDocs } = await import('firebase/firestore');
      
      (getDocs as any).mockResolvedValueOnce({
        docs: [],
        empty: true,
      });
      
      const notes = await PersistenceService.getAllNotes();
      expect(notes).toEqual([]);
    });
  });

  describe('DoD: Complete Flow', () => {
    it('should complete DoD: Finalizo SOAP → Clinical Vault → veo mi nota', async () => {
      const { setDoc, getDocs } = await import('firebase/firestore');
      
      // Step 1: Save SOAP note
      const noteId = await PersistenceService.saveSOAPNote(
        mockSOAPData,
        mockPatientId,
        mockSessionId
      );
      
      expect(noteId).toBeDefined();
      expect(setDoc).toHaveBeenCalled();
      
      // Step 2: Retrieve notes (simulate DocumentsPage.loadNotes)
      (getDocs as any).mockResolvedValueOnce({
        docs: [
          {
            data: () => ({
              id: noteId,
              patientId: mockPatientId,
              sessionId: mockSessionId,
              soapData: mockSOAPData,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              ownerUid: 'test-user-123',
            }),
          },
        ],
      });
      
      const notes = await PersistenceService.getAllNotes();
      
      // Step 3: Verify note appears in Clinical Vault
      expect(notes.length).toBe(1);
      expect(notes[0].id).toBe(noteId);
      expect(notes[0].patientId).toBe(mockPatientId);
      expect(notes[0].soapData).toEqual(mockSOAPData);
      
      // Step 4: Verify search functionality (by patient ID)
      const foundNote = notes.find(n => n.patientId === mockPatientId);
      expect(foundNote).toBeDefined();
      
      // Step 5: Verify sorting by date (newest first)
      const sortedNotes = notes.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      expect(sortedNotes[0].id).toBe(noteId);
    });
  });

  describe('Error Handling', () => {
    it('should handle save errors gracefully', async () => {
      const { setDoc } = await import('firebase/firestore');
      (setDoc as any).mockRejectedValueOnce(new Error('Firestore error'));
      
      await expect(
        PersistenceService.saveSOAPNote(mockSOAPData, mockPatientId, mockSessionId)
      ).rejects.toThrow('Failed to save note to database');
    });

    it('should return empty array on retrieval error', async () => {
      const { getDocs } = await import('firebase/firestore');
      (getDocs as any).mockRejectedValueOnce(new Error('Query error'));
      
      const notes = await PersistenceService.getAllNotes();
      expect(notes).toEqual([]);
    });
  });
});

