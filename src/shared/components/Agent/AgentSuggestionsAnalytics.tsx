import React, { useState, useMemo } from 'react';
import { getMetricsSummaryByVisit } from '../../../services/UsageAnalyticsService';

/**
 * Tipo de sugerencia del agente clínico
 */
interface AgentSuggestion {
  id: string;
  type: 'recommendation' | 'warning' | 'info';
  content: string;
  sourceBlockId: string;
  feedback?: 'accept' | 'reject' | 'defer';
}

/**
 * Props para el componente AgentSuggestionsAnalytics
 */
interface AgentSuggestionsAnalyticsProps {
  suggestions: AgentSuggestion[];
  visitId: string;
}

/**
 * Componente que muestra un resumen visual del impacto clínico de las sugerencias del agente
 */
const AgentSuggestionsAnalytics: React.FC<AgentSuggestionsAnalyticsProps> = ({ suggestions, visitId }) => {
  // Estado para controlar la expansión/colapso de los detalles
  const [isExpanded, setIsExpanded] = useState(false);

  // Calcular estadísticas de las sugerencias
  const stats = useMemo(() => {
    // Total de sugerencias
    const total = suggestions.length;

    // Conteo por tipo
    const typeCount = {
      recommendation: suggestions.filter(s => s.type === 'recommendation').length,
      warning: suggestions.filter(s => s.type === 'warning').length,
      info: suggestions.filter(s => s.type === 'info').length
    };

    // Conteo por feedback
    const feedbackCount = {
      accept: suggestions.filter(s => s.feedback === 'accept').length,
      reject: suggestions.filter(s => s.feedback === 'reject').length,
      defer: suggestions.filter(s => s.feedback === 'defer').length,
      pending: suggestions.filter(s => !s.feedback).length
    };

    // Cálculo de métricas
    const adherenceRate = total > 0 
      ? Math.round((feedbackCount.accept / total) * 100) 
      : 0;

    // Conteo de advertencias ignoradas (rechazadas o pendientes)
    const ignoredWarnings = suggestions
      .filter(s => s.type === 'warning' && (s.feedback === 'reject' || !s.feedback))
      .length;

    // Nivel de riesgo clínico basado en advertencias ignoradas
    let riskLevel: 'bajo' | 'medio' | 'alto' = 'bajo';
    if (ignoredWarnings > 0) {
      riskLevel = ignoredWarnings >= 2 ? 'alto' : 'medio';
    }

    // Tiempo estimado ahorrado (3 minutos por sugerencia)
    const estimatedTimeSaved = total * 3;

    return {
      total,
      typeCount,
      feedbackCount,
      adherenceRate,
      ignoredWarnings,
      riskLevel,
      estimatedTimeSaved
    };
  }, [suggestions]);

  // Obtener métricas adicionales del servicio de analytics
  const metricsData = useMemo(() => {
    if (!visitId) return null;
    return getMetricsSummaryByVisit(visitId);
  }, [visitId]);

  // Calcular la altura máxima para normalizar el gráfico de barras
  const maxBarValue = useMemo(() => {
    return Math.max(
      stats.typeCount.recommendation,
      stats.typeCount.warning,
      stats.typeCount.info
    );
  }, [stats.typeCount]);

  // Generar etiquetas para el porcentaje de adherencia
  const getAdherenceLabel = (rate: number): string => {
    if (rate >= 80) return 'Excelente';
    if (rate >= 60) return 'Buena';
    if (rate >= 40) return 'Regular';
    if (rate >= 20) return 'Baja';
    return 'Mínima';
  };

  // Si no hay sugerencias, no mostrar nada
  if (suggestions.length === 0) {
    return null;
  }

  // Obtener color de riesgo para el resumen textual
  const getRiskColorClass = (level: 'bajo' | 'medio' | 'alto'): string => {
    switch (level) {
      case 'bajo': return 'text-green-600';
      case 'medio': return 'text-yellow-600';
      case 'alto': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="mt-6 border rounded-md border-gray-200 bg-white shadow-sm">
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-800 flex items-center">
          Análisis de Sugerencias
          <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
            {stats.total}
          </span>
        </h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-3 py-1 text-sm font-medium rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100"
        >
          {isExpanded ? 'Ocultar detalles' : 'Ver detalles'}
        </button>
      </div>

      {/* Resumen compacto siempre visible */}
      <div className="p-4 grid grid-cols-1 sm:grid-cols-4 gap-4">
        {/* Scorecard 1: Total de sugerencias */}
        <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
          <div className="text-xs text-gray-500 uppercase tracking-wider">Sugerencias</div>
          <div className="mt-1 flex justify-between items-center">
            <div className="text-2xl font-semibold text-gray-700">{stats.total}</div>
            <div className="text-right">
              <div className="text-xs text-gray-500">Visita #{visitId}</div>
            </div>
          </div>
        </div>

        {/* Scorecard 2: Adherencia */}
        <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
          <div className="text-xs text-gray-500 uppercase tracking-wider">Adherencia</div>
          <div className="mt-1 flex justify-between items-center">
            <div className="text-2xl font-semibold text-gray-700">{stats.adherenceRate}%</div>
            <div className="text-right">
              <div className="text-xs text-white px-2 py-0.5 rounded-full bg-blue-500">
                {getAdherenceLabel(stats.adherenceRate)}
              </div>
            </div>
          </div>
        </div>

        {/* Scorecard 3: Advertencias */}
        <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
          <div className="text-xs text-gray-500 uppercase tracking-wider">Advertencias</div>
          <div className="mt-1 flex justify-between items-center">
            <div className="text-2xl font-semibold text-gray-700">
              {stats.typeCount.warning}
            </div>
            <div className="text-right">
              <div className={`text-xs px-2 py-0.5 rounded-full ${
                stats.typeCount.warning > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {stats.typeCount.warning > 0 ? 'Atención' : 'Ninguna'}
              </div>
            </div>
          </div>
        </div>

        {/* Scorecard 4: Tiempo ahorrado */}
        <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
          <div className="text-xs text-gray-500 uppercase tracking-wider">Tiempo Ahorrado</div>
          <div className="mt-1 flex justify-between items-center">
            <div className="text-2xl font-semibold text-gray-700">
              {metricsData?.estimated_time_saved_minutes || stats.estimatedTimeSaved} min
            </div>
            <div className="text-right">
              <div className="text-xs text-white px-2 py-0.5 rounded-full bg-green-500">
                Eficiencia
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detalles expandidos */}
      {isExpanded && (
        <div className="p-4 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Gráfico de tipos de sugerencia */}
            <div>
              <h4 className="text-md font-medium text-gray-700 mb-3">
                Distribución por Tipo
              </h4>
              <div className="flex items-end h-40 mt-2 space-x-4">
                {/* Barra para recomendaciones */}
                <div className="flex flex-col items-center space-y-1 flex-1">
                  <div 
                    className="bg-blue-500 w-full rounded-t-md"
                    style={{ 
                      height: `${maxBarValue ? (stats.typeCount.recommendation / maxBarValue) * 100 : 0}%`,
                      minHeight: stats.typeCount.recommendation ? '8px' : '0'
                    }}
                  ></div>
                  <div className="text-xs font-medium text-gray-500">{stats.typeCount.recommendation}</div>
                  <div className="text-xs text-gray-500">Recomendaciones</div>
                </div>

                {/* Barra para advertencias */}
                <div className="flex flex-col items-center space-y-1 flex-1">
                  <div 
                    className="bg-yellow-500 w-full rounded-t-md"
                    style={{ 
                      height: `${maxBarValue ? (stats.typeCount.warning / maxBarValue) * 100 : 0}%`,
                      minHeight: stats.typeCount.warning ? '8px' : '0'
                    }}
                  ></div>
                  <div className="text-xs font-medium text-gray-500">{stats.typeCount.warning}</div>
                  <div className="text-xs text-gray-500">Advertencias</div>
                </div>

                {/* Barra para información */}
                <div className="flex flex-col items-center space-y-1 flex-1">
                  <div 
                    className="bg-green-500 w-full rounded-t-md"
                    style={{ 
                      height: `${maxBarValue ? (stats.typeCount.info / maxBarValue) * 100 : 0}%`,
                      minHeight: stats.typeCount.info ? '8px' : '0'
                    }}
                  ></div>
                  <div className="text-xs font-medium text-gray-500">{stats.typeCount.info}</div>
                  <div className="text-xs text-gray-500">Informativas</div>
                </div>
              </div>
            </div>

            {/* Gráfico de feedback del usuario */}
            <div>
              <h4 className="text-md font-medium text-gray-700 mb-3">
                Respuesta del Clínico
              </h4>
              <div className="mt-2 space-y-2">
                {/* Barra para aceptadas */}
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Aceptadas</span>
                    <span>{stats.feedbackCount.accept} de {stats.total}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-green-600 h-2.5 rounded-full" 
                      style={{ width: `${stats.total ? (stats.feedbackCount.accept / stats.total) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>

                {/* Barra para rechazadas */}
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Rechazadas</span>
                    <span>{stats.feedbackCount.reject} de {stats.total}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-red-500 h-2.5 rounded-full" 
                      style={{ width: `${stats.total ? (stats.feedbackCount.reject / stats.total) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>

                {/* Barra para pospuestas */}
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Pospuestas</span>
                    <span>{stats.feedbackCount.defer} de {stats.total}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-yellow-400 h-2.5 rounded-full" 
                      style={{ width: `${stats.total ? (stats.feedbackCount.defer / stats.total) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>

                {/* Barra para pendientes */}
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Pendientes</span>
                    <span>{stats.feedbackCount.pending} de {stats.total}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-gray-400 h-2.5 rounded-full" 
                      style={{ width: `${stats.total ? (stats.feedbackCount.pending / stats.total) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Resumen textual */}
          <div className="mt-6 p-3 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-600">
            <p className="mb-1">
              <strong>Resumen:</strong> Visita #{visitId} tiene {stats.total} sugerencias 
              ({stats.typeCount.recommendation} recomendaciones, {stats.typeCount.warning} advertencias, {stats.typeCount.info} informativas).
            </p>
            <p className="mb-1">
              <strong>Impacto clínico:</strong> {stats.adherenceRate}% de adherencia a sugerencias. 
              {stats.ignoredWarnings > 0 
                ? <span> Se han ignorado <span className={getRiskColorClass(stats.riskLevel)}>{stats.ignoredWarnings} advertencias</span>, lo que representa un riesgo clínico {stats.riskLevel}.</span> 
                : ' No se han ignorado advertencias, lo que sugiere un riesgo clínico bajo.'}
            </p>
            <p>
              <strong>Eficiencia:</strong> Tiempo estimado ahorrado: {metricsData?.estimated_time_saved_minutes || stats.estimatedTimeSaved} minutos.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentSuggestionsAnalytics; 