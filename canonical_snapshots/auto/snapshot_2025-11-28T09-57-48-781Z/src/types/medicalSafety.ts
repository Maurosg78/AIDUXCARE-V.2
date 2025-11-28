/**
 * 🚨 Tipos de Seguridad Médica - AiDuxCare
 * 
 * Interfaces TypeScript para el sistema de análisis en tiempo real
 * que previene daño al paciente durante consultas médicas.
 */

/**
 * Análisis de chunk de audio en tiempo real
 */
export interface AudioChunkAnalysis {
  chunkId: string;
  timestamp: number;
  duration: number; // 10-15 segundos por chunk
  transcription: string;
  riskLevel: 'safe' | 'caution' | 'warning' | 'danger';
  iatrogenicRisks: IatrogenicRisk[];
  redFlags: RedFlag[];
  recommendations: string[];
  shouldAlert: boolean;
  urgencyLevel: 1 | 2 | 3 | 4 | 5; // 5 = stop immediately
}

/**
 * Riesgo iatrogénico detectado durante técnica manual
 */
export interface IatrogenicRisk {
  type: 'contraindication' | 'technique_error' | 'force_excessive' | 'anatomic_risk';
  description: string;
  severity: 'mild' | 'moderate' | 'severe' | 'critical';
  bodyRegion: string;
  recommendedAction: string;
  evidence: string; // Frase específica que triggereó la alerta
}

/**
 * Bandera roja que requiere atención inmediata
 */
export interface RedFlag {
  category: 'neurological' | 'vascular' | 'infection' | 'fracture' | 'systemic';
  indicator: string;
  urgency: 'immediate' | 'urgent' | 'monitor';
  recommendedAction: string;
  referralNeeded: boolean;
}

/**
 * Alerta médica generada por el sistema
 */
export interface MedicalAlert {
  id: string;
  timestamp: Date;
  urgencyLevel: 1 | 2 | 3 | 4 | 5;
  type: 'iatrogenic_risk' | 'red_flag' | 'technique_warning' | 'safety_reminder';
  message: string;
  recommendations: string[];
  risks: IatrogenicRisk[];
  redFlags: RedFlag[];
  actionRequired: 'STOP_IMMEDIATELY' | 'CAUTION' | 'MONITOR' | 'INFORM';
}

/**
 * Configuración del sistema de seguridad
 */
export interface SafetyConfig {
  enabled: boolean;
  chunkSize: number; // milisegundos
  overlapSize: number; // milisegundos
  alertThreshold: number; // nivel mínimo para alertar
  autoStopThreshold: number; // nivel para detener automáticamente
  enableAudioAlerts: boolean;
  enableVisualAlerts: boolean;
  enableVibration: boolean;
  logAllAnalyses: boolean;
}

/**
 * Callback para análisis completado
 */
export type AnalysisCallback = (analysis: AudioChunkAnalysis) => void;

/**
 * Callback para alertas generadas
 */
export type AlertCallback = (alert: MedicalAlert) => void;

/**
 * Callback para errores del sistema
 */
export type ErrorCallback = (error: string) => void;

/**
 * Estado del sistema de seguridad
 */
export interface SafetySystemState {
  isActive: boolean;
  isProcessing: boolean;
  currentRiskLevel: 'safe' | 'caution' | 'warning' | 'danger';
  activeAlerts: MedicalAlert[];
  analysisCount: number;
  lastAnalysis?: AudioChunkAnalysis;
  errors: string[];
}

/**
 * Log de seguridad para compliance
 */
export interface SafetyLog {
  id: string;
  timestamp: Date;
  sessionId: string;
  userId: string;
  analysis: AudioChunkAnalysis;
  alert?: MedicalAlert;
  actionTaken: string;
  outcome: 'prevented_incident' | 'false_positive' | 'missed_incident' | 'system_error';
}

/**
 * Estadísticas del sistema de seguridad
 */
export interface SafetyStatistics {
  totalAnalyses: number;
  alertsGenerated: number;
  criticalAlerts: number;
  incidentsPrevented: number;
  falsePositives: number;
  averageResponseTime: number; // milisegundos
  accuracy: number; // porcentaje
}

/**
 * Configuración de patrones de detección
 */
export interface DetectionPatterns {
  iatrogenicRisks: {
    [key: string]: RegExp[];
  };
  redFlags: {
    [key: string]: RegExp[];
  };
  safeTechniques: {
    [key: string]: RegExp[];
  };
}

/**
 * Resultado de validación de técnica
 */
export interface TechniqueValidation {
  isSafe: boolean;
  risks: IatrogenicRisk[];
  recommendations: string[];
  confidence: number; // 0-1
  alternativeTechniques: string[];
}

/**
 * Configuración de alertas
 */
export interface AlertConfig {
  visual: {
    enabled: boolean;
    position: 'top' | 'bottom' | 'center';
    duration: number; // milisegundos
    style: 'minimal' | 'prominent' | 'critical';
  };
  audio: {
    enabled: boolean;
    volume: number; // 0-1
    soundType: 'beep' | 'alert' | 'voice';
  };
  vibration: {
    enabled: boolean;
    pattern: number[]; // milisegundos
    intensity: number; // 0-1
  };
}

/**
 * Contexto de la sesión médica
 */
export interface MedicalSessionContext {
  sessionId: string;
  patientId: string;
  practitionerId: string;
  sessionType: 'initial_assessment' | 'treatment' | 'follow_up' | 'emergency';
  bodyRegion: string;
  technique: string;
  startTime: Date;
  endTime?: Date;
  safetyLevel: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Configuración de compliance
 */
export interface ComplianceConfig {
  logAllInteractions: boolean;
  encryptLogs: boolean;
  retentionPeriod: number; // días
  auditTrail: boolean;
  hipaaCompliant: boolean;
  gdprCompliant: boolean;
}

/**
 * Evento del sistema de seguridad
 */
export interface SafetyEvent {
  type: 'analysis_started' | 'analysis_completed' | 'alert_generated' | 'alert_dismissed' | 'system_error';
  timestamp: Date;
  data: AudioChunkAnalysis | MedicalAlert | string;
  sessionId?: string;
  userId?: string;
}

/**
 * Configuración de integración con EMR
 */
export interface EMRIntegration {
  enabled: boolean;
  system: 'epic' | 'cerner' | 'athena' | 'custom';
  apiEndpoint?: string;
  apiKey?: string;
  autoLogAlerts: boolean;
  autoLogAnalyses: boolean;
  syncPatientData: boolean;
}

/**
 * Configuración de machine learning
 */
export interface MLConfig {
  enabled: boolean;
  modelVersion: string;
  confidenceThreshold: number; // 0-1
  retrainFrequency: number; // días
  useCustomModel: boolean;
  customModelPath?: string;
}

/**
 * Configuración completa del sistema de seguridad
 */
export interface CompleteSafetyConfig {
  basic: SafetyConfig;
  alerts: AlertConfig;
  compliance: ComplianceConfig;
  emr: EMRIntegration;
  ml: MLConfig;
  patterns: DetectionPatterns;
} 