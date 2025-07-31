/**
 * 🚨 EnhancedAudioCaptureManager - Gestor de Audio Mejorado con Seguridad
 * 
 * Extensión del AudioCaptureManager que integra análisis en tiempo real
 * para detectar riesgos iatrogénicos y banderas rojas durante consultas médicas.
 * 
 * OBJETIVO: Proporcionar captura de audio robusta con análisis de seguridad
 * en tiempo real para prevenir daño al paciente.
 */

import { AudioCaptureManager, AudioCaptureConfig, AudioCaptureCallbacks } from './AudioCaptureManager';
import { RealTimeAnalysisEngine, AudioData, AudioChunk } from './RealTimeAnalysisEngine';
import { ImmediateAlertSystem, AlertConfig } from './ImmediateAlertSystem';
import { AudioChunkAnalysis, MedicalAlert, SafetySystemState } from '../types/medicalSafety';
import { SafetyClinicalAnalysis, SafetyAlert, SafetyWarning, SafetyHighlight } from '../types/clinical';

export interface EnhancedAudioCaptureCallbacks extends AudioCaptureCallbacks {
  onRiskAnalysis?: (analysis: SafetyClinicalAnalysis) => void;
  onSafetyAlert?: (alert: SafetyAlert) => void;
  onSafetyStateChange?: (state: SafetySystemState) => void;
  onError?: (error: string) => void;
}

export interface EnhancedAudioCaptureConfig extends AudioCaptureConfig {
  safety: {
    enabled: boolean;
    chunkSizeMs: number; // Tamaño del chunk en milisegundos
    overlapMs: number; // Solapamiento entre chunks
    alertThreshold: number; // Nivel mínimo para alertar (1-5)
    autoStopThreshold: number; // Nivel para detener automáticamente (1-5)
    enableAudioAlerts: boolean;
    enableVisualAlerts: boolean;
    enableVibration: boolean;
    logAllAnalyses: boolean;
  };
}

/**
 * 🚨 Gestor de Audio Mejorado con Sistema de Seguridad
 * 
 * Integra captura de audio con análisis en tiempo real para prevenir
 * daño al paciente durante técnicas manuales.
 */
export class EnhancedAudioCaptureManager extends AudioCaptureManager {
  private realTimeAnalyzer: RealTimeAnalysisEngine;
  private alertSystem: ImmediateAlertSystem;
  private chunkBuffer: AudioData[] = [];
  private analysisQueue: AudioChunk[] = [];
  private isProcessing: boolean = false;
  private safetyState: SafetySystemState;
  private safetyCallbacks: EnhancedAudioCaptureCallbacks;

  constructor(config: EnhancedAudioCaptureConfig, callbacks: EnhancedAudioCaptureCallbacks) {
    super(config, callbacks);
    
    this.safetyCallbacks = callbacks;
    this.realTimeAnalyzer = new RealTimeAnalysisEngine();
    this.alertSystem = new ImmediateAlertSystem(this.createAlertConfig(config.safety));
    
    // Inicializar estado del sistema de seguridad
    this.safetyState = {
      isActive: false,
      isProcessing: false,
      currentRiskLevel: 'safe',
      activeAlerts: [],
      analysisCount: 0,
      errors: []
    };

    // Setup callbacks del sistema de alertas
    this.setupAlertCallbacks();
    
    // Setup procesamiento de chunks
    this.setupChunkProcessing();
    
    console.log('🚨 EnhancedAudioCaptureManager inicializado con sistema de seguridad');
  }

  /**
   * Crear configuración de alertas
   */
  private createAlertConfig(safetyConfig: EnhancedAudioCaptureConfig['safety']): AlertConfig {
    return {
      visual: {
        enabled: safetyConfig.enableVisualAlerts,
        position: 'top',
        duration: 10000, // 10 segundos
        style: 'prominent'
      },
      audio: {
        enabled: safetyConfig.enableAudioAlerts,
        volume: 0.7,
        soundType: 'alert'
      },
      vibration: {
        enabled: safetyConfig.enableVibration,
        pattern: [200, 100, 200, 100, 200],
        intensity: 0.8
      }
    };
  }

  /**
   * Setup callbacks del sistema de alertas
   */
  private setupAlertCallbacks(): void {
    this.alertSystem.addCallback({
      onAlert: (alert: MedicalAlert) => {
        // Convertir MedicalAlert a SafetyAlert
        const safetyAlert: SafetyAlert = {
          id: alert.id,
          timestamp: alert.timestamp,
          urgencyLevel: alert.urgencyLevel,
          type: alert.type,
          message: alert.message,
          recommendations: alert.recommendations,
          warnings: [], // Convertir desde IatrogenicRisk
          highlights: [], // Convertir desde RedFlag
          actionRequired: alert.actionRequired,
          evidence: alert.evidence,
          bodyRegion: alert.bodyRegion,
          isDismissed: false
        };

        // Agregar a alertas activas
        this.safetyState.activeAlerts.push(safetyAlert);
        
        // Notificar callback
        this.safetyCallbacks.onSafetyAlert?.(safetyAlert);
        
        // Actualizar estado
        this.updateSafetyState();
      },
      onDismiss: (alertId: string) => {
        const alertIndex = this.safetyState.activeAlerts.findIndex(a => a.id === alertId);
        if (alertIndex > -1) {
          this.safetyState.activeAlerts[alertIndex].isDismissed = true;
          this.updateSafetyState();
        }
      },
      onAction: (alertId: string, action: string) => {
        console.log(`🔧 Acción de alerta: ${action} para alerta ${alertId}`);
        // Implementar acciones específicas según el tipo
      }
    });
  }

  /**
   * Setup procesamiento de chunks
   */
  private setupChunkProcessing(): void {
    if (!this.safetyState.isActive) {
      return;
    }

    // Procesar chunks cada 15 segundos
    setInterval(async () => {
      if (this.chunkBuffer.length > 0 && !this.isProcessing) {
        await this.processChunkQueue();
      }
    }, 15000);
  }

  /**
   * Procesar cola de chunks
   */
  private async processChunkQueue(): Promise<void> {
    if (this.isProcessing || this.chunkBuffer.length === 0) {
      return;
    }

    this.isProcessing = true;
    this.safetyState.isProcessing = true;
    this.updateSafetyState();

    try {
      while (this.chunkBuffer.length > 0) {
        const audioData = this.chunkBuffer.shift();
        if (audioData) {
          // Procesar análisis en tiempo real
          const analysis = await this.realTimeAnalyzer.processAudioChunk(audioData);
          
          // Convertir a SafetyClinicalAnalysis
          const safetyAnalysis = this.convertToSafetyAnalysis(analysis);
          
          // Trigger alerta si es necesario
          if (analysis.shouldAlert) {
            this.alertSystem.triggerAlert(analysis);
          }
          
          // Actualizar estado
          this.safetyState.lastAnalysis = safetyAnalysis;
          this.safetyState.analysisCount++;
          this.safetyState.currentRiskLevel = safetyAnalysis.riskLevel;
          
          // Notificar callbacks
          this.safetyCallbacks.onRiskAnalysis?.(safetyAnalysis);
          
          console.log(`📊 Análisis completado - Riesgo: ${safetyAnalysis.riskLevel}, Urgencia: ${safetyAnalysis.urgencyLevel}`);
        }
      }
    } catch (error) {
      const errorMessage = `Error procesando chunks: ${error}`;
      console.error('❌', errorMessage);
      this.safetyState.errors.push(errorMessage);
      this.safetyCallbacks.onError?.(errorMessage);
    } finally {
      this.isProcessing = false;
      this.safetyState.isProcessing = false;
      this.updateSafetyState();
    }
  }

  /**
   * Convertir AudioChunkAnalysis a SafetyClinicalAnalysis
   */
  private convertToSafetyAnalysis(analysis: AudioChunkAnalysis): SafetyClinicalAnalysis {
    // Convertir IatrogenicRisk a SafetyWarning
    const safetyWarnings: SafetyWarning[] = analysis.iatrogenicRisks.map(risk => ({
      severity: this.mapSeverity(risk.severity),
      title: `Riesgo ${risk.type}`,
      description: risk.description,
      recommendation: risk.recommendedAction,
      urgencyLevel: analysis.urgencyLevel,
      bodyRegion: risk.bodyRegion,
      evidence: risk.evidence,
      iatrogenicType: risk.type,
      actionRequired: this.mapActionRequired(analysis.urgencyLevel),
      timestamp: analysis.timestamp
    }));

    // Convertir RedFlag a SafetyHighlight
    const safetyHighlights: SafetyHighlight[] = analysis.redFlags.map(flag => ({
      priority: this.mapUrgency(flag.urgency),
      title: `Bandera Roja: ${flag.category}`,
      description: flag.indicator,
      category: flag.category,
      urgency: flag.urgency,
      referralNeeded: flag.referralNeeded,
      evidence: flag.evidence,
      timestamp: analysis.timestamp
    }));

    return {
      success: true,
      metadata: {
        processingTimeMs: analysis.duration,
        modelVersion: 'safety-v1.0',
        confidence: 0.85 // Valor estimado
      },
      warnings: safetyWarnings,
      highlights: safetyHighlights,
      safetyWarnings,
      safetyHighlights,
      riskLevel: analysis.riskLevel,
      shouldAlert: analysis.shouldAlert,
      urgencyLevel: analysis.urgencyLevel,
      audioChunkId: analysis.chunkId,
      transcription: analysis.transcription,
      chunkDuration: analysis.duration,
      recommendations: analysis.recommendations
    };
  }

  /**
   * Mapear severidad
   */
  private mapSeverity(severity: string): 'HIGH' | 'MEDIUM' | 'LOW' {
    switch (severity) {
      case 'critical':
      case 'severe':
        return 'HIGH';
      case 'moderate':
        return 'MEDIUM';
      default:
        return 'LOW';
    }
  }

  /**
   * Mapear urgencia
   */
  private mapUrgency(urgency: string): 'HIGH' | 'MEDIUM' | 'LOW' {
    switch (urgency) {
      case 'immediate':
        return 'HIGH';
      case 'urgent':
        return 'MEDIUM';
      default:
        return 'LOW';
    }
  }

  /**
   * Mapear acción requerida
   */
  private mapActionRequired(urgencyLevel: number): 'STOP_IMMEDIATELY' | 'CAUTION' | 'MONITOR' | 'INFORM' {
    switch (urgencyLevel) {
      case 5:
      case 4:
        return 'STOP_IMMEDIATELY';
      case 3:
        return 'CAUTION';
      case 2:
        return 'MONITOR';
      default:
        return 'INFORM';
    }
  }

  /**
   * Actualizar estado del sistema de seguridad
   */
  private updateSafetyState(): void {
    this.safetyCallbacks.onSafetyStateChange?.(this.safetyState);
  }

  /**
   * Iniciar captura con análisis de seguridad
   */
  async startCapture(): Promise<void> {
    try {
      // Iniciar captura base
      await super.startCapture();
      
      // Activar sistema de seguridad
      this.safetyState.isActive = true;
      this.updateSafetyState();
      
      console.log('🚨 Sistema de seguridad activado');
      
    } catch (error) {
      console.error('❌ Error iniciando captura mejorada:', error);
      throw error;
    }
  }

  /**
   * Detener captura
   */
  async stopCapture(): Promise<void> {
    try {
      // Detener captura base
      await super.stopCapture();
      
      // Desactivar sistema de seguridad
      this.safetyState.isActive = false;
      this.safetyState.isProcessing = false;
      this.updateSafetyState();
      
      // Limpiar alertas
      this.alertSystem.clearAllAlerts();
      
      console.log('🛑 Sistema de seguridad desactivado');
      
    } catch (error) {
      console.error('❌ Error deteniendo captura mejorada:', error);
      throw error;
    }
  }

  /**
   * Agregar chunk de audio para análisis
   */
  addAudioChunk(audioData: AudioData): void {
    this.chunkBuffer.push(audioData);
    
    // Si el buffer está lleno, procesar inmediatamente
    if (this.chunkBuffer.length >= 3) { // 3 chunks = ~45 segundos
      this.processChunkQueue();
    }
  }

  /**
   * Obtener estado del sistema de seguridad
   */
  getSafetyState(): SafetySystemState {
    return { ...this.safetyState };
  }

  /**
   * Obtener alertas activas
   */
  getActiveAlerts(): SafetyAlert[] {
    return this.safetyState.activeAlerts.filter(alert => !alert.isDismissed);
  }

  /**
   * Dismiss alerta
   */
  dismissAlert(alertId: string): void {
    this.alertSystem.dismissAlert(alertId);
  }

  /**
   * Acknowledge alerta
   */
  acknowledgeAlert(alertId: string): void {
    const alertIndex = this.safetyState.activeAlerts.findIndex(a => a.id === alertId);
    if (alertIndex > -1) {
      this.safetyState.activeAlerts[alertIndex].isDismissed = true;
      this.updateSafetyState();
    }
  }

  /**
   * Detener técnica (acción crítica)
   */
  stopTechnique(alertId: string): void {
    console.log(`⛔ TÉCNICA DETENIDA por alerta: ${alertId}`);
    
    // Detener captura
    this.stopCapture();
    
    // Marcar alerta como procesada
    this.acknowledgeAlert(alertId);
    
    // Notificar acción crítica
    this.safetyCallbacks.onError?.('Técnica detenida por seguridad');
  }

  /**
   * Obtener estadísticas de seguridad
   */
  getSafetyStatistics(): {
    totalAnalyses: number;
    alertsGenerated: number;
    criticalAlerts: number;
    activeAlerts: number;
    systemUptimeMs: number;
  } {
    const activeAlerts = this.getActiveAlerts();
    const criticalAlerts = activeAlerts.filter(a => a.urgencyLevel >= 4).length;

    return {
      totalAnalyses: this.safetyState.analysisCount,
      alertsGenerated: this.safetyState.activeAlerts.length,
      criticalAlerts,
      activeAlerts: activeAlerts.length,
      systemUptimeMs: this.safetyState.isActive ? Date.now() : 0
    };
  }

  /**
   * Limpiar recursos
   */
  cleanup(): void {
    super.cleanup();
    
    // Limpiar sistema de seguridad
    this.safetyState.isActive = false;
    this.safetyState.isProcessing = false;
    this.chunkBuffer = [];
    this.analysisQueue = [];
    
    // Limpiar alertas
    this.alertSystem.clearAllAlerts();
    
    console.log('🧹 Recursos de seguridad limpiados');
  }
} 