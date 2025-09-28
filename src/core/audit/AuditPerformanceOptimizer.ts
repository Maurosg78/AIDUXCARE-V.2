// @ts-nocheck
import { FirestoreAuditLogger, AuditEvent } from './FirestoreAuditLogger';

/**
 * Optimizador de rendimiento para el sistema de auditoría
 * Implementa técnicas de optimización para consultas masivas y alertas automáticas
 */
export class AuditPerformanceOptimizer {
  private static readonly BATCH_SIZE = 100;
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
  private static cache = new Map<string, { data: AuditEvent[]; timestamp: number }>();

  /**
   * Consulta optimizada con caché y paginación
   */
  static async getEventsOptimized(params: {
    userId?: string;
    patientId?: string;
    visitId?: string;
    type?: string;
    limit?: number;
    page?: number;
  }): Promise<{ events: AuditEvent[]; total: number; hasMore: boolean }> {
    const cacheKey = JSON.stringify(params);
    const cached = this.cache.get(cacheKey);
    
    // Verificar caché
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return {
        events: cached.data,
        total: cached.data.length,
        hasMore: false
      };
    }

    // Consulta real con paginación
    const limit = Math.min(params.limit || this.BATCH_SIZE, this.BATCH_SIZE);
    // const offset = page * limit; // No se usa en la implementación actual

    const events = await FirestoreAuditLogger.getEvents({
      userId: params.userId,
      patientId: params.patientId,
      visitId: params.visitId,
      type: params.type,
      limit: limit + 1 // +1 para determinar si hay más páginas
    });

    const hasMore = events.length > limit;
    const result = {
      events: events.slice(0, limit),
      total: events.length,
      hasMore
    };

    // Actualizar caché
    this.cache.set(cacheKey, {
      data: result.events,
      timestamp: Date.now()
    });

    return result;
  }

  /**
   * Detector de eventos críticos para alertas automáticas
   */
  static async detectCriticalEvents(): Promise<{
    failedLogins: number;
    unauthorizedAccess: number;
    dataExports: number;
    logoutEvents: number;
    patientDataAccess: number;
    visitDataAccess: number;
    suspiciousActivity: string[];
  }> {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // Obtener eventos de las últimas 24 horas
    const recentEvents = await FirestoreAuditLogger.getEvents({
      limit: 1000
    });

    const filteredEvents = recentEvents.filter(event => 
      event.timestamp >= last24Hours
    );

    const failedLogins = filteredEvents.filter(e => e.type === 'login_failed').length;
    const unauthorizedAccess = filteredEvents.filter(e => e.type.includes('unauthorized')).length;
    const dataExports = filteredEvents.filter(e => e.type.includes('data_export')).length;
    const logoutEvents = filteredEvents.filter(e => e.type === 'logout_success').length;
    const patientDataAccess = filteredEvents.filter(e => e.type.includes('patient_data')).length;
    const visitDataAccess = filteredEvents.filter(e => e.type.includes('visit_data')).length;

    // Detectar actividad sospechosa
    const suspiciousActivity: string[] = [];
    
    // Múltiples intentos de login fallidos
    const loginAttempts = filteredEvents.filter(e => e.type === 'login_failed');
    const loginAttemptsByUser = new Map<string, number>();
    loginAttempts.forEach(event => {
      const count = loginAttemptsByUser.get(event.userId) || 0;
      loginAttemptsByUser.set(event.userId, count + 1);
    });

    loginAttemptsByUser.forEach((count, userId) => {
      if (count > 5) {
        suspiciousActivity.push(`Usuario ${userId}: ${count} intentos de login fallidos`);
      }
    });

    // Exportaciones masivas
    const exportsByUser = new Map<string, number>();
    filteredEvents.filter(e => e.type === 'data_export').forEach(event => {
      const count = exportsByUser.get(event.userId) || 0;
      exportsByUser.set(event.userId, count + 1);
    });

    exportsByUser.forEach((count, userId) => {
      if (count > 10) {
        suspiciousActivity.push(`Usuario ${userId}: ${count} exportaciones en 24h`);
      }
    });

    return {
      failedLogins,
      unauthorizedAccess,
      dataExports,
      logoutEvents,
      patientDataAccess,
      visitDataAccess,
      suspiciousActivity
    };
  }

  /**
   * Genera métricas de auditoría para dashboard
   */
  static async generateAuditMetrics(): Promise<{
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsByUser: Record<string, number>;
    eventsByHour: Record<string, number>;
    topPatients: Array<{ patientId: string; accessCount: number }>;
  }> {
    const events = await FirestoreAuditLogger.getEvents({ limit: 1000 });
    
    const eventsByType: Record<string, number> = {};
    const eventsByUser: Record<string, number> = {};
    const eventsByHour: Record<string, number> = {};
    const patientAccess: Record<string, number> = {};

    events.forEach(event => {
      // Por tipo
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
      
      // Por usuario
      eventsByUser[event.userId] = (eventsByUser[event.userId] || 0) + 1;
      
      // Por hora
      const hour = event.timestamp.getHours().toString().padStart(2, '0');
      eventsByHour[hour] = (eventsByHour[hour] || 0) + 1;
      
      // Por paciente
      if (event.patientId) {
        patientAccess[event.patientId] = (patientAccess[event.patientId] || 0) + 1;
      }
    });

    const topPatients = Object.entries(patientAccess)
      .map(([patientId, accessCount]) => ({ patientId, accessCount }))
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, 10);

    return {
      totalEvents: events.length,
      eventsByType,
      eventsByUser,
      eventsByHour,
      topPatients
    };
  }

  /**
   * Limpia caché expirado
   */
  static cleanupCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.CACHE_DURATION) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Configura índices recomendados para Firestore
   */
  static getRecommendedIndexes(): Array<{
    collection: string;
    fields: string[];
    description: string;
  }> {
    return [
      {
        collection: 'audit_logs',
        fields: ['userId', 'timestamp'],
        description: 'Consultas por usuario y tiempo'
      },
      {
        collection: 'audit_logs',
        fields: ['type', 'timestamp'],
        description: 'Consultas por tipo de evento y tiempo'
      },
      {
        collection: 'audit_logs',
        fields: ['patientId', 'timestamp'],
        description: 'Consultas por paciente y tiempo'
      },
      {
        collection: 'audit_logs',
        fields: ['userRole', 'timestamp'],
        description: 'Consultas por rol y tiempo'
      }
    ];
  }
} 