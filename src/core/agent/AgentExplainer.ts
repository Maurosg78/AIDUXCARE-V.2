import { vi } from "vitest";
import { AgentSuggestion } from './ClinicalAgent';

/**
 * Genera una explicación determinística de por qué se generó una sugerencia clínica
 * basándose en su tipo, contenido y contexto de origen.
 * 
 * @param suggestion Sugerencia clínica a explicar
 * @returns Explicación textual sobre la razón de generación de la sugerencia
 */
export function explainSuggestion(suggestion: AgentSuggestion): string {
  // Si no hay contexto de origen, dar una explicación general
  if (!suggestion.context_origin) {
    return `Esta ${getSuggestionTypeText(suggestion.type)} fue generada en base a los protocolos clínicos estándar y la información disponible en el registro.`;
  }

  // Crear explicación basada en el tipo de sugerencia y su contexto
  switch (suggestion.type) {
    case 'recommendation':
      return generateRecommendationExplanation(suggestion);
    case 'warning':
      return generateWarningExplanation(suggestion);
    case 'info':
      return generateInfoExplanation(suggestion);
    default:
      return `Esta sugerencia se basa en el análisis del texto: "${suggestion.context_origin.text}" encontrado en la sección ${suggestion.context_origin.source_block}.`;
  }
}

/**
 * Obtiene el texto descriptivo del tipo de sugerencia
 */
function getSuggestionTypeText(type: 'recommendation' | 'warning' | 'info'): string {
  switch (type) {
    case 'recommendation':
      return 'recomendación clínica';
    case 'warning':
      return 'advertencia';
    case 'info':
      return 'información';
  }
}

/**
 * Genera explicación para sugerencias de tipo recomendación
 */
function generateRecommendationExplanation(suggestion: AgentSuggestion): string {
  const context = suggestion.context_origin?.text || '';
  const sourceBlock = suggestion.context_origin?.source_block || '';
  
  // Detectar patrones comunes en las recomendaciones
  if (context.toLowerCase().includes('dolor')) {
    return `Esta recomendación fue generada porque se identificó un patrón de dolor en "${context}" dentro de la sección ${sourceBlock}. Se sugiere seguir los protocolos de manejo de dolor según las guías clínicas actuales.`;
  }
  
  if (context.toLowerCase().includes('presión') || context.toLowerCase().includes('tensión')) {
    return `Se generó esta recomendación al detectar alteraciones de presión arterial en "${context}" registrado en ${sourceBlock}. El monitoreo periódico es crítico para prevenir complicaciones cardiovasculares.`;
  }

  if (suggestion.content.toLowerCase().includes('radiografía') || suggestion.content.toLowerCase().includes('imagen')) {
    return `Esta recomendación sugiere estudios de imagen basándose en la información clínica: "${context}" documentada en ${sourceBlock}, que podría indicar necesidad de evaluación diagnóstica complementaria.`;
  }

  // Explicación genérica para recomendaciones
  return `Esta recomendación clínica se generó a partir del análisis del texto: "${context}" registrado en ${sourceBlock}, siguiendo protocolos basados en evidencia para ofrecer el mejor cuidado posible.`;
}

/**
 * Genera explicación para sugerencias de tipo advertencia
 */
function generateWarningExplanation(suggestion: AgentSuggestion): string {
  const context = suggestion.context_origin?.text || '';
  const sourceBlock = suggestion.context_origin?.source_block || '';
  
  // Detectar patrones de riesgo
  if (context.toLowerCase().includes('alergia') || suggestion.content.toLowerCase().includes('alergia')) {
    return `Esta advertencia destaca un riesgo potencial relacionado con alergias mencionadas en "${context}" registrado en ${sourceBlock}. Las alergias deben verificarse antes de cualquier prescripción.`;
  }
  
  if (context.toLowerCase().includes('diabetes') || context.toLowerCase().includes('glucosa') || context.toLowerCase().includes('hba1c')) {
    return `Se generó esta advertencia debido a parámetros alterados de control glicémico: "${context}" en ${sourceBlock}. El descontrol metabólico requiere atención inmediata para prevenir complicaciones agudas.`;
  }

  if (context.toLowerCase().includes('presión') || context.toLowerCase().includes('tensión') || context.toLowerCase().includes('hta')) {
    return `Esta advertencia señala valores anormales de presión arterial detectados en "${context}" dentro de ${sourceBlock}. La hipertensión no controlada aumenta significativamente el riesgo cardiovascular.`;
  }

  // Explicación genérica para advertencias
  return `Esta advertencia clínica fue generada al identificar un patrón de riesgo en "${context}" dentro de ${sourceBlock}. Requiere atención prioritaria para garantizar la seguridad del paciente.`;
}

/**
 * Genera explicación para sugerencias de tipo información
 */
function generateInfoExplanation(suggestion: AgentSuggestion): string {
  const context = suggestion.context_origin?.text || '';
  const sourceBlock = suggestion.context_origin?.source_block || '';
  
  // Información sobre antecedentes
  if (context.toLowerCase().includes('previa') || context.toLowerCase().includes('anterior') || context.toLowerCase().includes('última visita')) {
    return `Esta información contextual resalta antecedentes relevantes: "${context}" registrados en ${sourceBlock}. La continuidad asistencial mejora significativamente los resultados clínicos.`;
  }
  
  if (context.toLowerCase().includes('diabetes') || context.toLowerCase().includes('glucosa')) {
    return `Esta información destaca un antecedente metabólico importante: "${context}" documentado en ${sourceBlock}. Los pacientes diabéticos requieren vigilancia especial de múltiples parámetros.`;
  }

  // Explicación genérica para información
  return `Esta información clínica complementaria se presenta basada en "${context}" encontrado en ${sourceBlock}, para proporcionar un contexto más completo durante la evaluación del paciente.`;
} 