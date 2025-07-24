import React, { useEffect, useRef } from 'react';
import { useCompetencySuggestions, UseCompetencySuggestionsConfig } from '../hooks/useCompetencySuggestions';
import { CompetencySuggestion } from '../services/CompetencySuggestionService';

interface CompetencySuggestionsIntegratorProps {
  config: UseCompetencySuggestionsConfig;
  transcript?: string;
  soapData?: Record<string, unknown>;
  onSuggestionsGenerated?: (suggestions: CompetencySuggestion[]) => void;
  onCriticalSuggestions?: (suggestions: CompetencySuggestion[]) => void;
  children?: React.ReactNode;
  enableRealTimeAnalysis?: boolean;
}

/**
 * Componente que integra sugerencias de competencias profesionales
 * en el flujo de trabajo existente de forma transparente
 */
export const CompetencySuggestionsIntegrator: React.FC<CompetencySuggestionsIntegratorProps> = ({
  config,
  transcript,
  soapData,
  onSuggestionsGenerated,
  onCriticalSuggestions,
  children,
  enableRealTimeAnalysis = true
}) => {
  const {
    suggestions,
    isLoading,
    error,
    statistics,
    analyzeTranscription,
    analyzeSOAP,
    generatePreventiveSuggestions,
    getCriticalSuggestions
  } = useCompetencySuggestions(config);

  const lastTranscriptRef = useRef<string>('');
  const lastSoapDataRef = useRef<Record<string, unknown> | null>(null);

  // Analizar transcripción cuando cambie
  useEffect(() => {
    if (transcript && transcript !== lastTranscriptRef.current && enableRealTimeAnalysis) {
      lastTranscriptRef.current = transcript;
      
      analyzeTranscription(transcript).then(newSuggestions => {
        if (onSuggestionsGenerated && newSuggestions.length > 0) {
          onSuggestionsGenerated(newSuggestions);
        }
      });
    }
  }, [transcript, analyzeTranscription, onSuggestionsGenerated, enableRealTimeAnalysis]);

  // Analizar SOAP cuando cambie
  useEffect(() => {
    if (soapData && JSON.stringify(soapData) !== JSON.stringify(lastSoapDataRef.current)) {
      lastSoapDataRef.current = soapData;
      
      analyzeSOAP(soapData).then(newSuggestions => {
        if (onSuggestionsGenerated && newSuggestions.length > 0) {
          onSuggestionsGenerated(newSuggestions);
        }
      });
    }
  }, [soapData, analyzeSOAP, onSuggestionsGenerated]);

  // Generar sugerencias preventivas al montar
  useEffect(() => {
    generatePreventiveSuggestions().then(preventiveSuggestions => {
      if (onSuggestionsGenerated && preventiveSuggestions.length > 0) {
        onSuggestionsGenerated(preventiveSuggestions);
      }
    });
  }, [generatePreventiveSuggestions, onSuggestionsGenerated]);

  // Notificar sugerencias críticas
  useEffect(() => {
    const criticalSuggestions = getCriticalSuggestions();
    if (onCriticalSuggestions && criticalSuggestions.length > 0) {
      onCriticalSuggestions(criticalSuggestions);
    }
  }, [suggestions, onCriticalSuggestions, getCriticalSuggestions]);

  // Log silencioso para auditoría
  useEffect(() => {
    if (suggestions.length > 0) {
      console.log('🔒 CompetencySuggestionsIntegrator:', {
        totalSuggestions: suggestions.length,
        region: config.region,
        geolocationSpecific: statistics.geolocationSpecific,
        criticalCount: getCriticalSuggestions().length
      });
    }
  }, [suggestions, statistics, config.region, getCriticalSuggestions]);

  // Renderizar children sin interferir en la UI
  return (
    <>
      {children}
      
      {/* Indicador de carga discreto (solo en desarrollo) */}
      {process.env.NODE_ENV === 'development' && isLoading && (
        <div className="fixed bottom-4 right-4 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs opacity-75">
          Verificando competencias...
        </div>
      )}
      
      {/* Indicador de error discreto (solo en desarrollo) */}
      {process.env.NODE_ENV === 'development' && error && (
        <div className="fixed bottom-4 right-4 bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs opacity-75">
          Error: {error}
        </div>
      )}
    </>
  );
};

/**
 * Hook para usar el integrador de sugerencias de competencias
 */
export const useCompetencyIntegrator = (config: UseCompetencySuggestionsConfig) => {
  const {
    suggestions,
    isLoading,
    error,
    statistics,
    getCriticalSuggestions,
    getGeolocationSpecificSuggestions,
    getStandardSuggestions
  } = useCompetencySuggestions(config);

  return {
    // Estado
    suggestions,
    isLoading,
    error,
    statistics,

    // Métodos de filtrado
    getCriticalSuggestions,
    getGeolocationSpecificSuggestions,
    getStandardSuggestions,

    // Componente integrador
    Integrator: ({ children, ...props }: Omit<CompetencySuggestionsIntegratorProps, 'config'>) => (
      <CompetencySuggestionsIntegrator config={config} {...props}>
        {children}
      </CompetencySuggestionsIntegrator>
    )
  };
}; 