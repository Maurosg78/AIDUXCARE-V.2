import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { AgentSuggestion } from '../../../core/agent/ClinicalAgent';
import AgentSuggestionExplainer from './AgentSuggestionExplainer';
import AgentSuggestionFeedbackActions, { SuggestionFeedbackType } from './AgentSuggestionFeedbackActions';
import { EMRFormService } from '../../../core/services/EMRFormService';
import { AuditLogger } from '../../../core/audit/AuditLogger';
import { track } from '../../../services/UsageAnalyticsService';
import { suggestionFeedbackDataSourceSupabase, SuggestionFeedback } from '../../../core/dataSources/suggestionFeedbackDataSourceSupabase';
import { 
  SuggestionType, 
  SuggestionSortOption, 
  SuggestionFilters,
  suggestionTypeToRiskLevel,
  riskLevelPriority,
  feedbackTypePriority,
  suggestionTypePriority
} from '../../../core/types/suggestions';

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
 * con capacidades de búsqueda, filtrado y ordenamiento
 */
const AgentSuggestionsViewer: React.FC<AgentSuggestionsViewerProps> = ({ 
  visitId,
  suggestions,
  onIntegrateSuggestions,
  userId = 'admin-test-001',
  patientId = 'patient-default'
}) => {
  // Estado original
  const [isExpanded, setIsExpanded] = useState(false);
  const [suggestionsWithFeedback, setSuggestionsWithFeedback] = useState<{[id: string]: SuggestionFeedbackType}>({});
  const [integratedSuggestions, setIntegratedSuggestions] = useState<Set<string>>(new Set());
  const [hasIntegratedToEMR, setHasIntegratedToEMR] = useState(false);
  const [isIntegrating, setIsIntegrating] = useState(false);
  const [feedbacks, setFeedbacks] = useState<{[suggestionId: string]: SuggestionFeedback}>({});
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(false);
  
  // Nuevo estado para búsqueda y filtrado
  const [filters, setFilters] = useState<SuggestionFilters>({
    searchText: '',
    types: ['recommendation', 'warning', 'info'],
    sortBy: 'risk'
  });
  
  // Efecto para cargar los feedbacks cuando se expande el componente
  useEffect(() => {
    if (isExpanded && suggestions.length > 0) {
      loadFeedbacks();
    }
  }, [isExpanded, suggestions]);

  // Función para cargar los feedbacks de las sugerencias
  const loadFeedbacks = async () => {
    if (!visitId || suggestions.length === 0) return;
    
    setIsFeedbackLoading(true);
    
    try {
      // Obtener todos los feedbacks para la visita
      const visitFeedbacks = await suggestionFeedbackDataSourceSupabase.getFeedbacksByVisit(visitId);
      
      if (visitFeedbacks.length > 0) {
        // Organizar feedbacks por suggestionId para facilitar acceso
        const feedbacksMap: {[suggestionId: string]: SuggestionFeedback} = {};
        
        visitFeedbacks.forEach(feedback => {
          feedbacksMap[feedback.suggestion_id] = feedback;
        });
        
        setFeedbacks(feedbacksMap);
        
        // Registrar métrica de visualización de feedback
        track('suggestion_feedback_viewed', userId, visitId, visitFeedbacks.length, {
          feedbacks_count: visitFeedbacks.length
        });
      }
    } catch (error) {
      console.error('Error al cargar feedbacks:', error);
    } finally {
      setIsFeedbackLoading(false);
    }
  };

  // Función para obtener etiqueta de feedback según el tipo
  const getFeedbackLabel = (type: 'useful' | 'irrelevant' | 'incorrect' | 'dangerous'): { text: string, color: string } => {
    switch (type) {
      case 'useful':
        return { text: 'Útil', color: 'bg-green-100 text-green-800 border-green-300' };
      case 'irrelevant':
        return { text: 'Irrelevante', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' };
      case 'incorrect':
        return { text: 'Incorrecta', color: 'bg-red-100 text-red-800 border-red-300' };
      case 'dangerous':
        return { text: 'Peligrosa', color: 'bg-purple-100 text-purple-800 border-purple-300' };
    }
  };

  // Filtrar y ordenar sugerencias
  const filteredAndSortedSuggestions = useMemo(() => {
    // Primero, filtrar por tipo y texto de búsqueda
    let filtered = suggestions.filter(suggestion => {
      const matchesType = filters.types.includes(suggestion.type as SuggestionType);
      const matchesText = filters.searchText === '' || 
        suggestion.content.toLowerCase().includes(filters.searchText.toLowerCase()) ||
        (suggestion.sourceBlockId && suggestion.sourceBlockId.toLowerCase().includes(filters.searchText.toLowerCase()));
        
      return matchesType && matchesText;
    });
    
    // Ordenar según el criterio seleccionado
    return filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'risk':
          // Ordenar por nivel de riesgo (warning > recommendation > info)
          const riskA = riskLevelPriority[suggestionTypeToRiskLevel[a.type as SuggestionType]];
          const riskB = riskLevelPriority[suggestionTypeToRiskLevel[b.type as SuggestionType]];
          return riskA - riskB;
          
        case 'usefulness':
          // Ordenar por feedback (útil > irrelevante > incorrecta > peligrosa)
          const feedbackA = feedbacks[a.id]?.feedback_type || 'none';
          const feedbackB = feedbacks[b.id]?.feedback_type || 'none';
          return (feedbackTypePriority[feedbackA] || 99) - (feedbackTypePriority[feedbackB] || 99);
          
        case 'type':
          // Ordenar por tipo de contenido (orden clínico)
          const typeA = suggestionTypePriority[a.type as SuggestionType];
          const typeB = suggestionTypePriority[b.type as SuggestionType];
          return typeA - typeB;
          
        default:
          return 0;
      }
    });
  }, [suggestions, filters, feedbacks]);
  
  // Agrupar sugerencias filtradas por tipo
  const groupedFilteredSuggestions = useMemo(() => {
    const grouped = {
      recommendation: [] as AgentSuggestion[],
      warning: [] as AgentSuggestion[],
      info: [] as AgentSuggestion[]
    };

    filteredAndSortedSuggestions.forEach(suggestion => {
      grouped[suggestion.type].push(suggestion);
    });

    return grouped;
  }, [filteredAndSortedSuggestions]);

  // Número de sugerencias aceptadas
  const acceptedCount = useMemo(() => {
    return Object.values(suggestionsWithFeedback).filter(feedback => feedback === 'useful').length;
  }, [suggestionsWithFeedback]);

  // Manejar cambios en los filtros
  const handleFilterChange = useCallback((filterUpdate: Partial<SuggestionFilters>) => {
    setFilters(prev => {
      const newFilters = { ...prev, ...filterUpdate };
      
      // Registrar métrica de uso de filtros
      track('suggestion_search_filter_used', userId, visitId, 1, {
        search_text: newFilters.searchText,
        filter_types: newFilters.types,
        sort_by: newFilters.sortBy,
        results_count: filteredAndSortedSuggestions.length
      });
      
      return newFilters;
    });
  }, [userId, visitId, filteredAndSortedSuggestions.length]);

  // Manejar cambio de tipo (toggle de filtro)
  const handleTypeToggle = useCallback((type: SuggestionType) => {
    setFilters(prev => {
      const newTypes = prev.types.includes(type)
        // Si ya está incluido, quitarlo (solo si quedaría al menos un tipo)
        ? (prev.types.length > 1 ? prev.types.filter(t => t !== type) : prev.types)
        // Si no está incluido, agregarlo
        : [...prev.types, type];
      
      return { ...prev, types: newTypes };
    });
  }, []);

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

  // Obtener la clase para el botón de filtro de tipo
  const getTypeFilterButtonClass = (type: SuggestionType): string => {
    const isActive = filters.types.includes(type);
    
    switch (type) {
      case 'recommendation':
        return `px-2 py-1 text-xs font-medium rounded-md border ${
          isActive ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-blue-50'
        }`;
      case 'warning':
        return `px-2 py-1 text-xs font-medium rounded-md border ${
          isActive ? 'bg-yellow-100 text-yellow-700 border-yellow-300' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-yellow-50'
        }`;
      case 'info':
        return `px-2 py-1 text-xs font-medium rounded-md border ${
          isActive ? 'bg-green-100 text-green-700 border-green-300' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-green-50'
        }`;
    }
  };

  // Manejar el feedback de una sugerencia
  const handleFeedback = (suggestionId: string, feedback: SuggestionFeedbackType) => {
    setSuggestionsWithFeedback(prev => ({
      ...prev,
      [suggestionId]: feedback
    }));
    
    if (feedback === 'useful') {
      setIntegratedSuggestions(prev => {
        const updated = new Set(prev);
        updated.add(suggestionId);
        return updated;
      });
    }
    
    // Recargar los feedbacks para actualizar la vista
    loadFeedbacks();
  };

  // Integrar sugerencias aceptadas al EMR
  const handleIntegrateToEMR = async () => {
    if (acceptedCount > 0 && !hasIntegratedToEMR && !isIntegrating) {
      setIsIntegrating(true);
      
      try {
        // Obtener todas las sugerencias aceptadas
        const acceptedSuggestionIds = Object.entries(suggestionsWithFeedback)
          .filter(([, feedback]) => feedback === 'useful')
          .map(([id]) => id);
          
        const acceptedSuggestions = suggestions.filter(s => 
          acceptedSuggestionIds.includes(s.id)
        );
        
        // Integrar cada sugerencia aceptada en el EMR
        let integratedCount = 0;
        
        for (const suggestion of acceptedSuggestions) {
          // Mapear el tipo de sugerencia a la sección EMR correspondiente
          const emrSection = EMRFormService.mapSuggestionTypeToEMRSection(suggestion.type);
          
          // Insertar la sugerencia en el EMR usando el método insertSuggestedContent
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

  // Renderizar sugerencias con su feedback correspondiente
  const renderSuggestion = (suggestion: AgentSuggestion) => (
    <div 
      key={suggestion.id} 
      className={`p-3 rounded-md border ${
        integratedSuggestions.has(suggestion.id) 
          ? 'bg-blue-50 border-blue-300' 
          : getTypeColorClass(suggestion.type)
      }`}
      data-testid={`suggestion-item-${suggestion.id}`}
    >
      <p className="text-sm text-gray-800 mb-2">{suggestion.content}</p>
      <p className="text-xs text-gray-500">Fuente: {suggestion.sourceBlockId}</p>
      
      {/* Mostrar feedback si existe */}
      {feedbacks[suggestion.id] && (
        <div className="mt-2 mb-2">
          <span 
            className={`text-xs px-2 py-1 rounded-md border ${getFeedbackLabel(feedbacks[suggestion.id].feedback_type).color}`}
          >
            Retroalimentación: {getFeedbackLabel(feedbacks[suggestion.id].feedback_type).text}
          </span>
        </div>
      )}
      
      <AgentSuggestionExplainer suggestion={suggestion} />
      <AgentSuggestionFeedbackActions 
        visitId={visitId}
        userId={userId}
        suggestion={suggestion}
        suggestionId={suggestion.id}
        onFeedback={(feedback) => handleFeedback(suggestion.id, feedback)} 
      />
    </div>
  );

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
              {/* Barra de búsqueda y filtros */}
              <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
                <div className="flex flex-col md:flex-row gap-2 md:items-center">
                  {/* Buscador */}
                  <div className="flex-grow">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        className="w-full py-1.5 pl-10 pr-3 text-sm text-gray-700 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Buscar sugerencias..."
                        value={filters.searchText}
                        onChange={(e) => handleFilterChange({ searchText: e.target.value })}
                        data-testid="suggestion-search-input"
                      />
                    </div>
                  </div>

                  {/* Filtros de tipo */}
                  <div className="flex gap-1">
                    <button 
                      className={getTypeFilterButtonClass('recommendation')}
                      onClick={() => handleTypeToggle('recommendation')}
                      title="Filtrar recomendaciones"
                      data-testid="filter-recommendation"
                    >
                      {getTypeIcon('recommendation')} Recomendaciones
                    </button>
                    <button 
                      className={getTypeFilterButtonClass('warning')}
                      onClick={() => handleTypeToggle('warning')}
                      title="Filtrar advertencias"
                      data-testid="filter-warning"
                    >
                      {getTypeIcon('warning')} Advertencias
                    </button>
                    <button 
                      className={getTypeFilterButtonClass('info')}
                      onClick={() => handleTypeToggle('info')}
                      title="Filtrar información"
                      data-testid="filter-info"
                    >
                      {getTypeIcon('info')} Info
                    </button>
                  </div>

                  {/* Selector de ordenamiento */}
                  <div className="flex-shrink-0">
                    <select
                      className="py-1.5 px-3 text-sm text-gray-700 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      value={filters.sortBy}
                      onChange={(e) => handleFilterChange({ sortBy: e.target.value as SuggestionSortOption })}
                      data-testid="sort-select"
                      aria-label="Ordenar sugerencias"
                    >
                      <option value="risk">Ordenar por riesgo</option>
                      <option value="usefulness">Ordenar por utilidad</option>
                      <option value="type">Ordenar por tipo</option>
                    </select>
                  </div>
                </div>
                
                {/* Contador de resultados */}
                <div className="mt-2 text-xs text-gray-500">
                  {filteredAndSortedSuggestions.length === suggestions.length ? (
                    <span>Mostrando todas las sugerencias ({suggestions.length})</span>
                  ) : (
                    <span>Mostrando {filteredAndSortedSuggestions.length} de {suggestions.length} sugerencias</span>
                  )}
                </div>
              </div>

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

              {/* Indicador de carga de feedbacks */}
              {isFeedbackLoading && (
                <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-xs text-blue-800">Cargando retroalimentación clínica...</p>
                </div>
              )}

              {/* Sin resultados */}
              {filteredAndSortedSuggestions.length === 0 && (
                <div className="p-4 text-center text-gray-500 border border-gray-200 rounded-md">
                  <p>No se encontraron sugerencias que coincidan con los criterios de búsqueda.</p>
                  <button 
                    className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                    onClick={() => setFilters({
                      searchText: '',
                      types: ['recommendation', 'warning', 'info'],
                      sortBy: 'risk'
                    })}
                    data-testid="reset-filters-button"
                  >
                    Restablecer filtros
                  </button>
                </div>
              )}

              {/* Lista de sugerencias ordenadas y filtradas */}
              {filters.sortBy === 'type' ? (
                <div className="space-y-6">
                  {/* Recomendaciones */}
                  {groupedFilteredSuggestions.recommendation.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-md font-medium text-gray-700 flex items-center">
                        {getTypeIcon('recommendation')} Recomendaciones ({groupedFilteredSuggestions.recommendation.length})
                      </h4>
                      {groupedFilteredSuggestions.recommendation.map(renderSuggestion)}
                    </div>
                  )}

                  {/* Advertencias */}
                  {groupedFilteredSuggestions.warning.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-md font-medium text-gray-700 flex items-center">
                        {getTypeIcon('warning')} Advertencias ({groupedFilteredSuggestions.warning.length})
                      </h4>
                      {groupedFilteredSuggestions.warning.map(renderSuggestion)}
                    </div>
                  )}

                  {/* Información */}
                  {groupedFilteredSuggestions.info.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-md font-medium text-gray-700 flex items-center">
                        {getTypeIcon('info')} Información ({groupedFilteredSuggestions.info.length})
                      </h4>
                      {groupedFilteredSuggestions.info.map(renderSuggestion)}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredAndSortedSuggestions.map(renderSuggestion)}
                </div>
              )}
            </>
          )}
          
          <div className="mt-4 text-right">
            <p className="text-xs text-gray-500">
              Total de sugerencias: {suggestions.length}
            </p>
            {Object.keys(feedbacks).length > 0 && (
              <p className="text-xs text-gray-500">
                Total de sugerencias con retroalimentación: {Object.keys(feedbacks).length}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentSuggestionsViewer; 