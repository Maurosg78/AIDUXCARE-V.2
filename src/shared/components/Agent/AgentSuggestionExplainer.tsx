import React, { useState, useCallback, useMemo } from "react";
import { AgentSuggestion } from "@/types/agent";
import { explainSuggestion } from "@/core/agent/AgentExplainer";

interface Props {
  suggestion: AgentSuggestion;
  className?: string;
}

const ERROR_MESSAGES = {
  NETWORK: "Error de conexión",
  TIMEOUT: "La solicitud de explicación ha expirado",
  UNKNOWN: "No se pudo generar una explicación",
} as const;

type ErrorMessage = (typeof ERROR_MESSAGES)[keyof typeof ERROR_MESSAGES];

interface ComponentState {
  isExpanded: boolean;
  explanation: string;
  isLoading: boolean;
  error: ErrorMessage | null;
  hasFetched: boolean;
}

function detectErrorType(error: unknown): ErrorMessage {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (
      msg.includes("network") ||
      msg.includes("connection") ||
      msg.includes("conexión")
    ) {
      return ERROR_MESSAGES.NETWORK;
    }
    if (
      msg.includes("timeout") ||
      msg.includes("expired") ||
      msg.includes("expirado")
    ) {
      return ERROR_MESSAGES.TIMEOUT;
    }
  }
  return ERROR_MESSAGES.UNKNOWN;
}

const AgentSuggestionExplainer: React.FC<Props> = ({
  suggestion,
  className = "",
}) => {
  const [state, setState] = useState<ComponentState>({
    isExpanded: false,
    explanation: "",
    isLoading: false,
    error: null,
    hasFetched: false,
  });

  const isExplainable = useMemo(
    () => suggestion.type === "recommendation" || suggestion.type === "warning",
    [suggestion.type],
  );

  const fetchExplanation = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }));
    try {
      const result = await explainSuggestion(suggestion);
      setState((prev) => ({
        ...prev,
        explanation: result,
        isLoading: false,
        error: null,
        hasFetched: true,
      }));
    } catch (err) {
      const errorMessage = detectErrorType(err);
      setState((prev) => ({
        ...prev,
        error: errorMessage,
        explanation: errorMessage,
        isLoading: false,
        hasFetched: true,
      }));
    }
  }, [suggestion]);

  const handleToggle = useCallback(async () => {
    const newIsExpanded = !state.isExpanded;

    if (!newIsExpanded) {
      setState((prev) => ({ ...prev, isExpanded: false }));
      return;
    }

    if (state.isLoading) {
      return;
    }

    setState((prev) => ({ ...prev, isExpanded: true }));

    if (!state.hasFetched || state.error) {
      fetchExplanation();
    }
  }, [
    state.isExpanded,
    state.isLoading,
    state.hasFetched,
    state.error,
    fetchExplanation,
  ]);

  const handleRetry = useCallback(() => {
    setState((prev) => ({
      ...prev,
      explanation: "",
      error: null,
    }));
    fetchExplanation();
  }, [fetchExplanation]);

  if (!isExplainable) {
    return null;
  }

  const errorClasses = state.error
    ? "text-red-600 bg-red-50 border border-red-200"
    : "text-gray-700 bg-gray-50 border border-gray-200";

  const explanationOrErrorContent = state.error ?? state.explanation;

  return (
    <section
      className={`mt-2 ${className}`}
      aria-label="Explicación de la sugerencia"
    >
      <button
        data-testid="explanation-button"
        onClick={handleToggle}
        className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-2"
        disabled={state.isLoading && state.isExpanded}
        type="button"
        aria-label={
          state.isExpanded ? "Ocultar explicación" : "Ver explicación"
        }
        aria-expanded={state.isExpanded ? "true" : "false"}
      >
        <span className="material-icons text-sm" aria-hidden="true">
          {state.isExpanded ? "expand_less" : "expand_more"}
        </span>
        {state.isExpanded ? "Ocultar explicación" : "Ver explicación"}
      </button>

      {state.isExpanded && state.isLoading && (
        <output
          data-testid="loading-indicator"
          className="mt-2 text-sm text-gray-600 flex items-center gap-2"
          aria-live="polite"
        >
          <div
            className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"
            aria-hidden="true"
          ></div>
          Cargando explicación...
        </output>
      )}

      {state.isExpanded && !state.isLoading && explanationOrErrorContent && (
        <div
          id="explanation-content"
          data-testid="explanation-text"
          className={`mt-2 p-3 rounded-md text-sm ${errorClasses}`}
          aria-live="polite"
        >
          {state.error ? (
            <>
              {explanationOrErrorContent}
              <button
                onClick={handleRetry}
                className="mt-2 ml-2 text-sm text-blue-600 hover:text-blue-800 font-semibold"
                type="button"
              >
                Reintentar
              </button>
            </>
          ) : (
            explanationOrErrorContent
          )}
        </div>
      )}
    </section>
  );
};

export default AgentSuggestionExplainer;
