import React, { useState } from 'react';
import { AgentSuggestion } from '../../../types/agent';
import { explainSuggestion } from '../../../core/agent/AgentExplainer';

interface Props {
  suggestion: AgentSuggestion;
}

const AgentSuggestionExplainer: React.FC<Props> = ({ suggestion }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [explanation, setExplanation] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    if (!isExpanded && !explanation) {
      setIsLoading(true);
      try {
        const result = await explainSuggestion(suggestion);
        setExplanation(result);
      } catch (error) {
        setExplanation('No se pudo generar una explicación para esta sugerencia.');
      } finally {
        setIsLoading(false);
      }
    }
    setIsExpanded(!isExpanded);
  };

  if (suggestion.type !== 'recommendation' && suggestion.type !== 'warning') {
    return null;
  }

  return (
    <div className="mt-2">
      <button 
        data-testid="explanation-button"
        onClick={handleToggle}
      >
        {isExpanded ? 'Ocultar explicación' : 'Ver explicación'}
      </button>
      {isLoading && <div data-testid="loading-indicator">Cargando...</div>}
      {isExpanded && explanation && (
        <div data-testid="explanation-text" className={explanation.includes('No se pudo') ? 'text-red-600 bg-red-50' : ''}>
          {explanation}
        </div>
      )}
    </div>
  );
};

export default AgentSuggestionExplainer; 