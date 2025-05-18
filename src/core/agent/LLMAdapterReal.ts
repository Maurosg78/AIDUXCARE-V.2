import { AgentContext } from './AgentContextBuilder';
import { AgentSuggestion } from './ClinicalAgent';
import { SuggestionType } from '../types/suggestions';
import { v4 as uuidv4 } from 'uuid';

/**
 * Función para generar un prompt bien estructurado a partir del contexto MCP
 * 
 * @param ctx Contexto del agente con los bloques de memoria
 * @returns Prompt estructurado para el LLM
 */
export function generatePromptFromContext(ctx: AgentContext): string {
  // Extraer bloques por tipo
  const contextualBlocks = ctx.blocks.filter(block => block.type === 'contextual');
  const persistentBlocks = ctx.blocks.filter(block => block.type === 'persistent');
  const semanticBlocks = ctx.blocks.filter(block => block.type === 'semantic');
  
  // Construir secciones del prompt
  let prompt = `# INSTRUCCIONES PARA EL ASISTENTE CLÍNICO
  
Eres un asistente clínico de IA especializado en proporcionar sugerencias médicas basadas en la información del paciente.
Tu tarea es generar sugerencias clínicas relevantes en tres categorías:

1. RECOMENDACIONES: Acciones médicas que el profesional clínico debería considerar.
2. ADVERTENCIAS: Alertas sobre posibles riesgos o contraindicaciones.
3. INFORMACIÓN: Datos contextuales relevantes para la toma de decisiones.

Cada sugerencia debe estar basada en evidencia científica y directamente relacionada con la información proporcionada.
Formato para cada sugerencia: { "type": "recommendation|warning|info", "content": "Texto de la sugerencia" }

# INFORMACIÓN DEL PACIENTE

`;

  // Agregar información persistente (historial médico)
  if (persistentBlocks.length > 0) {
    prompt += `## HISTORIAL MÉDICO\n\n`;
    persistentBlocks.forEach(block => {
      prompt += `${block.content}\n\n`;
    });
  }

  // Agregar información contextual (visita actual)
  if (contextualBlocks.length > 0) {
    prompt += `## INFORMACIÓN DE LA VISITA ACTUAL\n\n`;
    contextualBlocks.forEach(block => {
      prompt += `${block.content}\n\n`;
    });
  }

  // Agregar información semántica (conocimiento especializado)
  if (semanticBlocks.length > 0) {
    prompt += `## INFORMACIÓN CLÍNICA RELEVANTE\n\n`;
    semanticBlocks.forEach(block => {
      prompt += `${block.content}\n\n`;
    });
  }

  // Instrucciones finales para la generación de sugerencias
  prompt += `# SOLICITUD

Basado en la información proporcionada, genera entre 3 y 5 sugerencias clínicas.
Cada sugerencia debe ser específica, accionable y relevante para este caso.
Genera al menos una de cada tipo (recomendación, advertencia, información) si es posible.
Formatea cada sugerencia como un objeto JSON con los campos "type" y "content".

Ejemplo:
{ "type": "recommendation", "content": "Considerar evaluación de escala de dolor y administrar analgésicos según protocolo." }
{ "type": "warning", "content": "Monitorizar tensión arterial cada 4 horas. Valores fuera de rango requieren atención." }
{ "type": "info", "content": "Paciente con historial de diabetes. Considerar monitorización de glucemia." }`;

  return prompt;
}

/**
 * Mock temporal para simular la llamada a un LLM real
 * 
 * @param prompt Prompt formateado para el LLM
 * @returns Promesa que resuelve a un array de sugerencias como strings
 */
export async function callLLMReal(prompt: string): Promise<string[]> {
  // Este es un mock que simula un delay y devuelve respuestas predefinidas
  await new Promise(resolve => setTimeout(resolve, 500));

  // Analizar el contenido del prompt para generar respuestas más relevantes
  const hasPain = prompt.toLowerCase().includes('dolor');
  const hasHypertension = prompt.toLowerCase().includes('hipertensión') || 
                          prompt.toLowerCase().includes('presión arterial');
  const hasDiabetes = prompt.toLowerCase().includes('diabetes') || 
                      prompt.toLowerCase().includes('glucosa');
  const hasFever = prompt.toLowerCase().includes('fiebre') || 
                   prompt.toLowerCase().includes('temperatura');

  // Sugerencias por defecto
  const defaultSuggestions = [
    '{ "type": "recommendation", "content": "Realizar evaluación integral de signos vitales y documentar en la historia clínica." }',
    '{ "type": "info", "content": "Verificar cumplimiento del esquema de vacunación según la edad del paciente." }',
    '{ "type": "warning", "content": "Comprobar alergias medicamentosas antes de prescribir cualquier fármaco." }'
  ];

  // Sugerencias específicas basadas en el contenido
  const specificSuggestions = [];

  if (hasPain) {
    specificSuggestions.push(
      '{ "type": "recommendation", "content": "Utilizar escala EVA para valoración del dolor y evaluar la efectividad de analgésicos previamente administrados." }',
      '{ "type": "warning", "content": "Verificar interacciones medicamentosas antes de prescribir antiinflamatorios no esteroideos." }'
    );
  }

  if (hasHypertension) {
    specificSuggestions.push(
      '{ "type": "recommendation", "content": "Monitorizar presión arterial cada 4 horas y evaluar adherencia al tratamiento antihipertensivo." }',
      '{ "type": "info", "content": "La hipertensión no controlada aumenta el riesgo cardiovascular. Considerar evaluación de órganos diana." }'
    );
  }

  if (hasDiabetes) {
    specificSuggestions.push(
      '{ "type": "recommendation", "content": "Monitorizar niveles de glucemia y verificar administración correcta de insulina según pauta." }',
      '{ "type": "warning", "content": "Evaluar signos de hipoglucemia o hiperglucemia y adaptar el plan terapéutico si es necesario." }'
    );
  }

  if (hasFever) {
    specificSuggestions.push(
      '{ "type": "recommendation", "content": "Administrar antitérmicos si temperatura >38.5°C y considerar estudios para identificar foco infeccioso." }',
      '{ "type": "warning", "content": "Monitorizar signos de sepsis ante fiebre persistente. Vigilar presión arterial, frecuencia cardíaca y nivel de consciencia." }'
    );
  }

  // Combinar sugerencias específicas y genéricas, limitando a un máximo de 5
  const combinedSuggestions = [...specificSuggestions, ...defaultSuggestions];
  return combinedSuggestions.slice(0, 5);
}

/**
 * Convierte una respuesta textual del LLM en objetos AgentSuggestion
 * 
 * @param llmResponses Array de strings con formato JSON de las sugerencias
 * @param sourceBlockId ID del bloque de contexto de origen
 * @returns Array de objetos AgentSuggestion estructurados
 */
export function parseLLMResponses(llmResponses: string[], sourceBlockId: string): AgentSuggestion[] {
  const suggestions: AgentSuggestion[] = [];
  
  llmResponses.forEach(responseText => {
    try {
      // Intentar parsear la respuesta como JSON
      const parsed = JSON.parse(responseText);
      
      // Validar que tenga los campos requeridos
      if (parsed.type && parsed.content) {
        // Validar que el tipo sea uno de los permitidos
        const validTypes: SuggestionType[] = ['recommendation', 'warning', 'info'];
        const type = validTypes.includes(parsed.type) ? parsed.type as SuggestionType : 'info';
        
        // Crear sugerencia estructurada
        const suggestion: AgentSuggestion = {
          id: uuidv4(),
          sourceBlockId,
          type,
          content: parsed.content,
          context_origin: {
            source_block: sourceBlockId,
            text: parsed.content.substring(0, 20) + '...' // Extracto del contenido
          }
        };
        
        suggestions.push(suggestion);
      }
    } catch (error) {
      console.error('Error al parsear respuesta del LLM:', error);
      // Ignorar respuestas que no se pueden parsear
    }
  });
  
  return suggestions;
}

/**
 * Genera sugerencias utilizando un modelo LLM real (o simulado)
 * 
 * @param ctx Contexto del agente con los bloques de memoria
 * @returns Promesa que resuelve a un array de sugerencias generadas
 */
export async function getSuggestionsFromLLM(ctx: AgentContext): Promise<AgentSuggestion[]> {
  try {
    // Generar prompt a partir del contexto
    const prompt = generatePromptFromContext(ctx);
    
    // Obtener ID del primer bloque para usarlo como origen
    const sourceBlockId = ctx.blocks.length > 0 ? ctx.blocks[0].id : 'default-block-id';
    
    // Llamar al LLM (versión simulada)
    const llmResponses = await callLLMReal(prompt);
    
    // Parsear las respuestas en formato de sugerencias
    const suggestions = parseLLMResponses(llmResponses, sourceBlockId);
    
    // Si no se generaron sugerencias, devolver al menos una genérica
    if (suggestions.length === 0) {
      return [{
        id: uuidv4(),
        sourceBlockId,
        type: 'info',
        content: 'Considerar la realización de un examen físico completo y documentar hallazgos en la historia clínica.',
        context_origin: {
          source_block: sourceBlockId,
          text: 'examen físico completo'
        }
      }];
    }
    
    return suggestions;
  } catch (error) {
    console.error('Error al generar sugerencias con LLM:', error);
    
    // En caso de error, devolver una sugerencia genérica
    return [{
      id: uuidv4(),
      sourceBlockId: ctx.blocks.length > 0 ? ctx.blocks[0].id : 'default-block-id',
      type: 'info',
      content: 'Se recomienda verificar los signos vitales del paciente y registrarlos en la historia clínica.',
      context_origin: {
        source_block: ctx.blocks.length > 0 ? ctx.blocks[0].id : 'default-block-id',
        text: 'verificar signos vitales'
      }
    }];
  }
} 