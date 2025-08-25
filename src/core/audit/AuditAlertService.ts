import { FirestoreAuditLogger, AuditEvent } from './FirestoreAuditLogger';

import logger from '@/shared/utils/logger';

/**
 * Tipos de alertas disponibles
 */
export enum AlertType {
  LOGIN_FAILURE_SPREE = 'login_failure_spree',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  MASSIVE_DATA_EXPORT = 'massive_data_export',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  DATA_ACCESS_ANOMALY = 'data_access_anomaly',
  AUDIT_LOG_FAILURE = 'audit_log_failure'
}

/**
 * Niveles de severidad de alertas
 */
export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Interfaz para alertas de auditoría
 */
export interface AuditAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  userId?: string;
  patientId?: string;
  visitId?: string;
  metadata: Record<string, unknown>;
  timestamp: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
}

/**
 * Configuración de umbrales para alertas
 */
export interface AlertThresholds {
  loginFailuresPerHour: number;
  dataExportsPerDay: number;
  dataAccessPerHour: number;
  unauthorizedAccessPerDay: number;
}

/**
 * Servicio de alertas automáticas para auditoría
 * Detecta y genera alertas para eventos críticos de seguridad
 */
export class AuditAlertService {
  private static readonly DEFAULT_THRESHOLDS: AlertThresholds = {
    loginFailuresPerHour: 5,
    dataExportsPerDay: 10,
    dataAccessPerHour: 50,
    unauthorizedAccessPerDay: 3
  };

  private static alerts: AuditAlert[] = [];
  private static thresholds: AlertThresholds = AuditAlertService.DEFAULT_THRESHOLDS;

  /**
   * Configura umbrales personalizados para alertas
   */
  static setThresholds(newThresholds: Partial<AlertThresholds>): void {
    this.thresholds = { ...this.DEFAULT_THRESHOLDS, ...newThresholds };
  }

  /**
   * Analiza eventos recientes y genera alertas automáticas
   */
  static async analyzeAndGenerateAlerts(): Promise<AuditAlert[]> {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const lastHour = new Date(Date.now() - 60 * 60 * 1000);

    // Obtener eventos recientes
    const recentEvents = await FirestoreAuditLogger.getEvents({
      limit: 1000
    });

    const events24h = recentEvents.filter(e => e.timestamp >= last24Hours);
    const events1h = recentEvents.filter(e => e.timestamp >= lastHour);

    const newAlerts: AuditAlert[] = [];

    // 1. Alertas por intentos de login fallidos
    const loginFailureAlerts = this.detectLoginFailureAlerts(events1h);
    newAlerts.push(...loginFailureAlerts);

    // 2. Alertas por exportaciones masivas
    const exportAlerts = this.detectMassiveExportAlerts(events24h);
    newAlerts.push(...exportAlerts);

    // 3. Alertas por acceso masivo a datos
    const dataAccessAlerts = this.detectDataAccessAlerts(events1h);
    newAlerts.push(...dataAccessAlerts);

    // 4. Alertas por accesos no autorizados
    const unauthorizedAlerts = this.detectUnauthorizedAccessAlerts(events24h);
    newAlerts.push(...unauthorizedAlerts);

    // 5. Alertas por actividad sospechosa
    const suspiciousAlerts = this.detectSuspiciousActivityAlerts(events24h);
    newAlerts.push(...suspiciousAlerts);

    // Agregar nuevas alertas a la lista
    this.alerts.push(...newAlerts);

    // Registrar alertas generadas
    await this.logGeneratedAlerts(newAlerts);

    return newAlerts;
  }

  /**
   * Detecta alertas por intentos de login fallidos
   */
  private static detectLoginFailureAlerts(events: AuditEvent[]): AuditAlert[] {
    const alerts: AuditAlert[] = [];
    const loginFailures = events.filter(e => e.type === 'login_failed');
    
    // Agrupar por usuario
    const failuresByUser = new Map<string, AuditEvent[]>();
    loginFailures.forEach(event => {
      const userFailures = failuresByUser.get(event.userId) || [];
      userFailures.push(event);
      failuresByUser.set(event.userId, userFailures);
    });

    // Generar alertas para usuarios con muchos intentos fallidos
    failuresByUser.forEach((userFailures, userId) => {
      if (userFailures.length >= this.thresholds.loginFailuresPerHour) {
        alerts.push({
          id: this.generateAlertId(),
          type: AlertType.LOGIN_FAILURE_SPREE,
          severity: userFailures.length > 10 ? AlertSeverity.CRITICAL : AlertSeverity.HIGH,
          title: 'Intento de acceso sospechoso',
          description: `Usuario ${userId} ha realizado ${userFailures.length} intentos de login fallidos en la última hora`,
          userId,
          metadata: {
            failureCount: userFailures.length,
            timeWindow: '1 hour',
            threshold: this.thresholds.loginFailuresPerHour
          },
          timestamp: new Date(),
          acknowledged: false
        });
      }
    });

    return alerts;
  }

  /**
   * Detecta alertas por exportaciones masivas
   */
  private static detectMassiveExportAlerts(events: AuditEvent[]): AuditAlert[] {
    const alerts: AuditAlert[] = [];
    const exports = events.filter(e => e.type.includes('data_export'));
    
    // Agrupar por usuario
    const exportsByUser = new Map<string, AuditEvent[]>();
    exports.forEach(event => {
      const userExports = exportsByUser.get(event.userId) || [];
      userExports.push(event);
      exportsByUser.set(event.userId, userExports);
    });

    // Generar alertas para usuarios con muchas exportaciones
    exportsByUser.forEach((userExports, userId) => {
      if (userExports.length >= this.thresholds.dataExportsPerDay) {
        alerts.push({
          id: this.generateAlertId(),
          type: AlertType.MASSIVE_DATA_EXPORT,
          severity: userExports.length > 20 ? AlertSeverity.CRITICAL : AlertSeverity.HIGH,
          title: 'Exportación masiva de datos',
          description: `Usuario ${userId} ha realizado ${userExports.length} exportaciones en las últimas 24 horas`,
          userId,
          metadata: {
            exportCount: userExports.length,
            timeWindow: '24 hours',
            threshold: this.thresholds.dataExportsPerDay
          },
          timestamp: new Date(),
          acknowledged: false
        });
      }
    });

    return alerts;
  }

  /**
   * Detecta alertas por acceso masivo a datos clínicos
   */
  private static detectDataAccessAlerts(events: AuditEvent[]): AuditAlert[] {
    const alerts: AuditAlert[] = [];
    const dataAccess = events.filter(e => 
      e.type.includes('patient_data_access') || e.type.includes('visit_data_access')
    );
    
    // Agrupar por usuario
    const accessByUser = new Map<string, AuditEvent[]>();
    dataAccess.forEach(event => {
      const userAccess = accessByUser.get(event.userId) || [];
      userAccess.push(event);
      accessByUser.set(event.userId, userAccess);
    });

    // Generar alertas para usuarios con mucho acceso a datos
    accessByUser.forEach((userAccess, userId) => {
      if (userAccess.length >= this.thresholds.dataAccessPerHour) {
        alerts.push({
          id: this.generateAlertId(),
          type: AlertType.DATA_ACCESS_ANOMALY,
          severity: userAccess.length > 100 ? AlertSeverity.CRITICAL : AlertSeverity.MEDIUM,
          title: 'Acceso masivo a datos clínicos',
          description: `Usuario ${userId} ha accedido a ${userAccess.length} registros clínicos en la última hora`,
          userId,
          metadata: {
            accessCount: userAccess.length,
            timeWindow: '1 hour',
            threshold: this.thresholds.dataAccessPerHour
          },
          timestamp: new Date(),
          acknowledged: false
        });
      }
    });

    return alerts;
  }

  /**
   * Detecta alertas por accesos no autorizados
   */
  private static detectUnauthorizedAccessAlerts(events: AuditEvent[]): AuditAlert[] {
    const alerts: AuditAlert[] = [];
    const unauthorized = events.filter(e => e.type.includes('unauthorized'));
    
    if (unauthorized.length >= this.thresholds.unauthorizedAccessPerDay) {
      alerts.push({
        id: this.generateAlertId(),
        type: AlertType.UNAUTHORIZED_ACCESS,
        severity: unauthorized.length > 10 ? AlertSeverity.CRITICAL : AlertSeverity.HIGH,
        title: 'Múltiples accesos no autorizados',
        description: `Se han detectado ${unauthorized.length} intentos de acceso no autorizado en las últimas 24 horas`,
        metadata: {
          unauthorizedCount: unauthorized.length,
          timeWindow: '24 hours',
          threshold: this.thresholds.unauthorizedAccessPerDay,
          users: [...new Set(unauthorized.map(e => e.userId))]
        },
        timestamp: new Date(),
        acknowledged: false
      });
    }

    return alerts;
  }

  /**
   * Detecta alertas por actividad sospechosa
   */
  private static detectSuspiciousActivityAlerts(events: AuditEvent[]): AuditAlert[] {
    const alerts: AuditAlert[] = [];
    
    // Detectar patrones sospechosos
    const suspiciousPatterns = this.analyzeSuspiciousPatterns(events);
    
    if (suspiciousPatterns.length > 0) {
      alerts.push({
        id: this.generateAlertId(),
        type: AlertType.SUSPICIOUS_ACTIVITY,
        severity: AlertSeverity.MEDIUM,
        title: 'Actividad sospechosa detectada',
        description: `Se han detectado ${suspiciousPatterns.length} patrones de actividad sospechosa`,
        metadata: {
          patterns: suspiciousPatterns,
          timeWindow: '24 hours'
        },
        timestamp: new Date(),
        acknowledged: false
      });
    }

    return alerts;
  }

  /**
   * Analiza patrones sospechosos en los eventos
   */
  private static analyzeSuspiciousPatterns(events: AuditEvent[]): string[] {
    const patterns: string[] = [];
    
    // Patrón: Acceso a múltiples pacientes en poco tiempo
    const patientAccess = events.filter(e => e.patientId);
    const accessByUser = new Map<string, Set<string>>();
    
    patientAccess.forEach(event => {
      const userPatients = accessByUser.get(event.userId) || new Set();
      userPatients.add(event.patientId!);
      accessByUser.set(event.userId, userPatients);
    });

    accessByUser.forEach((patients, userId) => {
      if (patients.size > 10) {
        patterns.push(`Usuario ${userId} accedió a ${patients.size} pacientes diferentes`);
      }
    });

    // Patrón: Actividad fuera de horario laboral
    const offHoursActivity = events.filter(event => {
      const hour = event.timestamp.getHours();
      return hour < 6 || hour > 22; // Entre 6 AM y 10 PM
    });

    if (offHoursActivity.length > 20) {
      patterns.push(`${offHoursActivity.length} eventos fuera de horario laboral`);
    }

    return patterns;
  }

  /**
   * Obtiene todas las alertas activas
   */
  static getActiveAlerts(): AuditAlert[] {
    return this.alerts.filter(alert => !alert.acknowledged);
  }

  /**
   * Obtiene alertas por severidad
   */
  static getAlertsBySeverity(severity: AlertSeverity): AuditAlert[] {
    return this.alerts.filter(alert => alert.severity === severity);
  }

  /**
   * Marca una alerta como reconocida
   */
  static acknowledgeAlert(alertId: string, acknowledgedBy: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedBy = acknowledgedBy;
      alert.acknowledgedAt = new Date();
    }
  }

  /**
   * Limpia alertas antiguas (más de 30 días)
   */
  static cleanupOldAlerts(): void {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    this.alerts = this.alerts.filter(alert => alert.timestamp >= thirtyDaysAgo);
  }

  /**
   * Genera ID único para alerta
   */
  private static generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Registra alertas generadas en el sistema de auditoría
   */
  private static async logGeneratedAlerts(alerts: AuditAlert[]): Promise<void> {
    for (const alert of alerts) {
      try {
        await FirestoreAuditLogger.logEvent({
          type: 'audit_alert_generated',
          userId: 'system',
          userRole: 'SYSTEM',
          metadata: {
            alertId: alert.id,
            alertType: alert.type,
            alertSeverity: alert.severity,
            alertTitle: alert.title,
            alertDescription: alert.description
          },
        });
      } catch (error) {
        console.error('Error registrando alerta:', error);
      }
    }
  }
}

// Exportar instancia singleton
export const auditAlertService = AuditAlertService; 