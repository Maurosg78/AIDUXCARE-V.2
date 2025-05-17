import React, { useState } from 'react';
import { track } from '../../../services/UsageAnalyticsService';

/**
 * Tipo para las posibles acciones de retroalimentación sobre una sugerencia
 */
export type AgentSuggestionFeedback = 'accept' | 'reject' | 'none';

/**
 * Props para el componente AgentSuggestionFeedbackActions
 */
interface AgentSuggestionFeedbackActionsProps {
  visitId: string;
  userId: string;
  onFeedback: (feedback: AgentSuggestionFeedback) => void;
}

/**
 * Componente para los botones de aceptar/rechazar una sugerencia
 */
const AgentSuggestionFeedbackActions: React.FC<AgentSuggestionFeedbackActionsProps> = ({ 
  visitId, 
  userId, 
  onFeedback 
}) => {
  const [feedback, setFeedback] = useState<AgentSuggestionFeedback>('none');

  const handleAccept = () => {
    setFeedback('accept');
    onFeedback('accept');
    
    // Registrar métrica de aceptación
    if (visitId) {
      track('suggestions_accepted', userId, visitId, 1);
    }
  };

  const handleReject = () => {
    setFeedback('reject');
    onFeedback('reject');
  };

  return (
    <div className="mt-2 flex justify-end space-x-2">
      {feedback === 'none' ? (
        <>
          <button
            onClick={handleAccept}
            className="px-3 py-1 text-xs font-medium rounded-md bg-green-50 text-green-700 hover:bg-green-100"
          >
            Aceptar
          </button>
          <button
            onClick={handleReject}
            className="px-3 py-1 text-xs font-medium rounded-md bg-red-50 text-red-700 hover:bg-red-100"
          >
            Rechazar
          </button>
        </>
      ) : feedback === 'accept' ? (
        <span className="text-xs text-green-600 flex items-center">
          <span className="mr-1">✓</span> Aceptada
        </span>
      ) : (
        <span className="text-xs text-red-600 flex items-center">
          <span className="mr-1">✗</span> Rechazada
        </span>
      )}
    </div>
  );
};

export default AgentSuggestionFeedbackActions; 