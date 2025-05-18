import React, { useState } from 'react';
import { AgentSuggestion } from '../../../core/agent/ClinicalAgent';
import { explainSuggestion } from '../../../core/agent/AgentExplainer';
import { AuditLogger } from '../../../core/audit/AuditLogger';
import { track } from '../../../services/UsageAnalyticsService';

interface SuggestionExplanationProps {
  suggestion: AgentSuggestion;
  visitId: string;
  userId: string;
}

/**
 * Componente que muestra un botón para expandir/colapsar la explicación
 * sobre por qué se generó una sugerencia clínica específica.
 */
const SuggestionExplanation: React.FC<SuggestionExplanationProps> = ({
  suggestion,
  visitId,
  userId
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Obtener la explicación para la sugerencia
  const explanation = explainSuggestion(suggestion);
  
  // Manejar el clic en el botón de explicación
  const handleExplanationClick = () => {
    // Si se está expandiendo, registrar métricas y auditoría
    if (!isExpanded) {
      // Registrar evento de auditoría
      AuditLogger.log('suggestion_explained', {
        visitId,
        userId,
        suggestionId: suggestion.id,
        suggestionType: suggestion.type
      });
      
      // Registrar métrica de visualización
      track('suggestion_explanation_viewed', userId, visitId, 1, {
        suggestion_id: suggestion.id,
        suggestion_type: suggestion.type
      });
    }
    
    // Cambiar estado de expansión
    setIsExpanded(!isExpanded);
  };
  
  return (
    <div className="mt-3" data-testid="suggestion-explanation-container">
      <button
        className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
        onClick={handleExplanationClick}
        data-testid="explanation-button"
        aria-expanded={isExpanded ? "true" : "false"}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className={`h-3.5 w-3.5 mr-1 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        ¿Por qué esta sugerencia?
      </button>
      
      {isExpanded && (
        <div 
          className="mt-2 p-3 bg-blue-50 border border-blue-100 rounded-md text-xs text-blue-800"
          data-testid="explanation-content"
        >
          {explanation}
        </div>
      )}
    </div>
  );
};

export default SuggestionExplanation; 