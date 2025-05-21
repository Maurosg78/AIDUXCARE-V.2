import React from 'react';
import { AgentSuggestion, SuggestionFeedbackType } from '@/types/agent';
import { track } from '@/lib/analytics';
import { AuditLogger } from '../../../core/audit/AuditLogger';

export interface AgentSuggestionFeedbackActionsProps {
  visitId: string;
  userId: string;
  suggestion: AgentSuggestion;
  onAccept: () => void;
  onReject: () => void;
  isIntegrated: boolean;
}

const AgentSuggestionFeedbackActions: React.FC<AgentSuggestionFeedbackActionsProps> = ({
  visitId,
  userId,
  suggestion,
  onAccept,
  onReject,
  isIntegrated
}) => {
  const handleAccept = () => {
    track('suggestion_accepted', { visitId, userId, suggestionId: suggestion.id });
    onAccept();
  };

  const handleReject = () => {
    track('suggestion_rejected', { visitId, userId, suggestionId: suggestion.id });
    onReject();
  };

  if (isIntegrated) {
    return (
      <div className="mt-2 text-sm text-green-600">
        ✓ Sugerencia integrada
      </div>
    );
  }

  return (
    <div className="mt-2 flex space-x-2">
      <button
        onClick={handleAccept}
        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
      >
        Aceptar
      </button>
      <button
        onClick={handleReject}
        className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
      >
        Rechazar
      </button>
    </div>
  );
};

AgentSuggestionFeedbackActions.displayName = 'AgentSuggestionFeedbackActions';

export default AgentSuggestionFeedbackActions; 