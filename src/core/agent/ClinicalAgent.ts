import { vi } from "vitest";
import { AgentContext } from './AgentContextBuilder';
import { v4 as uuidv4 } from 'uuid';

/**
 * Interfaz que define la estructura de una sugerencia generada por el agente LLM
 */
export interface AgentSuggestion {
  id: string;
  sourceBlockId: string;
  type: 'recommendation' | 'warning' | 'info';
  content: string;
}

/**
 * STUB: Genera sugerencias basadas en el contexto del agente
 * 
 * Esta es una implementación simulada que genera sugerencias ficticias basadas
 * en el contenido de los bloques de memoria contextual y semántica.
 * 
 * En una implementación real, esta función llamaría a un servicio LLM para generar
 * sugerencias basadas en un análisis más profundo del contexto.
 * 
 * @param ctx El contexto del agente con los bloques de memoria
 * @returns Array de sugerencias generadas
 */
export async function getAgentSuggestions(ctx: AgentContext): Promise<AgentSuggestion[]> {
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
        content: 'Considerar evaluación de escala de dolor y administrar analgésicos según protocolo.'
      });
    }
    
    if (block.content.toLowerCase().includes('presión') || 
        block.content.toLowerCase().includes('tension')) {
      suggestions.push({
        id: uuidv4(),
        sourceBlockId: block.id,
        type: 'warning',
        content: 'Monitorizar tensión arterial cada 4 horas. Valores fuera de rango requieren atención.'
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
        content: 'Paciente con historial de diabetes. Considerar monitorización de glucemia.'
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
      content: 'Recordar documentar signos vitales en cada visita según protocolo institucional.'
    });
    
    suggestions.push({
      id: uuidv4(),
      sourceBlockId,
      type: 'recommendation',
      content: 'Evaluar estado de hidratación y balance hídrico del paciente.'
    });
  }
  
  return suggestions;
} 