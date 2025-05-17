import React, { useState, useEffect } from 'react';
import { getMetricsSummaryByVisit } from '../../../services/UsageAnalyticsService';

/**
 * Props para el componente AgentUsageDashboard
 */
interface AgentUsageDashboardProps {
  visitId: string;
}

/**
 * Componente que muestra un resumen de las métricas de uso del agente para una visita específica
 */
const AgentUsageDashboard: React.FC<AgentUsageDashboardProps> = ({ visitId }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [metrics, setMetrics] = useState<{ 
    generated: number; 
    accepted: number; 
    integrated: number;
  }>({ generated: 0, accepted: 0, integrated: 0 });
  
  // Cargar métricas al montar el componente y cuando cambie el visitId
  useEffect(() => {
    if (visitId) {
      const summary = getMetricsSummaryByVisit(visitId);
      setMetrics(summary);
    }
  }, [visitId]);
  
  // Si no hay métricas, no mostramos nada
  const hasMetrics = metrics.generated > 0 || metrics.accepted > 0 || metrics.integrated > 0;
  if (!hasMetrics) {
    return null;
  }
  
  // Calcular porcentajes para las barras de progreso
  const acceptRate = metrics.generated > 0 
    ? Math.round((metrics.accepted / metrics.generated) * 100) 
    : 0;
    
  const integrationRate = metrics.accepted > 0 
    ? Math.round((metrics.integrated / metrics.accepted) * 100) 
    : 0;

  return (
    <div className="mt-6 mb-6 border rounded-md border-gray-200 bg-white shadow-sm">
      <div className="p-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-800">
          Uso del Asistente Clínico
        </h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-3 py-1 text-sm font-medium rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100"
        >
          {isExpanded ? 'Ocultar detalles' : 'Ver detalles'}
        </button>
      </div>
      
      {/* Resumen compacto siempre visible */}
      <div className="p-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Sugerencias generadas */}
        <div className="bg-gray-50 p-2 rounded-md border border-gray-200">
          <div className="text-xs text-gray-500 uppercase tracking-wider">Generadas</div>
          <div className="text-xl font-semibold text-gray-700">{metrics.generated}</div>
        </div>
        
        {/* Sugerencias aceptadas */}
        <div className="bg-gray-50 p-2 rounded-md border border-gray-200">
          <div className="text-xs text-gray-500 uppercase tracking-wider">Aceptadas</div>
          <div className="text-xl font-semibold text-gray-700">
            {metrics.accepted}
            <span className="text-sm font-normal text-gray-500 ml-1">
              ({acceptRate}%)
            </span>
          </div>
        </div>
        
        {/* Sugerencias integradas */}
        <div className="bg-gray-50 p-2 rounded-md border border-gray-200">
          <div className="text-xs text-gray-500 uppercase tracking-wider">Integradas EMR</div>
          <div className="text-xl font-semibold text-gray-700">
            {metrics.integrated}
            <span className="text-sm font-normal text-gray-500 ml-1">
              ({integrationRate}%)
            </span>
          </div>
        </div>
      </div>
      
      {/* Detalles expandidos */}
      {isExpanded && (
        <div className="p-3 border-t border-gray-200">
          <div className="space-y-4">
            {/* Barra de progreso para tasa de aceptación */}
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Tasa de aceptación</span>
                <span>{acceptRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`${acceptRate >= 70 ? 'bg-green-500' : acceptRate >= 30 ? 'bg-yellow-500' : 'bg-red-500'} h-2 rounded-full`}
                  style={{ width: `${acceptRate}%` }}
                />
              </div>
            </div>
            
            {/* Barra de progreso para tasa de integración */}
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Tasa de integración</span>
                <span>{integrationRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`${integrationRate >= 70 ? 'bg-green-500' : integrationRate >= 30 ? 'bg-yellow-500' : 'bg-red-500'} h-2 rounded-full`}
                  style={{ width: `${integrationRate}%` }}
                />
              </div>
            </div>
            
            {/* Texto informativo */}
            <div className="text-xs text-gray-600 mt-2">
              <p>
                De {metrics.generated} sugerencias generadas por el agente, {metrics.accepted} fueron aceptadas ({acceptRate}%) 
                y {metrics.integrated} se integraron en el EMR ({integrationRate}% de las aceptadas).
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentUsageDashboard; 