import { useState, useEffect, useCallback } from 'react';

import { AgentSuggestion } from '../types/agent';
import { competencySuggestionService, CompetencySuggestion, CompetencySuggestionContext } from '../services/CompetencySuggestionService';

export interface UseCompetencySuggestionsConfig {
  region: string;
  userCertifications: string[];
  isPublicSector: boolean;
  enableRealTimeAnalysis?: boolean;
}

export interface CompetencySuggestionsState {
  suggestions: CompetencySuggestion[];
  isLoading: boolean;
  error: string | null;
  statistics: {
    total: number;
    byRegion: { [region: string]: number };
    byRiskLevel: { [level: string]: number };
    geolocationSpecific: number;
  };
}

/**
 * Hook personalizado para integrar sugerencias de competencias profesionales
 * en el flujo de trabajo existente de forma geolocalizada
 */
export const useCompetencySuggestions = (config: UseCompetencySuggestionsConfig) => {
  const [state, setState] = useState<CompetencySuggestionsState>({
    suggestions: [],
    isLoading: false,
    error: null,
    statistics: {
      total: 0,
      byRegion: {},
      byRiskLevel: {},
      geolocationSpecific: 0
    }
  });

  // Configurar contexto del usuario
  useEffect(() => {
    competencySuggestionService.setUserContext(
      config.region,
      config.userCertifications,
      config.isPublicSector
    );
  }, [config.region, config.userCertifications, config.isPublicSector]);

  /**
   * Analiza transcripción y genera sugerencias de competencias
   */
  const analyzeTranscription = useCallback(async (transcript: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const context: CompetencySuggestionContext = {
        region: config.region,
        userCertifications: config.userCertifications,
        isPublicSector: config.isPublicSector,
        mentionedTechniques: []
      };

      const suggestions = await competencySuggestionService.analyzeTranscriptionForCompetencies(
        transcript,
        context
      );

      const statistics = competencySuggestionService.getSuggestionStatistics(suggestions);

      setState(prev => ({
        ...prev,
        suggestions: [...prev.suggestions, ...suggestions],
        isLoading: false,
        statistics
      }));

      return suggestions;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      }));
      return [];
    }
  }, [config]);

  /**
   * Analiza SOAP y genera sugerencias de competencias
   */
  const analyzeSOAP = useCallback(async (soapData: Record<string, unknown>) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const context: CompetencySuggestionContext = {
        region: config.region,
        userCertifications: config.userCertifications,
        isPublicSector: config.isPublicSector,
        mentionedTechniques: [],
        soapData
      };

      const suggestions = await competencySuggestionService.analyzeSOAPForCompetencies(
        soapData,
        context
      );

      const statistics = competencySuggestionService.getSuggestionStatistics(suggestions);

      setState(prev => ({
        ...prev,
        suggestions: [...prev.suggestions, ...suggestions],
        isLoading: false,
        statistics
      }));

      return suggestions;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      }));
      return [];
    }
  }, [config]);

  /**
   * Genera sugerencias preventivas basadas en la región
   */
  const generatePreventiveSuggestions = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const context: CompetencySuggestionContext = {
        region: config.region,
        userCertifications: config.userCertifications,
        isPublicSector: config.isPublicSector,
        mentionedTechniques: []
      };

      const suggestions = await competencySuggestionService.generatePreventiveSuggestions(context);

      const statistics = competencySuggestionService.getSuggestionStatistics(suggestions);

      setState(prev => ({
        ...prev,
        suggestions: [...prev.suggestions, ...suggestions],
        isLoading: false,
        statistics
      }));

      return suggestions;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      }));
      return [];
    }
  }, [config]);

  /**
   * Filtra sugerencias por región y prioridad
   */
  const filterSuggestions = useCallback((
    region?: string,
    priority: 'all' | 'high' | 'medium' | 'low' = 'all'
  ) => {
    const targetRegion = region || config.region;
    return competencySuggestionService.filterSuggestionsByRegion(
      state.suggestions,
      targetRegion,
      priority
    );
  }, [state.suggestions, config.region]);

  /**
   * Limpia todas las sugerencias
   */
  const clearSuggestions = useCallback(() => {
    setState(prev => ({
      ...prev,
      suggestions: [],
      statistics: {
        total: 0,
        byRegion: {},
        byRiskLevel: {},
        geolocationSpecific: 0
      }
    }));
  }, []);

  /**
   * Obtiene sugerencias críticas que requieren acción inmediata
   */
  const getCriticalSuggestions = useCallback(() => {
    return state.suggestions.filter(suggestion => 
      suggestion.requiresAction && suggestion.riskLevel === 'high'
    );
  }, [state.suggestions]);

  /**
   * Obtiene sugerencias específicas de geolocalización
   */
  const getGeolocationSpecificSuggestions = useCallback(() => {
    return state.suggestions.filter(suggestion => suggestion.geolocationSpecific);
  }, [state.suggestions]);

  /**
   * Convierte sugerencias de competencias a formato AgentSuggestion estándar
   */
  const getStandardSuggestions = useCallback((): AgentSuggestion[] => {
    return state.suggestions.map(suggestion => ({
      id: suggestion.id,
      type: suggestion.type,
      field: suggestion.field,
      content: suggestion.content,
      sourceBlockId: suggestion.sourceBlockId,
      explanation: suggestion.explanation,
      createdAt: suggestion.createdAt,
      updatedAt: suggestion.updatedAt,
      context_origin: suggestion.context_origin
    }));
  }, [state.suggestions]);

  return {
    // Estado
    suggestions: state.suggestions,
    isLoading: state.isLoading,
    error: state.error,
    statistics: state.statistics,

    // Acciones
    analyzeTranscription,
    analyzeSOAP,
    generatePreventiveSuggestions,
    filterSuggestions,
    clearSuggestions,
    getCriticalSuggestions,
    getGeolocationSpecificSuggestions,
    getStandardSuggestions
  };
}; 