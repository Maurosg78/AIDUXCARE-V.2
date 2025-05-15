import React, { useState, useCallback } from 'react';
import { AgentSuggestion } from '../../../core/agent/ClinicalAgent';
import { explainSuggestion } from '../../../core/agent/AgentExplainer';

/**
 * Props para el componente AgentSuggestionExplainer
 */
interface AgentSuggestionExplainerProps {
  suggestion: AgentSuggestion;
}

/**
 * Componente que permite expandir y mostrar una explicación detallada para una sugerencia del agente
 */
const AgentSuggestionExplainer: React.FC<AgentSuggestionExplainerProps> = ({ suggestion }) => {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasError, setHasError] = useState(false);

  /**
   * Maneja el clic en el botón para mostrar/ocultar la explicación
   */
  const handleExplainClick = useCallback(async () => {
    // Si ya está expandido, solo ocultamos la explicación
    if (isExpanded) {
      setIsExpanded(false);
      return;
    }
    
    // Si ya tenemos una explicación, solo la mostramos
    if (explanation !== null) {
      setIsExpanded(true);
      return;
    }
    
    // Si no tenemos explicación, la solicitamos
    setIsLoading(true);
    setHasError(false);
    try {
      const explanationText = await explainSuggestion(suggestion);
      setExplanation(explanationText);
    } catch (error) {
      // En caso de error, mostramos un mensaje genérico
      setExplanation('No se pudo generar una explicación para esta sugerencia.');
      setHasError(true);
    } finally {
      setIsLoading(false);
      setIsExpanded(true);
    }
  }, [suggestion, explanation, isExpanded]);

  // Solo mostramos el botón para sugerencias de tipo recommendation o warning
  if (suggestion.type !== 'recommendation' && suggestion.type !== 'warning') {
    return null;
  }

  return (
    <div className="mt-2">
      <button
        onClick={handleExplainClick}
        disabled={isLoading}
        className="text-xs flex items-center text-blue-600 hover:text-blue-800 focus:outline-none"
      >
        {isLoading ? (
          <span className="inline-flex items-center" data-testid="loading-indicator">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Generando explicación...
          </span>
        ) : (
          <span>
            {isExpanded ? 'Ocultar explicación' : 'Ver explicación'}
            <svg
              className={`ml-1 h-4 w-4 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </span>
        )}
      </button>

      {isExpanded && explanation && (
        <div className={`mt-2 text-xs ${hasError ? 'text-red-600 bg-red-50 border-red-100' : 'text-gray-600 bg-gray-50 border-gray-100'} p-3 rounded-md border`} data-testid="explanation-text">
          {explanation}
        </div>
      )}
    </div>
  );
};

export default AgentSuggestionExplainer; 