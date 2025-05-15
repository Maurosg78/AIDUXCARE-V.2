import React, { useState, useMemo } from 'react';
import { AgentSuggestion } from '../../../core/agent/ClinicalAgent';
import AgentSuggestionExplainer from './AgentSuggestionExplainer';
import AgentSuggestionFeedbackActions from './AgentSuggestionFeedbackActions';

/**
 * Props para el componente AgentSuggestionsViewer
 */
interface AgentSuggestionsViewerProps {
  visitId: string;
  suggestions: AgentSuggestion[];
}

/**
 * Componente que muestra las sugerencias generadas por el agente clínico
 */
const AgentSuggestionsViewer: React.FC<AgentSuggestionsViewerProps> = ({ suggestions }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Agrupar sugerencias por tipo
  const groupedSuggestions = useMemo(() => {
    const grouped = {
      recommendation: [] as AgentSuggestion[],
      warning: [] as AgentSuggestion[],
      info: [] as AgentSuggestion[]
    };

    suggestions.forEach(suggestion => {
      grouped[suggestion.type].push(suggestion);
    });

    return grouped;
  }, [suggestions]);

  // Obtener el emoji correspondiente al tipo de sugerencia
  const getTypeIcon = (type: 'recommendation' | 'warning' | 'info'): string => {
    switch (type) {
      case 'recommendation':
        return '💡';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
    }
  };

  // Obtener la clase CSS para el color de fondo según el tipo
  const getTypeColorClass = (type: 'recommendation' | 'warning' | 'info'): string => {
    switch (type) {
      case 'recommendation':
        return 'bg-blue-50 border-blue-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-green-50 border-green-200';
    }
  };

  return (
    <div className="mt-8 border rounded-md border-gray-200 bg-white shadow-sm">
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-800 flex items-center">
          Sugerencias del Agente Clínico
          <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
            {suggestions.length}
          </span>
        </h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-3 py-1 text-sm font-medium rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100"
        >
          {isExpanded ? 'Ocultar sugerencias' : 'Ver sugerencias del agente'}
        </button>
      </div>

      {isExpanded && (
        <div className="p-4">
          {suggestions.length === 0 ? (
            <p className="text-center text-gray-500 py-4">
              Este agente no tiene sugerencias para esta visita.
            </p>
          ) : (
            <div className="space-y-6">
              {/* Recomendaciones */}
              {groupedSuggestions.recommendation.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-md font-medium text-gray-700 flex items-center">
                    {getTypeIcon('recommendation')} Recomendaciones ({groupedSuggestions.recommendation.length})
                  </h4>
                  {groupedSuggestions.recommendation.map(suggestion => (
                    <div 
                      key={suggestion.id} 
                      className={`p-3 rounded-md border ${getTypeColorClass('recommendation')}`}
                    >
                      <p className="text-sm text-gray-800 mb-2">{suggestion.content}</p>
                      <p className="text-xs text-gray-500">Fuente: {suggestion.sourceBlockId}</p>
                      <AgentSuggestionExplainer suggestion={suggestion} />
                      <AgentSuggestionFeedbackActions 
                        suggestion={suggestion} 
                        onFeedback={() => {
                          // El manejador ya muestra en consola el feedback dentro del componente
                        }} 
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Advertencias */}
              {groupedSuggestions.warning.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-md font-medium text-gray-700 flex items-center">
                    {getTypeIcon('warning')} Advertencias ({groupedSuggestions.warning.length})
                  </h4>
                  {groupedSuggestions.warning.map(suggestion => (
                    <div 
                      key={suggestion.id} 
                      className={`p-3 rounded-md border ${getTypeColorClass('warning')}`}
                    >
                      <p className="text-sm text-gray-800 mb-2">{suggestion.content}</p>
                      <p className="text-xs text-gray-500">Fuente: {suggestion.sourceBlockId}</p>
                      <AgentSuggestionExplainer suggestion={suggestion} />
                      <AgentSuggestionFeedbackActions 
                        suggestion={suggestion} 
                        onFeedback={() => {
                          // El manejador ya muestra en consola el feedback dentro del componente
                        }} 
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Información */}
              {groupedSuggestions.info.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-md font-medium text-gray-700 flex items-center">
                    {getTypeIcon('info')} Información ({groupedSuggestions.info.length})
                  </h4>
                  {groupedSuggestions.info.map(suggestion => (
                    <div 
                      key={suggestion.id} 
                      className={`p-3 rounded-md border ${getTypeColorClass('info')}`}
                    >
                      <p className="text-sm text-gray-800 mb-2">{suggestion.content}</p>
                      <p className="text-xs text-gray-500">Fuente: {suggestion.sourceBlockId}</p>
                      <AgentSuggestionExplainer suggestion={suggestion} />
                      <AgentSuggestionFeedbackActions 
                        suggestion={suggestion} 
                        onFeedback={() => {
                          // El manejador ya muestra en consola el feedback dentro del componente
                        }} 
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          <div className="mt-4 text-right">
            <p className="text-xs text-gray-500">
              Total de sugerencias: {suggestions.length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentSuggestionsViewer; 