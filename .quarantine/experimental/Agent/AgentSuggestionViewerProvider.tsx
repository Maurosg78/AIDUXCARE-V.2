import React, { createContext, useState, useCallback } from 'react';
import { AgentSuggestion } from './AgentSuggestionViewerTypes';
import { EMRFormService } from '@/services/EMRFormService';
import { trackMetric, UsageMetricType } from '@/services/UsageAnalyticsService';
import { AuditLogger } from '@/services/AuditLogger';

interface AgentSuggestionViewerContextType {
  suggestions: AgentSuggestion[];
  integratedSuggestions: AgentSuggestion[];
  isLoading: boolean;
  error: string | null;
  handleSuggestionAccepted: (suggestion: AgentSuggestion) => Promise<void>;
  handleSuggestionRejected: (suggestion: AgentSuggestion) => Promise<void>;
  loadSuggestions: () => Promise<void>;
}

interface AgentSuggestionViewerProviderProps {
  visitId: string;
  userId: string;
  patientId: string;
  children: React.ReactNode;
  initialSuggestions?: AgentSuggestion[];
}

export const AgentSuggestionViewerContext = createContext<AgentSuggestionViewerContextType | null>(null);

const AgentSuggestionViewerProvider: React.FC<AgentSuggestionViewerProviderProps> & {
  Context: typeof AgentSuggestionViewerContext;
// eslint-disable-next-line react/prop-types
} = ({ visitId, userId, patientId, children, initialSuggestions = [] }) => {
  const [suggestions, setSuggestions] = useState<AgentSuggestion[]>(initialSuggestions);
  const [integratedSuggestions, setIntegratedSuggestions] = useState<AgentSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSuggestionAccepted = useCallback(async (suggestion: AgentSuggestion) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Primero intentamos insertar la sugerencia
      const insertResult = await EMRFormService.insertSuggestion(
        suggestion,
        visitId,
        patientId,
        userId
      );
      
      if (!insertResult) {
        throw new Error('Error al integrar la sugerencia');
      }

      // Si la inserción fue exitosa, actualizamos el estado y registramos las métricas
      await Promise.all([
        trackMetric(
          'suggestion_integrated' as UsageMetricType,
          {
            suggestionId: suggestion.id,
            suggestionType: suggestion.type as 'recommendation' | 'warning' | 'info',
            suggestionField: suggestion.field
          },
          userId,
          visitId
        ),
        AuditLogger.log('suggestion_integrated', {
          suggestionId: suggestion.id,
          visitId,
          userId
        })
      ]);

      // Actualizamos el estado después de que todo haya sido exitoso
      setIntegratedSuggestions(prev => [...prev, suggestion]);
      setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
    } catch (err) {
      setError('Error al integrar la sugerencia');
      // No actualizamos el estado si hay error
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [visitId, userId, patientId]);

  const handleSuggestionRejected = useCallback(async (suggestion: AgentSuggestion) => {
    try {
      setIsLoading(true);
      setError(null);

      // Registramos las métricas
      await Promise.all([
        trackMetric(
          'suggestion_rejected' as UsageMetricType,
          {
            suggestionId: suggestion.id,
            suggestionType: suggestion.type as 'recommendation' | 'warning' | 'info',
            suggestionField: suggestion.field
          },
          userId,
          visitId
        ),
        AuditLogger.log('suggestion_rejected', {
          suggestionId: suggestion.id,
          visitId,
          userId
        })
      ]);

      // Actualizamos el estado después de registrar las métricas
      setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
    } catch (err) {
      setError('Error al rechazar la sugerencia');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [visitId, userId]);

  const loadSuggestions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      // Simulamos una carga
      await new Promise(resolve => setTimeout(resolve, 100));
      // Aquí iría la lógica real de carga de sugerencias
    } catch (err) {
      setError('Error al cargar las sugerencias');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value: AgentSuggestionViewerContextType = {
    suggestions,
    integratedSuggestions,
    isLoading,
    error,
    handleSuggestionAccepted,
    handleSuggestionRejected,
    loadSuggestions,
  };

  return (
    <AgentSuggestionViewerContext.Provider value={value}>
      {children}
    </AgentSuggestionViewerContext.Provider>
  );
};



AgentSuggestionViewerProvider.Context = AgentSuggestionViewerContext;

export default AgentSuggestionViewerProvider; 