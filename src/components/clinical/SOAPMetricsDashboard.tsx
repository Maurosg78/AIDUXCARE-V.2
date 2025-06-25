/**
 * STATS: SOAP METRICS DASHBOARD - PANEL DE MÉTRICAS DE PRECISIÓN
 * 
 * Dashboard para visualizar métricas de precisión SOAP y análisis de auditoría
 * 
 * @author AiDuxCare Team
 * @date Junio 2025
 * @version 1.0
 */

import React, { useState, useEffect } from 'react';
import { SOAPMetrics, MetricsReport, ErrorAnalysis } from '../../services/SOAPMetricsService';
import { AdvancedSOAPResult, AuditAction } from '../../services/SOAPClassifierV2Service';

interface SOAPMetricsDashboardProps {
  originalResult: AdvancedSOAPResult;
  auditActions: AuditAction[];
  finalSOAP: any;
  sessionId: string;
  onMetricsUpdate?: (metrics: SOAPMetrics) => void;
}

const SOAPMetricsDashboard: React.FC<SOAPMetricsDashboardProps> = ({
  originalResult,
  auditActions,
  finalSOAP,
  sessionId,
  onMetricsUpdate
}) => {
  const [metrics, setMetrics] = useState<SOAPMetrics | null>(null);
  const [report, setReport] = useState<MetricsReport | null>(null);
  const [errorPatterns, setErrorPatterns] = useState<ErrorAnalysis[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'errors' | 'recommendations'>('overview');

  useEffect(() => {
    if (originalResult && auditActions && finalSOAP) {
      // Importar dinámicamente el servicio de métricas
      import('../../services/SOAPMetricsService').then(({ SOAPMetricsService }) => {
        const calculatedMetrics = SOAPMetricsService.calculateSOAPMetrics(
          originalResult,
          auditActions,
          finalSOAP
        );
        
        const metricsReport = SOAPMetricsService.generateMetricsReport(
          sessionId,
          originalResult,
          auditActions,
          finalSOAP
        );
        
        const patterns = SOAPMetricsService.analyzeErrorPatterns(
          originalResult,
          auditActions
        );

        setMetrics(calculatedMetrics);
        setReport(metricsReport);
        setErrorPatterns(patterns);
        
        if (onMetricsUpdate) {
          onMetricsUpdate(calculatedMetrics);
        }
      });
    }
  }, [originalResult, auditActions, finalSOAP, sessionId, onMetricsUpdate]);

  if (!metrics || !report) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-[#BDC3C7]/20">
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5DA5A3] mx-auto mb-2"></div>
            <p className="text-[#2C3E50]/60">Calculando métricas...</p>
          </div>
        </div>
      </div>
    );
  }

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 0.8) return 'text-green-600 bg-green-100';
    if (accuracy >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getQualityColor = (quality: number) => {
    if (quality >= 0.8) return 'text-green-600';
    if (quality >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-[#BDC3C7]/20">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-[#5DA5A3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="text-lg font-semibold text-[#2C3E50]">Métricas de Precisión SOAP</h3>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-[#2C3E50]/60">Score de Mejora:</span>
          <span className={`px-2 py-1 rounded text-sm font-medium ${getAccuracyColor(report.improvementScore / 100)}`}>
            {report.improvementScore}/100
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-[#F7F7F7] p-1 rounded-lg">
        {[
          { id: 'overview', label: 'Resumen', icon: 'STATS:' },
          { id: 'details', label: 'Detalles', icon: 'SEARCH' },
          { id: 'errors', label: 'Errores', icon: 'WARNING:' },
          { id: 'recommendations', label: 'Recomendaciones', icon: 'TIP' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-[#5DA5A3] shadow-sm'
                : 'text-[#2C3E50]/60 hover:text-[#2C3E50]'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Métricas Principales */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#F7F7F7] p-4 rounded-lg">
                <div className="text-2xl font-bold text-[#5DA5A3]">
                  {Math.round(metrics.accuracy.overall * 100)}%
                </div>
                <div className="text-sm text-[#2C3E50]/60">Precisión General</div>
              </div>
              
              <div className="bg-[#F7F7F7] p-4 rounded-lg">
                <div className="text-2xl font-bold text-[#5DA5A3]">
                  {Math.round(metrics.quality.completeness * 100)}%
                </div>
                <div className="text-sm text-[#2C3E50]/60">Completitud</div>
              </div>
              
              <div className="bg-[#F7F7F7] p-4 rounded-lg">
                <div className="text-2xl font-bold text-[#5DA5A3]">
                  {metrics.performance.processingTime}ms
                </div>
                <div className="text-sm text-[#2C3E50]/60">Tiempo Procesamiento</div>
              </div>
              
              <div className="bg-[#F7F7F7] p-4 rounded-lg">
                <div className="text-2xl font-bold text-[#5DA5A3]">
                  {auditActions.length}
                </div>
                <div className="text-sm text-[#2C3E50]/60">Acciones Auditoría</div>
              </div>
            </div>

            {/* Precisión por Sección */}
            <div className="bg-[#F7F7F7] p-4 rounded-lg">
              <h4 className="font-semibold text-[#2C3E50] mb-3">Precisión por Sección SOAP</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(metrics.accuracy.bySection).map(([section, accuracy]) => (
                  <div key={section} className="text-center">
                    <div className={`text-lg font-bold ${getAccuracyColor(accuracy)}`}>
                      {Math.round(accuracy * 100)}%
                    </div>
                    <div className="text-sm text-[#2C3E50]/60">Sección {section}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Alertas */}
            {errorPatterns.length > 0 && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <h4 className="font-semibold text-red-800 mb-2">WARNING: Alertas Detectadas</h4>
                <div className="space-y-2">
                  {errorPatterns.slice(0, 3).map((pattern, index) => (
                    <div key={index} className="text-sm text-red-700">
                      • {pattern.errorType}: {pattern.frequency} ocurrencias
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'details' && (
          <div className="space-y-6">
            {/* Distribución de Confianza */}
            <div className="bg-[#F7F7F7] p-4 rounded-lg">
              <h4 className="font-semibold text-[#2C3E50] mb-3">Distribución de Confianza</h4>
              <div className="grid grid-cols-3 gap-4">
                {Object.entries(metrics.accuracy.byConfidence).map(([level, accuracy]) => (
                  <div key={level} className="text-center">
                    <div className={`text-lg font-bold ${getAccuracyColor(accuracy)}`}>
                      {Math.round(accuracy * 100)}%
                    </div>
                    <div className="text-sm text-[#2C3E50]/60">Confianza {level}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Métricas de Calidad */}
            <div className="bg-[#F7F7F7] p-4 rounded-lg">
              <h4 className="font-semibold text-[#2C3E50] mb-3">Métricas de Calidad</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[#2C3E50]">Consistencia</span>
                  <span className={`font-semibold ${getQualityColor(metrics.quality.consistency)}`}>
                    {Math.round(metrics.quality.consistency * 100)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#2C3E50]">Revisión Profesional</span>
                  <span className={`font-semibold ${getQualityColor(1 - metrics.quality.professionalReview)}`}>
                    {Math.round((1 - metrics.quality.professionalReview) * 100)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Métricas de Rendimiento */}
            <div className="bg-[#F7F7F7] p-4 rounded-lg">
              <h4 className="font-semibold text-[#2C3E50] mb-3">Rendimiento</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[#2C3E50]">Uso de Fallback</span>
                  <span className="font-semibold text-[#5DA5A3]">
                    {metrics.performance.fallbackUsage ? 'Sí' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#2C3E50]">Segmentos Clasificados</span>
                  <span className="font-semibold text-[#5DA5A3]">
                    {originalResult.classifiedSegments.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'errors' && (
          <div className="space-y-6">
            {/* Resumen de Errores */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <div className="text-2xl font-bold text-red-600">
                  {metrics.errors.classificationErrors}
                </div>
                <div className="text-sm text-red-700">Errores Clasificación</div>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <div className="text-2xl font-bold text-yellow-600">
                  {metrics.errors.missingSections}
                </div>
                <div className="text-sm text-yellow-700">Secciones Faltantes</div>
              </div>
              
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <div className="text-2xl font-bold text-orange-600">
                  {metrics.errors.lowConfidenceSegments}
                </div>
                <div className="text-sm text-orange-700">Baja Confianza</div>
              </div>
            </div>

            {/* Análisis de Patrones de Error */}
            {errorPatterns.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-semibold text-[#2C3E50]">Análisis de Patrones de Error</h4>
                {errorPatterns.map((pattern, index) => (
                  <div key={index} className="bg-[#F7F7F7] p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium text-[#2C3E50]">{pattern.errorType}</h5>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        pattern.impact === 'HIGH' ? 'bg-red-100 text-red-600' :
                        pattern.impact === 'MEDIUM' ? 'bg-yellow-100 text-yellow-600' :
                        'bg-green-100 text-green-600'
                      }`}>
                        {pattern.impact}
                      </span>
                    </div>
                    <div className="text-sm text-[#2C3E50]/60 mb-2">
                      Frecuencia: {pattern.frequency} ocurrencias
                    </div>
                    <div className="text-sm text-[#2C3E50]">
                      <strong>Sugerencias:</strong>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        {pattern.suggestions.map((suggestion, idx) => (
                          <li key={idx} className="text-[#2C3E50]/70">{suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'recommendations' && (
          <div className="space-y-6">
            {/* Recomendaciones */}
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-3">TIP Recomendaciones de Mejora</h4>
              <div className="space-y-3">
                {report.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span className="text-blue-700">{recommendation}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Score de Mejora */}
            <div className="bg-[#F7F7F7] p-4 rounded-lg">
              <h4 className="font-semibold text-[#2C3E50] mb-3">Score de Mejora</h4>
              <div className="text-center">
                <div className={`text-4xl font-bold ${getAccuracyColor(report.improvementScore / 100)}`}>
                  {report.improvementScore}/100
                </div>
                <div className="text-sm text-[#2C3E50]/60 mt-2">
                  {report.improvementScore >= 80 ? 'Excelente calidad' :
                   report.improvementScore >= 60 ? 'Buena calidad' :
                   report.improvementScore >= 40 ? 'Calidad aceptable' :
                   'Requiere mejoras significativas'}
                </div>
              </div>
            </div>

            {/* Acciones Sugeridas */}
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-3">SUCCESS: Acciones Sugeridas</h4>
              <div className="space-y-2">
                <div className="text-sm text-green-700">
                  • Revisar clasificaciones de baja confianza
                </div>
                <div className="text-sm text-green-700">
                  • Validar secciones faltantes
                </div>
                <div className="text-sm text-green-700">
                  • Ajustar umbrales de clasificación si es necesario
                </div>
                <div className="text-sm text-green-700">
                  • Documentar feedback para mejora del modelo
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-[#BDC3C7]/30">
        <div className="flex items-center justify-between text-xs text-[#2C3E50]/60">
          <div>
            <span>Session ID: {sessionId}</span>
          </div>
          <div>
            <span>Última actualización: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SOAPMetricsDashboard; 