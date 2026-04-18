import logger from '@/shared/utils/logger';
/**
 * Servicio de Persistencia para AiDuxCare V.2
 * Implementación profesional usando Firestore
 */

import CryptoService from './CryptoService';

import { doc, setDoc, getDoc, collection, query, where, orderBy, getDocs, deleteDoc, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { VerbalConsentService } from './verbalConsentService';
// ✅ WO-CONSENT-VERBAL-01-LANG: Multi-jurisdiction support
import { getCurrentJurisdiction } from '../core/consent/consentJurisdiction';

// Bloque 5E: Export SOAPData para uso en PersistenceServiceEnhanced
export type SOAPData = {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  confidence: number;
  timestamp: string;
};

export type NoteStatus = 'draft' | 'finalized';

type EncryptedData = {
  iv: string;
  encryptedData: string;
  salt?: string;
};

export interface SavedNote {
  id: string;
  patientId: string;
  sessionId: string;
  soapData: SOAPData;
  encryptedData: EncryptedData;
  createdAt: string;
  updatedAt: string;
  ownerUid: string; // Added for querying
  /** Firestore rules expect authorUid; kept for backward compatibility with ownerUid */
  authorUid?: string;
  /** WO-FIX-FOLLOWUP-VISITTYPE-SESSION-COUNT: preserve for History and session count */
  visitType?: 'initial' | 'follow-up';
  source?: 'workflow' | 'consultation';
  status?: NoteStatus;
  versionNumber?: number;
  parentNoteId?: string;
  supersedesNoteId?: string;
  acceptedAt?: string;
  acceptedBy?: string;
  acceptanceOperationId?: string;
}

export interface SaveSOAPNoteOptions {
  requestedStatus?: NoteStatus;
  acceptedAt?: string;
  acceptedBy?: string;
  acceptanceOperationId?: string;
}

type PreparedNoteWrite = {
  noteId: string;
  createdAt: string;
  updatedAt: string;
  status: NoteStatus;
  versionNumber: number;
  parentNoteId?: string;
  supersedesNoteId?: string;
  acceptedAt?: string;
  acceptedBy?: string;
  acceptanceOperationId?: string;
  skipWrite?: boolean;
};

export class PersistenceService {
  private static readonly COLLECTION_NAME = 'consultations';

  /**
   * Obtiene el ID del usuario actual autenticado
   */
  private static getCurrentUserId(): string {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('Usuario no autenticado');
    }
    return user.uid;
  }

  /**
   * Guarda una nota SOAP cifrada
   */
  static async saveSOAPNote(
    soapData: SOAPData,
    patientId: string = 'default-patient',
    sessionId: string = 'default-session',
    noteId?: string,
    options: SaveSOAPNoteOptions = {}
  ): Promise<string> {
    try {
      const userId = this.getCurrentUserId();

      // ✅ WO-CONSENT-VERBAL-01-LANG: Gate - Check for valid consent with jurisdiction validation
      const jurisdiction = getCurrentJurisdiction();
      const hasValid = await VerbalConsentService.hasValidConsent(patientId, userId, jurisdiction);
      if (!hasValid) {
        throw new Error('Patient consent (verbal or digital) is required before saving clinical notes. Please obtain consent first.');
      }

      const preparedWrite = await this.prepareNoteWrite(
        patientId,
        sessionId,
        noteId,
        options
      );

      if (preparedWrite.skipWrite) {
        return preparedWrite.noteId;
      }

      // Cifrar los datos SOAP
      const encryptedData = await CryptoService.encryptMedicalData(soapData);

      const resolvedNoteId = preparedWrite.noteId;
      const savedNote: SavedNote = {
        id: resolvedNoteId,
        patientId,
        sessionId,
        soapData, // Mantener una copia sin cifrar para visualización
        encryptedData,
        createdAt: preparedWrite.createdAt,
        updatedAt: preparedWrite.updatedAt,
        ownerUid: userId, // Mantener para compatibilidad con SavedNote interface
        visitType: (soapData as { visitType?: 'initial' | 'follow-up' }).visitType,
        source: (soapData as { source?: 'workflow' | 'consultation' }).source,
        status: preparedWrite.status,
        versionNumber: preparedWrite.versionNumber,
        parentNoteId: preparedWrite.parentNoteId,
        supersedesNoteId: preparedWrite.supersedesNoteId,
        acceptedAt: preparedWrite.acceptedAt,
        acceptedBy: preparedWrite.acceptedBy,
        acceptanceOperationId: preparedWrite.acceptanceOperationId,
      };

      // ✅ FIX 1.1: Save to Firestore - Use authorUid to match Firestore rules
      const noteRef = doc(db, this.COLLECTION_NAME, resolvedNoteId);
      const dataToSave = {
        ...savedNote,
        authorUid: userId, // ✅ CRITICAL: Firestore rules expect authorUid, not ownerUid
        ownerUid: userId, // Keep for backward compatibility
      };
      const sanitizedDataToSave = this.sanitizeForFirestore(dataToSave);

      console.log(`[PersistenceService] Saving note to Firestore:`, {
        collection: this.COLLECTION_NAME,
        noteId: resolvedNoteId,
        hasOwnerUid: Boolean(userId),
        hasPatientId: Boolean(savedNote.patientId),
        hasSessionId: Boolean(savedNote.sessionId),
        createdAt: savedNote.createdAt,
      });

      await setDoc(noteRef, sanitizedDataToSave);

      console.log(`✅ [PersistenceService] Note saved successfully with ID: ${resolvedNoteId}`);
      return resolvedNoteId;
    } catch (error) {
      console.error('Error generating clinical note:', error);
      throw new Error('Failed to save note to database');
    }
  }

  /**
   * Get all saved notes for current user
   * ✅ PHIPA/PIPEDA Compliance: Only returns notes owned by authenticated user
   * ✅ Uses authorUid to match Firestore security rules
   */
  static async getAllNotes(): Promise<SavedNote[]> {
    try {
      const notes = await this.fetchAllNotesRaw();
      const latestNotes = this.selectLatestNotes(notes);
      console.log(`✅ [PersistenceService] Retrieved ${latestNotes.length} notes for current user`);
      return latestNotes;
    } catch (error: any) {
      // WO-FS-DATA-03: Handle permission-denied as "no data yet"
      const isPermissionDenied = error?.code === 'permission-denied' ||
        error?.message?.includes('permission-denied');

      if (isPermissionDenied) {
        console.info('[PersistenceService] No notes found (permission-denied) - may be empty state');
        return [];
      }

      console.error('[PersistenceService] Error obteniendo notas:', error);
      return [];
    }
  }

  /**
   * Obtiene una nota específica por ID
   */
  static async getNoteById(noteId: string): Promise<SavedNote | null> {
    try {
      const userId = this.getCurrentUserId();
      const noteRef = doc(db, this.COLLECTION_NAME, noteId);
      const snapshot = await getDoc(noteRef);

      if (!snapshot.exists()) {
        return null;
      }

      const data = snapshot.data() as SavedNote;
      // Verify ownership
      if (data.ownerUid !== userId && data.authorUid !== userId) {
        console.warn('Note access denied: user does not own this note');
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error obteniendo nota por ID:', error);
      return null;
    }
  }

  /**
   * Obtiene notas por paciente
   * ✅ PHIPA/PIPEDA Compliance: Only returns notes owned by authenticated user
   * ✅ Uses authorUid to match Firestore security rules
   */
  static async getNotesByPatient(patientId: string): Promise<SavedNote[]> {
    try {
      const notes = await this.fetchNotesByPatientRaw(patientId);
      const latestNotes = this.selectLatestNotes(notes);
      return latestNotes;
    } catch (error: any) {
      // WO-FS-DATA-03: Handle permission-denied as "no data yet" for historical queries
      const isPermissionDenied = error?.code === 'permission-denied' ||
        error?.message?.includes('permission-denied') ||
        error?.message?.includes('Missing or insufficient permissions');

      if (isPermissionDenied) {
        console.info('[PersistenceService] No notes found (permission-denied) - may be empty state');
        return [];
      }

      console.error('[PersistenceService] Error obteniendo notas por paciente:', error);
      return [];
    }
  }

  /**
   * Verifica y descifra una nota
   */
  static async verifyAndDecryptNote(noteId: string): Promise<SOAPData | null> {
    try {
      const note = await this.getNoteById(noteId);
      if (!note) {
        return null;
      }

      // Descifrar los datos
      const decryptedData = await CryptoService.decryptMedicalData(note.encryptedData);
      return decryptedData as unknown as SOAPData;
    } catch (error) {
      console.error('Error verificando/descifrando nota:', error);
      return null;
    }
  }

  /**
   * Elimina una nota por ID
   */
  static async deleteNote(noteId: string): Promise<boolean> {
    try {
      const userId = this.getCurrentUserId();
      const noteRef = doc(db, this.COLLECTION_NAME, noteId);

      // Verify ownership before deleting
      const snapshot = await getDoc(noteRef);
      if (!snapshot.exists()) {
        console.warn('Note not found:', noteId);
        return false;
      }

      const data = snapshot.data();
      if (data.ownerUid !== userId && data.authorUid !== userId) {
        console.warn('Note deletion denied: user does not own this note');
        return false;
      }

      await deleteDoc(noteRef);
      console.log(`🗑️ Nota eliminada: ${noteId}`);
      return true;
    } catch (error) {
      console.error('Error eliminando nota:', error);
      return false;
    }
  }

  /**
   * Obtiene estadísticas de notas guardadas
   */
  static async getStats(): Promise<{
    totalNotes: number;
    totalPatients: number;
    totalSessions: number;
    oldestNote: string | null;
    newestNote: string | null;
  }> {
    const notes = await this.getAllNotes();
    const patients = new Set(notes.map(n => n.patientId));
    const sessions = new Set(notes.map(n => n.sessionId));

    const sortedByDate = notes.sort((a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    return {
      totalNotes: notes.length,
      totalPatients: patients.size,
      totalSessions: sessions.size,
      oldestNote: sortedByDate.length > 0 ? sortedByDate[0].createdAt : null,
      newestNote: sortedByDate.length > 0 ? sortedByDate[sortedByDate.length - 1].createdAt : null
    };
  }

  /**
   * Genera un ID único para la nota
   */
  private static generateNoteId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `note_${timestamp}_${random}`;
  }

  private static async fetchAllNotesRaw(): Promise<SavedNote[]> {
    const userId = this.getCurrentUserId();
    const notesRef = collection(db, this.COLLECTION_NAME);
    const notesQuery = query(
      notesRef,
      where('authorUid', '==', userId),
      orderBy('createdAt', 'desc')
    );

    console.log(`[PersistenceService] Querying notes from Firestore:`, {
      collection: this.COLLECTION_NAME,
      hasAuthorUid: Boolean(userId),
    });

    const snapshot = await getDocs(notesQuery);
    const notes = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
      const data = doc.data() as SavedNote;
      console.log(`[PersistenceService] Found note:`, {
        id: doc.id,
        hasPatientId: Boolean(data.patientId),
        createdAt: data.createdAt,
        hasAuthorUid: Boolean(data.authorUid || data.ownerUid),
      });
      return { ...data, id: doc.id };
    });
    return notes;
  }

  private static async fetchNotesByPatientRaw(patientId: string): Promise<SavedNote[]> {
    const userId = this.getCurrentUserId();
    const notesRef = collection(db, this.COLLECTION_NAME);
    const notesQuery = query(
      notesRef,
      where('authorUid', '==', userId),
      where('patientId', '==', patientId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(notesQuery);

    console.log(`[PersistenceService] Found ${snapshot.docs.length} notes for requested patient`, {
      hasPatientId: Boolean(patientId),
      hasUserId: Boolean(userId),
    });

    const notes = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
      const data = doc.data() as SavedNote;
      return { ...data, id: doc.id };
    });
    return notes;
  }

  private static async prepareNoteWrite(
    patientId: string,
    sessionId: string,
    noteId: string | undefined,
    options: SaveSOAPNoteOptions
  ): Promise<PreparedNoteWrite> {
    const latestNote = await this.getLatestNoteForSession(patientId, sessionId);
    const requestedStatus = options.requestedStatus ?? 'finalized';
    const acceptanceOperationId = options.acceptanceOperationId;
    const explicitTargetNoteId = noteId;
    const existingTargetNoteId = explicitTargetNoteId ?? latestNote?.id;
    const existingTargetNote =
      existingTargetNoteId != null
        ? await this.getNoteById(existingTargetNoteId)
        : null;
    const acceptedAt =
      requestedStatus === 'finalized'
        ? options.acceptedAt ?? new Date().toISOString()
        : undefined;
    const acceptedBy =
      requestedStatus === 'finalized'
        ? options.acceptedBy
        : undefined;
    const latestNoteStatus = this.resolveNoteStatus(latestNote);
    const latestDraftExists =
      latestNote != null &&
      latestNoteStatus === 'draft';
    const latestAcceptedWithSameOperation =
      latestNote != null &&
      requestedStatus === 'finalized' &&
      acceptanceOperationId != null &&
      latestNote.acceptanceOperationId === acceptanceOperationId;

    if (latestAcceptedWithSameOperation) {
      const preservedCreatedAt = latestNote.createdAt || new Date().toISOString();
      const currentVersionNumber = this.resolveNoteVersionNumber(latestNote);
      return {
        noteId: latestNote.id,
        createdAt: preservedCreatedAt,
        updatedAt: latestNote.updatedAt || preservedCreatedAt,
        status: 'finalized',
        versionNumber: currentVersionNumber,
        parentNoteId: latestNote.parentNoteId,
        supersedesNoteId: latestNote.supersedesNoteId,
        acceptedAt: latestNote.acceptedAt,
        acceptedBy: latestNote.acceptedBy,
        acceptanceOperationId: latestNote.acceptanceOperationId,
        skipWrite: true,
      };
    }

    if (latestDraftExists) {
      const latestDraft = latestNote;
      const preservedCreatedAt = latestDraft.createdAt || new Date().toISOString();
      const nextUpdatedAt = new Date().toISOString();
      const currentVersionNumber = this.resolveNoteVersionNumber(latestDraft);
      return {
        noteId: latestDraft.id,
        createdAt: preservedCreatedAt,
        updatedAt: nextUpdatedAt,
        status: requestedStatus,
        versionNumber: currentVersionNumber,
        parentNoteId: latestDraft.parentNoteId,
        supersedesNoteId: latestDraft.supersedesNoteId,
        acceptedAt,
        acceptedBy,
        acceptanceOperationId,
      };
    }

    const explicitTargetStatus = this.resolveNoteStatus(existingTargetNote);
    const shouldCreateNewVersion =
      existingTargetNote != null &&
      explicitTargetStatus === 'finalized' &&
      requestedStatus === 'draft';

    const shouldForkFinalizedIntoDraft =
      existingTargetNote != null &&
      explicitTargetStatus === 'finalized' &&
      requestedStatus === 'finalized';

    if (shouldCreateNewVersion) {
      const finalizedSourceNote = latestNote ?? existingTargetNote;
      if (!finalizedSourceNote) {
        throw new Error('Cannot create note version without source note');
      }
      const latestVersionNumber = this.resolveNoteVersionNumber(finalizedSourceNote);
      const nextVersionNumber = latestVersionNumber + 1;
      const baseRootId = finalizedSourceNote.parentNoteId ?? finalizedSourceNote.id;
      const nextNoteId = this.buildVersionedNoteId(baseRootId, nextVersionNumber);
      const nextCreatedAt = new Date().toISOString();
      const nextUpdatedAt = nextCreatedAt;
      return {
        noteId: nextNoteId,
        createdAt: nextCreatedAt,
        updatedAt: nextUpdatedAt,
        status: requestedStatus,
        versionNumber: nextVersionNumber,
        parentNoteId: baseRootId,
        supersedesNoteId: finalizedSourceNote.id,
        acceptedAt,
        acceptedBy,
        acceptanceOperationId,
      };
    }

    if (shouldForkFinalizedIntoDraft) {
      const finalizedSourceNote = latestNote ?? existingTargetNote;
      if (!finalizedSourceNote) {
        throw new Error('Cannot fork finalized note without source note');
      }
      const latestVersionNumber = this.resolveNoteVersionNumber(finalizedSourceNote);
      const nextVersionNumber = latestVersionNumber + 1;
      const baseRootId = finalizedSourceNote.parentNoteId ?? finalizedSourceNote.id;
      const nextNoteId = this.buildVersionedNoteId(baseRootId, nextVersionNumber);
      const nextCreatedAt = new Date().toISOString();
      const nextUpdatedAt = nextCreatedAt;
      return {
        noteId: nextNoteId,
        createdAt: nextCreatedAt,
        updatedAt: nextUpdatedAt,
        status: 'draft',
        versionNumber: nextVersionNumber,
        parentNoteId: baseRootId,
        supersedesNoteId: finalizedSourceNote.id,
      };
    }

    if (existingTargetNote) {
      const preservedCreatedAt = existingTargetNote.createdAt || new Date().toISOString();
      const nextUpdatedAt = new Date().toISOString();
      const currentVersionNumber = this.resolveNoteVersionNumber(existingTargetNote);
      return {
        noteId: existingTargetNote.id,
        createdAt: preservedCreatedAt,
        updatedAt: nextUpdatedAt,
        status: requestedStatus,
        versionNumber: currentVersionNumber,
        parentNoteId: existingTargetNote.parentNoteId,
        supersedesNoteId: existingTargetNote.supersedesNoteId,
        acceptedAt,
        acceptedBy,
        acceptanceOperationId,
      };
    }

    const freshNoteId = noteId ?? this.generateNoteId();
    const freshCreatedAt = new Date().toISOString();
    const freshUpdatedAt = freshCreatedAt;
    return {
      noteId: freshNoteId,
      createdAt: freshCreatedAt,
      updatedAt: freshUpdatedAt,
      status: requestedStatus,
      versionNumber: 1,
      acceptedAt,
      acceptedBy,
      acceptanceOperationId,
    };
  }

  private static async getLatestNoteForSession(
    patientId: string,
    sessionId: string
  ): Promise<SavedNote | null> {
    try {
      const notes = await this.fetchNotesByPatientRaw(patientId);
      const matchingNotes = notes.filter((note) => note.sessionId === sessionId);
      if (matchingNotes.length === 0) {
        return null;
      }
      const sortedNotes = matchingNotes.sort((leftNote, rightNote) => {
        const leftVersionNumber = this.resolveNoteVersionNumber(leftNote);
        const rightVersionNumber = this.resolveNoteVersionNumber(rightNote);
        const versionDifference = rightVersionNumber - leftVersionNumber;
        if (versionDifference !== 0) {
          return versionDifference;
        }
        const leftTimestamp = this.resolveNoteOrderingTimestamp(leftNote);
        const rightTimestamp = this.resolveNoteOrderingTimestamp(rightNote);
        return rightTimestamp - leftTimestamp;
      });
      const latestNote = sortedNotes[0];
      return latestNote ?? null;
    } catch (error) {
      console.error('[PersistenceService] Error resolving latest note for session:', error);
      return null;
    }
  }

  private static selectLatestNotes(notes: SavedNote[]): SavedNote[] {
    const latestBySessionId = new Map<string, SavedNote>();
    notes.forEach((note) => {
      const groupingKey = note.sessionId || note.id;
      const currentLatest = latestBySessionId.get(groupingKey);
      if (!currentLatest) {
        latestBySessionId.set(groupingKey, note);
        return;
      }
      const currentVersionNumber = this.resolveNoteVersionNumber(currentLatest);
      const candidateVersionNumber = this.resolveNoteVersionNumber(note);
      if (candidateVersionNumber > currentVersionNumber) {
        latestBySessionId.set(groupingKey, note);
        return;
      }
      if (candidateVersionNumber < currentVersionNumber) {
        return;
      }
      const currentTimestamp = this.resolveNoteOrderingTimestamp(currentLatest);
      const candidateTimestamp = this.resolveNoteOrderingTimestamp(note);
      if (candidateTimestamp > currentTimestamp) {
        latestBySessionId.set(groupingKey, note);
      }
    });
    const latestNotes = Array.from(latestBySessionId.values());
    const sortedLatestNotes = latestNotes.sort((leftNote, rightNote) => {
      const leftTimestamp = this.resolveNoteOrderingTimestamp(leftNote);
      const rightTimestamp = this.resolveNoteOrderingTimestamp(rightNote);
      return rightTimestamp - leftTimestamp;
    });
    return sortedLatestNotes;
  }

  private static resolveNoteStatus(note: SavedNote | null | undefined): NoteStatus {
    const explicitStatus = note?.status;
    if (explicitStatus === 'draft' || explicitStatus === 'finalized') {
      return explicitStatus;
    }
    return 'finalized';
  }

  private static resolveNoteVersionNumber(note: SavedNote | null | undefined): number {
    const explicitVersion = note?.versionNumber;
    const hasValidVersion =
      typeof explicitVersion === 'number' &&
      Number.isFinite(explicitVersion) &&
      explicitVersion > 0;
    if (hasValidVersion) {
      return explicitVersion;
    }
    return 1;
  }

  private static resolveNoteOrderingTimestamp(note: SavedNote): number {
    const updatedAtValue = Date.parse(note.updatedAt || '');
    if (Number.isFinite(updatedAtValue)) {
      return updatedAtValue;
    }
    const createdAtValue = Date.parse(note.createdAt || '');
    if (Number.isFinite(createdAtValue)) {
      return createdAtValue;
    }
    return 0;
  }

  private static buildVersionedNoteId(baseNoteId: string, versionNumber: number): string {
    const baseId = baseNoteId.replace(/_v\d+$/, '');
    if (versionNumber <= 1) {
      return baseId;
    }
    return `${baseId}_v${versionNumber}`;
  }

  private static sanitizeForFirestore<T extends Record<string, unknown>>(payload: T): T {
    const sanitizedPayload = { ...payload };
    const payloadKeys = Object.keys(sanitizedPayload) as Array<keyof T>;
    payloadKeys.forEach((payloadKey) => {
      const payloadValue = sanitizedPayload[payloadKey];
      const isUndefinedValue = payloadValue === undefined;
      if (isUndefinedValue) {
        delete sanitizedPayload[payloadKey];
      }
    });
    return sanitizedPayload;
  }
}

export default PersistenceService; 
