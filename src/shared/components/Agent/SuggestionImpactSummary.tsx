import React from 'react';
import { SuggestionType } from '../../../core/types/suggestions';
import { SuggestionTypeMetrics } from '../../../core/types/analytics';

interface SuggestionImpactSummaryProps {
  metricsData: SuggestionTypeMetrics[];
}

/**
 * Componente que muestra un resumen del impacto acumulado por tipo de sugerencia clínica
 */
const SuggestionImpactSummary: React.FC<SuggestionImpactSummaryProps> = ({ metricsData }) => {
  // Obtener el icono y colores según el tipo de sugerencia
  const getTypeIcon = (type: SuggestionType): string => {
    switch (type) {
      case 'recommendation':
        return '💡';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
    }
  };

  const getTypeColorClass = (type: SuggestionType): string => {
    switch (type) {
      case 'recommendation':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getTypeName = (type: SuggestionType): string => {
    switch (type) {
      case 'recommendation':
        return 'Recomendaciones';
      case 'warning':
        return 'Advertencias';
      case 'info':
        return 'Información';
    }
  };

  // Si no hay datos, mostrar mensaje
  if (!metricsData || metricsData.length === 0) {
    return (
      <div className="p-3 border rounded-md bg-gray-50 text-center text-gray-500 text-sm">
        Sin datos de métricas por tipo de sugerencia
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid="suggestion-impact-summary">
      <h4 className="text-md font-medium text-gray-700">
        Impacto por Tipo de Sugerencia
      </h4>

      {metricsData.map((metrics) => (
        <div 
          key={metrics.type}
          className={`p-3 border rounded-md ${getTypeColorClass(metrics.type)}`}
          data-testid={`type-metrics-${metrics.type}`}
        >
          <h5 className="font-medium flex items-center">
            <span className="mr-1">{getTypeIcon(metrics.type)}</span>
            {getTypeName(metrics.type)}
          </h5>
          <div className="mt-1 text-sm">
            Generadas: {metrics.generated} | Aceptadas: {metrics.accepted} | {metrics.acceptanceRate}% 
            {metrics.timeSavedMinutes > 0 && (
              <span> | ⏱️ {metrics.timeSavedMinutes} min ahorrados</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SuggestionImpactSummary; 