import { SuggestionField } from './agent';

/**
 * Tipos de sugerencias que se pueden integrar al EMR
 */
export const INTEGRABLE_SUGGESTION_TYPES = ['recommendation', 'warning', 'info'] as const;
export type IntegrableSuggestionType = typeof INTEGRABLE_SUGGESTION_TYPES[number];

/**
 * Interfaz para representar una sugerencia que se integrará al EMR
 */
export interface SuggestionToIntegrate {
  id: string;
  content: string;
  type: IntegrableSuggestionType;
  sourceBlockId: string;
  field: SuggestionField;
} 