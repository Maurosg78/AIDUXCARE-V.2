import logger from '@/shared/utils/logger';
/**
 * Servicio de Persistencia para AiDuxCare V.2
 * Implementación profesional usando Firestore
 */

import CryptoService from './CryptoService';

import { getAuth } from 'firebase/auth';

type SOAPData = {
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
import { doc, setDoc, getDoc, collection, query, where, getDocs, deleteDoc, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';

import { app, db } from '@/integrations/firebase';

export interface SavedNote {
  id: string;
  patientId: string;
  sessionId: string;
  soapData: SOAPData;
  encryptedData: EncryptedData;
  createdAt: string;
  updatedAt: string;
}

export class PersistenceService {
  private static readonly COLLECTION_NAME = 'consultations';

  /**
   * Obtiene el ID del usuario actual autenticado
   */
  private static getCurrentUserId(): string {
    const user = getAuth(app).currentUser;
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
        updatedAt: new Date().toISOString()
      };

      // Guardar en Firestore
      const noteRef = doc(db, this.COLLECTION_NAME, userId, 'notes', noteId);
      await setDoc(noteRef, savedNote);
      
      console.log(`✅ Nota SOAP guardada con ID: ${noteId}`);
      return noteId;
    } catch (error) {
      console.error('Error guardando nota SOAP:', error);
      throw new Error('Error al guardar la nota en la base de datos');
    }
  }

  /**
   * Obtiene todas las notas guardadas del usuario actual
   */
  static async getAllNotes(): Promise<SavedNote[]> {
    try {
      const userId = this.getCurrentUserId();
      const notesRef = collection(db, this.COLLECTION_NAME, userId, 'notes');
      const snapshot = await getDocs(notesRef);
      
      return snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => doc.data() as SavedNote);
    } catch (error) {
      console.error('Error obteniendo notas:', error);
      return [];
    }
  }

  /**
   * Obtiene una nota específica por ID
   */
  static async getNoteById(noteId: string): Promise<SavedNote | null> {
    try {
      const userId = this.getCurrentUserId();
      const noteRef = doc(db, this.COLLECTION_NAME, userId, 'notes', noteId);
      const snapshot = await getDoc(noteRef);
      
      return snapshot.exists() ? (snapshot.data() as SavedNote) : null;
    } catch (error) {
      console.error('Error obteniendo nota por ID:', error);
      return null;
    }
  }

  /**
   * Obtiene notas por paciente
   */
  static async getNotesByPatient(patientId: string): Promise<SavedNote[]> {
    try {
      const userId = this.getCurrentUserId();
      const notesRef = collection(db, this.COLLECTION_NAME, userId, 'notes');
      const q = query(notesRef, where('patientId', '==', patientId));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => doc.data() as SavedNote);
    } catch (error) {
      console.error('Error obteniendo notas por paciente:', error);
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
      const noteRef = doc(db, this.COLLECTION_NAME, userId, 'notes', noteId);
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