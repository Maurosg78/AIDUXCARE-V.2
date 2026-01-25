import logger from '@/shared/utils/logger';
/**
 * Servicio de Persistencia para AiDuxCare V.2
 * Implementación profesional usando Firestore
 */

import CryptoService from './CryptoService';

import { doc, setDoc, getDoc, collection, query, where, getDocs, deleteDoc, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
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
}

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
    sessionId: string = 'default-session'
  ): Promise<string> {
    try {
      const userId = this.getCurrentUserId();
      
      // ✅ WO-CONSENT-VERBAL-01-LANG: Gate - Check for valid consent with jurisdiction validation
      const jurisdiction = getCurrentJurisdiction();
      const hasValid = await VerbalConsentService.hasValidConsent(patientId, userId, jurisdiction);
      if (!hasValid) {
        throw new Error('Patient consent (verbal or digital) is required before saving clinical notes. Please obtain consent first.');
      }
      
      // Cifrar los datos SOAP
      const encryptedData = await CryptoService.encryptMedicalData(soapData);
      
      // Crear el registro de la nota
      const noteId = this.generateNoteId();
      const savedNote: SavedNote = {
        id: noteId,
        patientId,
        sessionId,
        soapData, // Mantener una copia sin cifrar para visualización
        encryptedData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ownerUid: userId, // Mantener para compatibilidad con SavedNote interface
      };

      // ✅ FIX 1.1: Save to Firestore - Use authorUid to match Firestore rules
      const noteRef = doc(db, this.COLLECTION_NAME, noteId);
      const dataToSave = {
        ...savedNote,
        authorUid: userId, // ✅ CRITICAL: Firestore rules expect authorUid, not ownerUid
        ownerUid: userId, // Keep for backward compatibility
      };
      
      console.log(`[PersistenceService] Saving note to Firestore:`, {
        collection: this.COLLECTION_NAME,
        noteId,
        ownerUid: userId,
        patientId: savedNote.patientId,
        sessionId: savedNote.sessionId,
        createdAt: savedNote.createdAt,
      });
      
      await setDoc(noteRef, dataToSave);
      
      console.log(`✅ [PersistenceService] Note saved successfully with ID: ${noteId}`);
      return noteId;
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
      const userId = this.getCurrentUserId();
      const notesRef = collection(db, this.COLLECTION_NAME);
      // ✅ CRITICAL FIX: Use authorUid to match Firestore rules (not ownerUid)
      const q = query(notesRef, where('authorUid', '==', userId), orderBy('createdAt', 'desc'));
      
      console.log(`[PersistenceService] Querying notes from Firestore:`, {
        collection: this.COLLECTION_NAME,
        authorUid: userId,
      });
      
      const snapshot = await getDocs(q);
      
      const notes = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = doc.data() as SavedNote;
        console.log(`[PersistenceService] Found note:`, {
          id: doc.id,
          patientId: data.patientId,
          createdAt: data.createdAt,
          authorUid: data.authorUid || data.ownerUid, // Support both for backward compatibility
        });
        return { ...data, id: doc.id };
      });
      
      console.log(`✅ [PersistenceService] Retrieved ${notes.length} notes for user ${userId}`);
      return notes;
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
      if (data.ownerUid !== userId) {
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
      const userId = this.getCurrentUserId();
      const notesRef = collection(db, this.COLLECTION_NAME);
      // ✅ CRITICAL FIX: Use authorUid to match Firestore rules (not ownerUid)
      // Firestore rules require: resource.data.authorUid == request.auth.uid
      const q = query(
        notesRef, 
        where('authorUid', '==', userId), 
        where('patientId', '==', patientId),
        orderBy('createdAt', 'desc') // Most recent first
      );
      const snapshot = await getDocs(q);
      
      console.log(`[PersistenceService] Found ${snapshot.docs.length} notes for patient ${patientId} (user: ${userId})`);
      
      return snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = doc.data() as SavedNote;
        // Ensure we have the document ID
        return { ...data, id: doc.id };
      });
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
      if (data.ownerUid !== userId) {
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
}

export default PersistenceService; 