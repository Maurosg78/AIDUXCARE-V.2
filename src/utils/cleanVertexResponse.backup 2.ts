import { selectTestsByProtocol } from "./testProtocolSelector";
import { parseVertexResponse, validateClinicalSchema } from "./responseParser";

export type RiesgoLegal = 'bajo' | 'medio' | 'alto';

export interface ClinicalAnalysis {
  motivo_consulta: string;
  hallazgos_relevantes: string[];
  diagnosticos_probables: string[];
  red_flags: string[];
  evaluaciones_fisicas_sugeridas: string[];
  plan_tratamiento_sugerido: string[];
  riesgo_legal: RiesgoLegal;
}

const DEFAULT_TESTS = [
  "Evaluación física según región afectada"
];

const toArray = (v: unknown): string[] => {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(String);
  if (typeof v === 'string') return [v];
  return [];
};

const processPhysicalTests = (tests: any): string[] => {
  if (!tests) return [];
  if (!Array.isArray(tests)) return [];
  
  return tests.map((item: any) => {
    // Si es string, retornarlo directamente
    if (typeof item === "string") return item;
    
    // Si es objeto, extraer el campo test o nombre
    if (item && typeof item === "object") {
      if (item.test) return String(item.test);
      if (item.nombre) return String(item.nombre);
      if (item.name) return String(item.name);
      // Si no tiene campos conocidos, intentar convertir a string
      return String(item);
    }
    
    return null;
  }).filter((test): test is string => {
    return test !== null && test !== "[object Object]" && test !== "undefined";
  });
};
export function normalizeVertexResponse(raw: any): ClinicalAnalysis {
  console.log('[Normalizer] Input:', raw);
  
  // Usar el parser robusto
  const parseResult = parseVertexResponse(raw);
  
  if (!parseResult.success) {
    console.error('[Normalizer] Parse failed:', parseResult.error);
    // Retornar estructura vacía pero válida
    return {
      motivo_consulta: '',
      hallazgos_relevantes: [],
      diagnosticos_probables: [],
      red_flags: [],
      evaluaciones_fisicas_sugeridas: DEFAULT_TESTS,
      plan_tratamiento_sugerido: [],
      riesgo_legal: 'bajo'
    };
  }
  
  const parsed = parseResult.data;
  console.log('[Normalizer] Parsed data from', parseResult.source, ':', parsed);
  
  // Validar schema
  if (!validateClinicalSchema(parsed)) {
    console.warn('[Normalizer] Schema validation warning - missing fields');
  }
  
  // Aplicar protocolos MSK si es región conocida
  const motivo = (parsed?.motivo_consulta || '').toLowerCase();
  const isLumbar = motivo.includes('lumbar') || motivo.includes('espalda');
  const isCervical = motivo.includes('cervical') || motivo.includes('cuello');
  const isShoulder = motivo.includes('hombro') || motivo.includes('shoulder');
  
  let evalsSafe = processPhysicalTests(parsed?.evaluaciones_fisicas_sugeridas);
  
  if (isLumbar || isCervical || isShoulder) {
    const context = {
      region: motivo,
      symptoms: toArray(parsed?.hallazgos_relevantes),
      duration: parsed?.tiempo_evolucion || '3 días',
      redFlags: toArray(parsed?.red_flags)
    };
    
    const protocolTests = selectTestsByProtocol(context);
    if (protocolTests.length > 0) {
      console.log('[Normalizer] Applied protocol tests:', protocolTests);
      evalsSafe = protocolTests;
    }
  }
  
  const riesgoSafe: RiesgoLegal = ['bajo', 'medio', 'alto'].includes(parsed?.riesgo_legal) 
    ? parsed.riesgo_legal 
    : 'bajo';
  
  const result = {
    motivo_consulta: String(parsed?.motivo_consulta || ''),
    hallazgos_relevantes: toArray(parsed?.hallazgos_relevantes),
    diagnosticos_probables: toArray(parsed?.diagnosticos_probables),
    red_flags: toArray(parsed?.red_flags),
    yellow_flags: toArray(parsed?.yellow_flags),    evaluaciones_fisicas_sugeridas: evalsSafe.length > 0 ? evalsSafe : DEFAULT_TESTS,
    plan_tratamiento_sugerido: toArray(parsed?.plan_tratamiento_sugerido),
    riesgo_legal: riesgoSafe
  };
  
  console.log('[Normalizer] Final result:', result);
  return result;
}

export default normalizeVertexResponse;
