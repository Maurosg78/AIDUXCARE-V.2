import React from 'react';

interface SuggestionMetrics {
  totalSuggestions: number;
  acceptedSuggestions: number;
  rejectedSuggestions: number;
  pendingSuggestions: number;
  averageResponseTime: number;
  successRate: number;
}

interface AgentSuggestionMetricsProps {
  metrics: SuggestionMetrics;
  isLoading?: boolean;
  error?: string;
}

const AgentSuggestionMetrics: React.FC<AgentSuggestionMetricsProps> = ({
  metrics,
  isLoading = false,
  error
}) => {
  const formatPercentage = (rate: number): string => {
    return `${(rate * 100).toFixed(1)}%`;
  };

  const formatTime = (time: number): string => {
    return `${time.toFixed(1)}s`;
  };

  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <div className="text-gray-600">Cargando métricas...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  const metricItems = [
    {
      label: 'Total de Sugerencias',
      value: metrics.totalSuggestions.toString(),
      color: 'text-blue-600'
    },
    {
      label: 'Sugerencias Aceptadas',
      value: metrics.acceptedSuggestions.toString(),
      color: 'text-green-600'
    },
    {
      label: 'Sugerencias Rechazadas',
      value: metrics.rejectedSuggestions.toString(),
      color: 'text-red-600'
    },
    {
      label: 'Sugerencias Pendientes',
      value: metrics.pendingSuggestions.toString(),
      color: 'text-yellow-600'
    },
    {
      label: 'Tiempo Promedio de Respuesta',
      value: formatTime(metrics.averageResponseTime),
      color: 'text-purple-600'
    },
    {
      label: 'Tasa de Éxito',
      value: formatPercentage(metrics.successRate),
      color: 'text-indigo-600'
    }
  ];

  return (
    <section 
      aria-label="Métricas de sugerencias"
      className="bg-white rounded-lg shadow-sm border p-6"
    >
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Métricas de Sugerencias
      </h2>
      
      <ul aria-label="Lista de métricas" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metricItems.map((item, index) => (
          <li key={index} className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">{item.label}</div>
            <div className={`text-2xl font-bold ${item.color}`}>
              {item.value}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default AgentSuggestionMetrics; 