import React, { useState } from 'react';
import { track } from '../../../services/UsageAnalyticsService';
import { AuditLogger } from '../../../core/audit/AuditLogger';
import supabase from '../../../core/auth/supabaseClient';
import { AgentSuggestion } from '../../../core/agent/ClinicalAgent';

/**
 * Tipo para las posibles acciones de retroalimentación sobre una sugerencia
 */
export type SuggestionFeedbackType = 'useful' | 'irrelevant' | 'incorrect' | 'dangerous' | 'none';

/**
 * Props para el componente AgentSuggestionFeedbackActions
 */
interface AgentSuggestionFeedbackActionsProps {
  visitId: string;
  userId: string;
  suggestionId: string;
  suggestion?: AgentSuggestion;
  onFeedback?: (feedback: SuggestionFeedbackType) => void;
}

/**
 * Componente para proporcionar retroalimentación sobre la calidad de las sugerencias clínicas
 */
const AgentSuggestionFeedbackActions: React.FC<AgentSuggestionFeedbackActionsProps> = ({ 
  visitId, 
  userId, 
  suggestionId,
  suggestion,
  onFeedback
}) => {
  const [feedback, setFeedback] = useState<SuggestionFeedbackType>('none');
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Guarda el feedback en Supabase, registra en AuditLogger y envía métricas
   */
  const saveFeedback = async (feedbackType: SuggestionFeedbackType) => {
    if (feedbackType === 'none') return;
    
    setIsSubmitting(true);
    
    try {
      // 1. Guardar en Supabase
      const { error } = await supabase
        .from('suggestion_feedback')
        .insert({
          user_id: userId,
          visit_id: visitId,
          suggestion_id: suggestionId,
          feedback_type: feedbackType
        });
      
      if (error) {
        throw new Error(`Error al guardar feedback: ${error.message}`);
      }
      
      // 2. Registrar en AuditLogger
      AuditLogger.logSuggestionFeedback(
        userId,
        visitId,
        suggestionId,
        feedbackType,
        suggestion?.type || 'unknown'
      );
      
      // 3. Enviar métrica de uso
      track(
        'suggestion_feedback_given',
        userId,
        visitId,
        1,
        { 
          feedbackType,
          suggestionId,
          suggestionType: suggestion?.type || 'unknown'
        }
      );
      
      // Actualizar estado y notificar al componente padre
      setFeedback(feedbackType);
      if (onFeedback) {
        onFeedback(feedbackType);
      }
    } catch (error) {
      if (error instanceof Error) {
        // Manejar error silenciosamente en producción
        console.error('Error al procesar feedback:', error.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determinar si ya se ha dado feedback
  const hasProvidedFeedback = feedback !== 'none';

  return (
    <div className="mt-2 flex flex-col">
      <p className="text-xs text-gray-600 mb-1">¿Qué tan útil fue esta sugerencia?</p>
      <div className="flex space-x-2">
        <button
          onClick={() => saveFeedback('useful')}
          disabled={isSubmitting || hasProvidedFeedback}
          className={`px-3 py-1 text-xs font-medium rounded-md ${
            feedback === 'useful' 
              ? 'bg-green-100 text-green-700 border border-green-400' 
              : isSubmitting || hasProvidedFeedback
                ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                : 'bg-green-50 text-green-700 hover:bg-green-100'
          }`}
          aria-label="Sugerencia útil"
        >
          ✅ Útil
        </button>
        <button
          onClick={() => saveFeedback('irrelevant')}
          disabled={isSubmitting || hasProvidedFeedback}
          className={`px-3 py-1 text-xs font-medium rounded-md ${
            feedback === 'irrelevant' 
              ? 'bg-yellow-100 text-yellow-700 border border-yellow-400' 
              : isSubmitting || hasProvidedFeedback
                ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
          }`}
          aria-label="Sugerencia irrelevante"
        >
          ⚠️ Irrelevante
        </button>
        <button
          onClick={() => saveFeedback('incorrect')}
          disabled={isSubmitting || hasProvidedFeedback}
          className={`px-3 py-1 text-xs font-medium rounded-md ${
            feedback === 'incorrect' 
              ? 'bg-red-100 text-red-700 border border-red-400' 
              : isSubmitting || hasProvidedFeedback
                ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                : 'bg-red-50 text-red-700 hover:bg-red-100'
          }`}
          aria-label="Sugerencia incorrecta"
        >
          ❌ Incorrecta
        </button>
        <button
          onClick={() => saveFeedback('dangerous')}
          disabled={isSubmitting || hasProvidedFeedback}
          className={`px-3 py-1 text-xs font-medium rounded-md ${
            feedback === 'dangerous' 
              ? 'bg-purple-100 text-purple-700 border border-purple-400' 
              : isSubmitting || hasProvidedFeedback
                ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
          }`}
          aria-label="Sugerencia peligrosa"
        >
          🔥 Peligrosa
        </button>
      </div>
      {isSubmitting && (
        <p className="text-xs text-gray-500 mt-1">Enviando feedback...</p>
      )}
      {hasProvidedFeedback && !isSubmitting && (
        <p className="text-xs text-green-600 mt-1">¡Gracias por tu retroalimentación!</p>
      )}
    </div>
  );
};

export default AgentSuggestionFeedbackActions; 