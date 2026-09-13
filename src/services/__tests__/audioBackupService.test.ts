import { describe, it, expect, vi, beforeEach } from 'vitest';
import { collection, doc, getDocs, orderBy, query, updateDoc, where } from 'firebase/firestore';

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
    collection: vi.fn(() => ({ id: 'mock-collection-ref' })),
    query: vi.fn((...args: unknown[]) => args),
    where: vi.fn((...args: unknown[]) => args),
    orderBy: vi.fn((...args: unknown[]) => args),
    getDocs: vi.fn(),
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

import { getTranscriptTextForSession, updateAudioBackupTranscriptionStatus } from '../audioBackupService';

function buildMockQuerySnapshot(docs: Array<Record<string, unknown>>) {
  return {
    forEach: (callback: (doc: { data: () => Record<string, unknown> }) => void) => {
      for (const docData of docs) {
        callback({ data: () => docData });
      }
    },
  };
}

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

/**
 * TD-014: al reanudar una sesión que nunca generó un SOAP, sessions.transcript
 * nunca se escribió — el único lugar donde el texto puede vivir es acá,
 * en session_audio_backups.transcriptText (TD-013). Esta suite cubre la
 * lectura, no la escritura.
 */
describe('audioBackupService — getTranscriptTextForSession (TD-014)', () => {
  const mockGetDocs = vi.mocked(getDocs);
  const mockQuery = vi.mocked(query);
  const mockWhere = vi.mocked(where);
  const mockOrderBy = vi.mocked(orderBy);
  const mockCollection = vi.mocked(collection);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devuelve el texto de un único respaldo exitoso', async () => {
    mockGetDocs.mockResolvedValue(
      buildMockQuerySnapshot([{ transcriptText: 'Dolor lumbar desde hace dos semanas.' }]) as any,
    );

    const result = await getTranscriptTextForSession('session-1', 'user-1');

    expect(result).toBe('Dolor lumbar desde hace dos semanas.');
    expect(mockCollection).toHaveBeenCalledWith({}, 'session_audio_backups');
    expect(mockWhere).toHaveBeenCalledWith('sessionId', '==', 'session-1');
    expect(mockWhere).toHaveBeenCalledWith('userId', '==', 'user-1');
    expect(mockWhere).toHaveBeenCalledWith('transcriptionStatus', '==', 'success');
    expect(mockOrderBy).toHaveBeenCalledWith('recordingStartedAt', 'asc');
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });

  it('concatena varios respaldos de la misma sesión en orden cronológico (caso real: laptop + móvil bajo el mismo sessionId)', async () => {
    mockGetDocs.mockResolvedValue(
      buildMockQuerySnapshot([
        { transcriptText: 'Primera parte, grabada en la laptop.' },
        { transcriptText: 'Segunda parte, grabada después en el móvil.' },
      ]) as any,
    );

    const result = await getTranscriptTextForSession('session-1', 'user-1');

    expect(result).toBe('Primera parte, grabada en la laptop.\nSegunda parte, grabada después en el móvil.');
  });

  it('ignora respaldos sin transcriptText utilizable (vacío o ausente)', async () => {
    mockGetDocs.mockResolvedValue(
      buildMockQuerySnapshot([
        { transcriptText: null },
        { transcriptText: '   ' },
        { transcriptText: 'El único texto real.' },
      ]) as any,
    );

    const result = await getTranscriptTextForSession('session-1', 'user-1');

    expect(result).toBe('El único texto real.');
  });

  it('devuelve null cuando no hay ningún respaldo exitoso para la sesión', async () => {
    mockGetDocs.mockResolvedValue(buildMockQuerySnapshot([]) as any);

    const result = await getTranscriptTextForSession('session-sin-audio', 'user-1');

    expect(result).toBeNull();
  });
});
