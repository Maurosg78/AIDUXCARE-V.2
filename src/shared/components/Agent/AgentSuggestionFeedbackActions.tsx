import React, { useState } from 'react';
import { AgentSuggestion } from '../../../core/agent/ClinicalAgent';
import { logMetric } from '../../../services/UsageAnalyticsService';

/**
 * Tipo para las posibles acciones de retroalimentación sobre una sugerencia
 */
export type AgentSuggestionFeedback = 'accept' | 'reject' | 'defer';

/**
 * Props para el componente AgentSuggestionFeedbackActions
 */
interface AgentSuggestionFeedbackActionsProps {
  suggestion: AgentSuggestion;
  onFeedback: (feedback: AgentSuggestionFeedback) => void;
  visitId?: string;
  userId?: string;
}

/**
 * Componente que muestra botones de acción para dar retroalimentación sobre una sugerencia del agente
 */
const AgentSuggestionFeedbackActions: React.FC<AgentSuggestionFeedbackActionsProps> = ({
  suggestion,
  onFeedback,
  visitId,
  userId = 'admin-test-001'
}) => {
  const [selectedFeedback, setSelectedFeedback] = useState<AgentSuggestionFeedback | null>(null);

  /**
   * Maneja el clic en un botón de retroalimentación
   */
  const handleFeedbackClick = (feedback: AgentSuggestionFeedback) => {
    if (selectedFeedback !== null) {
      return; // Ya se seleccionó una acción
    }
    
    setSelectedFeedback(feedback);
    onFeedback(feedback);
    
    // Registrar métrica si es una aceptación y tenemos un visitId
    if (feedback === 'accept' && visitId) {
      logMetric({
        timestamp: new Date().toISOString(),
        visitId,
        userId,
        type: 'suggestions_accepted',
        value: 1
      });
    }
  };

  return (
    <div className="mt-2 flex space-x-2">
      <button
        onClick={() => handleFeedbackClick('accept')}
        disabled={selectedFeedback !== null}
        className={`text-xs px-2 py-1 rounded ${
          selectedFeedback === 'accept'
            ? 'bg-green-100 text-green-800 border border-green-300'
            : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-green-50'
        } ${selectedFeedback !== null && selectedFeedback !== 'accept' ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        ✅ Aceptar
      </button>
      
      <button
        onClick={() => handleFeedbackClick('reject')}
        disabled={selectedFeedback !== null}
        className={`text-xs px-2 py-1 rounded ${
          selectedFeedback === 'reject'
            ? 'bg-red-100 text-red-800 border border-red-300'
            : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-red-50'
        } ${selectedFeedback !== null && selectedFeedback !== 'reject' ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        ❌ Rechazar
      </button>
      
      <button
        onClick={() => handleFeedbackClick('defer')}
        disabled={selectedFeedback !== null}
        className={`text-xs px-2 py-1 rounded ${
          selectedFeedback === 'defer'
            ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
            : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-yellow-50'
        } ${selectedFeedback !== null && selectedFeedback !== 'defer' ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        ⏳ Posponer
      </button>
    </div>
  );
};

export default AgentSuggestionFeedbackActions; 