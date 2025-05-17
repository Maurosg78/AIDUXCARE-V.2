import { vi } from "vitest";
import { v4 as uuidv4 } from 'uuid';
import { AgentContext } from './AgentContextBuilder';
import { AgentSuggestion } from './ClinicalAgent';
import { LLMProvider, sendToLLM } from './LLMAdapter';

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
ID de Paciente: ${context.patientId || 'No disponible'}

`;

  // Agrupar bloques por tipo
  const contextualBlocks = context.blocks.filter(block => block.type === 'contextual');
  const persistentBlocks = context.blocks.filter(block => block.type === 'persistent');
  const semanticBlocks = context.blocks.filter(block => block.type === 'semantic');

  // Añadir bloques contextuales
  if (contextualBlocks.length > 0) {
    prompt += `MEMORIA CONTEXTUAL (información específica de la visita actual):\n`;
    contextualBlocks.forEach(block => {
      prompt += `[ID: ${block.id}] ${block.content}\n`;
    });
    prompt += '\n';
  }

  // Añadir bloques persistentes
  if (persistentBlocks.length > 0) {
    prompt += `MEMORIA PERSISTENTE (historial del paciente):\n`;
    persistentBlocks.forEach(block => {
      prompt += `[ID: ${block.id}] ${block.content}\n`;
    });
    prompt += '\n';
  }

  // Añadir bloques semánticos
  if (semanticBlocks.length > 0) {
    prompt += `CONOCIMIENTO SEMÁNTICO (información médica general):\n`;
    semanticBlocks.forEach(block => {
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
 * @param llmResponse La respuesta del LLM en formato string
 * @param context El contexto original para obtener sourceBlockId válidos
 * @returns Array de objetos AgentSuggestion
 */
function parseResponseToSuggestions(llmResponse: string, context: AgentContext): AgentSuggestion[] {
  // Array para almacenar las sugerencias parseadas
  const suggestions: AgentSuggestion[] = [];
  
  // Obtener sourceBlockIds válidos, o usar un valor por defecto si no hay bloques
  const validBlockIds = context.blocks.length > 0 
    ? context.blocks.map(block => block.id)
    : ['default-block-id'];
  
  // En una implementación real, se analizaría la respuesta del LLM para extraer sugerencias
  // En esta versión simulada, creamos 2-3 sugerencias manualmente
  
  // Simular el parseo determinando cuántas sugerencias generar (2 o 3)
  const suggestionsCount = Math.random() > 0.5 ? 3 : 2;
  
  // Tipos de sugerencia disponibles
  const suggestionTypes: Array<'recommendation' | 'warning' | 'info'> = [
    'recommendation', 'warning', 'info'
  ];
  
  // Generar sugerencias simuladas
  for (let i = 0; i < suggestionsCount; i++) {
    // Seleccionar un tipo de sugerencia para esta iteración
    const type = suggestionTypes[i % suggestionTypes.length];
    
    // Seleccionar un sourceBlockId válido del contexto
    // Intentamos elegir un bloque que coincida con el tipo de sugerencia, si existe
    const matchingBlocks = context.blocks.filter(block => {
      if (type === 'recommendation' && block.content.toLowerCase().includes('tratamiento')) return true;
      if (type === 'warning' && block.content.toLowerCase().includes('precaución')) return true;
      if (type === 'info' && block.content.toLowerCase().includes('diagnóstico')) return true;
      return false;
    });
    
    // Si encontramos bloques que coinciden, usamos uno de ellos, de lo contrario elegimos uno aleatorio
    const sourceBlockId = matchingBlocks.length > 0
      ? matchingBlocks[0].id
      : validBlockIds[Math.floor(Math.random() * validBlockIds.length)];
    
    // Crear contenido simulado basado en el tipo y la respuesta LLM
    let content = '';
    switch (type) {
      case 'recommendation':
        content = `Basado en el análisis ${llmResponse.substring(0, 20)}... Se recomienda evaluar los parámetros vitales y considerar ajuste de medicación.`;
        break;
      case 'warning':
        content = `Advertencia: Los datos ${llmResponse.substring(20, 40)}... sugieren riesgo de complicaciones. Monitorizar de cerca.`;
        break;
      case 'info':
        content = `Información: El historial del paciente ${llmResponse.substring(40, 60)}... indica necesidad de seguimiento regular.`;
        break;
    }
    
    // Crear objeto de sugerencia y añadirlo al array
    suggestions.push({
      id: uuidv4(),
      sourceBlockId,
      type,
      content
    });
  }
  
  return suggestions;
}

/**
 * Ejecuta el agente clínico con los parámetros proporcionados
 * 
 * Esta función construye un prompt a partir del contexto, lo envía al LLM
 * y parsea la respuesta para obtener sugerencias clínicas.
 * 
 * @param params Parámetros de ejecución del agente (contexto y proveedor)
 * @returns Promesa que se resuelve con un array de sugerencias
 */
export async function executeAgent(params: AgentExecutionParams): Promise<AgentSuggestion[]> {
  // Fase 1: Construir el prompt a partir del contexto
  const prompt = buildPromptFromContext(params.context);
  
  // Fase 2: Enviar el prompt al LLM
  const llmResponse = await sendToLLM(prompt, params.provider);
  
  // Fase 3: Parsear la respuesta y convertirla en sugerencias
  const suggestions = parseResponseToSuggestions(llmResponse, params.context);
  
  return suggestions;
} 