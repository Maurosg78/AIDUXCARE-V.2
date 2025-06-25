/**
 * 🚨 SERVICIO DE ALERTAS INTELIGENTES
 * Sistema de monitoreo y alertas automáticas para la maratón
 */

export interface AlertRule {
  id: string;
  name: string;
  condition: (metrics: SystemMetrics) => boolean;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string | ((metrics: SystemMetrics) => string);
  cooldownMinutes: number;
  enabled: boolean;
}

export interface SystemMetrics {
  requestsPerMinute: number;
  averageResponseTime: number;
  successRate: number;
  errorRate: number;
  throughput: number;
  activeConnections: number;
  memoryUsage: number;
  cpuUsage: number;
  timestamp: Date;
}

export interface Alert {
  id: string;
  ruleId: string;
  message: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timestamp: Date;
  acknowledged: boolean;
  resolved: boolean;
}

export class IntelligentAlertService {
  private alerts: Alert[] = [];
  private rules: AlertRule[] = [];
  private lastTriggered: Map<string, Date> = new Map();

  constructor() {
    this.initializeDefaultRules();
  }

  /**
   * Inicializa reglas de alerta por defecto
   */
  private initializeDefaultRules(): void {
    this.rules = [
      // Alertas de rendimiento
      {
        id: 'high-error-rate',
        name: 'High Error Rate',
        condition: (metrics: SystemMetrics) => metrics.errorRate > 5,
        severity: 'HIGH',
        message: (metrics: SystemMetrics) => `Error rate is ${metrics.errorRate.toFixed(1)}% (threshold: 5%)`,
        cooldownMinutes: 5,
        enabled: true
      },
      {
        id: 'slow-response-time',
        name: 'Slow Response Time',
        condition: (metrics: SystemMetrics) => metrics.averageResponseTime > 500,
        severity: 'MEDIUM',
        message: (metrics: SystemMetrics) => `Average response time is ${metrics.averageResponseTime}ms (threshold: 500ms)`,
        cooldownMinutes: 3,
        enabled: true
      },
      {
        id: 'high-cpu-usage',
        name: 'High CPU Usage',
        condition: (metrics: SystemMetrics) => metrics.cpuUsage > 80,
        severity: 'HIGH',
        message: (metrics: SystemMetrics) => `CPU usage is ${metrics.cpuUsage}% (threshold: 80%)`,
        cooldownMinutes: 2,
        enabled: true
      },
      {
        id: 'high-memory-usage',
        name: 'High Memory Usage',
        condition: (metrics: SystemMetrics) => metrics.memoryUsage > 85,
        severity: 'CRITICAL',
        message: (metrics: SystemMetrics) => `Memory usage is ${metrics.memoryUsage}% (threshold: 85%)`,
        cooldownMinutes: 1,
        enabled: true
      },
      {
        id: 'low-throughput',
        name: 'Low Throughput',
        condition: (metrics: SystemMetrics) => metrics.throughput < 20,
        severity: 'MEDIUM',
        message: (metrics: SystemMetrics) => `Throughput is ${metrics.throughput}/s (threshold: 20/s)`,
        cooldownMinutes: 5,
        enabled: true
      },
      {
        id: 'too-many-connections',
        name: 'Too Many Connections',
        condition: (metrics: SystemMetrics) => metrics.activeConnections > 50,
        severity: 'HIGH',
        message: (metrics: SystemMetrics) => `Active connections: ${metrics.activeConnections} (threshold: 50)`,
        cooldownMinutes: 3,
        enabled: true
      },
      // Alertas de tendencias
      {
        id: 'response-time-trending-up',
        name: 'Response Time Trending Up',
        condition: (metrics: SystemMetrics) => this.isResponseTimeTrendingUp(),
        severity: 'LOW',
        message: 'Response time is trending upward',
        cooldownMinutes: 10,
        enabled: true
      },
      {
        id: 'success-rate-declining',
        name: 'Success Rate Declining',
        condition: (metrics: SystemMetrics) => this.isSuccessRateDeclining(),
        severity: 'MEDIUM',
        message: 'Success rate is declining',
        cooldownMinutes: 5,
        enabled: true
      }
    ];
  }

  /**
   * Procesa métricas y genera alertas
   */
  processMetrics(metrics: SystemMetrics): Alert[] {
    const newAlerts: Alert[] = [];

    for (const rule of this.rules) {
      if (!rule.enabled) continue;

      // Verificar cooldown
      const lastTriggered = this.lastTriggered.get(rule.id);
      if (lastTriggered) {
        const minutesSinceLastTrigger = (Date.now() - lastTriggered.getTime()) / (1000 * 60);
        if (minutesSinceLastTrigger < rule.cooldownMinutes) {
          continue;
        }
      }

      // Verificar condición
      if (rule.condition(metrics)) {
        const alertMessage = typeof rule.message === 'function' ? rule.message(metrics) : rule.message;
        
        const alert: Alert = {
          id: `${rule.id}-${Date.now()}`,
          ruleId: rule.id,
          message: alertMessage,
          severity: rule.severity,
          timestamp: new Date(),
          acknowledged: false,
          resolved: false
        };

        newAlerts.push(alert);
        this.lastTriggered.set(rule.id, new Date());
      }
    }

    // Agregar nuevas alertas
    this.alerts.push(...newAlerts);

    // Limpiar alertas antiguas (más de 24 horas)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    this.alerts = this.alerts.filter(alert => alert.timestamp > oneDayAgo);

    return newAlerts;
  }

  /**
   * Obtiene alertas activas
   */
  getActiveAlerts(): Alert[] {
    return this.alerts.filter(alert => !alert.resolved);
  }

  /**
   * Obtiene alertas por severidad
   */
  getAlertsBySeverity(severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'): Alert[] {
    return this.alerts.filter(alert => alert.severity === severity);
  }

  /**
   * Marca alerta como reconocida
   */
  acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
    }
  }

  /**
   * Marca alerta como resuelta
   */
  resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
    }
  }

  /**
   * Agrega regla personalizada
   */
  addRule(rule: AlertRule): void {
    this.rules.push(rule);
  }

  /**
   * Habilita/deshabilita regla
   */
  toggleRule(ruleId: string, enabled: boolean): void {
    const rule = this.rules.find(r => r.id === ruleId);
    if (rule) {
      rule.enabled = enabled;
    }
  }

  /**
   * Verifica si el tiempo de respuesta está aumentando
   */
  private isResponseTimeTrendingUp(): boolean {
    // Implementación simplificada - en producción usaría análisis de tendencias
    const recentAlerts = this.alerts
      .filter(alert => alert.ruleId === 'slow-response-time')
      .filter(alert => alert.timestamp > new Date(Date.now() - 30 * 60 * 1000)); // Últimos 30 minutos

    return recentAlerts.length >= 3;
  }

  /**
   * Verifica si la tasa de éxito está disminuyendo
   */
  private isSuccessRateDeclining(): boolean {
    // Implementación simplificada - en producción usaría análisis de tendencias
    const recentAlerts = this.alerts
      .filter(alert => alert.ruleId === 'high-error-rate')
      .filter(alert => alert.timestamp > new Date(Date.now() - 15 * 60 * 1000)); // Últimos 15 minutos

    return recentAlerts.length >= 2;
  }

  /**
   * Obtiene estadísticas de alertas
   */
  getAlertStats(): {
    total: number;
    active: number;
    acknowledged: number;
    resolved: number;
    bySeverity: Record<string, number>;
  } {
    const active = this.getActiveAlerts();
    const acknowledged = this.alerts.filter(a => a.acknowledged && !a.resolved);
    const resolved = this.alerts.filter(a => a.resolved);

    const bySeverity = {
      LOW: this.getAlertsBySeverity('LOW').length,
      MEDIUM: this.getAlertsBySeverity('MEDIUM').length,
      HIGH: this.getAlertsBySeverity('HIGH').length,
      CRITICAL: this.getAlertsBySeverity('CRITICAL').length
    };

    return {
      total: this.alerts.length,
      active: active.length,
      acknowledged: acknowledged.length,
      resolved: resolved.length,
      bySeverity
    };
  }
} 