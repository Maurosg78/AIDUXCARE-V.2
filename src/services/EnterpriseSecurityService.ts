/**
 * EnterpriseSecurityService - Servicio de seguridad empresarial para AiDuxCare
 * Maneja auditoría, control de acceso, cumplimiento HIPAA y monitoreo de seguridad
 */

export interface SecurityEvent {
  id: string;
  timestamp: string;
  userId?: string;
  action: string;
  resource: string;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  details?: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface AccessControl {
  userId: string;
  role: 'OWNER' | 'PHYSICIAN' | 'ADMIN' | 'VIEWER';
  permissions: string[];
  lastAccess: string;
  mfaEnabled: boolean;
}

export class EnterpriseSecurityService {
  private static instance: EnterpriseSecurityService;
  private securityEvents: SecurityEvent[] = [];
  private accessControls: Map<string, AccessControl> = new Map();

  constructor() {
    if (EnterpriseSecurityService.instance) {
      return EnterpriseSecurityService.instance;
    }
    EnterpriseSecurityService.instance = this;
  }

  /**
   * Registra un evento de seguridad para auditoría
   */
  logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): void {
    const securityEvent: SecurityEvent = {
      ...event,
      id: this.generateEventId(),
      timestamp: new Date().toISOString()
    };

    this.securityEvents.push(securityEvent);
    
    // En producción, esto se enviaría a un sistema de logging centralizado
    console.log('🔒 Security Event:', securityEvent);
    
    // Si es un evento crítico, tomar acciones inmediatas
    if (event.severity === 'critical') {
      this.handleCriticalEvent(securityEvent);
    }
  }

  /**
   * Valida el control de acceso para diferentes roles
   */
  validateAccessControl(userId: string, action: string, resource: string): boolean {
    const userAccess = this.accessControls.get(userId);
    
    if (!userAccess) {
      this.logSecurityEvent({
        action: 'ACCESS_DENIED',
        resource,
        success: false,
        severity: 'high',
        details: { userId, reason: 'User not found in access controls' }
      });
      return false;
    }

    // Verificar permisos según el rol
    const hasPermission = this.checkPermission(userAccess.role, action, resource);
    
    this.logSecurityEvent({
      userId,
      action,
      resource,
      success: hasPermission,
      severity: hasPermission ? 'low' : 'medium',
      details: { role: userAccess.role, permissions: userAccess.permissions }
    });

    return hasPermission;
  }

  /**
   * Verifica permisos específicos según rol y acción
   */
  private checkPermission(role: string, action: string, resource: string): boolean {
    const permissionMatrix = {
      OWNER: ['*'], // Acceso total
      PHYSICIAN: ['read:patient', 'write:soap', 'read:history', 'write:consultation'],
      ADMIN: ['read:patient', 'read:history', 'manage:users', 'read:audit'],
      VIEWER: ['read:patient', 'read:history']
    };

    const permissions = permissionMatrix[role as keyof typeof permissionMatrix] || [];
    
    // OWNER tiene acceso total
    if (permissions.includes('*')) return true;
    
    // Verificar permiso específico
    const requiredPermission = `${action}:${resource}`;
    return permissions.includes(requiredPermission);
  }

  /**
   * Configura control de acceso para un usuario
   */
  setAccessControl(userId: string, accessControl: Omit<AccessControl, 'userId'>): void {
    this.accessControls.set(userId, {
      ...accessControl,
      userId
    });

    this.logSecurityEvent({
      userId,
      action: 'ACCESS_CONTROL_SET',
      resource: 'user_permissions',
      success: true,
      severity: 'medium',
      details: { role: accessControl.role, permissions: accessControl.permissions }
    });
  }

  /**
   * Obtiene eventos de seguridad para auditoría
   */
  getSecurityEvents(filters?: {
    userId?: string;
    severity?: string;
    startDate?: string;
    endDate?: string;
  }): SecurityEvent[] {
    let events = [...this.securityEvents];

    if (filters?.userId) {
      events = events.filter(e => e.userId === filters.userId);
    }

    if (filters?.severity) {
      events = events.filter(e => e.severity === filters.severity);
    }

    if (filters?.startDate) {
      events = events.filter(e => e.timestamp >= filters.startDate!);
    }

    if (filters?.endDate) {
      events = events.filter(e => e.timestamp <= filters.endDate!);
    }

    return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Genera reporte de cumplimiento HIPAA
   */
  generateHIPAAReport(): {
    totalEvents: number;
    criticalEvents: number;
    accessViolations: number;
    mfaCompliance: number;
    lastAudit: string;
  } {
    const events = this.securityEvents;
    const criticalEvents = events.filter(e => e.severity === 'critical').length;
    const accessViolations = events.filter(e => !e.success && e.action.includes('ACCESS')).length;
    const mfaEnabled = Array.from(this.accessControls.values()).filter(ac => ac.mfaEnabled).length;
    const totalUsers = this.accessControls.size;

    return {
      totalEvents: events.length,
      criticalEvents,
      accessViolations,
      mfaCompliance: totalUsers > 0 ? (mfaEnabled / totalUsers) * 100 : 0,
      lastAudit: new Date().toISOString()
    };
  }

  /**
   * Maneja eventos críticos de seguridad
   */
  private handleCriticalEvent(event: SecurityEvent): void {
    // En producción, esto podría:
    // - Enviar alertas por email/SMS
    // - Bloquear temporalmente el usuario
    // - Activar protocolos de emergencia
    
    console.error('🚨 CRITICAL SECURITY EVENT:', event);
    
    // Ejemplo: bloquear usuario si hay múltiples intentos fallidos
    if (event.action === 'LOGIN_FAILED' && event.userId) {
      const recentFailures = this.securityEvents.filter(e => 
        e.userId === event.userId && 
        e.action === 'LOGIN_FAILED' && 
        e.timestamp > new Date(Date.now() - 15 * 60 * 1000).toISOString() // Últimos 15 minutos
      );

      if (recentFailures.length >= 5) {
        this.logSecurityEvent({
          userId: event.userId,
          action: 'ACCOUNT_LOCKED',
          resource: 'user_account',
          success: false,
          severity: 'critical',
          details: { reason: 'Multiple failed login attempts', failures: recentFailures.length }
        });
      }
    }
  }

  /**
   * Genera ID único para eventos de seguridad
   */
  private generateEventId(): string {
    return `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Limpia eventos antiguos (mantener solo últimos 30 días)
   */
  cleanupOldEvents(): void {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    this.securityEvents = this.securityEvents.filter(e => e.timestamp >= thirtyDaysAgo);
  }
} 