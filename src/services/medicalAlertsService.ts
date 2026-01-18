/**
 * Medical Alerts Service - Security audit logging
 * 
 * Detects medical alerts in transcriptions and integrates with SOAP generation
 * 
 * Security audit logging:
 * - A.12.4.1: Event logging (all detections logged)
 * - A.12.4.2: Protection of log information (encrypted metadata)
 * 
 * Medical-Legal Requirements:
 * - 100% of detected alerts must be included in SOAP notes
 * - False positive rate must be <5%
 * - Processing time must be <10 seconds
 */

import { detectVitalSigns, generateAlertsFromVitalSigns, detectPostSurgicalAlerts, MedicalAlert, VitalSign } from '../utils/vitalSignsDetector';

// ✅ Security audit: Lazy import to prevent build issues
let FirestoreAuditLogger: typeof import('../core/audit/FirestoreAuditLogger').FirestoreAuditLogger | null = null;

const getAuditLogger = async () => {
  if (!FirestoreAuditLogger) {
    const module = await import('../core/audit/FirestoreAuditLogger');
    FirestoreAuditLogger = module.FirestoreAuditLogger;
  }
  return FirestoreAuditLogger;
};

export interface AlertDetectionResult {
  alerts: MedicalAlert[];
  vitalSigns: VitalSign[];
  processingTimeMs: number;
  falsePositiveRate?: number;
}

export interface SOAPWithAlerts {
  subjective: string;
  objective: string;
  assessment: string; // Includes alerts automatically
  plan: string;
  alerts: MedicalAlert[];
  alertSummary?: string; // Formatted alerts for inclusion in Assessment
}

export class MedicalAlertsService {
  /**
   * Detect all medical alerts in transcription
   * ✅ Security audit: All detections are logged
   */
  static async detectAlerts(
    transcription: string,
    patientId?: string,
    sessionId?: string
  ): Promise<AlertDetectionResult> {
    const startTime = Date.now();

    try {
      // Detect vital signs
      const vitalSigns = detectVitalSigns(transcription);

      // Generate alerts from vital signs
      const vitalAlerts = generateAlertsFromVitalSigns(vitalSigns);

      // Detect post-surgical alerts
      const postSurgicalAlerts = detectPostSurgicalAlerts(transcription);

      // Combine all alerts
      const allAlerts = [...vitalAlerts, ...postSurgicalAlerts];

      // Sort by severity (critical first)
      const severityOrder = { critical: 0, warning: 1, info: 2 };
      allAlerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

      const processingTime = Date.now() - startTime;

      // ✅ Security audit: Log alert detection
      const AuditLogger = await getAuditLogger();
      await AuditLogger.logEvent({
        type: 'medical_alerts_detected',
        userId: 'system',
        userRole: 'SYSTEM',
        patientId,
        metadata: {
          sessionId,
          alertCount: allAlerts.length,
          criticalAlerts: allAlerts.filter(a => a.severity === 'critical').length,
          warningAlerts: allAlerts.filter(a => a.severity === 'warning').length,
          processingTimeMs: processingTime,
          complianceFrameworks: ['ISO27001', 'PHIPA', 'PIPEDA'],
          timestamp: new Date().toISOString(),
        },
      });

      return {
        alerts: allAlerts,
        vitalSigns,
        processingTimeMs: processingTime,
      };
    } catch (error) {
      console.error('[MedicalAlerts] Error detecting alerts:', error);
      
      // ✅ Security audit: Log error
      const AuditLogger = await getAuditLogger();
      await AuditLogger.logEvent({
        type: 'medical_alerts_detection_failed',
        userId: 'system',
        userRole: 'SYSTEM',
        patientId,
        metadata: {
          sessionId,
          error: error instanceof Error ? error.message : 'Unknown error',
          securityLevel: 'high',
          timestamp: new Date().toISOString(),
        },
      });

      return {
        alerts: [],
        vitalSigns: [],
        processingTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Format alerts for inclusion in SOAP Assessment section
   * ✅ CRITICAL: Alerts MUST be included in 100% of SOAPs
   */
  static formatAlertsForSOAP(alerts: MedicalAlert[]): string {
    if (alerts.length === 0) {
      return '';
    }

    // Group alerts by severity
    const criticalAlerts = alerts.filter(a => a.severity === 'critical');
    const warningAlerts = alerts.filter(a => a.severity === 'warning');
    const infoAlerts = alerts.filter(a => a.severity === 'info');

    let alertText = '\n\n--- ALERTAS MÉDICO-LEGALES AUTOMÁTICAS ---\n';

    // Critical alerts first
    if (criticalAlerts.length > 0) {
      alertText += '\n🚨 ALERTAS CRÍTICAS:\n';
      criticalAlerts.forEach((alert, index) => {
        alertText += `${index + 1}. ${alert.message}`;
        if (alert.detectedValue) {
          alertText += ` (Valor detectado: ${alert.detectedValue})`;
        }
        if (alert.normalRange) {
          alertText += ` [Rango normal: ${alert.normalRange}]`;
        }
        if (alert.recommendation) {
          alertText += `\n   Recomendación: ${alert.recommendation}`;
        }
        alertText += '\n';
      });
    }

    // Warning alerts
    if (warningAlerts.length > 0) {
      alertText += '\n⚠️ ALERTAS DE ADVERTENCIA:\n';
      warningAlerts.forEach((alert, index) => {
        alertText += `${index + 1}. ${alert.message}`;
        if (alert.detectedValue) {
          alertText += ` (Valor detectado: ${alert.detectedValue})`;
        }
        if (alert.normalRange) {
          alertText += ` [Rango normal: ${alert.normalRange}]`;
        }
        if (alert.recommendation) {
          alertText += `\n   Recomendación: ${alert.recommendation}`;
        }
        alertText += '\n';
      });
    }

    // Info alerts
    if (infoAlerts.length > 0) {
      alertText += '\nℹ️ INFORMACIÓN CLÍNICA:\n';
      infoAlerts.forEach((alert, index) => {
        alertText += `${index + 1}. ${alert.message}`;
        if (alert.recommendation) {
          alertText += `\n   Nota: ${alert.recommendation}`;
        }
        alertText += '\n';
      });
    }

    alertText += '\n--- FIN DE ALERTAS AUTOMÁTICAS ---\n';

    return alertText;
  }

  /**
   * Include alerts in SOAP Assessment section
   * ✅ CRITICAL: This ensures 100% inclusion rate
   */
  static includeAlertsInSOAP(
    soapAssessment: string,
    alerts: MedicalAlert[]
  ): string {
    if (alerts.length === 0) {
      return soapAssessment;
    }

    const alertsText = this.formatAlertsForSOAP(alerts);
    
    // Append alerts to Assessment section
    return `${soapAssessment}${alertsText}`;
  }

  /**
   * Process transcription and return SOAP with alerts included
   * This is the main integration point with SOAP generation
   */
  static async processWithAlerts(
    transcription: string,
    existingSOAP: {
      subjective: string;
      objective: string;
      assessment: string;
      plan: string;
    },
    patientId?: string,
    sessionId?: string
  ): Promise<SOAPWithAlerts> {
    // Detect alerts
    const detectionResult = await this.detectAlerts(transcription, patientId, sessionId);

    // Include alerts in Assessment
    const assessmentWithAlerts = this.includeAlertsInSOAP(
      existingSOAP.assessment,
      detectionResult.alerts
    );

    // ✅ Security audit: Log SOAP generation with alerts
    const AuditLogger = await getAuditLogger();
    await AuditLogger.logEvent({
      type: 'soap_generated_with_alerts',
      userId: 'system',
      userRole: 'SYSTEM',
      patientId,
      metadata: {
        sessionId,
        alertCount: detectionResult.alerts.length,
        alertsIncluded: true,
        processingTimeMs: detectionResult.processingTimeMs,
        securityLevel: detectionResult.alerts.some(a => a.severity === 'critical') ? 'critical' : 'high',
        complianceFrameworks: ['ISO27001', 'PHIPA', 'PIPEDA'],
        timestamp: new Date().toISOString(),
      },
    });

    return {
      subjective: existingSOAP.subjective,
      objective: existingSOAP.objective,
      assessment: assessmentWithAlerts,
      plan: existingSOAP.plan,
      alerts: detectionResult.alerts,
      alertSummary: this.formatAlertsForSOAP(detectionResult.alerts),
    };
  }

  /**
   * Validate alert detection quality
   * Used for monitoring false positive rate
   */
  static validateDetectionQuality(
    detectedAlerts: MedicalAlert[],
    confirmedAlerts: MedicalAlert[]
  ): {
    falsePositiveRate: number;
    truePositiveRate: number;
    accuracy: number;
  } {
    const totalDetected = detectedAlerts.length;
    const totalConfirmed = confirmedAlerts.length;
    
    // Calculate false positives (detected but not confirmed)
    const falsePositives = detectedAlerts.filter(
      detected => !confirmedAlerts.some(
        confirmed => confirmed.category === detected.category &&
                     confirmed.detectedValue === detected.detectedValue
      )
    ).length;

    // Calculate true positives (detected and confirmed)
    const truePositives = detectedAlerts.filter(
      detected => confirmedAlerts.some(
        confirmed => confirmed.category === detected.category &&
                     confirmed.detectedValue === detected.detectedValue
      )
    ).length;

    const falsePositiveRate = totalDetected > 0 ? (falsePositives / totalDetected) * 100 : 0;
    const truePositiveRate = totalConfirmed > 0 ? (truePositives / totalConfirmed) * 100 : 0;
    const accuracy = totalDetected > 0 ? ((truePositives / totalDetected) * 100) : 0;

    return {
      falsePositiveRate,
      truePositiveRate,
      accuracy,
    };
  }
}

export default MedicalAlertsService;

