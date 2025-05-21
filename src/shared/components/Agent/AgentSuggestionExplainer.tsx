import React from 'react';
import { AgentSuggestion } from '@/types/agent';

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
  if (!suggestion.explanation) return null;

  return (
    <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
      <p className="font-medium mb-1">Explicación:</p>
      <p>{suggestion.explanation}</p>
    </div>
  );
};

AgentSuggestionExplainer.displayName = 'AgentSuggestionExplainer';

export default AgentSuggestionExplainer; 