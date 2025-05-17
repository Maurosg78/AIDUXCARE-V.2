import React, { useState, useMemo } from 'react';
import { AgentSuggestion } from '../../../core/agent/ClinicalAgent';
import AgentSuggestionExplainer from './AgentSuggestionExplainer';
import AgentSuggestionFeedbackActions from './AgentSuggestionFeedbackActions';
import { AgentSuggestionFeedback } from './AgentSuggestionFeedbackActions';
import { EMRFormService } from '../../../core/services/EMRFormService';
import { AuditLogger } from '../../../core/audit/AuditLogger';
import { track } from '../../../services/UsageAnalyticsService';

/**
 * Props para el componente AgentSuggestionsViewer
 */
interface AgentSuggestionsViewerProps {
  visitId: string;
  suggestions: AgentSuggestion[];
  onIntegrateSuggestions?: (count: number) => void;
  userId?: string;
  patientId?: string;
}

/**
 * Componente que muestra las sugerencias generadas por el agente clínico
 */
const AgentSuggestionsViewer: React.FC<AgentSuggestionsViewerProps> = ({ 
  visitId,
  suggestions,
  onIntegrateSuggestions,
  userId = 'admin-test-001',
  patientId = 'patient-default'
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [suggestionsWithFeedback, setSuggestionsWithFeedback] = useState<{[id: string]: AgentSuggestionFeedback}>({});
  const [integratedSuggestions, setIntegratedSuggestions] = useState<Set<string>>(new Set());
  const [hasIntegratedToEMR, setHasIntegratedToEMR] = useState(false);
  const [isIntegrating, setIsIntegrating] = useState(false);

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
    
    if (feedback === 'accept') {
      setIntegratedSuggestions(prev => {
        const updated = new Set(prev);
        updated.add(suggestionId);
        return updated;
      });
    }
  };

  // Integrar sugerencias aceptadas al EMR
  const handleIntegrateToEMR = async () => {
    if (acceptedCount > 0 && !hasIntegratedToEMR && !isIntegrating) {
      setIsIntegrating(true);
      
      try {
        // Obtener todas las sugerencias aceptadas
        const acceptedSuggestionIds = Object.entries(suggestionsWithFeedback)
          .filter(([, feedback]) => feedback === 'accept')
          .map(([id]) => id);
          
        const acceptedSuggestions = suggestions.filter(s => 
          acceptedSuggestionIds.includes(s.id)
        );
        
        // Integrar cada sugerencia aceptada en el EMR
        let integratedCount = 0;
        
        for (const suggestion of acceptedSuggestions) {
          // Mapear el tipo de sugerencia a la sección EMR correspondiente
          const emrSection = EMRFormService.mapSuggestionTypeToEMRSection(suggestion.type);
          
          // Insertar la sugerencia en el EMR usando el nuevo método
          const success = await EMRFormService.insertSuggestedContent(
            visitId,
            emrSection,
            suggestion.content,
            'agent',
            suggestion.id
          );
          
          if (success) {
            integratedCount++;
            
            // Marcar la sugerencia como integrada
            setIntegratedSuggestions(prev => {
              const updated = new Set(prev);
              updated.add(suggestion.id);
              return updated;
            });
            
            // Registrar métrica de integración y campo correspondido
            track('suggestion_field_matched', userId, visitId, 1, {
              suggestion_id: suggestion.id,
              suggestion_type: suggestion.type,
              emr_section: emrSection
            });
          }
        }
        
        // Llamar al callback para notificar la integración si se proporcionó
        if (onIntegrateSuggestions && integratedCount > 0) {
          onIntegrateSuggestions(integratedCount);
          
          // Registrar métrica global de integración
          track('suggestions_integrated', userId, visitId, integratedCount);
        }
        
        // Marcar que ya se han integrado las sugerencias
        setHasIntegratedToEMR(true);
      } catch (error) {
        console.error('Error al integrar sugerencias al EMR:', error);
      } finally {
        setIsIntegrating(false);
      }
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
              {/* Botón para integrar al EMR (solo se muestra si hay sugerencias aceptadas sin integrar) */}
              {acceptedCount > 0 && !hasIntegratedToEMR && integratedSuggestions.size < acceptedCount && (
                <div className="mb-4 p-3 bg-green-50 border border-green-100 rounded-md flex justify-between items-center">
                  <div>
                    <p className="text-sm text-green-800">
                      <span className="font-medium">{acceptedCount}</span> sugerencias aceptadas listas para integrar
                    </p>
                  </div>
                  <button
                    onClick={handleIntegrateToEMR}
                    disabled={isIntegrating}
                    className={`px-3 py-1 text-sm ${isIntegrating ? 'bg-gray-400' : 'bg-green-600'} text-white rounded-md ${isIntegrating ? '' : 'hover:bg-green-700'}`}
                  >
                    {isIntegrating ? 'Integrando...' : 'Integrar al EMR'}
                  </button>
                </div>
              )}

              {/* Confirmación de integración */}
              {hasIntegratedToEMR && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-800 flex items-center">
                    <span className="mr-2">✅</span>
                    {integratedSuggestions.size} sugerencias han sido integradas en el registro clínico
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
                        className={`p-3 rounded-md border ${
                          integratedSuggestions.has(suggestion.id) 
                            ? 'bg-blue-50 border-blue-300' 
                            : getTypeColorClass('recommendation')
                        }`}
                      >
                        <p className="text-sm text-gray-800 mb-2">{suggestion.content}</p>
                        <p className="text-xs text-gray-500">Fuente: {suggestion.sourceBlockId}</p>
                        <AgentSuggestionExplainer suggestion={suggestion} />
                        <AgentSuggestionFeedbackActions 
                          visitId={visitId}
                          userId={userId}
                          suggestion={suggestion}
                          onFeedback={(feedback) => handleFeedback(suggestion.id, feedback)} 
                          isIntegrated={integratedSuggestions.has(suggestion.id)}
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
                        className={`p-3 rounded-md border ${
                          integratedSuggestions.has(suggestion.id) 
                            ? 'bg-blue-50 border-blue-300' 
                            : getTypeColorClass('warning')
                        }`}
                      >
                        <p className="text-sm text-gray-800 mb-2">{suggestion.content}</p>
                        <p className="text-xs text-gray-500">Fuente: {suggestion.sourceBlockId}</p>
                        <AgentSuggestionExplainer suggestion={suggestion} />
                        <AgentSuggestionFeedbackActions 
                          visitId={visitId}
                          userId={userId}
                          suggestion={suggestion}
                          onFeedback={(feedback) => handleFeedback(suggestion.id, feedback)} 
                          isIntegrated={integratedSuggestions.has(suggestion.id)}
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
                        className={`p-3 rounded-md border ${
                          integratedSuggestions.has(suggestion.id) 
                            ? 'bg-blue-50 border-blue-300' 
                            : getTypeColorClass('info')
                        }`}
                      >
                        <p className="text-sm text-gray-800 mb-2">{suggestion.content}</p>
                        <p className="text-xs text-gray-500">Fuente: {suggestion.sourceBlockId}</p>
                        <AgentSuggestionExplainer suggestion={suggestion} />
                        <AgentSuggestionFeedbackActions 
                          visitId={visitId}
                          userId={userId}
                          suggestion={suggestion}
                          onFeedback={(feedback) => handleFeedback(suggestion.id, feedback)} 
                          isIntegrated={integratedSuggestions.has(suggestion.id)}
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