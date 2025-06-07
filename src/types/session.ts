/**
 * 🔧 Session Types - AiDuxCare V.2
 * Modelo de datos optimizado sin almacenamiento de audio
 * Solo highlights + SOAP para máxima eficiencia y privacidad
 */

export interface ClinicalHighlight {
  id: string;
  text: string;
  category: 'síntoma' | 'hallazgo' | 'plan' | 'advertencia';
  confidence: number;
  timestamp: string;
  isSelected: boolean;
  source?: 'transcription' | 'manual' | 'ai_suggestion';
}

export interface SessionData {
  // Identificadores
  sessionId: string;
  patientId: string;
  therapistId: string;
  
  // Metadatos de sesión
  sessionDate: string;
  startTime: string;
  endTime?: string;
  duration?: number; // en minutos
  
  // Datos clínicos (SIN audio)
  highlights: ClinicalHighlight[];
  soapNotes: string;
  
  // Metadatos de calidad
  transcriptionQuality?: number; // 0-1
  highlightsCount: number;
  selectedHighlightsCount: number;
  
  // Estado de la sesión
  status: 'active' | 'completed' | 'saved';
  
  // Auditoría (sin datos sensibles)
  createdAt: string;
  updatedAt: string;
  version: string;
}

export interface SessionMetadata {
  // Información técnica
  appVersion: string;
  deviceInfo?: string;
  
  // Calidad del procesamiento
  averageConfidence: number;
  processingTime: number; // en segundos
  
  // Estadísticas de la sesión
  wordsTranscribed?: number;
  highlightsGenerated: number;
  manualCorrections: number;
  
  // Configuración utilizada
  aiModel?: string;
  transcriptionEngine?: string;
}

export interface LocalStorageSession {
  sessionData: SessionData;
  metadata: SessionMetadata;
  
  // Para sincronización
  lastSyncAt?: string;
  needsSync: boolean;
  syncStatus: 'pending' | 'synced' | 'error';
}

// Tipos para el almacenamiento local por terapeuta
export interface TherapistLocalData {
  therapistId: string;
  name: string;
  email?: string;
  
  // Sesiones locales
  sessions: LocalStorageSession[];
  
  // Configuraciones
  preferences: {
    autoSave: boolean;
    highlightThreshold: number; // 0-1
    defaultCategories: string[];
    soapTemplate?: string;
  };
  
  // Estadísticas locales
  stats: {
    totalSessions: number;
    totalHighlights: number;
    averageSessionDuration: number;
    lastSessionDate?: string;
  };
  
  // Metadatos
  createdAt: string;
  lastActiveAt: string;
  dataVersion: string;
}

// Utilidades para el manejo de datos
export interface SessionSummary {
  sessionId: string;
  patientName: string;
  date: string;
  duration: number;
  highlightsCount: number;
  status: SessionData['status'];
  hasSOAP: boolean;
}

// Para la exportación de datos
export interface ExportableSession {
  // Solo datos no sensibles para exportación
  sessionId: string;
  date: string;
  duration: number;
  highlightsCount: number;
  soapGenerated: boolean;
  qualityMetrics: {
    averageConfidence: number;
    processingTime: number;
  };
}

// Tipos para la sincronización en la nube (futura implementación)
export interface CloudSyncPayload {
  therapistId: string;
  sessions: Pick<SessionData, 'sessionId' | 'patientId' | 'sessionDate' | 'highlights' | 'soapNotes'>[];
  lastSyncTimestamp: string;
  deviceFingerprint: string;
}

export interface SyncConflict {
  sessionId: string;
  conflictType: 'version' | 'data' | 'timestamp';
  localData: SessionData;
  cloudData: SessionData;
  resolution?: 'local' | 'cloud' | 'merge';
} 