/**
 * STATS: SISTEMA DE MONITOREO AVANZADO
 * Métricas personalizadas para pipeline médico con alertas inteligentes
 */

import { register, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

export interface MedicalMetrics {
  // Contadores de procesamiento
  medicalAnalysisTotal: Counter;
  soapGenerationTotal: Counter;
  entityExtractionTotal: Counter;
  riskAssessmentTotal: Counter;
  
  // Métricas de latencia
  analysisLatency: Histogram;
  soapLatency: Histogram;
  entityLatency: Histogram;
  
  // Métricas de calidad
  confidenceScore: Histogram;
  accuracyScore: Histogram;
  
  // Métricas de recursos
  tokenUsage: Histogram;
  cacheHitRate: Gauge;
  errorRate: Gauge;
  
  // Métricas de negocio
  activeSessions: Gauge;
  consultationsPerHour: Counter;
  revenuePerConsultation: Histogram;
}

export interface AlertRule {
  id: string;
  name: string;
  condition: (metrics: any) => boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  cooldown: number;
}

export class AdvancedMonitoringService {
  private metrics: MedicalMetrics;
  private alertRules: AlertRule[] = [];
  private lastAlertTime: Map<string, number> = new Map();

  constructor() {
    // Registrar métricas por defecto de Node.js
    collectDefaultMetrics();

    this.initializeMetrics();
    this.setupAlertRules();
  }

  /**
   * Inicializa métricas personalizadas
   */
  private initializeMetrics(): void {
    this.metrics = {
      // Contadores de procesamiento
      medicalAnalysisTotal: new Counter({
        name: 'aiduxcare_medical_analysis_total',
        help: 'Total de análisis médicos procesados',
        labelNames: ['specialty', 'priority', 'model_used']
      }),

      soapGenerationTotal: new Counter({
        name: 'aiduxcare_soap_generation_total',
        help: 'Total de secciones SOAP generadas',
        labelNames: ['section_type', 'confidence_level']
      }),

      entityExtractionTotal: new Counter({
        name: 'aiduxcare_entity_extraction_total',
        help: 'Total de entidades médicas extraídas',
        labelNames: ['entity_type', 'specialty']
      }),

      riskAssessmentTotal: new Counter({
        name: 'aiduxcare_risk_assessment_total',
        help: 'Total de evaluaciones de riesgo',
        labelNames: ['risk_level', 'urgency']
      }),

      // Métricas de latencia
      analysisLatency: new Histogram({
        name: 'aiduxcare_analysis_latency_seconds',
        help: 'Latencia de análisis médico en segundos',
        labelNames: ['specialty', 'priority'],
        buckets: [0.1, 0.5, 1, 2, 5, 10, 30]
      }),

      soapLatency: new Histogram({
        name: 'aiduxcare_soap_latency_seconds',
        help: 'Latencia de generación SOAP en segundos',
        labelNames: ['section_type'],
        buckets: [0.1, 0.5, 1, 2, 5]
      }),

      entityLatency: new Histogram({
        name: 'aiduxcare_entity_latency_seconds',
        help: 'Latencia de extracción de entidades en segundos',
        labelNames: ['entity_type'],
        buckets: [0.05, 0.1, 0.5, 1, 2]
      }),

      // Métricas de calidad
      confidenceScore: new Histogram({
        name: 'aiduxcare_confidence_score',
        help: 'Puntuación de confianza del análisis',
        labelNames: ['specialty', 'model_used'],
        buckets: [0.1, 0.3, 0.5, 0.7, 0.9, 1.0]
      }),

      accuracyScore: new Histogram({
        name: 'aiduxcare_accuracy_score',
        help: 'Puntuación de precisión del análisis',
        labelNames: ['specialty', 'entity_type'],
        buckets: [0.1, 0.3, 0.5, 0.7, 0.9, 1.0]
      }),

      // Métricas de recursos
      tokenUsage: new Histogram({
        name: 'aiduxcare_token_usage',
        help: 'Uso de tokens por análisis',
        labelNames: ['model_used', 'specialty'],
        buckets: [100, 500, 1000, 2000, 5000, 10000]
      }),

      cacheHitRate: new Gauge({
        name: 'aiduxcare_cache_hit_rate',
        help: 'Tasa de aciertos del cache'
      }),

      errorRate: new Gauge({
        name: 'aiduxcare_error_rate',
        help: 'Tasa de errores del sistema'
      }),

      // Métricas de negocio
      activeSessions: new Gauge({
        name: 'aiduxcare_active_sessions',
        help: 'Sesiones activas actualmente',
        labelNames: ['specialty']
      }),

      consultationsPerHour: new Counter({
        name: 'aiduxcare_consultations_per_hour',
        help: 'Consultas por hora',
        labelNames: ['specialty', 'priority']
      }),

      revenuePerConsultation: new Histogram({
        name: 'aiduxcare_revenue_per_consultation',
        help: 'Ingresos por consulta en euros',
        labelNames: ['specialty', 'plan_type'],
        buckets: [10, 25, 50, 75, 100, 150, 200]
      })
    };
  }

  /**
   * Configura reglas de alerta
   */
  private setupAlertRules(): void {
    this.alertRules = [
      {
        id: 'high_latency',
        name: 'Latencia Alta',
        condition: (metrics) => {
          const avgLatency = metrics.analysisLatency.observe({ specialty: 'general' });
          return avgLatency > 5; // Más de 5 segundos
        },
        severity: 'high',
        message: 'Latencia de análisis médico excede 5 segundos',
        cooldown: 300000 // 5 minutos
      },

      {
        id: 'low_confidence',
        name: 'Confianza Baja',
        condition: (metrics) => {
          const avgConfidence = metrics.confidenceScore.observe({ specialty: 'general' });
          return avgConfidence < 0.7; // Menos del 70%
        },
        severity: 'medium',
        message: 'Confianza promedio del análisis por debajo del 70%',
        cooldown: 600000 // 10 minutos
      },

      {
        id: 'high_error_rate',
        name: 'Tasa de Error Alta',
        condition: (metrics) => {
          return metrics.errorRate > 0.05; // Más del 5%
        },
        severity: 'critical',
        message: 'Tasa de errores del sistema excede el 5%',
        cooldown: 120000 // 2 minutos
      },

      {
        id: 'low_cache_hit_rate',
        name: 'Cache Hit Rate Bajo',
        condition: (metrics) => {
          return metrics.cacheHitRate < 0.6; // Menos del 60%
        },
        severity: 'low',
        message: 'Tasa de aciertos del cache por debajo del 60%',
        cooldown: 900000 // 15 minutos
      },

      {
        id: 'high_token_usage',
        name: 'Uso Alto de Tokens',
        condition: (metrics) => {
          const avgTokens = metrics.tokenUsage.observe({ model_used: 'gemini-1.5-pro' });
          return avgTokens > 5000; // Más de 5000 tokens
        },
        severity: 'medium',
        message: 'Uso promedio de tokens excede 5000 por análisis',
        cooldown: 600000 // 10 minutos
      }
    ];
  }

  /**
   * Registra análisis médico
   */
  recordMedicalAnalysis(specialty: string, priority: string, modelUsed: string, duration: number, confidence: number, tokens: number): void {
    this.metrics.medicalAnalysisTotal.inc({ specialty, priority, model_used: modelUsed });
    this.metrics.analysisLatency.observe({ specialty, priority }, duration / 1000);
    this.metrics.confidenceScore.observe({ specialty, model_used: modelUsed }, confidence);
    this.metrics.tokenUsage.observe({ model_used: modelUsed, specialty }, tokens);
  }

  /**
   * Registra generación SOAP
   */
  recordSOAPGeneration(sectionType: string, duration: number, confidence: number): void {
    this.metrics.soapGenerationTotal.inc({ section_type: sectionType, confidence_level: this.getConfidenceLevel(confidence) });
    this.metrics.soapLatency.observe({ section_type: sectionType }, duration / 1000);
  }

  /**
   * Registra extracción de entidades
   */
  recordEntityExtraction(entityType: string, specialty: string, duration: number, accuracy: number): void {
    this.metrics.entityExtractionTotal.inc({ entity_type: entityType, specialty });
    this.metrics.entityLatency.observe({ entity_type: entityType }, duration / 1000);
    this.metrics.accuracyScore.observe({ specialty, entity_type: entityType }, accuracy);
  }

  /**
   * Registra evaluación de riesgo
   */
  recordRiskAssessment(riskLevel: string, urgency: string): void {
    this.metrics.riskAssessmentTotal.inc({ risk_level: riskLevel, urgency });
  }

  /**
   * Actualiza métricas de cache
   */
  updateCacheHitRate(hitRate: number): void {
    this.metrics.cacheHitRate.set(hitRate);
  }

  /**
   * Actualiza tasa de errores
   */
  updateErrorRate(errorRate: number): void {
    this.metrics.errorRate.set(errorRate);
  }

  /**
   * Registra sesión activa
   */
  recordActiveSession(specialty: string, increment: boolean = true): void {
    if (increment) {
      this.metrics.activeSessions.inc({ specialty });
    } else {
      this.metrics.activeSessions.dec({ specialty });
    }
  }

  /**
   * Registra consulta
   */
  recordConsultation(specialty: string, priority: string, revenue: number): void {
    this.metrics.consultationsPerHour.inc({ specialty, priority });
    this.metrics.revenuePerConsultation.observe({ specialty, plan_type: this.getPlanType(revenue) }, revenue);
  }

  /**
   * Obtiene nivel de confianza
   */
  private getConfidenceLevel(confidence: number): string {
    if (confidence >= 0.9) return 'high';
    if (confidence >= 0.7) return 'medium';
    return 'low';
  }

  /**
   * Obtiene tipo de plan basado en ingresos
   */
  private getPlanType(revenue: number): string {
    if (revenue >= 75) return 'premium';
    if (revenue >= 50) return 'pro';
    return 'basic';
  }

  /**
   * Ejecuta verificaciones de alerta
   */
  async checkAlerts(): Promise<any[]> {
    const alerts: any[] = [];
    const currentTime = Date.now();

    for (const rule of this.alertRules) {
      const lastAlert = this.lastAlertTime.get(rule.id) || 0;
      
      if (currentTime - lastAlert > rule.cooldown) {
        try {
          if (rule.condition(this.metrics)) {
            alerts.push({
              id: rule.id,
              name: rule.name,
              severity: rule.severity,
              message: rule.message,
              timestamp: new Date().toISOString()
            });
            
            this.lastAlertTime.set(rule.id, currentTime);
          }
        } catch (error) {
          console.error(`Error en regla de alerta ${rule.id}:`, error);
        }
      }
    }

    return alerts;
  }

  /**
   * Obtiene métricas en formato Prometheus
   */
  async getMetrics(): Promise<string> {
    return await register.metrics();
  }

  /**
   * Obtiene métricas personalizadas
   */
  getCustomMetrics(): any {
    return {
      analysisTotal: this.metrics.medicalAnalysisTotal,
      soapTotal: this.metrics.soapGenerationTotal,
      entityTotal: this.metrics.entityExtractionTotal,
      riskTotal: this.metrics.riskAssessmentTotal,
      cacheHitRate: this.metrics.cacheHitRate,
      errorRate: this.metrics.errorRate,
      activeSessions: this.metrics.activeSessions
    };
  }

  /**
   * Resetea métricas (útil para testing)
   */
  resetMetrics(): void {
    register.clear();
    this.initializeMetrics();
  }
} 