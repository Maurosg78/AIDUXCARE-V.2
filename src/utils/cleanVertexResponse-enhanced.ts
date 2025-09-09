import { logger } from '../core/monitoring/logger';
import { validateAndLogResponse, PROMPT_VERSION } from './promptValidator';

export function cleanVertexResponse(text: string, traceId?: string): any {
  const tid = traceId || `trace-${Date.now()}`;
  
  logger.info('vertex.response.processing', { 
    traceId: tid,
    promptVersion: PROMPT_VERSION,
    responseLength: text.length 
  });
  
  try {
    // Tu lógica existente de limpieza
    let cleaned = text
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();
    
    // Si empieza con { o [, intentar parsear
    if (cleaned.startsWith('{') || cleaned.startsWith('[')) {
      const parsed = JSON.parse(cleaned);
      
      // Validar y loggear
      const validated = validateAndLogResponse(parsed, tid);
      
      logger.info('vertex.response.success', { 
        traceId: tid,
        hasRedFlags: validated.red_flags?.length > 0,
        testsCount: validated.evaluaciones_fisicas_sugeridas?.length
      });
      
      return validated;
    }
    
    // Si no es JSON, buscar JSON embebido
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return validateAndLogResponse(parsed, tid);
    }
    
    throw new Error('No valid JSON found in response');
    
  } catch (error) {
    logger.error('vertex.response.error', error as Error, { 
      traceId: tid,
      promptVersion: PROMPT_VERSION 
    });
    
    // Retornar estructura mínima válida
    return {
      motivo_consulta: "Error al procesar respuesta",
      diagnosticos_probables: [],
      red_flags: [],
      evaluaciones_fisicas_sugeridas: [
        {
          test: "Evaluación inicial",
          sensibilidad: 0.5,
          especificidad: 0.5,
          tecnica: "Pendiente",
          interpretacion: "Requiere reevaluación"
        }
      ],
      plan_tratamiento: {
        inmediato: ["Reevaluar"],
        corto_plazo: ["Pendiente"],
        seguimiento: "Inmediato"
      },
      error: true,
      errorMessage: error.message
    };
  }
}
