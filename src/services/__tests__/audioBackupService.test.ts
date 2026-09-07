import { describe, it, expect, vi, beforeEach } from 'vitest';
import { doc, updateDoc } from 'firebase/firestore';

/**
 * TD-013: antes de este fix, updateAudioBackupTranscriptionStatus solo
 * escribía transcriptionStatus/lastError — el texto de la transcripción
 * vivía únicamente en memoria del cliente (useState en useTranscript.ts)
 * y se perdía si la pestaña/dispositivo se cerraba antes de que el
 * usuario generara el SOAP. Esta suite cubre el campo nuevo,
 * transcriptText, en ambos casos (éxito con texto, falla sin texto).
 */

vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual<any>('firebase/firestore');
  return {
    ...actual,
    getFirestore: vi.fn(() => ({})),
    doc: vi.fn(() => ({ id: 'mock-doc-ref' })),
    updateDoc: vi.fn(),
    addDoc: vi.fn(),
    collection: vi.fn(),
  };
});

vi.mock('firebase/storage', () => ({
  ref: vi.fn(),
  uploadBytes: vi.fn(),
}));

vi.mock('../../lib/firebase', () => ({
  db: {},
  storage: {},
  auth: { currentUser: { uid: 'test-user-id' } },
}));

import { updateAudioBackupTranscriptionStatus } from '../audioBackupService';

describe('audioBackupService — updateAudioBackupTranscriptionStatus (TD-013)', () => {
  const mockUpdateDoc = vi.mocked(updateDoc);
  const mockDoc = vi.mocked(doc);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('persiste transcriptText junto con transcriptionStatus: success', async () => {
    await updateAudioBackupTranscriptionStatus(
      'backup-id-1',
      'success',
      null,
      'Doctora, tengo dolor lumbar desde hace dos semanas.',
    );

    expect(mockDoc).toHaveBeenCalledWith({}, 'session_audio_backups', 'backup-id-1');
    expect(mockUpdateDoc).toHaveBeenCalledTimes(1);

    const writtenPayload = mockUpdateDoc.mock.calls[0][1] as Record<string, unknown>;
    expect(writtenPayload.transcriptionStatus).toBe('success');
    expect(writtenPayload.transcriptText).toBe('Doctora, tengo dolor lumbar desde hace dos semanas.');
    expect(writtenPayload.lastError).toBeNull();
    expect(typeof writtenPayload.updatedAt).toBe('string');
  });

  it('escribe transcriptText: null en una falla — no hay texto que persistir', async () => {
    await updateAudioBackupTranscriptionStatus('backup-id-2', 'failed_retryable', 'La transcripción no devolvió texto');

    const writtenPayload = mockUpdateDoc.mock.calls[0][1] as Record<string, unknown>;
    expect(writtenPayload.transcriptionStatus).toBe('failed_retryable');
    expect(writtenPayload.transcriptText).toBeNull();
    expect(writtenPayload.lastError).toBe('La transcripción no devolvió texto');
  });

  it('mantiene compatibilidad hacia atrás: llamar sin transcriptText no rompe la firma existente', async () => {
    await updateAudioBackupTranscriptionStatus('backup-id-3', 'success', null);

    const writtenPayload = mockUpdateDoc.mock.calls[0][1] as Record<string, unknown>;
    expect(writtenPayload.transcriptText).toBeNull();
  });
});
