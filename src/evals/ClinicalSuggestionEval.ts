import { AgentSuggestion } from '../core/agent/ClinicalAgent';
import { SuggestionType } from '../core/types/suggestions';

/**
 * Interfaz que define el resultado de una evaluación de sugerencia clínica
 */
export interface SuggestionEvalResult {
  isValid: boolean;
  reasons: string[]; // Razones por las que pasa o falla la evaluación
}

/**
 * Evalúa una sugerencia clínica para verificar que cumple con los criterios establecidos
 * 
 * @param suggestion La sugerencia clínica a evaluar
 * @returns Resultado de la evaluación con razones detalladas
 */
export function evaluateSuggestion(suggestion: AgentSuggestion): SuggestionEvalResult {
  const reasons: string[] = [];
  let isValid = true;

  // Validar que el tipo sea válido (recommendation, warning, info)
  const validTypes: SuggestionType[] = ['recommendation', 'warning', 'info'];
  if (!validTypes.includes(suggestion.type as SuggestionType)) {
    reasons.push(`Tipo de sugerencia '${suggestion.type}' no válido. Debe ser: recommendation, warning o info.`);
    isValid = false;
  } else {
    reasons.push(`Tipo de sugerencia '${suggestion.type}' válido.`);
  }

  // Validar que content esté presente y tenga mínimo 10 caracteres
  if (!suggestion.content || suggestion.content.trim().length === 0) {
    reasons.push('El contenido de la sugerencia no puede estar vacío.');
    isValid = false;
  } else if (suggestion.content.length < 10) {
    reasons.push(`El contenido de la sugerencia es demasiado corto (${suggestion.content.length} caracteres). Mínimo requerido: 10 caracteres.`);
    isValid = false;
  } else {
    reasons.push(`Contenido de la sugerencia válido (${suggestion.content.length} caracteres).`);
  }

  // Validar que context_origin esté definido
  if (!suggestion.context_origin) {
    reasons.push('La sugerencia debe tener un origen de contexto definido (context_origin).');
    isValid = false;
  } else {
    if (!suggestion.context_origin.source_block) {
      reasons.push('El origen de contexto debe especificar un bloque de origen (source_block).');
      isValid = false;
    } else {
      reasons.push('Origen de contexto (context_origin) válido.');
    }
    
    if (!suggestion.context_origin.text) {
      reasons.push('El origen de contexto debe especificar un texto de referencia (text).');
      isValid = false;
    }
  }

  // Validar que tenga un ID
  if (!suggestion.id) {
    reasons.push('La sugerencia debe tener un ID único.');
    isValid = false;
  } else {
    reasons.push('ID de sugerencia válido.');
  }

  // Validar que tenga un sourceBlockId
  if (!suggestion.sourceBlockId) {
    reasons.push('La sugerencia debe tener un ID de bloque de origen (sourceBlockId).');
    isValid = false;
  } else {
    reasons.push('ID de bloque de origen (sourceBlockId) válido.');
  }

  return {
    isValid,
    reasons
  };
} 