import React from 'react';
import { AgentSuggestion } from '../../../core/agent/ClinicalAgent';

interface SuggestionContextOriginProps {
  suggestion: AgentSuggestion;
}

/**
 * Componente que muestra el origen contextual de una sugerencia clínica
 * 
 * Este componente muestra el texto fuente del contexto MCP que generó
 * la sugerencia, mejorando la transparencia para el profesional de salud.
 */
const SuggestionContextOrigin: React.FC<SuggestionContextOriginProps> = ({ suggestion }) => {
  // Si no hay contexto de origen, mostrar mensaje alternativo
  if (!suggestion.context_origin) {
    return (
      <div 
        className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded text-xs text-gray-500"
        data-testid="suggestion-context-unavailable"
      >
        Sin contexto disponible
      </div>
    );
  }

  return (
    <div 
      className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded"
      data-testid="suggestion-context-origin"
    >
      <p className="text-xs font-medium text-gray-700 mb-1">
        Origen de la sugerencia:
      </p>
      <div className="flex flex-col">
        <span className="text-xs text-gray-600 mb-1">
          <span className="font-medium">Bloque fuente:</span> {suggestion.context_origin.source_block}
        </span>
        <div className="p-1.5 bg-white border border-gray-100 rounded text-xs text-gray-800">
          {suggestion.context_origin.text}
        </div>
      </div>
    </div>
  );
};

export default SuggestionContextOrigin; 