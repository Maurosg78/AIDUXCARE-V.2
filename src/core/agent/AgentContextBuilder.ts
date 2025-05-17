import { vi } from "vitest";
import { MCPContext } from '@/core/mcp/schema';

/**
 * Interfaz que define la estructura del contexto para el agente LLM
 */
export interface AgentContext {
  visitId: string;
  patientId: string;
  blocks: {
    id: string;
    type: 'contextual' | 'persistent' | 'semantic';
    content: string;
    metadata?: Record<string, unknown>;
  }[];
}

/**
 * Construye un contexto estructurado para el agente LLM a partir del contexto MCP
 * 
 * @param mcpContext - El contexto MCP completo que contiene los bloques de memoria
 * @returns Un objeto AgentContext limpio y estructurado
 */
export function buildAgentContext(mcpContext: MCPContext): AgentContext {
  // Inicializar el objeto de contexto del agente
  const agentContext: AgentContext = {
    visitId: '',
    patientId: '',
    blocks: []
  };
  
  // Extraer y procesar los bloques de memoria contextual
  const contextualBlocks = mcpContext.contextual.data
    .filter(block => Boolean(block.id) && Boolean(block.content))
    .map(block => {
      // Tipo básico para todos los bloques
      const blockData: {
        id: string;
        type: 'contextual';
        content: string;
        metadata?: Record<string, unknown>;
      } = {
        id: block.id,
        type: 'contextual',
        content: block.content
      };
      
      return blockData;
    });
  
  // Extraer y procesar los bloques de memoria persistente
  const persistentBlocks = mcpContext.persistent.data
    .filter(block => Boolean(block.id) && Boolean(block.content))
    .map(block => {
      // Tipo básico para todos los bloques
      const blockData: {
        id: string;
        type: 'persistent';
        content: string;
        metadata?: Record<string, unknown>;
      } = {
        id: block.id,
        type: 'persistent',
        content: block.content
      };
      
      return blockData;
    });
  
  // Extraer y procesar los bloques de memoria semántica
  const semanticBlocks = mcpContext.semantic.data
    .filter(block => Boolean(block.id) && Boolean(block.content))
    .map(block => {
      // Tipo básico para todos los bloques
      const blockData: {
        id: string;
        type: 'semantic';
        content: string;
        metadata?: Record<string, unknown>;
      } = {
        id: block.id,
        type: 'semantic',
        content: block.content
      };
      
      return blockData;
    });
  
  // Extraer patientId y visitId de los datos disponibles
  // Utilizando el operador 'as' de manera segura para acceder a propiedades opcionales
  mcpContext.persistent.data.forEach(block => {
    const blockAny = block as Record<string, unknown>;
    if (blockAny.patient_id && typeof blockAny.patient_id === 'string' && !agentContext.patientId) {
      agentContext.patientId = blockAny.patient_id;
    }
  });
  
  // Buscar el visitId en los bloques contextual
  [...mcpContext.contextual.data, ...mcpContext.persistent.data].forEach(block => {
    const blockAny = block as Record<string, unknown>;
    if (blockAny.visit_id && typeof blockAny.visit_id === 'string' && !agentContext.visitId) {
      agentContext.visitId = blockAny.visit_id;
    }
  });
  
  // Combinar todos los bloques validados
  agentContext.blocks = [
    ...contextualBlocks,
    ...persistentBlocks,
    ...semanticBlocks
  ];
  
  return agentContext;
}