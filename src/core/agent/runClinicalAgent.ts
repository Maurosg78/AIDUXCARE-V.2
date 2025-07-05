import { v4 as uuidv4 } from "uuid";
import { AgentSuggestion } from "@/types/agent"; // Asegúrate que las rutas de importación con @ sean correctas para tu proyecto
import { buildAgentContext } from "./AgentContextBuilder";
import { AgentExecutor } from "./AgentExecutor";
import { logMetric, UsageMetricType } from "@/services/UsageAnalyticsService"; // Asegúrate que UsageMetricType se exporte y se importe

/**
 * Ejecuta el agente clínico para una visita específica
 *
 * @param visitId ID de la visita para la cual ejecutar el agente
 * @returns Promise<AgentSuggestion[]> Array de sugerencias generadas por el agente
 */
export async function runClinicalAgent(
  visitId: string,
): Promise<AgentSuggestion[]> {
  try {
    // Construir el contexto del agente
    const agentContext = await buildAgentContext(visitId);

    // Si el contexto es nulo o inválido, retornar array vacío y no loggear métrica
    // Es importante validar que professionalId existe antes de usarlo.
    if (
      !agentContext ||
      !agentContext.metadata ||
      !agentContext.metadata.professionalId || // Clave para userId en logMetric de éxito
      !Array.isArray(agentContext.blocks)
    ) {
      console.warn("Contexto inválido o vacío para la visita:", visitId);
      // Considerar loguear una métrica aquí si es un escenario que quieres rastrear,
      // por ejemplo, con type 'agent_execution_skipped_no_context'.
      // Por ahora, mantenemos el return [].
      return [];
    }

    // Crear y ejecutar el agente
    // Asumiendo que AgentExecutor.create puede necesitar el agentContext completo o partes de él,
    // y no solo visitId. Si solo necesita visitId, está bien.
    // El segundo parámetro 'openai' es el provider por defecto, según tus tests.
    const executor = await AgentExecutor.create(visitId, "openai");
    const suggestions = await executor.execute();

    // Registrar métrica de sugerencias generadas
    if (suggestions.length > 0) {
      const metricType: UsageMetricType = "suggestions_generated"; // Asegúrate que UsageMetricType incluye este valor
      const estimatedTimeSaved = suggestions.length * 3; // 3 minutos por sugerencia

      logMetric({
        id: uuidv4(),
        type: metricType,
        userId: agentContext.metadata.professionalId, // Usar el professionalId del contexto
        visitId: visitId,
        metadata: {
          suggestionCount: suggestions.length,
          contextSize: agentContext.blocks.length,
          // Podrías añadir más detalles aquí si es relevante
        },
        createdAt: new Date(),
        timestamp: new Date().toISOString(),
        value: suggestions.length,
        estimated_time_saved_minutes: estimatedTimeSaved,
      });
    }

    return suggestions;
  } catch (error) {
    // Registrar el error en las métricas
    // CAMBIO IMPORTANTE AQUÍ: Usar 'agent_execution_failed'
    const errorMetricType: UsageMetricType = "agent_execution_failed"; // Asegúrate que UsageMetricType incluye este valor

    logMetric({
      id: uuidv4(),
      type: errorMetricType,
      userId: "system", // O intentar obtener professionalId si está disponible en algún lado antes del fallo
      visitId: visitId, // El visitId original con el que se llamó la función
      metadata: {
        error: error instanceof Error ? error.message : String(error),
        // errorType: error instanceof Error ? error.constructor.name : "Unknown", // Esto ya estaba bien
        // Puedes añadir más detalles del error si es necesario
      },
      createdAt: new Date(), // Ya estaba bien
      timestamp: new Date().toISOString(), // Ya estaba bien
      value: 0, // Ya estaba bien
    });

    console.error("Error al ejecutar el agente clínico:", error);
    // En lugar de lanzar el error, devolvemos un array vacío según el comportamiento esperado por los tests
    return [];
  }
}
