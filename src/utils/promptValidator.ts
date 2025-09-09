import { validateClinicalOutput } from '../core/ai/validation/validateClinicalOutput';
import { logger } from '../core/monitoring/logger';

export const PROMPT_VERSION = import.meta.env.VITE_PROMPT_VERSION || '1.1.0';

export function validateAndLogResponse(
  response: any,
  traceId: string
): any {
  try {
    const validation = validateClinicalOutput(response);
    
    if (validation.valid) {
      logger.clinical('validation.success', PROMPT_VERSION, { traceId });
      return response;
    } else {
      logger.clinical('validation.failed', PROMPT_VERSION, { 
        traceId, 
        errors: validation.errors 
      });
      
      // Intentar reparar
      if (!response.evaluaciones_fisicas_sugeridas || 
          response.evaluaciones_fisicas_sugeridas.length < 3) {
        response.evaluaciones_fisicas_sugeridas = [
          ...(response.evaluaciones_fisicas_sugeridas || []),
          {
            test: "Evaluación postural",
            sensibilidad: 0.7,
            especificidad: 0.6,
            tecnica: "Observación",
            interpretacion: "Baseline"
          }
        ];
      }
      
      return response;
    }
  } catch (error) {
    logger.error('validation.error', error as Error, { traceId });
    return response;
  }
}
