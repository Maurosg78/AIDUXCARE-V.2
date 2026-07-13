import { addDoc, collection, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes } from 'firebase/storage';
import { auth, db, storage } from '../lib/firebase';

export type AudioBackupTranscriptionStatus =
  | 'pending'
  | 'success'
  | 'failed_retryable'
  | 'failed_permanent';

export interface AudioBackupClinicalContext {
  sessionId?: string | null;
  patientId?: string | null;
  userId?: string | null;
}

export interface PersistAudioBackupInput extends AudioBackupClinicalContext {
  audioBlob: Blob;
  recordingStartedAt: string;
  recordingStoppedAt: string;
}

export interface PersistedAudioBackup {
  id: string;
  recordingId: string;
  storagePath: string;
}

const AUDIO_BACKUP_COLLECTION = 'session_audio_backups';
const AUDIO_BACKUP_STORAGE_ROOT = 'session-audio-backups';

function extensionFromMimeType(mimeType: string): string {
  if (mimeType.includes('mp4')) return 'mp4';
  if (mimeType.includes('mpeg')) return 'mp3';
  if (mimeType.includes('wav')) return 'wav';
  return 'webm';
}

function sanitizeStorageSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export async function persistAudioBackup(input: PersistAudioBackupInput): Promise<PersistedAudioBackup> {
  if (!storage || !db) {
    throw new Error('Firebase Storage/Firestore no está disponible para respaldar audio clínico.');
  }

  const authenticatedUserId = auth?.currentUser?.uid ?? null;
  const clinicalUserId = input.userId ?? authenticatedUserId;

  if (!clinicalUserId) {
    throw new Error('No hay usuario autenticado para respaldar audio clínico.');
  }

  const recordingId = crypto.randomUUID();
  const safeUserId = sanitizeStorageSegment(clinicalUserId);
  const sessionStorageSegment = input.sessionId ?? 'unassigned-session';
  const safeSessionId = sanitizeStorageSegment(sessionStorageSegment);
  const mimeType = input.audioBlob.type || 'audio/webm';
  const fileExtension = extensionFromMimeType(mimeType);
  const audioBackupStoragePath = `${AUDIO_BACKUP_STORAGE_ROOT}/${safeUserId}/${safeSessionId}/${recordingId}.${fileExtension}`;
  const audioBackupStorageRef = ref(storage, audioBackupStoragePath);

  await uploadBytes(audioBackupStorageRef, input.audioBlob, {
    contentType: mimeType,
    customMetadata: {
      recordingId,
      sessionId: input.sessionId ?? '',
      patientId: input.patientId ?? '',
      userId: clinicalUserId,
      recordingStartedAt: input.recordingStartedAt,
      recordingStoppedAt: input.recordingStoppedAt,
    },
  });

  const audioBackupDocument = {
    recordingId,
    sessionId: input.sessionId ?? null,
    patientId: input.patientId ?? null,
    userId: clinicalUserId,
    storagePath: audioBackupStoragePath,
    mimeType,
    sizeBytes: input.audioBlob.size,
    recordingStartedAt: input.recordingStartedAt,
    recordingStoppedAt: input.recordingStoppedAt,
    transcriptionStatus: 'pending' as AudioBackupTranscriptionStatus,
    retryCount: 0,
    lastError: null as string | null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const audioBackupDocumentRef = await addDoc(collection(db, AUDIO_BACKUP_COLLECTION), audioBackupDocument);

  return {
    id: audioBackupDocumentRef.id,
    recordingId,
    storagePath: audioBackupStoragePath,
  };
}

export async function updateAudioBackupTranscriptionStatus(
  audioBackupId: string,
  transcriptionStatus: AudioBackupTranscriptionStatus,
  lastError: string | null = null,
): Promise<void> {
  if (!db) {
    throw new Error('Firestore no está disponible para actualizar respaldo de audio clínico.');
  }

  const audioBackupDocumentRef = doc(db, AUDIO_BACKUP_COLLECTION, audioBackupId);
  const audioBackupUpdate = {
    transcriptionStatus,
    lastError,
    updatedAt: new Date().toISOString(),
  };

  await updateDoc(audioBackupDocumentRef, audioBackupUpdate);
}
