/**
 * 🔐 MEDICAL AUDIT SERVICE - AUDITORÍA MÉDICA COMPLETA
 * Sistema de auditoría especializado para entornos médicos con compliance HIPAA
 * Registra todas las actividades críticas del sistema con anonimización automática
 */

import { logger } from '@/lib/browser-logger';
import CryptoJS from 'crypto-js';

interface MedicalAuditEvent {
  eventId: string;
  timestamp: string;
  userId: string; // anonimizado
  patientId?: string; // anonimizado
  eventType: AuditEventType;
  action: string;
  resource: string;
  outcome: 'SUCCESS' | 'FAILURE' | 'WARNING';
  details: any;
  ipAddress: string; // anonimizado
  userAgent: string; // anonimizado
  sessionId: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

type AuditEventType = 
  | 'AUTHENTICATION'
  | 'DATA_ACCESS'
  | 'DATA_MODIFICATION'
  | 'PATIENT_RECORD_ACCESS'
  | 'PRESCRIPTION_ACCESS'
  | 'EMERGENCY_ACCESS'
  | 'SYSTEM_CONFIGURATION'
  | 'BACKUP_OPERATION'
  | 'SECURITY_INCIDENT';

interface SecurityAlert {
  alertId: string;
  timestamp: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: 'AUTHENTICATION' | 'DATA_BREACH' | 'UNUSUAL_ACCESS' | 'SYSTEM_ANOMALY';
  description: string;
  affectedUsers: string[];
  recommendedActions: string[];
  autoResolved: boolean;
}

class MedicalAuditService {
  private static auditEvents: MedicalAuditEvent[] = [];
  private static securityAlerts: SecurityAlert[] = [];
  private static readonly MAX_EVENTS = 10000; // máximo eventos en memoria
  private static readonly ANOMALY_THRESHOLD = 5; // intentos sospechosos

  /**
   * Registrar evento de auditoría médica
   */
  static logMedicalEvent(
    userId: string,
    eventType: AuditEventType,
    action: string,
    resource: string,
    outcome: 'SUCCESS' | 'FAILURE' | 'WARNING',
    details: any = {},
    patientId?: string,
    ipAddress: string = 'unknown',
    userAgent: string = 'unknown'
  ): void {
    const event: MedicalAuditEvent = {
      eventId: this.generateEventId(),
      timestamp: new Date().toISOString(),
      userId: this.anonymizeUserId(userId),
      patientId: patientId ? this.anonymizePatientId(patientId) : undefined,
      eventType,
      action,
      resource,
      outcome,
      details: this.anonymizeDetails(details),
      ipAddress: this.anonymizeIP(ipAddress),
      userAgent: this.anonymizeUserAgent(userAgent),
      sessionId: this.getCurrentSessionId(),
      riskLevel: this.assessRiskLevel(eventType, action, outcome)
    };

    // Agregar a memoria
    this.auditEvents.push(event);
    
    // Mantener límite de eventos
    if (this.auditEvents.length > this.MAX_EVENTS) {
      this.auditEvents.shift();
    }

    // Log estructurado usando browser logger
    logger.info('MEDICAL_AUDIT_EVENT', event);

    // Detectar anomalías
    this.detectAnomalies(event);

    // Guardar en localStorage como backup
    this.saveToLocalStorage();
  }

  /**
   * Registrar acceso a datos de paciente (HIPAA crítico)
   */
  static logPatientDataAccess(
    userId: string,
    patientId: string,
    dataType: string,
    action: 'READ' | 'WRITE' | 'DELETE',
    success: boolean,
    justification?: string
  ): void {
    this.logMedicalEvent(
      userId,
      'PATIENT_RECORD_ACCESS',
      `${action}_${dataType}`,
      `patient_data/${dataType}`,
      success ? 'SUCCESS' : 'FAILURE',
      {
        dataType,
        justification: justification || 'routine_access',
        accessMethod: 'application',
        dataClassification: this.classifyMedicalData(dataType)
      },
      patientId
    );

    // Alerta si acceso fuera de horario
    if (this.isOutOfHours()) {
      this.createSecurityAlert(
        'MEDIUM',
        'UNUSUAL_ACCESS',
        `Acceso a datos de paciente fuera de horario laboral`,
        [userId],
        ['Verificar justificación del acceso', 'Contactar al usuario si es necesario']
      );
    }
  }

  /**
   * Registrar evento de autenticación
   */
  static logAuthenticationEvent(
    userId: string,
    action: 'LOGIN' | 'LOGOUT' | 'MFA_SETUP' | 'PASSWORD_CHANGE',
    success: boolean,
    mfaUsed: boolean = false,
    ipAddress: string = 'unknown',
    userAgent: string = 'unknown'
  ): void {
    this.logMedicalEvent(
      userId,
      'AUTHENTICATION',
      action,
      'authentication_system',
      success ? 'SUCCESS' : 'FAILURE',
      {
        mfaUsed,
        authMethod: mfaUsed ? 'MFA' : 'PASSWORD_ONLY',
        loginTime: new Date().toISOString()
      },
      undefined,
      ipAddress,
      userAgent
    );

    // Detectar intentos de login sospechosos
    if (!success) {
      this.trackFailedLogin(userId, ipAddress);
    }
  }

  /**
   * Registrar acceso de emergencia (Break Glass)
   */
  static logEmergencyAccess(
    userId: string,
    patientId: string,
    justification: string,
    approver?: string
  ): void {
    this.logMedicalEvent(
      userId,
      'EMERGENCY_ACCESS',
      'BREAK_GLASS_ACCESS',
      'emergency_patient_data',
      'SUCCESS',
      {
        justification,
        approver: approver ? this.anonymizeUserId(approver) : undefined,
        emergencyType: 'break_glass',
        requiresPostApproval: !approver
      },
      patientId
    );

    // Alerta crítica para acceso de emergencia
    this.createSecurityAlert(
      'HIGH',
      'UNUSUAL_ACCESS',
      `Acceso de emergencia activado por usuario ${this.anonymizeUserId(userId)}`,
      [userId],
      [
        'Verificar justificación médica',
        'Obtener aprobación post-acceso si es requerida',
        'Documentar en expediente del paciente'
      ]
    );
  }

  /**
   * Generar reporte de compliance HIPAA
   */
  static generateHIPAAComplianceReport(startDate: Date, endDate: Date): any {
    const relevantEvents = this.auditEvents.filter(event => {
      const eventDate = new Date(event.timestamp);
      return eventDate >= startDate && eventDate <= endDate;
    });

    const report = {
      reportId: this.generateEventId(),
      generatedAt: new Date().toISOString(),
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      summary: {
        totalEvents: relevantEvents.length,
        patientDataAccess: relevantEvents.filter(e => e.eventType === 'PATIENT_RECORD_ACCESS').length,
        authenticationEvents: relevantEvents.filter(e => e.eventType === 'AUTHENTICATION').length,
        emergencyAccess: relevantEvents.filter(e => e.eventType === 'EMERGENCY_ACCESS').length,
        securityIncidents: relevantEvents.filter(e => e.riskLevel === 'CRITICAL').length
      },
      breakdown: {
        byEventType: this.groupBy(relevantEvents, 'eventType'),
        byOutcome: this.groupBy(relevantEvents, 'outcome'),
        byRiskLevel: this.groupBy(relevantEvents, 'riskLevel')
      },
      securityAlerts: this.securityAlerts.filter(alert => {
        const alertDate = new Date(alert.timestamp);
        return alertDate >= startDate && alertDate <= endDate;
      }),
      recommendations: this.generateSecurityRecommendations(relevantEvents)
    };

    // Log generación del reporte
    this.logMedicalEvent(
      'SYSTEM',
      'SYSTEM_CONFIGURATION',
      'GENERATE_COMPLIANCE_REPORT',
      'audit_system',
      'SUCCESS',
      {
        reportType: 'HIPAA_COMPLIANCE',
        eventCount: relevantEvents.length,
        period: report.period
      }
    );

    return report;
  }

  /**
   * Detectar anomalías de seguridad
   */
  private static detectAnomalies(event: MedicalAuditEvent): void {
    // Detectar múltiples fallos de login
    if (event.eventType === 'AUTHENTICATION' && event.outcome === 'FAILURE') {
      const recentFailures = this.auditEvents.filter(e => 
        e.eventType === 'AUTHENTICATION' && 
        e.outcome === 'FAILURE' &&
        e.userId === event.userId &&
        new Date(e.timestamp).getTime() > Date.now() - (30 * 60 * 1000) // últimos 30 min
      );

      if (recentFailures.length >= this.ANOMALY_THRESHOLD) {
        this.createSecurityAlert(
          'HIGH',
          'AUTHENTICATION',
          `Múltiples fallos de autenticación detectados`,
          [event.userId],
          ['Bloquear cuenta temporalmente', 'Verificar actividad sospechosa']
        );
      }
    }

    // Detectar acceso masivo a datos de pacientes
    if (event.eventType === 'PATIENT_RECORD_ACCESS') {
      const recentAccess = this.auditEvents.filter(e => 
        e.eventType === 'PATIENT_RECORD_ACCESS' &&
        e.userId === event.userId &&
        new Date(e.timestamp).getTime() > Date.now() - (60 * 60 * 1000) // última hora
      );

      if (recentAccess.length >= 50) { // más de 50 accesos por hora
        this.createSecurityAlert(
          'MEDIUM',
          'UNUSUAL_ACCESS',
          `Acceso masivo a datos de pacientes detectado`,
          [event.userId],
          ['Verificar justificación médica', 'Revisar patrones de acceso']
        );
      }
    }
  }

  /**
   * Crear alerta de seguridad
   */
  private static createSecurityAlert(
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    category: 'AUTHENTICATION' | 'DATA_BREACH' | 'UNUSUAL_ACCESS' | 'SYSTEM_ANOMALY',
    description: string,
    affectedUsers: string[],
    recommendedActions: string[]
  ): void {
    const alert: SecurityAlert = {
      alertId: this.generateEventId(),
      timestamp: new Date().toISOString(),
      severity,
      category,
      description,
      affectedUsers: affectedUsers.map(user => this.anonymizeUserId(user)),
      recommendedActions,
      autoResolved: false
    };

    this.securityAlerts.push(alert);

    // Log crítico para alertas de alta severidad
    if (severity === 'HIGH' || severity === 'CRITICAL') {
      logger.error('SECURITY_ALERT', alert);
    } else {
      logger.warn('SECURITY_ALERT', alert);
    }
  }

  /**
   * Métodos de anonimización (GDPR compliant)
   */
  private static anonymizeUserId(userId: string): string {
    return `user_${CryptoJS.SHA256(userId).toString().substring(0, 12)}`;
  }

  private static anonymizePatientId(patientId: string): string {
    return `patient_${CryptoJS.SHA256(patientId).toString().substring(0, 12)}`;
  }

  private static anonymizeIP(ip: string): string {
    return `ip_${CryptoJS.SHA256(ip).toString().substring(0, 8)}`;
  }

  private static anonymizeUserAgent(userAgent: string): string {
    return `ua_${CryptoJS.SHA256(userAgent).toString().substring(0, 8)}`;
  }

  private static anonymizeDetails(details: any): any {
    const anonymized = { ...details };
    const sensitiveFields = ['patientName', 'socialSecurityNumber', 'email', 'phone'];
    
    sensitiveFields.forEach(field => {
      if (anonymized[field]) {
        anonymized[field] = `***${CryptoJS.SHA256(anonymized[field]).toString().substring(0, 8)}`;
      }
    });

    return anonymized;
  }

  /**
   * Métodos utilitarios
   */
  private static generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  private static getCurrentSessionId(): string {
    return `session_${CryptoJS.SHA256(Date.now().toString()).toString().substring(0, 16)}`;
  }

  private static assessRiskLevel(
    eventType: AuditEventType, 
    action: string, 
    outcome: string
  ): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (outcome === 'FAILURE') return 'MEDIUM';
    if (eventType === 'EMERGENCY_ACCESS') return 'HIGH';
    if (eventType === 'SECURITY_INCIDENT') return 'CRITICAL';
    if (eventType === 'PATIENT_RECORD_ACCESS') return 'MEDIUM';
    return 'LOW';
  }

  private static classifyMedicalData(dataType: string): string {
    const highRiskData = ['diagnosis', 'medications', 'lab_results', 'mental_health'];
    const mediumRiskData = ['vital_signs', 'allergies', 'medical_history'];
    
    if (highRiskData.includes(dataType)) return 'HIGH_RISK';
    if (mediumRiskData.includes(dataType)) return 'MEDIUM_RISK';
    return 'LOW_RISK';
  }

  private static isOutOfHours(): boolean {
    const hour = new Date().getHours();
    return hour < 6 || hour > 22; // fuera de 6 AM - 10 PM
  }

  private static trackFailedLogin(userId: string, ipAddress: string): void {
    // Implementar tracking de intentos fallidos
    logger.error('🚨 Failed login attempt:', this.anonymizeUserId(userId), 'from', this.anonymizeIP(ipAddress));
  }

  private static groupBy(array: any[], key: string): Record<string, number> {
    return array.reduce((acc, item) => {
      const group = item[key];
      acc[group] = (acc[group] || 0) + 1;
      return acc;
    }, {});
  }

  private static generateSecurityRecommendations(events: MedicalAuditEvent[]): string[] {
    const recommendations: string[] = [];
    
    const failureRate = events.filter(e => e.outcome === 'FAILURE').length / events.length;
    if (failureRate > 0.1) {
      recommendations.push('Revisar configuración de autenticación - alta tasa de fallos');
    }

    const emergencyAccess = events.filter(e => e.eventType === 'EMERGENCY_ACCESS').length;
    if (emergencyAccess > 0) {
      recommendations.push('Revisar justificaciones de acceso de emergencia');
    }

    return recommendations;
  }

  private static saveToLocalStorage(): void {
    try {
      // Guardar solo los últimos 1000 eventos para no sobrecargar localStorage
      const recentEvents = this.auditEvents.slice(-1000);
      localStorage.setItem('medical_audit_backup', JSON.stringify(recentEvents));
    } catch (error) {
      logger.error('❌ Error guardando audit backup:', error);
    }
  }

  /**
   * Obtener estadísticas de auditoría
   */
  static getAuditStatistics(): any {
    return {
      totalEvents: this.auditEvents.length,
      recentAlerts: this.securityAlerts.filter(alert => 
        new Date(alert.timestamp).getTime() > Date.now() - (24 * 60 * 60 * 1000)
      ).length,
      eventsByType: this.groupBy(this.auditEvents, 'eventType'),
      riskDistribution: this.groupBy(this.auditEvents, 'riskLevel')
    };
  }

  /**
   * Registrar evento del sistema (wrapper para logMedicalEvent)
   */
  static logSystemEvent(
    userId: string,
    action: string,
    description: string,
    details: any = {}
  ): void {
    this.logMedicalEvent(
      userId,
      'SYSTEM_CONFIGURATION',
      action,
      'system',
      'SUCCESS',
      {
        description,
        ...details
      }
    );
  }
}

export default MedicalAuditService; 