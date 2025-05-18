import { AgentContext } from './AgentContextBuilder';
import { v4 as uuidv4 } from 'uuid';
import { getSuggestionsFromLLM } from './LLMAdapterReal';
import { evaluateSuggestion } from '../../evals/ClinicalSuggestionEval';
import { logMetric } from '../../services/UsageAnalyticsService';

/**
 * Interfaz que define la estructura de una sugerencia generada por el agente LLM
 */
export interface AgentSuggestion {
  id: string;
  sourceBlockId: string;
  type: 'recommendation' | 'warning' | 'info';
  content: string;
  context_origin?: {
    source_block: string;
    text: string;
  }
}

/**
 * Genera sugerencias basadas en el contexto del agente
 * 
 * Dependiendo de la configuración del entorno, utilizará un modelo LLM real o 
 * generará sugerencias determinísticas basadas en palabras clave.
 * 
 * @param ctx El contexto del agente con los bloques de memoria
 * @returns Array de sugerencias generadas
 */
export async function getAgentSuggestions(ctx: AgentContext): Promise<AgentSuggestion[]> {
  // Verificar si se debe usar el LLM real
  const useRealLLM = process.env.USE_REAL_LLM === 'true';
  
  // Si se usa LLM real, invocar al adaptador
  if (useRealLLM) {
    console.log('Utilizando LLM real para generar sugerencias clínicas');
    const suggestions = await getSuggestionsFromLLM(ctx);
    return evaluateSuggestionsIfEnabled(suggestions, ctx.visitId, ctx.patientId);
  }
  
  // En caso contrario, usar la implementación determinística original
  console.log('Utilizando generación determinística de sugerencias clínicas');
  const suggestions = await getDeterministicSuggestions(ctx);
  return evaluateSuggestionsIfEnabled(suggestions, ctx.visitId, ctx.patientId);
}

/**
 * Evalúa las sugerencias generadas si la evaluación está habilitada
 * 
 * @param suggestions Sugerencias a evaluar
 * @param visitId ID de la visita
 * @param patientId ID del paciente
 * @returns Las mismas sugerencias recibidas (la evaluación es solo para métricas)
 */
function evaluateSuggestionsIfEnabled(
  suggestions: AgentSuggestion[], 
  visitId: string, 
  patientId: string
): AgentSuggestion[] {
  // Verificar si está habilitada la evaluación (desactivada por defecto)
  const enableEvaluation = process.env.ENABLE_SUGGESTION_EVAL === 'true';
  
  if (!enableEvaluation) {
    return suggestions;
  }
  
  // Si la evaluación está activada, evaluar cada sugerencia
  console.log('Evaluando calidad de sugerencias clínicas');
  
  let invalidCount = 0;
  
  suggestions.forEach(suggestion => {
    const evalResult = evaluateSuggestion(suggestion);
    
    if (!evalResult.isValid) {
      invalidCount++;
      
      // Registrar métrica de sugerencia inválida para análisis posterior
      if (visitId) {
        try {
          logMetric({
            timestamp: new Date().toISOString(),
            visitId,
            userId: 'system',
            type: 'suggestion_eval_failed',
            value: 1,
            details: {
              suggestion_id: suggestion.id,
              patient_id: patientId,
              reasons: evalResult.reasons,
              suggestion_type: suggestion.type,
              suggestion_content: suggestion.content.substring(0, 50) // Primeros 50 caracteres para análisis
            }
          });
        } catch (error) {
          console.error('Error al registrar métrica de evaluación de sugerencia:', error);
        }
      }
    }
  });
  
  if (invalidCount > 0) {
    console.warn(`Se encontraron ${invalidCount} sugerencias que no cumplen con los criterios de calidad.`);
  }
  
  // Devolver las sugerencias originales (la evaluación es solo para métricas)
  return suggestions;
}

/**
 * Implementación determinística para generar sugerencias basadas en palabras clave
 * 
 * Esta implementación simulada genera sugerencias ficticias basadas
 * en el contenido de los bloques de memoria contextual y semántica.
 * 
 * @param ctx El contexto del agente con los bloques de memoria
 * @returns Array de sugerencias generadas
 */
export async function getDeterministicSuggestions(ctx: AgentContext): Promise<AgentSuggestion[]> {
  // Array para almacenar las sugerencias generadas
  const suggestions: AgentSuggestion[] = [];
  
  // Filtrar bloques de tipo contextual y semantico
  const contextualBlocks = ctx.blocks.filter(block => block.type === 'contextual');
  const semanticBlocks = ctx.blocks.filter(block => block.type === 'semantic');
  
  // STUB: Generar sugerencias basadas en bloques contextuales
  for (const block of contextualBlocks) {
    // Solo generamos sugerencias para bloques que contengan ciertas palabras clave
    if (block.content.toLowerCase().includes('dolor')) {
      suggestions.push({
        id: uuidv4(),
        sourceBlockId: block.id,
        type: 'recommendation',
        content: 'Considerar evaluación de escala de dolor y administrar analgésicos según protocolo.',
        context_origin: {
          source_block: block.id,
          text: 'dolor'
        }
      });
    }
    
    if (block.content.toLowerCase().includes('presión') || 
        block.content.toLowerCase().includes('tension')) {
      suggestions.push({
        id: uuidv4(),
        sourceBlockId: block.id,
        type: 'warning',
        content: 'Monitorizar tensión arterial cada 4 horas. Valores fuera de rango requieren atención.',
        context_origin: {
          source_block: block.id,
          text: 'presión'
        }
      });
    }
  }
  
  // STUB: Generar sugerencias basadas en bloques semánticos
  for (const block of semanticBlocks) {
    if (block.content.toLowerCase().includes('diabetes') || 
        block.content.toLowerCase().includes('glucosa')) {
      suggestions.push({
        id: uuidv4(),
        sourceBlockId: block.id,
        type: 'info',
        content: 'Paciente con historial de diabetes. Considerar monitorización de glucemia.',
        context_origin: {
          source_block: block.id,
          text: 'diabetes'
        }
      });
    }
  }
  
  // Si no se generaron sugerencias basadas en keywords, generar al menos 2 genéricas
  if (suggestions.length === 0) {
    // Usar el primer bloque contextual si existe
    const sourceBlockId = contextualBlocks.length > 0 
      ? contextualBlocks[0].id 
      : (semanticBlocks.length > 0 ? semanticBlocks[0].id : 'default-block-id');
    
    suggestions.push({
      id: uuidv4(),
      sourceBlockId,
      type: 'info',
      content: 'Recordar documentar signos vitales en cada visita según protocolo institucional.',
      context_origin: {
        source_block: sourceBlockId,
        text: 'Recordar documentar signos vitales en cada visita según protocolo institucional.'
      }
    });
    
    suggestions.push({
      id: uuidv4(),
      sourceBlockId,
      type: 'recommendation',
      content: 'Evaluar estado de hidratación y balance hídrico del paciente.',
      context_origin: {
        source_block: sourceBlockId,
        text: 'Evaluar estado de hidratación y balance hídrico del paciente.'
      }
    });
  }
  
  return suggestions;
} 