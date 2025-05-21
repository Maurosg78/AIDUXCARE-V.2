import React, { useState, useMemo } from 'react';
import { AgentSuggestion, SuggestionType, SuggestionField } from '@/types/agent';
import AgentSuggestionExplainer from './AgentSuggestionExplainer';
import AgentSuggestionFeedbackActions from './AgentSuggestionFeedbackActions';
import { trackMetric } from '@/services/UsageAnalyticsService';

/**
 * Props para el componente AgentSuggestionsViewer
 */
interface AgentSuggestionsViewerProps {
  visitId: string;
  suggestions: AgentSuggestion[];
  onIntegrateSuggestions?: (count: number) => void;
  userId?: string;
  patientId?: string;
  onSuggestionAccepted: (suggestion: AgentSuggestion) => void;
  onSuggestionRejected: (suggestion: AgentSuggestion) => void;
}

/**
 * Componente que muestra las sugerencias generadas por el agente clínico
 */
const AgentSuggestionsViewer: React.FC<AgentSuggestionsViewerProps> = ({ 
  visitId,
  suggestions,
  onIntegrateSuggestions,
  userId = 'admin-test-001',
  patientId = 'patient-default',
  onSuggestionAccepted,
  onSuggestionRejected
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [integratedSuggestions, setIntegratedSuggestions] = useState<Set<string>>(new Set());

  // Agrupar sugerencias por tipo
  const groupedSuggestions = useMemo(() => {
    const grouped: Partial<Record<SuggestionType, AgentSuggestion[]>> = {
      recommendation: [],
      warning: [],
      info: []
    };

    suggestions.forEach(suggestion => {
      if (suggestion.type in grouped) {
        grouped[suggestion.type]?.push(suggestion);
      }
    });

    return grouped;
  }, [suggestions]);

  // Obtener el emoji correspondiente al tipo de sugerencia
  const getTypeIcon = (type: SuggestionType): string => {
    switch (type) {
      case 'recommendation':
        return '💡';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return 'ℹ️';
    }
  };

  // Obtener la clase CSS para el color de fondo según el tipo
  const getTypeColorClass = (type: SuggestionType): string => {
    switch (type) {
      case 'recommendation':
        return 'bg-blue-50 border-blue-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const handleSuggestionAccepted = (suggestion: AgentSuggestion) => {
    trackMetric(
      'suggestions_integrated',
      userId,
      visitId,
      1,
      {
        suggestion_id: suggestion.id,
        suggestion_type: suggestion.type,
        suggestion_field: suggestion.field
      }
    );
    onSuggestionAccepted(suggestion);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          Sugerencias del Copiloto ({suggestions.length})
        </h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm text-blue-600 hover:text-blue-800"
          data-testid="toggle-suggestions"
        >
          {isExpanded ? 'Ocultar' : 'Mostrar'}
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-6">
          {Object.entries(groupedSuggestions).map(([type, typeSuggestions]) => 
            typeSuggestions && typeSuggestions.length > 0 && (
              <div key={type} className="space-y-3" data-testid={`${type}-section`}>
                <h4 className="text-md font-medium text-gray-700 flex items-center">
                  {getTypeIcon(type as SuggestionType)} {type} ({typeSuggestions.length})
                </h4>
                {typeSuggestions.map(suggestion => (
                  <div 
                    key={suggestion.id} 
                    className={`p-3 rounded-md border ${
                      integratedSuggestions.has(suggestion.id) 
                        ? 'bg-blue-50 border-blue-300' 
                        : getTypeColorClass(suggestion.type)
                    }`}
                  >
                    <p className="text-sm text-gray-800 mb-2">{suggestion.content}</p>
                    <p className="text-xs text-gray-500">Campo: {suggestion.field}</p>
                    <p className="text-xs text-gray-500">Fuente: {suggestion.sourceBlockId}</p>
                    <AgentSuggestionExplainer suggestion={suggestion} />
                    <AgentSuggestionFeedbackActions 
                      visitId={visitId}
                      userId={userId}
                      suggestion={suggestion}
                      onAccept={() => handleSuggestionAccepted(suggestion)}
                      onReject={() => onSuggestionRejected(suggestion)}
                      isIntegrated={integratedSuggestions.has(suggestion.id)}
                    />
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      )}
      
      <div className="mt-4 text-right">
        <p className="text-xs text-gray-500">
          Total de sugerencias: {suggestions.length}
          {integratedSuggestions.size > 0 && ` (${integratedSuggestions.size} integradas)`}
        </p>
      </div>
    </div>
  );
};

AgentSuggestionsViewer.displayName = 'AgentSuggestionsViewer';

export default AgentSuggestionsViewer; 