// @ts-nocheck
import { parseVertexResponse, validateClinicalSchema } from "./responseParser";

export interface TestConEvidencia {
  test: string;
  sensibilidad: number;
  especificidad: number;
  score: number;
  indicacion: string;
  justificacion?: string;
}

export interface ClinicalAnalysis {
  motivo_consulta: string;
  hallazgos_relevantes: string[];
  diagnosticos_probables: string[];
  red_flags: string[];
  evaluaciones_fisicas_sugeridas: TestConEvidencia[];
  plan_tratamiento_sugerido: string[];
  riesgo_legal: 'bajo' | 'medio' | 'alto';
}

export function normalizeVertexResponse(raw: any): ClinicalAnalysis {
  console.log('[Normalizer] Input:', raw);
  
  const parseResult = parseVertexResponse(raw);
  
  if (!parseResult.success) {
    console.error('[Normalizer] Parse failed:', parseResult.error);
    return {
      motivo_consulta: '',
      hallazgos_relevantes: [],
      diagnosticos_probables: [],
      red_flags: [],
      evaluaciones_fisicas_sugeridas: [],
      plan_tratamiento_sugerido: [],
      riesgo_legal: 'bajo'
    };
  }
  
  const parsed = parseResult.data;
  console.log('[Normalizer] Parsed data from', parseResult.source, ':', parsed);
  
  // Procesar evaluaciones físicas
  let evaluaciones = parsed?.evaluaciones_fisicas_sugeridas || [];
  
  // Si vienen como strings simples, convertir al nuevo formato
  if (evaluaciones.length > 0 && typeof evaluaciones[0] === 'string') {
    evaluaciones = evaluaciones.map((test: string) => ({
      test,
      sensibilidad: 0,
      especificidad: 0,
      score: 0,
      indicacion: 'Evaluación clínica',
      justificacion: 'Sugerido por análisis clínico'
    }));
  }
  
  // Ordenar por score descendente
  evaluaciones.sort((a: any, b: any) => (b.score || 0) - (a.score || 0));
  
  return {
    motivo_consulta: String(parsed?.motivo_consulta || ''),
    hallazgos_relevantes: Array.isArray(parsed?.hallazgos_relevantes) 
      ? parsed.hallazgos_relevantes : [],
    diagnosticos_probables: Array.isArray(parsed?.diagnosticos_probables)
      ? parsed.diagnosticos_probables : [],
    red_flags: Array.isArray(parsed?.red_flags) ? parsed.red_flags : [],
    evaluaciones_fisicas_sugeridas: evaluaciones,
    plan_tratamiento_sugerido: Array.isArray(parsed?.plan_tratamiento_sugerido)
      ? parsed.plan_tratamiento_sugerido : [],
    riesgo_legal: parsed?.riesgo_legal || 'bajo'
  };
}