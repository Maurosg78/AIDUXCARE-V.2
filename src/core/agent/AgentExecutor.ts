import { v4 as uuidv4 } from 'uuid';
import type { AgentContext, AgentSuggestion, MemoryBlock, SuggestionType, SuggestionField } from '@/types/agent';
import { LLMProvider, sendToLLM, LLMResponse } from './LLMAdapter';
import { ClinicalAgent } from './ClinicalAgent';

/**
 * Parámetros necesarios para ejecutar el agente clínico
 */
export interface AgentExecutionParams {
  context: AgentContext;
  provider: LLMProvider;
}

/**
 * Convierte el contexto del agente en un prompt estructurado y legible para el LLM
 * 
 * @param context El contexto del agente
 * @returns String con el prompt formateado
 */
function buildPromptFromContext(context: AgentContext): string {
  // Inicializar el prompt con un encabezado claro
  let prompt = `INSTRUCCIONES:
Eres un asistente médico de IA especializado en análisis clínico.
Basado en la información proporcionada, genera 2-3 sugerencias clínicas priorizadas.
Clasifica cada sugerencia como "recommendation", "warning" o "info".

CONTEXTO DEL PACIENTE:
ID de Visita: ${context.visitId || 'No disponible'}
ID de Paciente: ${context.metadata?.patientId || 'No disponible'}

`;

  // Validación defensiva para context.blocks
  const blocks = Array.isArray(context.blocks) ? context.blocks : [];

  // Agrupar bloques por tipo
  const contextualBlocks = blocks.filter((block: MemoryBlock) => block.type === 'contextual');
  const persistentBlocks = blocks.filter((block: MemoryBlock) => block.type === 'persistent');
  const semanticBlocks = blocks.filter((block: MemoryBlock) => block.type === 'semantic');

  // Añadir bloques contextuales
  if (contextualBlocks.length > 0) {
    prompt += `MEMORIA CONTEXTUAL (información específica de la visita actual):\n`;
    contextualBlocks.forEach((block: MemoryBlock) => {
      prompt += `[ID: ${block.id}] ${block.content}\n`;
    });
    prompt += '\n';
  }

  // Añadir bloques persistentes
  if (persistentBlocks.length > 0) {
    prompt += `MEMORIA PERSISTENTE (historial del paciente):\n`;
    persistentBlocks.forEach((block: MemoryBlock) => {
      prompt += `[ID: ${block.id}] ${block.content}\n`;
    });
    prompt += '\n';
  }

  // Añadir bloques semánticos
  if (semanticBlocks.length > 0) {
    prompt += `CONOCIMIENTO SEMÁNTICO (información médica general):\n`;
    semanticBlocks.forEach((block: MemoryBlock) => {
      prompt += `[ID: ${block.id}] ${block.content}\n`;
    });
    prompt += '\n';
  }

  // Añadir instrucciones finales para el formato de respuesta
  prompt += `
FORMATO DE RESPUESTA:
Proporciona tus sugerencias con el siguiente formato:

1. [TIPO: recommendation/warning/info] Contenido de la primera sugerencia
2. [TIPO: recommendation/warning/info] Contenido de la segunda sugerencia
3. [TIPO: recommendation/warning/info] Contenido de la tercera sugerencia (opcional)

Asegúrate de incluir solo sugerencias relevantes y útiles basadas en el contexto proporcionado.
`;

  return prompt;
}

/**
 * Parsea la respuesta del LLM y la convierte en un array de objetos AgentSuggestion
 * 
 * @param llmResponse La respuesta del LLM
 * @param context El contexto original para obtener sourceBlockId válidos
 * @returns Array de objetos AgentSuggestion
 */
function parseResponseToSuggestions(llmResponse: LLMResponse, context: AgentContext): AgentSuggestion[] {
  console.log('parseResponseToSuggestions - Respuesta LLM recibida:', llmResponse);
  console.log('parseResponseToSuggestions - Contexto recibido:', context);

  const suggestions = llmResponse.suggestions.map(suggestion => ({
    ...suggestion,
    createdAt: new Date(),
    updatedAt: new Date()
  }));

  console.log('parseResponseToSuggestions - Sugerencias procesadas:', suggestions);
  return suggestions;
}

export class AgentExecutor {
  private agent: ClinicalAgent;
  private context: AgentContext;
  private provider: LLMProvider;

  constructor(agent: ClinicalAgent, context: AgentContext, provider: LLMProvider) {
    this.agent = agent;
    this.context = context;
    this.provider = provider;
  }

  public static async create(visitId: string, provider: LLMProvider): Promise<AgentExecutor> {
    if (!visitId) {
      throw new Error('El ID de visita es requerido para crear el ejecutor del agente');
    }
    const agent = await ClinicalAgent.create(visitId);
    const context = await agent.getContext();
    return new AgentExecutor(agent, context, provider);
  }

  public getSuggestions(): AgentSuggestion[] {
    return this.agent.getSuggestions();
  }

  public async execute(): Promise<AgentSuggestion[]> {
    try {
      console.log('AgentExecutor.execute - Contexto recibido:', {
        visitId: this.context.visitId,
        blocksCount: this.context.blocks?.length,
        blocks: this.context.blocks
      });

    if (!this.context || !Array.isArray(this.context.blocks)) {
        console.log('AgentExecutor.execute - Contexto inválido o sin bloques');
      return [];
    }

    const prompt = buildPromptFromContext(this.context);
      console.log('AgentExecutor.execute - Prompt generado:', prompt);

    const llmResponse = await sendToLLM(this.context, this.provider);
      console.log('AgentExecutor.execute - Respuesta LLM:', llmResponse);

    const suggestions = parseResponseToSuggestions(llmResponse, this.context);
      console.log('AgentExecutor.execute - Sugerencias parseadas:', suggestions);
    
    // Añadir cada sugerencia al agente
    for (const suggestion of suggestions) {
      await this.agent.addSuggestion({
        id: suggestion.id,
        sourceBlockId: suggestion.sourceBlockId,
        type: suggestion.type,
        content: suggestion.content,
        field: suggestion.field
      });
    }
    
    return suggestions;
    } catch (error) {
      console.error('Error al ejecutar el agente:', error);
      return [];
    }
  }
} 