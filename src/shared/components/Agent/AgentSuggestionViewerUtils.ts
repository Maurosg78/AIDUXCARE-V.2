// Utilidades para el manejo y análisis de sugerencias del agente

export type SuggestionType = "recommendation" | "warning" | "info" | string;
export type SuggestionStatus =
  | "integrated"
  | "rejected"
  | "pending"
  | "error"
  | string;

export interface Suggestion {
  id?: string;
  type?: SuggestionType;
  status?: SuggestionStatus;
  content?: string;
  responseTime?: number;
  priority?: number;
}

export function formatSuggestionType(type: SuggestionType): string {
  switch (type) {
    case "recommendation":
      return "Recomendación";
    case "warning":
      return "Advertencia";
    case "info":
      return "Información";
    default:
      return "Desconocido";
  }
}

export function formatSuggestionStatus(status: SuggestionStatus): string {
  switch (status) {
    case "integrated":
      return "Integrado";
    case "rejected":
      return "Rechazado";
    case "pending":
      return "Pendiente";
    case "error":
      return "Error";
    default:
      return "Desconocido";
  }
}

export function calculateSuccessRate(suggestions: Suggestion[]): number {
  if (!suggestions.length) return 0;
  const integrated = suggestions.filter(
    (s) => s.status === "integrated",
  ).length;
  return integrated / suggestions.length;
}

export function calculateAverageResponseTime(
  suggestions: Suggestion[],
): number {
  const withTime = suggestions.filter(
    (s) => typeof s.responseTime === "number",
  );
  if (!withTime.length) return 0;
  const total = withTime.reduce((acc, s) => acc + (s.responseTime || 0), 0);
  return total / withTime.length;
}

export function groupSuggestionsByType(
  suggestions: Suggestion[],
): Record<string, Suggestion[]> {
  const grouped: Record<string, Suggestion[]> = {
    recommendation: [],
    warning: [],
    info: [],
  };
  suggestions.forEach((s) => {
    if (s.type && grouped[s.type]) {
      grouped[s.type].push(s);
    }
  });
  return grouped;
}

export function filterSuggestionsByStatus(
  suggestions: Suggestion[],
  status: SuggestionStatus,
): Suggestion[] {
  return suggestions.filter((s) => s.status === status);
}

export function sortSuggestionsByPriority(
  suggestions: Suggestion[],
): Suggestion[] {
  // Si no hay prioridad, se considera 0
  return [...suggestions].sort((a, b) => (b.priority || 0) - (a.priority || 0));
}
