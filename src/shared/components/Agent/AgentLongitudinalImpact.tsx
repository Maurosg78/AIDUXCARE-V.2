import React, { useEffect, useState } from 'react';
import { SuggestionType } from '../../../core/types/suggestions';
import { LongitudinalImpactByType } from '../../../core/types/analytics';
import { getLongitudinalImpactByPatient } from '../../../services/UsageAnalyticsService';

interface AgentLongitudinalImpactProps {
  patientId: string;
}

/**
 * Componente que muestra el impacto longitudinal acumulado de las sugerencias
 * generadas por el agente clínico, agrupado por tipo de sugerencia, para todo
 * el historial del paciente.
 */
const AgentLongitudinalImpact: React.FC<AgentLongitudinalImpactProps> = ({ patientId }) => {
  const [impactData, setImpactData] = useState<LongitudinalImpactByType[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar datos al montar el componente o cuando cambia el patientId
  useEffect(() => {
    const loadImpactData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await getLongitudinalImpactByPatient(patientId);
        setImpactData(data);
      } catch (err) {
        console.error('Error al cargar datos de impacto longitudinal:', err);
        setError('No se pudieron cargar las métricas acumuladas');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (patientId) {
      loadImpactData();
    }
  }, [patientId]);

  // Obtener icono según el tipo de sugerencia
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

  // Obtener colores según el tipo de sugerencia
  const getTypeColorClasses = (type: SuggestionType): { 
    card: string;
    bar: string;
    text: string;
  } => {
    switch (type) {
      case 'recommendation':
        return {
          card: 'bg-blue-50 border-blue-200',
          bar: 'bg-blue-500',
          text: 'text-blue-800'
        };
      case 'warning':
        return {
          card: 'bg-yellow-50 border-yellow-200',
          bar: 'bg-yellow-500',
          text: 'text-yellow-800'
        };
      case 'info':
        return {
          card: 'bg-gray-50 border-gray-200',
          bar: 'bg-gray-500',
          text: 'text-gray-800'
        };
    }
  };

  // Obtener nombre legible del tipo de sugerencia
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

  // Encontrar el valor máximo para normalizar los gráficos de barras
  const maxGeneratedValue = Math.max(
    ...impactData.map(data => data.totalGenerated),
    1 // Evitar división por cero
  );

  // Mostrar mensaje de carga
  if (isLoading) {
    return (
      <div className="p-4 text-center text-gray-500">
        Cargando métricas longitudinales...
      </div>
    );
  }

  // Mostrar mensaje de error
  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        {error}
      </div>
    );
  }

  // Mostrar mensaje cuando no hay datos
  if (!impactData || impactData.length === 0) {
    return (
      <div 
        className="p-4 border rounded-md bg-gray-50 text-center text-gray-500"
        data-testid="no-impact-data"
      >
        No hay métricas acumuladas disponibles para este paciente.
      </div>
    );
  }

  return (
    <div className="border rounded-md border-gray-200 bg-white shadow-sm" data-testid="agent-longitudinal-impact">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h3 className="text-lg font-medium text-gray-800">
          Impacto clínico longitudinal
        </h3>
        <p className="text-sm text-gray-600">
          Métricas acumuladas de todas las visitas de este paciente
        </p>
      </div>
      
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {impactData.map((impact) => (
            <div 
              key={impact.type}
              className={`p-4 border rounded-md ${getTypeColorClasses(impact.type).card}`}
              data-testid={`impact-card-${impact.type}`}
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className={`text-md font-medium flex items-center ${getTypeColorClasses(impact.type).text}`}>
                  <span className="mr-1">{getTypeIcon(impact.type)}</span>
                  {getTypeName(impact.type)}
                </h4>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  {impact.visitCount} visitas
                </span>
              </div>
              
              {/* Métricas principales */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                  <div className="text-xs text-gray-500">Generadas</div>
                  <div className="text-xl font-semibold">{impact.totalGenerated}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Aceptadas</div>
                  <div className="text-xl font-semibold">{impact.totalAccepted}</div>
                </div>
              </div>
              
              {/* Barra de porcentaje de aceptación */}
              <div className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span>Tasa de aceptación</span>
                  <span className="font-medium">{impact.acceptanceRate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className={`${getTypeColorClasses(impact.type).bar} h-2.5 rounded-full`}
                    style={{ width: `${impact.acceptanceRate}%` }}
                    data-testid={`acceptance-bar-${impact.type}`}
                  ></div>
                </div>
              </div>
              
              {/* Barra de cantidad generada (normalizada) */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Tiempo ahorrado</span>
                  <span className="font-medium">{impact.totalTimeSavedMinutes} min</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className={`${getTypeColorClasses(impact.type).bar} h-2.5 rounded-full`}
                    style={{ width: `${(impact.totalGenerated / maxGeneratedValue) * 100}%` }}
                    data-testid={`time-bar-${impact.type}`}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AgentLongitudinalImpact; 