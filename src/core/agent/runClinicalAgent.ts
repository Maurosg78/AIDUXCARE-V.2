import { vi } from "vitest";
import { MCPContext } from '../mcp/schema';
import { buildAgentContext } from './AgentContextBuilder';
import { executeAgent } from './AgentExecutor';
import { AgentSuggestion } from './ClinicalAgent';
import { LLMProvider } from './LLMAdapter';
import { logMetric } from '../../services/UsageAnalyticsService';

/**
 * Tipo para los resultados devueltos por runClinicalAgent
 */
export interface RunClinicalAgentResult {
  suggestions: AgentSuggestion[];
  auditLogs: string[]; // Para uso futuro
}

/**
 * Tipo para los parámetros del contexto adicional
 */
export interface RunClinicalAgentParams {
  visitId?: string;
  userId?: string;
}

/**
 * Función de alto nivel que orquesta el flujo completo del agente clínico
 * 
 * Este flujo combina el builder del contexto y la ejecución del agente,
 * proporcionando una interfaz simplificada para usar el agente clínico.
 * 
 * @param mcpContext Contexto MCP con los datos de memoria
 * @param provider Proveedor LLM a utilizar (por defecto: 'openai')
 * @param params Parámetros adicionales como visitId y userId
 * @returns Objeto con las sugerencias generadas y logs de auditoría
 */
export async function runClinicalAgent(
  mcpContext: MCPContext,
  provider: LLMProvider = 'openai',
  params: RunClinicalAgentParams = {}
): Promise<RunClinicalAgentResult> {
  // Resultado por defecto en caso de error
  const defaultResult: RunClinicalAgentResult = {
    suggestions: [],
    auditLogs: []
  };

  try {
    // Validación básica del contexto MCP
    if (!mcpContext || 
        !mcpContext.contextual || 
        !mcpContext.persistent || 
        !mcpContext.semantic) {
      return defaultResult;
    }

    // Construir el contexto del agente a partir del contexto MCP
    const agentContext = buildAgentContext(mcpContext);

    // Ejecutar el agente con el contexto construido
    const suggestions = await executeAgent({
      context: agentContext,
      provider
    });

    // Registrar métrica de sugerencias generadas si hay sugerencias y un visitId
    if (suggestions.length > 0 && params.visitId) {
      // Calcular el tiempo estimado ahorrado (3 minutos por sugerencia)
      const estimatedTimeSaved = suggestions.length * 3;
      
      // Registrar la métrica con el tiempo estimado ahorrado
      logMetric({
        timestamp: new Date().toISOString(),
        visitId: params.visitId,
        userId: params.userId || 'admin-test-001',
        type: 'suggestions_generated',
        value: suggestions.length,
        estimated_time_saved_minutes: estimatedTimeSaved
      });
    }

    // Retornar las sugerencias generadas y un array vacío para auditLogs (uso futuro)
    return {
      suggestions,
      auditLogs: []
    };
  } catch (error) {
    // En caso de error, capturarlo y devolver un resultado vacío
    // Aquí se podría agregar lógica adicional para registrar el error en el futuro
    return defaultResult;
  }
} 