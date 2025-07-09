/**
 * Servicio de Persistencia para AiDuxCare V.2
 * Simula persistencia en base de datos para MVP (usando localStorage)
 */

import { SOAPData } from './AudioToSOAPBridge';
import { EncryptedData, CryptoService } from './CryptoService';

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
  private static readonly STORAGE_KEY = 'aiduxcare_notes';

  /**
   * Guarda una nota SOAP cifrada
   */
  static async saveSOAPNote(
    soapData: SOAPData,
    patientId: string = 'default-patient',
    sessionId: string = 'default-session'
  ): Promise<string> {
    try {
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

      // Obtener notas existentes
      const existingNotes = this.getAllNotes();
      
      // Agregar la nueva nota
      existingNotes.push(savedNote);
      
      // Guardar en localStorage
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(existingNotes));
      
      console.log(`✅ Nota SOAP guardada con ID: ${noteId}`);
      return noteId;
    } catch (error) {
      console.error('Error guardando nota SOAP:', error);
      throw new Error('Error al guardar la nota en la base de datos');
    }
  }

  /**
   * Obtiene todas las notas guardadas
   */
  static getAllNotes(): SavedNote[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
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
      const notes = this.getAllNotes();
      return notes.find(note => note.id === noteId) || null;
    } catch (error) {
      console.error('Error obteniendo nota por ID:', error);
      return null;
    }
  }

  /**
   * Obtiene notas por paciente
   */
  static getNotesByPatient(patientId: string): SavedNote[] {
    try {
      const notes = this.getAllNotes();
      return notes.filter(note => note.patientId === patientId);
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
      return decryptedData;
    } catch (error) {
      console.error('Error verificando/descifrando nota:', error);
      return null;
    }
  }

  /**
   * Elimina una nota por ID
   */
  static deleteNote(noteId: string): boolean {
    try {
      const notes = this.getAllNotes();
      const filteredNotes = notes.filter(note => note.id !== noteId);
      
      if (filteredNotes.length === notes.length) {
        return false; // No se encontró la nota
      }
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredNotes));
      console.log(`🗑️ Nota eliminada: ${noteId}`);
      return true;
    } catch (error) {
      console.error('Error eliminando nota:', error);
      return false;
    }
  }

  /**
   * Limpia todas las notas (para testing)
   */
  static clearAllNotes(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    console.log('🧹 Todas las notas han sido eliminadas');
  }

  /**
   * Obtiene estadísticas de notas guardadas
   */
  static getStats(): {
    totalNotes: number;
    totalPatients: number;
    totalSessions: number;
    oldestNote: string | null;
    newestNote: string | null;
  } {
    const notes = this.getAllNotes();
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

  /**
   * Simula una operación de base de datos con delay
   */
  private static async simulateDbDelay(ms: number = 100): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Exporta todas las notas para backup
   */
  static exportNotes(): string {
    const notes = this.getAllNotes();
    return JSON.stringify(notes, null, 2);
  }

  /**
   * Importa notas desde backup
   */
  static importNotes(notesJson: string): boolean {
    try {
      const notes = JSON.parse(notesJson);
      if (Array.isArray(notes)) {
        localStorage.setItem(this.STORAGE_KEY, notesJson);
        console.log(`📥 ${notes.length} notas importadas exitosamente`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error importando notas:', error);
      return false;
    }
  }
}

export default PersistenceService; 