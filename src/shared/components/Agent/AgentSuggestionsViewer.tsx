import React, { useState, useMemo } from 'react';
import { AgentSuggestion } from '../../../core/agent/ClinicalAgent';
import AgentSuggestionExplainer from './AgentSuggestionExplainer';
import AgentSuggestionFeedbackActions from './AgentSuggestionFeedbackActions';
import { AgentSuggestionFeedback } from './AgentSuggestionFeedbackActions';

/**
 * Props para el componente AgentSuggestionsViewer
 */
interface AgentSuggestionsViewerProps {
  visitId: string;
  suggestions: AgentSuggestion[];
  onIntegrateSuggestions?: (count: number) => void;
  userId?: string;
}

/**
 * Componente que muestra las sugerencias generadas por el agente clínico
 */
const AgentSuggestionsViewer: React.FC<AgentSuggestionsViewerProps> = ({ 
  visitId,
  suggestions,
  onIntegrateSuggestions,
  userId = 'admin-test-001'
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [suggestionsWithFeedback, setSuggestionsWithFeedback] = useState<{[id: string]: AgentSuggestionFeedback}>({});
  const [hasIntegratedToEMR, setHasIntegratedToEMR] = useState(false);

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

  // Número de sugerencias aceptadas
  const acceptedCount = useMemo(() => {
    return Object.values(suggestionsWithFeedback).filter(feedback => feedback === 'accept').length;
  }, [suggestionsWithFeedback]);

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

  // Manejar el feedback de una sugerencia
  const handleFeedback = (suggestionId: string, feedback: AgentSuggestionFeedback) => {
    setSuggestionsWithFeedback(prev => ({
      ...prev,
      [suggestionId]: feedback
    }));
  };

  // Integrar sugerencias aceptadas al EMR
  const handleIntegrateToEMR = () => {
    if (acceptedCount > 0 && onIntegrateSuggestions && !hasIntegratedToEMR) {
      onIntegrateSuggestions(acceptedCount);
      setHasIntegratedToEMR(true);
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
            <>
              {/* Botón para integrar al EMR */}
              {acceptedCount > 0 && !hasIntegratedToEMR && (
                <div className="mb-4 p-3 bg-green-50 border border-green-100 rounded-md flex justify-between items-center">
                  <div>
                    <p className="text-sm text-green-800">
                      <span className="font-medium">{acceptedCount}</span> sugerencias aceptadas listas para integrar
                    </p>
                  </div>
                  <button
                    onClick={handleIntegrateToEMR}
                    className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Integrar al EMR
                  </button>
                </div>
              )}

              {/* Confirmación de integración */}
              {hasIntegratedToEMR && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-800 flex items-center">
                    <span className="mr-2">✅</span>
                    {acceptedCount} sugerencias han sido integradas en el registro clínico
                  </p>
                </div>
              )}

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
                          visitId={visitId}
                          userId={userId}
                          onFeedback={(feedback) => handleFeedback(suggestion.id, feedback)} 
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
                          visitId={visitId}
                          userId={userId}
                          onFeedback={(feedback) => handleFeedback(suggestion.id, feedback)} 
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
                          visitId={visitId}
                          userId={userId}
                          onFeedback={(feedback) => handleFeedback(suggestion.id, feedback)} 
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
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