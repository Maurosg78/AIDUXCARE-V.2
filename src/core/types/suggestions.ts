/**
 * Tipos para filtrado y ordenamiento de sugerencias clínicas
 */

/**
 * Tipos de sugerencias soportados por el sistema
 */
export type SuggestionType = "recommendation" | "warning" | "info";

/**
 * Opciones de ordenamiento para las sugerencias
 */
export type SuggestionSortOption = "risk" | "usefulness" | "type";

/**
 * Estado de los filtros de sugerencias
 */
export interface SuggestionFilters {
  searchText: string;
  types: SuggestionType[];
  sortBy: SuggestionSortOption;
}

/**
 * Nivel de riesgo asociado a una sugerencia para ordenamiento
 */
export type RiskLevel = "high" | "medium" | "low";

/**
 * Mapeo de tipo de sugerencia a nivel de riesgo para ordenamiento
 */
export const suggestionTypeToRiskLevel: Record<SuggestionType, RiskLevel> = {
  warning: "high",
  recommendation: "medium",
  info: "low",
};

/**
 * Orden de prioridad para los niveles de riesgo
 */
export const riskLevelPriority: Record<RiskLevel, number> = {
  high: 1,
  medium: 2,
  low: 3,
};

/**
 * Orden de prioridad para tipos de feedback
 */
export const feedbackTypePriority: Record<string, number> = {
  useful: 1,
  irrelevant: 2,
  incorrect: 3,
  dangerous: 4,
  none: 5,
};

/**
 * Orden de prioridad para tipos de sugerencia
 */
export const suggestionTypePriority: Record<SuggestionType, number> = {
  warning: 1,
  recommendation: 2,
  info: 3,
};
