/**
 * 📊 **Enterprise Audit Logging Types**
 * 
 * Sistema de auditoría enterprise con:
 * - Compliance HIPAA/GDPR completo
 * - Trazabilidad total de acciones
 * - Tipado estricto para análisis
 */

// =====================================================
// AUDIT EVENT TYPES
// =====================================================

export type AuditEventType =
  // Authentication Events
  | 'auth.login.success'
  | 'auth.login.failure'
  | 'auth.logout'
  | 'auth.register.success'
  | 'auth.register.failure'
  | 'auth.email.verified'
  | 'auth.password.reset.requested'
  | 'auth.password.reset.completed'
  | 'auth.session.expired'
  
  // Profile Events
  | 'profile.created'
  | 'profile.updated'
  | 'profile.completed'
  | 'profile.viewed'
  
  // System Events
  | 'system.error'
  | 'system.security.violation'
  | 'system.access.denied'
  
  // Future Clinical Events
  | 'clinical.patient.accessed'
  | 'clinical.note.created'
  | 'clinical.data.exported';

export type AuditLevel = 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';

export type AuditSource = 'web' | 'mobile' | 'api' | 'system';

// =====================================================
// AUDIT EVENT STRUCTURE
// =====================================================

export interface AuditEvent {
  readonly id: string;
  readonly timestamp: Date;
  readonly eventType: AuditEventType;
  readonly level: AuditLevel;
  readonly source: AuditSource;
  
  // User Context
  readonly userId: string | null;
  readonly userEmail: string | null;
  readonly sessionId: string | null;
  
  // Request Context
  readonly ipAddress: string;
  readonly userAgent: string;
  readonly requestId: string;
  
  // Event Details
  readonly details: AuditEventDetails;
  readonly metadata: Record<string, unknown>;
  
  // Compliance
  readonly complianceFlags: ComplianceFlags;
}

export interface AuditEventDetails {
  readonly action: string;
  readonly resource?: string;
  readonly resourceId?: string;
  readonly outcome: 'success' | 'failure' | 'partial';
  readonly errorCode?: string;
  readonly errorMessage?: string;
  readonly duration?: number; // milliseconds
}

export interface ComplianceFlags {
  readonly hipaaRelevant: boolean;
  readonly gdprRelevant: boolean;
  readonly retentionPeriod: number; // days
  readonly sensitiveData: boolean;
}

// =====================================================
// AUDIT REPOSITORY INTERFACE
// =====================================================

export interface IAuditRepository {
  log(event: Omit<AuditEvent, 'id' | 'timestamp'>): Promise<void>;
  query(filters: AuditQueryFilters): Promise<AuditEvent[]>;
  getEventsByUser(userId: string, limit?: number): Promise<AuditEvent[]>;
  getEventsByType(eventType: AuditEventType, limit?: number): Promise<AuditEvent[]>;
  getSecurityEvents(since: Date): Promise<AuditEvent[]>;
}

export interface AuditQueryFilters {
  readonly userId?: string;
  readonly eventType?: AuditEventType;
  readonly level?: AuditLevel;
  readonly dateFrom?: Date;
  readonly dateTo?: Date;
  readonly limit?: number;
  readonly offset?: number;
}

// =====================================================
// AUDIT SERVICE INTERFACE
// =====================================================

export interface IAuditService {
  // High-level logging methods
  logAuthEvent(type: AuditEventType, userId: string | null, details: Partial<AuditEventDetails>): Promise<void>;
  logSecurityEvent(details: AuditEventDetails, metadata?: Record<string, unknown>): Promise<void>;
  logSystemError(error: Error, context?: Record<string, unknown>): Promise<void>;
  
  // Compliance methods
  generateComplianceReport(dateFrom: Date, dateTo: Date): Promise<ComplianceReport>;
  exportUserData(userId: string): Promise<UserAuditData>;
}

export interface ComplianceReport {
  readonly generatedAt: Date;
  readonly period: { from: Date; to: Date };
  readonly totalEvents: number;
  readonly eventsByType: Record<AuditEventType, number>;
  readonly securityEvents: number;
  readonly errors: number;
  readonly userActivitySummary: UserActivitySummary[];
}

export interface UserActivitySummary {
  readonly userId: string;
  readonly userEmail: string;
  readonly lastLogin: Date | null;
  readonly totalActions: number;
  readonly securityViolations: number;
}

export interface UserAuditData {
  readonly userId: string;
  readonly events: AuditEvent[];
  readonly summary: UserActivitySummary;
  readonly exportedAt: Date;
}

// =====================================================
// AUDIT DECORATORS & HELPERS
// =====================================================

export interface AuditContext {
  readonly userId?: string;
  readonly sessionId?: string;
  readonly requestId?: string;
  readonly ipAddress?: string;
  readonly userAgent?: string;
}