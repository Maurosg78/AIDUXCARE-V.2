import { selectTestsByProtocol } from './testProtocolSelector';

export function normalizeVertexResponse(raw: any): any {
  // ... código existente ...
  
  // En vez del fallback hardcodeado, usar protocolo
  let evaluaciones = raw?.evaluaciones_fisicas_sugeridas || [];
  
  if (!evaluaciones || evaluaciones.length === 0) {
    // Extraer contexto del raw response
    const context = {
      region: raw?.region || detectRegionFromText(raw?.motivo_consulta),
      symptoms: raw?.hallazgos_clinicos || [],
      duration: raw?.tiempo_evolucion,
      redFlags: raw?.red_flags || [],
      mechanism: raw?.mecanismo_lesion
    };
    
    // Seleccionar tests por protocolo
    evaluaciones = selectTestsByProtocol(context);
  }
  
  return {
    ...normalized,
    evaluaciones_fisicas_sugeridas: evaluaciones
  };
}
