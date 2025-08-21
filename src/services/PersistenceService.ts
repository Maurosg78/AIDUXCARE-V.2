/**
 * Servicio de Persistencia para AiDuxCare V.2
 * Implementación profesional usando Firestore
 */

import { 
  collection, 
  doc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  Timestamp,
  setDoc, 
  getDoc, 
  deleteDoc, 
  QueryDocumentSnapshot, 
  DocumentData 
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { app, db } from '@/integrations/firebase';
import { CryptoService } from './CryptoService';

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
   * Genera un ID único para la nota
   */
  private static generateNoteId(): string {
    return `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Obtiene estadísticas de las notas del usuario
   */
  static async getNotesStats(): Promise<{
    totalNotes: number;
    oldestNote: string | null;
    newestNote: string | null;
  }> {
    try {
      const userId = this.getCurrentUserId();
      const notesRef = collection(db, this.COLLECTION_NAME, userId, 'notes');
      const snapshot = await getDocs(notesRef);
      
      const notes = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => doc.data() as SavedNote);
      const sortedByDate = notes.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      
      return {
        totalNotes: notes.length,
        oldestNote: sortedByDate.length > 0 ? sortedByDate[0].createdAt : null,
        newestNote: sortedByDate.length > 0 ? sortedByDate[sortedByDate.length - 1].createdAt : null
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas de notas:', error);
      return {
        totalNotes: 0,
        oldestNote: null,
        newestNote: null
      };
    }
  }

  /**
   * Elimina una nota específica
   */
  static async deleteNote(noteId: string): Promise<boolean> {
    try {
      const userId = this.getCurrentUserId();
      const noteRef = doc(db, this.COLLECTION_NAME, userId, 'notes', noteId);
      await deleteDoc(noteRef);
      
      console.log(`✅ Nota eliminada con ID: ${noteId}`);
      return true;
    } catch (error) {
      console.error('Error eliminando nota:', error);
      return false;
    }
  }

  /**
   * Busca notas por texto
   */
  static async searchNotes(searchTerm: string): Promise<SavedNote[]> {
    try {
      const userId = this.getCurrentUserId();
      const notesRef = collection(db, this.COLLECTION_NAME, userId, 'notes');
      const snapshot = await getDocs(notesRef);
      
      const notes = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => doc.data() as SavedNote);
      
      // Búsqueda simple en texto (se puede mejorar con índices de Firestore)
      return notes.filter(note => 
        note.soapData.subjective.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.soapData.objective.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.soapData.assessment.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.soapData.plan.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } catch (error) {
      console.error('Error buscando notas:', error);
      return [];
    }
  }
} 