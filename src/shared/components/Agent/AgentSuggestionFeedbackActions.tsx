import React, { useState } from 'react';
import { track } from '../../../services/UsageAnalyticsService';
import { EMRFormService } from '../../../core/services/EMRFormService';
import { AgentSuggestion } from '../../../core/agent/ClinicalAgent';

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
  suggestion?: AgentSuggestion;
  onFeedback: (feedback: AgentSuggestionFeedback) => void;
  isIntegrated?: boolean;
}

/**
 * Componente para los botones de aceptar/rechazar una sugerencia
 */
const AgentSuggestionFeedbackActions: React.FC<AgentSuggestionFeedbackActionsProps> = ({ 
  visitId, 
  userId, 
  suggestion,
  onFeedback,
  isIntegrated = false
}) => {
  const [feedback, setFeedback] = useState<AgentSuggestionFeedback>('none');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAccept = async () => {
    setIsProcessing(true);
    
    try {
      // Actualizar estado local
      setFeedback('accept');
      
      // Registrar métrica de aceptación
      if (visitId) {
        track('suggestions_accepted', userId, visitId, 1);
      }
      
      // Notificar al componente padre
      onFeedback('accept');
      
      // Si tenemos la información de la sugerencia, intentar integrarla al EMR
      if (suggestion) {
        try {
          await EMRFormService.insertSuggestedContent(
            visitId,
            EMRFormService.mapSuggestionTypeToEMRSection(suggestion.type),
            suggestion.content,
            'agent',
            suggestion.id
          );
        } catch (error) {
          console.error('Error al integrar sugerencia al EMR:', error);
        }
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = () => {
    setFeedback('reject');
    onFeedback('reject');
  };

  return (
    <div className="mt-2 flex justify-end space-x-2">
      {isIntegrated ? (
        <span className="text-xs text-blue-600 flex items-center bg-blue-50 px-2 py-1 rounded-md">
          <span className="mr-1">✓</span> Integrado al EMR
        </span>
      ) : feedback === 'none' ? (
        <>
          <button
            onClick={handleAccept}
            disabled={isProcessing}
            className={`px-3 py-1 text-xs font-medium rounded-md ${
              isProcessing 
                ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                : 'bg-green-50 text-green-700 hover:bg-green-100'
            }`}
          >
            {isProcessing ? 'Procesando...' : 'Aceptar'}
          </button>
          <button
            onClick={handleReject}
            disabled={isProcessing}
            className={`px-3 py-1 text-xs font-medium rounded-md ${
              isProcessing 
                ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                : 'bg-red-50 text-red-700 hover:bg-red-100'
            }`}
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