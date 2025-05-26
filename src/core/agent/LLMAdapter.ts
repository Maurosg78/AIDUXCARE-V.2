import { AgentContext, AgentSuggestion, SuggestionType } from '@/types/agent';

/**
 * Tipo que define los proveedores de modelos de lenguaje soportados
 */
export type LLMProvider = 'openai' | 'anthropic' | 'cohere';

export interface LLMResponse {
  suggestions: AgentSuggestion[];
  explanation?: string;
}

/**
 * Función que simula el envío de un prompt a un modelo de lenguaje
 * 
 * Esta implementación solo simula las respuestas con un retraso artificial.
 * En una implementación real, esta función realizaría una llamada a la API
 * del proveedor correspondiente.
 * 
 * @param context El contexto del agente
 * @param provider El proveedor de LLM a utilizar
 * @returns Una promesa que se resuelve con la respuesta del modelo
 * @throws Error si el proveedor no es soportado
 */
export async function sendToLLM(
  context: AgentContext,
  provider: LLMProvider = 'openai'
): Promise<LLMResponse> {
  // Validar proveedor soportado
  if (provider !== 'openai' && provider !== 'anthropic' && provider !== 'cohere') {
    return Promise.reject(new Error('Unsupported LLM provider'));
  }
  // Implementación simulada para desarrollo
  return {
    suggestions: [
      {
        id: '1',
        type: 'recommendation' as SuggestionType,
        field: 'diagnosis',
        content: 'Considerar diagnóstico de hipertensión arterial',
        sourceBlockId: context.blocks[0]?.id || 'default',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ],
    explanation: 'Basado en los signos vitales y síntomas reportados'
  };
} 