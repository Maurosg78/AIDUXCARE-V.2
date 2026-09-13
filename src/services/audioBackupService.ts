import { addDoc, collection, doc, getDocs, orderBy, query, updateDoc, where } from 'firebase/firestore';
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
  transcriptText: string | null = null,
): Promise<void> {
  if (!db) {
    throw new Error('Firestore no está disponible para actualizar respaldo de audio clínico.');
  }

  const audioBackupDocumentRef = doc(db, AUDIO_BACKUP_COLLECTION, audioBackupId);
  const audioBackupUpdate = {
    transcriptionStatus,
    lastError,
    // TD-013: el texto se persiste aquí, en el mismo documento que ya
    // rastrea el audio crudo, apenas Whisper responde con éxito — antes
    // de que el usuario tenga que hacer nada más (generar el SOAP,
    // navegar a otra pantalla, etc.). Antes de este cambio, este texto
    // solo vivía en useState del cliente y se perdía si la pestaña o el
    // dispositivo se cerraban antes de ese paso posterior.
    transcriptText,
    updatedAt: new Date().toISOString(),
  };

  await updateDoc(audioBackupDocumentRef, audioBackupUpdate);
}

/**
 * TD-014: hidrata el transcript al reanudar una sesión que nunca llegó a
 * generar un SOAP — `sessions.transcript` solo se escribe en ese paso
 * (ver ProfessionalWorkflowPage.tsx), así que si el usuario nunca lo
 * generó, el texto vive únicamente acá, en session_audio_backups (TD-013).
 *
 * Una sesión puede tener más de un respaldo de audio (ej. una grabación
 * web larga + una nativa corta bajo el mismo sessionId, visto en el
 * incidente real del 2026-09-07) — se concatenan en orden cronológico.
 */
export async function getTranscriptTextForSession(sessionId: string, userId: string): Promise<string | null> {
  if (!db) {
    throw new Error('Firestore no está disponible para leer el respaldo de audio clínico.');
  }

  // userId explícito en la query, no solo en la regla de seguridad: las
  // reglas de Firestore evalúan cada documento devuelto por un list/query
  // contra resource.data.userId (ver firestore.rules), pero incluirlo acá
  // también deja la query auto-explicada y evita cualquier ambigüedad de
  // evaluación para operaciones de lista compuestas.
  const audioBackupCollectionRef = collection(db, AUDIO_BACKUP_COLLECTION);
  const successfulBackupsQuery = query(
    audioBackupCollectionRef,
    where('sessionId', '==', sessionId),
    where('userId', '==', userId),
    where('transcriptionStatus', '==', 'success'),
    orderBy('recordingStartedAt', 'asc'),
  );

  const matchingBackups = await getDocs(successfulBackupsQuery);
  const transcriptTexts: string[] = [];

  matchingBackups.forEach((backupDoc) => {
    const backupData = backupDoc.data();
    const backupTranscriptText = backupData.transcriptText;
    const hasUsableText = typeof backupTranscriptText === 'string' && backupTranscriptText.trim().length > 0;
    if (hasUsableText) {
      transcriptTexts.push(backupTranscriptText.trim());
    }
  });

  const hasAnyRecoveredText = transcriptTexts.length > 0;
  if (!hasAnyRecoveredText) {
    return null;
  }

  const combinedTranscriptText = transcriptTexts.join('\n');
  return combinedTranscriptText;
}
