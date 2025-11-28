/**
 * Hospital Portal ISO 27001 Audit Service
 * 
 * Comprehensive audit logging for ISO 27001 compliance
 * Implements controls:
 * - A.12.4.1: Event logging
 * - A.12.4.2: Protection of log information
 * - A.12.4.3: Administrator and operator logs
 * - A.9.4.2: Secure log-on procedures
 * - A.9.4.4: Use of privileged utility programs
 */

import { FirestoreAuditLogger } from '../core/audit/FirestoreAuditLogger';

export interface ISOAuditEvent {
  // ISO 27001 Required Fields
  eventId: string;
  timestamp: Date;
  userId: string;
  userRole: string;
  action: string;
  resourceType: string;
  resourceId: string;
  success: boolean;
  
  // ISO 27001 Additional Context
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  correlationId?: string;
  
  // Security Context
  securityLevel: 'low' | 'medium' | 'high' | 'critical';
  complianceFrameworks: ('ISO27001' | 'HIPAA' | 'PIPEDA' | 'PHIPA')[];
  
  // Technical Details
  metadata?: Record<string, unknown>;
  errorDetails?: {
    code: string;
    message: string;
    stack?: string;
  };
}

export class HospitalPortalISOAudit {
  /**
   * Log authentication event (ISO 27001 A.9.4.2)
   */
  static async logAuthentication(
    event: 'success' | 'failed' | 'rate_limited',
    noteCode: string,
    noteId: string,
    physiotherapistId: string,
    clientInfo: { ipAddress: string; userAgent: string },
    error?: string
  ): Promise<void> {
    const eventType = `hospital_portal_auth_${event}`;
    const securityLevel = event === 'rate_limited' ? 'high' : event === 'failed' ? 'medium' : 'low';
    
    await FirestoreAuditLogger.logEvent({
      type: eventType,
      userId: event === 'success' ? physiotherapistId : 'anonymous',
      userRole: event === 'success' ? 'PHYSIOTHERAPIST' : 'HOSPITAL_STAFF',
      resourceType: 'hospital_portal_note',
      resourceId: noteId,
      action: 'authenticate',
      success: event === 'success',
      metadata: {
        noteCode,
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
        securityLevel,
        complianceFrameworks: ['ISO27001', 'PHIPA', 'PIPEDA'],
        error: error || undefined,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Log data access event (ISO 27001 A.12.4.1)
   */
  static async logDataAccess(
    action: 'view' | 'copy' | 'download',
    noteCode: string,
    noteId: string,
    physiotherapistId: string,
    clientInfo: { ipAddress: string; userAgent: string },
    contentLength?: number
  ): Promise<void> {
    const securityLevel = action === 'copy' ? 'critical' : action === 'download' ? 'high' : 'medium';
    
    await FirestoreAuditLogger.logEvent({
      type: `hospital_portal_note_${action}`,
      userId: physiotherapistId,
      userRole: 'PHYSIOTHERAPIST',
      resourceType: 'hospital_portal_note',
      resourceId: noteId,
      action,
      success: true,
      metadata: {
        noteCode,
        contentLength,
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
        securityLevel,
        complianceFrameworks: ['ISO27001', 'PHIPA', 'PIPEDA'],
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Log security event (ISO 27001 A.12.4.3)
   */
  static async logSecurityEvent(
    eventType: 'rate_limit' | 'encryption_error' | 'session_timeout' | 'unauthorized_access',
    noteCode: string,
    noteId: string,
    clientInfo: { ipAddress: string; userAgent: string },
    details?: Record<string, unknown>
  ): Promise<void> {
    const securityLevel = eventType === 'unauthorized_access' ? 'critical' : 'high';
    
    await FirestoreAuditLogger.logEvent({
      type: `hospital_portal_security_${eventType}`,
      userId: 'system',
      userRole: 'SYSTEM',
      resourceType: 'hospital_portal_note',
      resourceId: noteId,
      action: 'security_event',
      success: false,
      metadata: {
        noteCode,
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
        securityLevel,
        complianceFrameworks: ['ISO27001', 'PHIPA', 'PIPEDA'],
        ...details,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Log data lifecycle event (ISO 27001 A.8.2.3)
   */
  static async logDataLifecycle(
    event: 'created' | 'deleted' | 'expired',
    noteCode: string,
    noteId: string,
    physiotherapistId: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await FirestoreAuditLogger.logEvent({
      type: `hospital_portal_note_${event}`,
      userId: physiotherapistId,
      userRole: 'PHYSIOTHERAPIST',
      resourceType: 'hospital_portal_note',
      resourceId: noteId,
      action: event,
      success: true,
      metadata: {
        noteCode,
        securityLevel: 'medium',
        complianceFrameworks: ['ISO27001', 'PHIPA', 'PIPEDA'],
        ...metadata,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Generate ISO 27001 compliance report
   */
  static async generateComplianceReport(
    physiotherapistId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalEvents: number;
    authenticationEvents: number;
    dataAccessEvents: number;
    securityEvents: number;
    complianceScore: number;
    recommendations: string[];
  }> {
    // This would query FirestoreAuditLogger for events in the date range
    // For now, return structure
    return {
      totalEvents: 0,
      authenticationEvents: 0,
      dataAccessEvents: 0,
      securityEvents: 0,
      complianceScore: 100,
      recommendations: [],
    };
  }
}


