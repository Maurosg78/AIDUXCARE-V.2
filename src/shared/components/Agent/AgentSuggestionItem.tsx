import React from "react";

interface AgentSuggestion {
  id: string;
  type: "recommendation" | "warning" | "info";
  content: string;
  sourceBlockId: string;
  field: string;
}

interface AgentSuggestionItemProps {
  suggestion: AgentSuggestion;
  isIntegrated: boolean;
  onAccept: (suggestion: AgentSuggestion) => void;
  onReject: (suggestion: AgentSuggestion) => void;
  onFeedback: (suggestion: AgentSuggestion) => void;
}

const typeLabels: Record<string, string> = {
  recommendation: "Recomendación",
  warning: "Advertencia",
  info: "Información",
};

const AgentSuggestionItem: React.FC<AgentSuggestionItemProps> = ({
  suggestion,
  isIntegrated,
  onAccept,
  onReject,
  onFeedback,
}) => {
  return (
    <div role="article" aria-label="Sugerencia de diagnóstico">
      <div>{suggestion.content}</div>
      <div>{typeLabels[suggestion.type] || "Desconocido"}</div>
      {isIntegrated ? (
        <div>Integrado</div>
      ) : (
        <>
          <button
            onClick={() => onAccept(suggestion)}
            aria-label="Aceptar sugerencia"
          >
            Aceptar
          </button>
          <button
            onClick={() => onReject(suggestion)}
            aria-label="Rechazar sugerencia"
          >
            Rechazar
          </button>
          <button
            onClick={() => onFeedback(suggestion)}
            aria-label="Dar retroalimentación"
          >
            Retroalimentación
          </button>
        </>
      )}
    </div>
  );
};

export default AgentSuggestionItem;
