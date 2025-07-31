/**
 * 🚨 ImmediateAlertSystem - Sistema de Alertas Inmediatas
 * 
 * Sistema crítico que genera alertas visuales, auditivas y táctiles
 * para prevenir daño al paciente durante técnicas manuales.
 * 
 * OBJETIVO: Alertar inmediatamente al profesional cuando se detecten
 * riesgos iatrogénicos o banderas rojas durante la consulta.
 */

import { MedicalAlert, AudioChunkAnalysis, IatrogenicRisk, RedFlag } from '../types/medicalSafety';

export interface AlertCallback {
  onAlert?: (alert: MedicalAlert) => void;
  onDismiss?: (alertId: string) => void;
  onAction?: (alertId: string, action: string) => void;
}

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
 * 🚨 Sistema de Alertas Inmediatas
 * 
 * Genera alertas críticas para prevenir daño al paciente
 * durante técnicas manuales y exploración física.
 */
export class ImmediateAlertSystem {
  private alertCallbacks: AlertCallback[] = [];
  private activeAlerts: Map<string, MedicalAlert> = new Map();
  private alertConfig: AlertConfig;
  private audioContext: AudioContext | null = null;
  private isVibrationSupported: boolean = false;

  constructor(config: AlertConfig) {
    this.alertConfig = config;
    this.initializeSystem();
  }

  /**
   * Inicializar sistema de alertas
   */
  private initializeSystem(): void {
    // Verificar soporte de vibración
    this.isVibrationSupported = 'vibrate' in navigator;
    
    // Inicializar AudioContext si está habilitado
    if (this.alertConfig.audio.enabled) {
      this.initializeAudioContext();
    }

    console.log('🚨 Sistema de alertas inmediatas inicializado');
  }

  /**
   * Inicializar contexto de audio
   */
  private initializeAudioContext(): void {
    try {
      this.audioContext = new AudioContext();
      console.log('✅ AudioContext inicializado para alertas');
    } catch (error) {
      console.warn('⚠️ No se pudo inicializar AudioContext:', error);
    }
  }

  /**
   * Trigger alerta basada en análisis de audio
   */
  triggerAlert(analysis: AudioChunkAnalysis): void {
    if (!analysis.shouldAlert) {
      return;
    }

    const alert: MedicalAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      urgencyLevel: analysis.urgencyLevel,
      type: this.determineAlertType(analysis),
      message: this.generateAlertMessage(analysis),
      recommendations: analysis.recommendations,
      risks: analysis.iatrogenicRisks,
      redFlags: analysis.redFlags,
      actionRequired: this.determineActionRequired(analysis.urgencyLevel)
    };

    // Agregar alerta activa
    this.activeAlerts.set(alert.id, alert);

    // Mostrar alertas según configuración
    this.showVisualAlert(alert);
    
    if (alert.urgencyLevel >= 4) {
      this.playUrgentSound();
      this.triggerVibration();
    } else if (alert.urgencyLevel >= 3) {
      this.playCautionSound();
    }

    // Log para compliance
    this.logSafetyAlert(alert);

    // Notificar callbacks
    this.notifyCallbacks(alert);

    console.log(`🚨 Alerta generada: ${alert.type} - Nivel ${alert.urgencyLevel}`);
  }

  /**
   * Determinar tipo de alerta
   */
  private determineAlertType(analysis: AudioChunkAnalysis): MedicalAlert['type'] {
    if (analysis.iatrogenicRisks.some(r => r.severity === 'critical')) {
      return 'iatrogenic_risk';
    }
    
    if (analysis.redFlags.some(r => r.urgency === 'immediate')) {
      return 'red_flag';
    }
    
    if (analysis.iatrogenicRisks.length > 0) {
      return 'technique_warning';
    }
    
    return 'safety_reminder';
  }

  /**
   * Generar mensaje de alerta
   */
  private generateAlertMessage(analysis: AudioChunkAnalysis): string {
    if (analysis.urgencyLevel >= 5) {
      return `⛔ DETENER TÉCNICA INMEDIATAMENTE: ${analysis.iatrogenicRisks[0]?.description || 'Riesgo crítico detectado'}`;
    }
    
    if (analysis.urgencyLevel >= 4) {
      return `🚨 ALERTA CRÍTICA: ${analysis.iatrogenicRisks[0]?.description || analysis.redFlags[0]?.indicator || 'Riesgo alto detectado'}`;
    }
    
    if (analysis.urgencyLevel >= 3) {
      return `⚠️ PRECAUCIÓN: ${analysis.iatrogenicRisks[0]?.description || analysis.redFlags[0]?.indicator || 'Revisar técnica actual'}`;
    }
    
    return `ℹ️ Información: ${analysis.recommendations[0] || 'Revisar técnica actual'}`;
  }

  /**
   * Determinar acción requerida
   */
  private determineActionRequired(urgencyLevel: number): MedicalAlert['actionRequired'] {
    switch (urgencyLevel) {
      case 5:
        return 'STOP_IMMEDIATELY';
      case 4:
        return 'STOP_IMMEDIATELY';
      case 3:
        return 'CAUTION';
      default:
        return 'MONITOR';
    }
  }

  /**
   * Mostrar alerta visual
   */
  private showVisualAlert(alert: MedicalAlert): void {
    if (!this.alertConfig.visual.enabled) {
      return;
    }

    // Crear elemento de alerta visual
    const alertElement = document.createElement('div');
    alertElement.id = `alert-${alert.id}`;
    alertElement.className = this.getAlertCSSClass(alert);
    alertElement.innerHTML = this.generateAlertHTML(alert);

    // Posicionar alerta
    this.positionAlert(alertElement);

    // Agregar al DOM
    document.body.appendChild(alertElement);

    // Auto-remover después del tiempo configurado
    setTimeout(() => {
      if (alertElement.parentNode) {
        alertElement.parentNode.removeChild(alertElement);
      }
    }, this.alertConfig.visual.duration);

    console.log(`👁️ Alerta visual mostrada: ${alert.type}`);
  }

  /**
   * Obtener clase CSS para alerta
   */
  private getAlertCSSClass(alert: MedicalAlert): string {
    const baseClass = 'medical-alert';
    const urgencyClass = `urgency-${alert.urgencyLevel}`;
    const typeClass = `type-${alert.type}`;
    const positionClass = `position-${this.alertConfig.visual.position}`;
    const styleClass = `style-${this.alertConfig.visual.style}`;

    return `${baseClass} ${urgencyClass} ${typeClass} ${positionClass} ${styleClass}`;
  }

  /**
   * Generar HTML de alerta
   */
  private generateAlertHTML(alert: MedicalAlert): string {
    const urgencyIcon = this.getUrgencyIcon(alert.urgencyLevel);
    const urgencyText = this.getUrgencyText(alert.urgencyLevel);

    return `
      <div class="alert-content">
        <div class="alert-header">
          <span class="alert-icon">${urgencyIcon}</span>
          <span class="alert-urgency">${urgencyText}</span>
          <button class="alert-dismiss" onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
        </div>
        <div class="alert-message">
          <p class="alert-text">${alert.message}</p>
          ${alert.recommendations.length > 0 ? `
            <div class="alert-recommendations">
              <strong>Recomendaciones:</strong>
              <ul>
                ${alert.recommendations.map(rec => `<li>${rec}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
        </div>
        <div class="alert-actions">
          <button class="btn-primary" onclick="handleAlertAction('${alert.id}', 'acknowledge')">
            Entendido
          </button>
          ${alert.actionRequired === 'STOP_IMMEDIATELY' ? `
            <button class="btn-danger" onclick="handleAlertAction('${alert.id}', 'stop_technique')">
              Detener Técnica
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Posicionar alerta en pantalla
   */
  private positionAlert(alertElement: HTMLElement): void {
    const position = this.alertConfig.visual.position;
    
    switch (position) {
      case 'top':
        alertElement.style.top = '20px';
        alertElement.style.left = '50%';
        alertElement.style.transform = 'translateX(-50%)';
        break;
      case 'bottom':
        alertElement.style.bottom = '20px';
        alertElement.style.left = '50%';
        alertElement.style.transform = 'translateX(-50%)';
        break;
      case 'center':
        alertElement.style.top = '50%';
        alertElement.style.left = '50%';
        alertElement.style.transform = 'translate(-50%, -50%)';
        break;
    }
  }

  /**
   * Obtener icono de urgencia
   */
  private getUrgencyIcon(urgencyLevel: number): string {
    switch (urgencyLevel) {
      case 5:
        return '⛔';
      case 4:
        return '🚨';
      case 3:
        return '⚠️';
      default:
        return 'ℹ️';
    }
  }

  /**
   * Obtener texto de urgencia
   */
  private getUrgencyText(urgencyLevel: number): string {
    switch (urgencyLevel) {
      case 5:
        return 'DETENER INMEDIATAMENTE';
      case 4:
        return 'ALERTA CRÍTICA';
      case 3:
        return 'PRECAUCIÓN';
      default:
        return 'INFORMACIÓN';
    }
  }

  /**
   * Reproducir sonido urgente
   */
  private playUrgentSound(): void {
    if (!this.alertConfig.audio.enabled || !this.audioContext) {
      return;
    }

    try {
      // Crear oscilador para sonido de alerta
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Configurar sonido de alerta
      oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime + 0.2);

      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(this.alertConfig.audio.volume, this.audioContext.currentTime + 0.01);
      gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.3);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.3);

      console.log('🔊 Sonido urgente reproducido');
    } catch (error) {
      console.warn('⚠️ Error reproduciendo sonido urgente:', error);
    }
  }

  /**
   * Reproducir sonido de precaución
   */
  private playCautionSound(): void {
    if (!this.alertConfig.audio.enabled || !this.audioContext) {
      return;
    }

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Sonido de precaución más suave
      oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime);
      oscillator.frequency.setValueAtTime(500, this.audioContext.currentTime + 0.1);

      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(this.alertConfig.audio.volume * 0.5, this.audioContext.currentTime + 0.01);
      gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.2);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.2);

      console.log('🔊 Sonido de precaución reproducido');
    } catch (error) {
      console.warn('⚠️ Error reproduciendo sonido de precaución:', error);
    }
  }

  /**
   * Trigger vibración
   */
  private triggerVibration(): void {
    if (!this.alertConfig.vibration.enabled || !this.isVibrationSupported) {
      return;
    }

    try {
      // Patrón de vibración para alerta crítica
      const pattern = this.alertConfig.vibration.pattern.length > 0 
        ? this.alertConfig.vibration.pattern 
        : [200, 100, 200, 100, 200]; // Patrón por defecto

      navigator.vibrate(pattern);
      console.log('📳 Vibración activada');
    } catch (error) {
      console.warn('⚠️ Error activando vibración:', error);
    }
  }

  /**
   * Log de alerta para compliance
   */
  private logSafetyAlert(alert: MedicalAlert): void {
    const logEntry = {
      timestamp: alert.timestamp,
      alertId: alert.id,
      urgencyLevel: alert.urgencyLevel,
      type: alert.type,
      message: alert.message,
      risks: alert.risks.length,
      redFlags: alert.redFlags.length,
      actionRequired: alert.actionRequired
    };

    console.log('📋 Log de seguridad:', logEntry);

    // En producción, enviar a sistema de logging
    // this.sendToLoggingSystem(logEntry);
  }

  /**
   * Notificar callbacks
   */
  private notifyCallbacks(alert: MedicalAlert): void {
    this.alertCallbacks.forEach(callback => {
      callback.onAlert?.(alert);
    });
  }

  /**
   * Agregar callback
   */
  addCallback(callback: AlertCallback): void {
    this.alertCallbacks.push(callback);
  }

  /**
   * Remover callback
   */
  removeCallback(callback: AlertCallback): void {
    const index = this.alertCallbacks.indexOf(callback);
    if (index > -1) {
      this.alertCallbacks.splice(index, 1);
    }
  }

  /**
   * Dismiss alerta
   */
  dismissAlert(alertId: string): void {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      this.activeAlerts.delete(alertId);
      
      // Remover elemento visual si existe
      const alertElement = document.getElementById(`alert-${alertId}`);
      if (alertElement) {
        alertElement.remove();
      }

      // Notificar callbacks
      this.alertCallbacks.forEach(callback => {
        callback.onDismiss?.(alertId);
      });

      console.log(`✅ Alerta descartada: ${alertId}`);
    }
  }

  /**
   * Obtener alertas activas
   */
  getActiveAlerts(): MedicalAlert[] {
    return Array.from(this.activeAlerts.values());
  }

  /**
   * Limpiar todas las alertas
   */
  clearAllAlerts(): void {
    this.activeAlerts.clear();
    
    // Remover todos los elementos visuales
    document.querySelectorAll('.medical-alert').forEach(element => {
      element.remove();
    });

    console.log('🧹 Todas las alertas limpiadas');
  }

  /**
   * Obtener estadísticas de alertas
   */
  getAlertStatistics(): {
    totalAlerts: number;
    criticalAlerts: number;
    activeAlerts: number;
    dismissedAlerts: number;
  } {
    const activeAlerts = this.getActiveAlerts();
    const criticalAlerts = activeAlerts.filter(a => a.urgencyLevel >= 4).length;

    return {
      totalAlerts: activeAlerts.length,
      criticalAlerts,
      activeAlerts: activeAlerts.length,
      dismissedAlerts: 0 // En producción, trackear desde base de datos
    };
  }
} 