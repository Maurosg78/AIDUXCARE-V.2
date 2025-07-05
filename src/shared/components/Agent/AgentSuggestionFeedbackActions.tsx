import React from "react";
import { Button } from "../UI/Button";
import { track } from "../../utils/analytics";

interface AgentSuggestionFeedbackActionsProps {
  visitId: string;
  userId: string;
  suggestion: {
    id: string;
    content: string;
  };
  onAccept: () => void;
  onReject: () => void;
  isIntegrated: boolean;
}

const AgentSuggestionFeedbackActions: React.FC<
  AgentSuggestionFeedbackActionsProps
> = ({ visitId, userId, suggestion, onAccept, onReject, isIntegrated }) => {
  const handleAccept = () => {
    track("suggestion_accepted", {
      visitId,
      userId,
      suggestionId: suggestion.id,
    });
    onAccept();
  };

  const handleReject = () => {
    track("suggestion_rejected", {
      visitId,
      userId,
      suggestionId: suggestion.id,
    });
    onReject();
  };

  if (isIntegrated) {
    return (
      <div className="mt-2 text-sm text-success">✓ Sugerencia integrada</div>
    );
  }

  return (
    <div className="mt-2 flex space-x-2">
      <Button variant="primary" size="sm" onClick={handleAccept}>
        Aceptar
      </Button>
      <Button variant="outline" size="sm" onClick={handleReject}>
        Rechazar
      </Button>
    </div>
  );
};

export default AgentSuggestionFeedbackActions;
