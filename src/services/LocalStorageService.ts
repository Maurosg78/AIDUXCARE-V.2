/**
 * 🗄️ Local Storage Service - AiDuxCare V.2
 * Gestión de almacenamiento local sin audio
 * Enfoque: highlights + SOAP únicamente
 */

import { 
  SessionData, 
  TherapistLocalData, 
  LocalStorageSession, 
  SessionSummary,
  ClinicalHighlight 
} from '@/types/session';

// Tipo para pacientes
interface Patient {
  id: string;
  name: string;
  age: number;
  phone: string;
  email: string;
  condition: string;
  allergies?: string[];
  medications?: string[];
  clinicalHistory?: string;
  derivadoPor?: string;
  createdAt: string;
  updatedAt: string;
}

class LocalStorageService {
  private readonly STORAGE_PREFIX = 'aiduxcare_v2_';
  private readonly THERAPIST_KEY = 'therapist_data';
  private readonly SESSIONS_KEY = 'sessions';
  private readonly PATIENTS_KEY = 'patients';
  private readonly VERSION = '2.0.0';

  // ========= GESTIÓN DE TERAPEUTAS =========

  /**
   * Obtener datos del terapeuta actual
   */
  getCurrentTherapist(): TherapistLocalData | null {
    try {
      const data = localStorage.getItem(this.getStorageKey(this.THERAPIST_KEY));
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('❌ Error al obtener datos del terapeuta:', error);
      return null;
    }
  }

  /**
   * Guardar datos del terapeuta
   */
  saveTherapistData(therapistData: TherapistLocalData): boolean {
    try {
      const dataToSave = {
        ...therapistData,
        lastActiveAt: new Date().toISOString(),
        dataVersion: this.VERSION
      };
      
      localStorage.setItem(
        this.getStorageKey(this.THERAPIST_KEY), 
        JSON.stringify(dataToSave)
      );
      
      return true;
    } catch (error) {
      console.error('❌ Error al guardar datos del terapeuta:', error);
      return false;
    }
  }

  /**
   * Crear nuevo terapeuta
   */
  createTherapist(therapistId: string, name: string, email?: string): TherapistLocalData {
    const newTherapist: TherapistLocalData = {
      therapistId,
      name,
      email,
      sessions: [],
      preferences: {
        autoSave: true,
        highlightThreshold: 0.8,
        defaultCategories: ['síntoma', 'hallazgo', 'plan'],
        soapTemplate: undefined
      },
      stats: {
        totalSessions: 0,
        totalHighlights: 0,
        averageSessionDuration: 0,
        lastSessionDate: undefined
      },
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      dataVersion: this.VERSION
    };

    this.saveTherapistData(newTherapist);
    return newTherapist;
  }

  // ========= GESTIÓN DE SESIONES =========

  /**
   * Guardar sesión (SIN audio, solo highlights + SOAP)
   */
  saveSession(sessionData: SessionData): boolean {
    try {
      const therapist = this.getCurrentTherapist();
      if (!therapist) {
        throw new Error('No hay terapeuta activo');
      }

      const localSession: LocalStorageSession = {
        sessionData: {
          ...sessionData,
          updatedAt: new Date().toISOString()
        },
        metadata: {
          appVersion: this.VERSION,
          averageConfidence: this.calculateAverageConfidence(sessionData.highlights),
          processingTime: 0, // Se calculará en tiempo real
          highlightsGenerated: sessionData.highlights.length,
          manualCorrections: 0 // Se trackea durante la sesión
        },
        needsSync: true,
        syncStatus: 'pending'
      };

      // Actualizar o agregar sesión
      const existingIndex = therapist.sessions.findIndex(
        s => s.sessionData.sessionId === sessionData.sessionId
      );

      if (existingIndex >= 0) {
        therapist.sessions[existingIndex] = localSession;
      } else {
        therapist.sessions.push(localSession);
      }

      // Actualizar estadísticas
      this.updateTherapistStats(therapist);
      
      // Guardar
      return this.saveTherapistData(therapist);
      
    } catch (error) {
      console.error('❌ Error al guardar sesión:', error);
      return false;
    }
  }

  /**
   * Obtener sesión por ID
   */
  getSession(sessionId: string): SessionData | null {
    try {
      const therapist = this.getCurrentTherapist();
      if (!therapist) return null;

      const session = therapist.sessions.find(
        s => s.sessionData.sessionId === sessionId
      );

      return session ? session.sessionData : null;
    } catch (error) {
      console.error('❌ Error al obtener sesión:', error);
      return null;
    }
  }

  /**
   * Obtener todas las sesiones del terapeuta
   */
  getAllSessions(): SessionSummary[] {
    try {
      const therapist = this.getCurrentTherapist();
      if (!therapist) return [];

      return therapist.sessions.map(session => ({
        sessionId: session.sessionData.sessionId,
        patientName: `Paciente ${session.sessionData.patientId}`, // En producción vendrá de otra fuente
        date: session.sessionData.sessionDate,
        duration: session.sessionData.duration || 0,
        highlightsCount: session.sessionData.highlights.length,
        status: session.sessionData.status,
        hasSOAP: !!session.sessionData.soapNotes
      }));
    } catch (error) {
      console.error('❌ Error al obtener sesiones:', error);
      return [];
    }
  }

  /**
   * Eliminar sesión
   */
  deleteSession(sessionId: string): boolean {
    try {
      const therapist = this.getCurrentTherapist();
      if (!therapist) return false;

      therapist.sessions = therapist.sessions.filter(
        s => s.sessionData.sessionId !== sessionId
      );

      this.updateTherapistStats(therapist);
      return this.saveTherapistData(therapist);
    } catch (error) {
      console.error('❌ Error al eliminar sesión:', error);
      return false;
    }
  }

  // ========= GESTIÓN DE HIGHLIGHTS =========

  /**
   * Agregar highlight a sesión activa
   */
  addHighlightToSession(sessionId: string, highlight: ClinicalHighlight): boolean {
    try {
      const therapist = this.getCurrentTherapist();
      if (!therapist) return false;

      const sessionIndex = therapist.sessions.findIndex(
        s => s.sessionData.sessionId === sessionId
      );

      if (sessionIndex === -1) return false;

      therapist.sessions[sessionIndex].sessionData.highlights.push(highlight);
      therapist.sessions[sessionIndex].sessionData.highlightsCount = 
        therapist.sessions[sessionIndex].sessionData.highlights.length;

      return this.saveTherapistData(therapist);
    } catch (error) {
      console.error('❌ Error al agregar highlight:', error);
      return false;
    }
  }

  /**
   * Actualizar highlight existente
   */
  updateHighlight(sessionId: string, highlightId: string, updates: Partial<ClinicalHighlight>): boolean {
    try {
      const therapist = this.getCurrentTherapist();
      if (!therapist) return false;

      const sessionIndex = therapist.sessions.findIndex(
        s => s.sessionData.sessionId === sessionId
      );

      if (sessionIndex === -1) return false;

      const highlightIndex = therapist.sessions[sessionIndex].sessionData.highlights.findIndex(
        h => h.id === highlightId
      );

      if (highlightIndex === -1) return false;

      therapist.sessions[sessionIndex].sessionData.highlights[highlightIndex] = {
        ...therapist.sessions[sessionIndex].sessionData.highlights[highlightIndex],
        ...updates
      };

      return this.saveTherapistData(therapist);
    } catch (error) {
      console.error('❌ Error al actualizar highlight:', error);
      return false;
    }
  }

  // ========= GESTIÓN DE PACIENTES =========

  /**
   * Obtener lista de todos los pacientes
   */
  getAllPatients(): Patient[] {
    try {
      const data = localStorage.getItem(this.getStorageKey(this.PATIENTS_KEY));
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('❌ Error al obtener lista de pacientes:', error);
      return [];
    }
  }

  /**
   * Guardar paciente nuevo
   */
  savePatient(patientData: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'> | Patient): Patient | null {
    try {
      let patient: Patient;
      
      if ('id' in patientData) {
        // Es un paciente completo
        patient = patientData as Patient;
      } else {
        // Es datos para crear nuevo paciente
        patient = {
          id: `patient-${Date.now()}`,
          ...patientData,
          allergies: patientData.allergies || [],
          medications: patientData.medications || [],
          clinicalHistory: patientData.clinicalHistory || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }

      const patients = this.getAllPatients();
      const existingIndex = patients.findIndex(p => p.id === patient.id);
      
      if (existingIndex >= 0) {
        patients[existingIndex] = { ...patient, updatedAt: new Date().toISOString() };
      } else {
        patients.push(patient);
      }

      localStorage.setItem(this.getStorageKey(this.PATIENTS_KEY), JSON.stringify(patients));
      return patient;
    } catch (error) {
      console.error('❌ Error al guardar paciente:', error);
      return null;
    }
  }

  /**
   * Obtener paciente por ID
   */
  getPatientById(patientId: string): Patient | null {
    try {
      const patients = this.getAllPatients();
      return patients.find(p => p.id === patientId) || null;
    } catch (error) {
      console.error('❌ Error al obtener paciente:', error);
      return null;
    }
  }

  /**
   * Actualizar paciente existente
   */
  updatePatient(patientId: string, updates: Partial<Patient>): boolean {
    try {
      const patients = this.getAllPatients();
      const patientIndex = patients.findIndex(p => p.id === patientId);
      
      if (patientIndex === -1) {
        console.error('❌ Paciente no encontrado:', patientId);
        return false;
      }

      patients[patientIndex] = {
        ...patients[patientIndex],
        ...updates,
        updatedAt: new Date().toISOString()
      };

      localStorage.setItem(
        this.getStorageKey(this.PATIENTS_KEY), 
        JSON.stringify(patients)
      );

      console.log('✅ Paciente actualizado exitosamente:', patientId);
      return true;
    } catch (error) {
      console.error('❌ Error al actualizar paciente:', error);
      return false;
    }
  }

  /**
   * Eliminar paciente
   */
  deletePatient(patientId: string): boolean {
    try {
      const patients = this.getAllPatients();
      const filteredPatients = patients.filter(p => p.id !== patientId);
      
      if (patients.length === filteredPatients.length) {
        console.error('❌ Paciente no encontrado para eliminar:', patientId);
        return false;
      }

      localStorage.setItem(
        this.getStorageKey(this.PATIENTS_KEY), 
        JSON.stringify(filteredPatients)
      );

      console.log('✅ Paciente eliminado exitosamente:', patientId);
      return true;
    } catch (error) {
      console.error('❌ Error al eliminar paciente:', error);
      return false;
    }
  }

  // ========= UTILIDADES =========

  /**
   * Obtener tamaño de almacenamiento utilizado
   */
  getStorageSize(): { used: number; total: number; percentage: number } {
    try {
      let totalSize = 0;
      
      for (const key in localStorage) {
        if (key.startsWith(this.STORAGE_PREFIX)) {
          totalSize += localStorage[key].length;
        }
      }

      // Estimación del límite de localStorage (5MB típicamente)
      const estimatedLimit = 5 * 1024 * 1024; // 5MB en bytes
      
      return {
        used: totalSize,
        total: estimatedLimit,
        percentage: (totalSize / estimatedLimit) * 100
      };
    } catch (error) {
      console.error('❌ Error al calcular tamaño de almacenamiento:', error);
      return { used: 0, total: 0, percentage: 0 };
    }
  }

  /**
   * Limpiar datos antiguos (mantener solo últimos N días)
   */
  cleanOldData(daysToKeep: number = 30): number {
    try {
      const therapist = this.getCurrentTherapist();
      if (!therapist) return 0;

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const initialCount = therapist.sessions.length;
      
      therapist.sessions = therapist.sessions.filter(session => 
        new Date(session.sessionData.sessionDate) >= cutoffDate
      );

      const removedCount = initialCount - therapist.sessions.length;
      
      if (removedCount > 0) {
        this.updateTherapistStats(therapist);
        this.saveTherapistData(therapist);
      }

      return removedCount;
    } catch (error) {
      console.error('❌ Error al limpiar datos antiguos:', error);
      return 0;
    }
  }

  /**
   * Exportar datos para backup
   */
  exportData(): string | null {
    try {
      const therapist = this.getCurrentTherapist();
      if (!therapist) return null;

      // Solo exportar datos no sensibles
      const exportData = {
        therapistId: therapist.therapistId,
        name: therapist.name,
        exportDate: new Date().toISOString(),
        sessionsCount: therapist.sessions.length,
        stats: therapist.stats,
        version: this.VERSION
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('❌ Error al exportar datos:', error);
      return null;
    }
  }

  // ========= MÉTODOS PRIVADOS =========

  private getStorageKey(key: string): string {
    return `${this.STORAGE_PREFIX}${key}`;
  }

  private calculateAverageConfidence(highlights: ClinicalHighlight[]): number {
    if (highlights.length === 0) return 0;
    
    const total = highlights.reduce((sum, h) => sum + h.confidence, 0);
    return total / highlights.length;
  }

  private updateTherapistStats(therapist: TherapistLocalData): void {
    const sessions = therapist.sessions;
    
    therapist.stats = {
      totalSessions: sessions.length,
      totalHighlights: sessions.reduce((sum, s) => sum + s.sessionData.highlights.length, 0),
      averageSessionDuration: sessions.length > 0 
        ? sessions.reduce((sum, s) => sum + (s.sessionData.duration || 0), 0) / sessions.length 
        : 0,
      lastSessionDate: sessions.length > 0 
        ? sessions[sessions.length - 1].sessionData.sessionDate 
        : undefined
    };
  }
}

// Singleton instance
export const localStorageService = new LocalStorageService();
export default localStorageService; 