import { v4 as uuidv4 } from 'uuid';
import { AgentContext, AgentSuggestion } from '@/types/agent';
import { buildAgentContext } from './AgentContextBuilder';
import { AgentExecutor } from './AgentExecutor';
import { logMetric } from '@/services/UsageAnalyticsService';
import { UsageMetricType } from '@/services/UsageAnalyticsService';

/**
 * Ejecuta el agente clínico para una visita específica
 * 
 * @param visitId ID de la visita para la cual ejecutar el agente
 * @returns Promise<AgentSuggestion[]> Array de sugerencias generadas por el agente
 */
export async function runClinicalAgent(visitId: string): Promise<AgentSuggestion[]> {
  try {
    // Construir el contexto del agente
    const agentContext = await buildAgentContext(visitId);

    // Crear y ejecutar el agente
    const executor = await AgentExecutor.create(visitId, 'openai');
    const suggestions = await executor.execute();

    // Registrar métrica de sugerencias generadas
    if (suggestions.length > 0) {
      const metric: UsageMetricType = 'suggestions_generated';
      const estimatedTimeSaved = suggestions.length * 3; // 3 minutos por sugerencia

      logMetric({
        id: uuidv4(),
        type: metric,
        userId: agentContext.metadata.professionalId || 'system',
        visitId: visitId,
        metadata: {
          suggestionCount: suggestions.length,
          contextSize: agentContext.blocks.length
        },
        createdAt: new Date(),
        timestamp: new Date().toISOString(),
        value: suggestions.length,
        estimated_time_saved_minutes: estimatedTimeSaved
      });
    }

    return suggestions;
  } catch (error) {
    console.error('Error al ejecutar el agente clínico:', error);
    throw error;
  }
} 