/**
 * 📊 SOAP METRICS SERVICE - ANÁLISIS DE PRECISIÓN Y CALIDAD
 * 
 * Servicio para métricas de precisión SOAP, análisis de errores y mejora continua
 * 
 * @author AiDuxCare Team
 * @date Junio 2025
 * @version 1.0
 */

import { AuditAction, ClassifiedSegment, AdvancedSOAPResult } from './SOAPClassifierV2Service';

export interface SOAPMetrics {
  accuracy: {
    overall: number;
    bySection: {
      S: number;
      O: number;
      A: number;
      P: number;
    };
    byConfidence: {
      high: number;
      medium: number;
      low: number;
    };
  };
  quality: {
    completeness: number;
    consistency: number;
    professionalReview: number;
  };
  performance: {
    processingTime: number;
    fallbackUsage: number;
    auditActions: number;
  };
  errors: {
    classificationErrors: number;
    missingSections: number;
    lowConfidenceSegments: number;
  };
}

export interface MetricsReport {
  sessionId: string;
  timestamp: string;
  metrics: SOAPMetrics;
  recommendations: string[];
  improvementScore: number;
}

export interface ErrorAnalysis {
  errorType: 'CLASSIFICATION' | 'MISSING_CONTENT' | 'LOW_CONFIDENCE' | 'INCONSISTENCY';
  frequency: number;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  segments: string[];
  suggestions: string[];
}

export class SOAPMetricsService {
  
  /**
   * Calcular métricas completas de precisión SOAP
   */
  static calculateSOAPMetrics(
    originalResult: AdvancedSOAPResult,
    auditActions: AuditAction[],
    finalSOAP: any
  ): SOAPMetrics {
    
    const accuracy = this.calculateAccuracyMetrics(originalResult, auditActions);
    const quality = this.calculateQualityMetrics(originalResult, finalSOAP);
    const performance = this.calculatePerformanceMetrics(originalResult, auditActions);
    const errors = this.calculateErrorMetrics(originalResult, auditActions);

    return {
      accuracy,
      quality,
      performance,
      errors
    };
  }

  /**
   * Calcular métricas de precisión
   */
  private static calculateAccuracyMetrics(
    originalResult: AdvancedSOAPResult,
    auditActions: AuditAction[]
  ): SOAPMetrics['accuracy'] {
    
    const totalSegments = originalResult.classifiedSegments.length;
    const correctClassifications = auditActions.filter(action => 
      action.type === 'APPROVE'
    ).length;
    
    const overallAccuracy = totalSegments > 0 ? correctClassifications / totalSegments : 0;

    // Precisión por sección
    const sectionAccuracy = {
      S: this.calculateSectionAccuracy(originalResult, auditActions, 'S'),
      O: this.calculateSectionAccuracy(originalResult, auditActions, 'O'),
      A: this.calculateSectionAccuracy(originalResult, auditActions, 'A'),
      P: this.calculateSectionAccuracy(originalResult, auditActions, 'P')
    };

    // Precisión por nivel de confianza
    const confidenceAccuracy = {
      high: this.calculateConfidenceAccuracy(originalResult, auditActions, 0.8),
      medium: this.calculateConfidenceAccuracy(originalResult, auditActions, 0.6),
      low: this.calculateConfidenceAccuracy(originalResult, auditActions, 0.4)
    };

    return {
      overall: overallAccuracy,
      bySection: sectionAccuracy,
      byConfidence: confidenceAccuracy
    };
  }

  /**
   * Calcular precisión por sección específica
   */
  private static calculateSectionAccuracy(
    originalResult: AdvancedSOAPResult,
    auditActions: AuditAction[],
    section: 'S' | 'O' | 'A' | 'P'
  ): number {
    
    const sectionSegments = originalResult.classifiedSegments.filter(
      segment => segment.soap_section === section
    );
    
    if (sectionSegments.length === 0) return 0;

    const correctInSection = auditActions.filter(action => 
      action.original_section === section && action.type === 'APPROVE'
    ).length;

    return correctInSection / sectionSegments.length;
  }

  /**
   * Calcular precisión por nivel de confianza
   */
  private static calculateConfidenceAccuracy(
    originalResult: AdvancedSOAPResult,
    auditActions: AuditAction[],
    confidenceThreshold: number
  ): number {
    
    const highConfidenceSegments = originalResult.classifiedSegments.filter(
      segment => segment.confidence >= confidenceThreshold
    );
    
    if (highConfidenceSegments.length === 0) return 0;

    const correctHighConfidence = auditActions.filter(action => {
      const segment = originalResult.classifiedSegments.find(s => s.id === action.segment_id);
      return segment && segment.confidence >= confidenceThreshold && action.type === 'APPROVE';
    }).length;

    return correctHighConfidence / highConfidenceSegments.length;
  }

  /**
   * Calcular métricas de calidad
   */
  private static calculateQualityMetrics(
    originalResult: AdvancedSOAPResult,
    finalSOAP: any
  ): SOAPMetrics['quality'] {
    
    // Completitud: porcentaje de secciones con contenido
    const sections = ['S', 'O', 'A', 'P'];
    const completedSections = sections.filter(section => 
      finalSOAP[section] && finalSOAP[section].trim().length > 0
    ).length;
    
    const completeness = completedSections / sections.length;

    // Consistencia: coherencia entre segmentos
    const consistency = this.calculateConsistencyScore(originalResult.classifiedSegments);

    // Revisión profesional: porcentaje de segmentos que requieren revisión
    const segmentsRequiringReview = originalResult.classifiedSegments.filter(
      segment => segment.audit_metadata.requires_review
    ).length;
    
    const professionalReview = originalResult.classifiedSegments.length > 0 
      ? segmentsRequiringReview / originalResult.classifiedSegments.length 
      : 0;

    return {
      completeness,
      consistency,
      professionalReview
    };
  }

  /**
   * Calcular score de consistencia
   */
  private static calculateConsistencyScore(segments: ClassifiedSegment[]): number {
    if (segments.length < 2) return 1.0;

    let consistencyScore = 0;
    let comparisons = 0;

    for (let i = 0; i < segments.length - 1; i++) {
      for (let j = i + 1; j < segments.length; j++) {
        const segment1 = segments[i];
        const segment2 = segments[j];

        // Verificar consistencia en clasificación
        if (segment1.soap_section === segment2.soap_section) {
          consistencyScore += 1;
        }
        
        // Verificar consistencia en confianza
        const confidenceDiff = Math.abs(segment1.confidence - segment2.confidence);
        if (confidenceDiff < 0.2) {
          consistencyScore += 0.5;
        }

        comparisons++;
      }
    }

    return comparisons > 0 ? consistencyScore / comparisons : 1.0;
  }

  /**
   * Calcular métricas de rendimiento
   */
  private static calculatePerformanceMetrics(
    originalResult: AdvancedSOAPResult,
    auditActions: AuditAction[]
  ): SOAPMetrics['performance'] {
    
    return {
      processingTime: originalResult.processingTime,
      fallbackUsage: originalResult.fallbackUsed ? 1 : 0,
      auditActions: auditActions.length
    };
  }

  /**
   * Calcular métricas de errores
   */
  private static calculateErrorMetrics(
    originalResult: AdvancedSOAPResult,
    auditActions: AuditAction[]
  ): SOAPMetrics['errors'] {
    
    const classificationErrors = auditActions.filter(action => 
      action.type === 'RECLASSIFY'
    ).length;

    const missingSections = ['S', 'O', 'A', 'P'].filter(section => {
      const sectionSegments = originalResult.classifiedSegments.filter(
        segment => segment.soap_section === section
      );
      return sectionSegments.length === 0;
    }).length;

    const lowConfidenceSegments = originalResult.classifiedSegments.filter(
      segment => segment.confidence < 0.6
    ).length;

    return {
      classificationErrors,
      missingSections,
      lowConfidenceSegments
    };
  }

  /**
   * Generar reporte completo de métricas
   */
  static generateMetricsReport(
    sessionId: string,
    originalResult: AdvancedSOAPResult,
    auditActions: AuditAction[],
    finalSOAP: any
  ): MetricsReport {
    
    const metrics = this.calculateSOAPMetrics(originalResult, auditActions, finalSOAP);
    const recommendations = this.generateRecommendations(metrics);
    const improvementScore = this.calculateImprovementScore(metrics);

    return {
      sessionId,
      timestamp: new Date().toISOString(),
      metrics,
      recommendations,
      improvementScore
    };
  }

  /**
   * Generar recomendaciones basadas en métricas
   */
  private static generateRecommendations(metrics: SOAPMetrics): string[] {
    const recommendations: string[] = [];

    // Recomendaciones basadas en precisión
    if (metrics.accuracy.overall < 0.8) {
      recommendations.push('La precisión general es baja. Considere revisar el modelo de clasificación.');
    }

    if (metrics.accuracy.bySection.S < 0.7) {
      recommendations.push('La sección Subjetivo tiene baja precisión. Mejore la detección de síntomas.');
    }

    if (metrics.accuracy.bySection.O < 0.7) {
      recommendations.push('La sección Objetivo tiene baja precisión. Mejore la detección de hallazgos.');
    }

    // Recomendaciones basadas en calidad
    if (metrics.quality.completeness < 0.8) {
      recommendations.push('Faltan secciones completas. Revise la cobertura de clasificación.');
    }

    if (metrics.quality.professionalReview > 0.3) {
      recommendations.push('Muchos segmentos requieren revisión profesional. Considere ajustar el umbral de confianza.');
    }

    // Recomendaciones basadas en errores
    if (metrics.errors.classificationErrors > 5) {
      recommendations.push('Hay muchos errores de clasificación. Mejore el algoritmo de clasificación.');
    }

    if (metrics.errors.lowConfidenceSegments > 10) {
      recommendations.push('Hay muchos segmentos de baja confianza. Considere mejorar el procesamiento de texto.');
    }

    return recommendations;
  }

  /**
   * Calcular score de mejora
   */
  private static calculateImprovementScore(metrics: SOAPMetrics): number {
    let score = 100;

    // Penalización por baja precisión
    score -= (1 - metrics.accuracy.overall) * 40;

    // Penalización por baja calidad
    score -= (1 - metrics.quality.completeness) * 30;
    score -= metrics.quality.professionalReview * 20;

    // Penalización por errores
    score -= Math.min(metrics.errors.classificationErrors * 2, 20);
    score -= Math.min(metrics.errors.lowConfidenceSegments, 10);

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Analizar patrones de errores
   */
  static analyzeErrorPatterns(
    originalResult: AdvancedSOAPResult,
    auditActions: AuditAction[]
  ): ErrorAnalysis[] {
    
    const errorPatterns: ErrorAnalysis[] = [];

    // Análisis de errores de clasificación
    const classificationErrors = auditActions.filter(action => action.type === 'RECLASSIFY');
    if (classificationErrors.length > 0) {
      errorPatterns.push({
        errorType: 'CLASSIFICATION',
        frequency: classificationErrors.length,
        impact: classificationErrors.length > 5 ? 'HIGH' : 'MEDIUM',
        segments: classificationErrors.map(action => action.segment_id),
        suggestions: [
          'Mejorar algoritmo de clasificación SOAP',
          'Ajustar umbrales de confianza',
          'Añadir más ejemplos de entrenamiento'
        ]
      });
    }

    // Análisis de contenido faltante
    const missingSections = ['S', 'O', 'A', 'P'].filter(section => {
      const sectionSegments = originalResult.classifiedSegments.filter(
        segment => segment.soap_section === section
      );
      return sectionSegments.length === 0;
    });

    if (missingSections.length > 0) {
      errorPatterns.push({
        errorType: 'MISSING_CONTENT',
        frequency: missingSections.length,
        impact: missingSections.length > 2 ? 'HIGH' : 'MEDIUM',
        segments: missingSections,
        suggestions: [
          'Mejorar cobertura de clasificación',
          'Ajustar prompts de clasificación',
          'Revisar segmentación de texto'
        ]
      });
    }

    // Análisis de baja confianza
    const lowConfidenceSegments = originalResult.classifiedSegments.filter(
      segment => segment.confidence < 0.6
    );

    if (lowConfidenceSegments.length > 0) {
      errorPatterns.push({
        errorType: 'LOW_CONFIDENCE',
        frequency: lowConfidenceSegments.length,
        impact: lowConfidenceSegments.length > 10 ? 'HIGH' : 'MEDIUM',
        segments: lowConfidenceSegments.map(s => s.id),
        suggestions: [
          'Mejorar calidad de transcripción',
          'Ajustar procesamiento de texto',
          'Añadir más contexto clínico'
        ]
      });
    }

    return errorPatterns;
  }

  /**
   * Exportar métricas para dashboard
   */
  static exportMetricsForDashboard(metrics: SOAPMetrics): any {
    return {
      summary: {
        overallAccuracy: Math.round(metrics.accuracy.overall * 100),
        completeness: Math.round(metrics.quality.completeness * 100),
        processingTime: metrics.performance.processingTime,
        errors: metrics.errors.classificationErrors
      },
      details: {
        sectionAccuracy: Object.entries(metrics.accuracy.bySection).map(([section, accuracy]) => ({
          section,
          accuracy: Math.round(accuracy * 100)
        })),
        confidenceDistribution: Object.entries(metrics.accuracy.byConfidence).map(([level, accuracy]) => ({
          level,
          accuracy: Math.round(accuracy * 100)
        }))
      },
      alerts: this.generateAlerts(metrics)
    };
  }

  /**
   * Generar alertas basadas en métricas
   */
  private static generateAlerts(metrics: SOAPMetrics): any[] {
    const alerts: any[] = [];

    if (metrics.accuracy.overall < 0.7) {
      alerts.push({
        type: 'warning',
        message: 'Precisión general baja',
        severity: 'high'
      });
    }

    if (metrics.quality.professionalReview > 0.4) {
      alerts.push({
        type: 'info',
        message: 'Muchos segmentos requieren revisión profesional',
        severity: 'medium'
      });
    }

    if (metrics.errors.classificationErrors > 5) {
      alerts.push({
        type: 'error',
        message: 'Errores de clasificación frecuentes',
        severity: 'high'
      });
    }

    return alerts;
  }
}

export default SOAPMetricsService; 