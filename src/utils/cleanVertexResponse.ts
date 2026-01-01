import { selectTestsByProtocol } from "./testProtocolSelector";
import { parseVertexResponse, validateClinicalSchema } from "./responseParser";

export type RiesgoLegal = 'bajo' | 'medio' | 'alto';

export interface ClinicalAnalysis {
  motivo_consulta: string;
  hallazgos_clinicos?: string[];  // Nuevo campo
  hallazgos_relevantes?: string[];
  contexto_ocupacional?: string[]; // Nuevo campo
  contexto_psicosocial?: string[]; // Nuevo campo
  medicacion_actual?: string[];    // Nuevo campo
  antecedentes_medicos?: string[]; // Nuevo campo
  diagnosticos_probables: string[];
  red_flags: string[];
  yellow_flags?: string[];
  evaluaciones_fisicas_sugeridas: any[];
  plan_tratamiento_sugerido: string[];
  derivacion_recomendada?: string;
  pronostico_estimado?: string;
  notas_seguridad?: string;
  riesgo_legal: RiesgoLegal;
}

const DEFAULT_TESTS = [
  {
    test: "Evaluación física según región afectada",
    sensibilidad: 0.75,
    especificidad: 0.85,
    objetivo: "Evaluación inicial",
    contraindicado_si: ""
  }
];

const toArray = (v: unknown): string[] => {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(String);
  if (typeof v === 'string') return [v];
  return [];
};

const processPhysicalTests = (tests: any): any[] => {
  if (!tests) return [];
  if (!Array.isArray(tests)) return [];
  
  return tests.map((item: any) => {
    if (typeof item === "string") {
      return {
        test: item,
        sensibilidad: 0.75,
        especificidad: 0.85,
        objetivo: "Evaluación clínica",
        contraindicado_si: ""
      };
    }
    
    if (item && typeof item === "object") {
      // Asegurar que tenga los campos esperados
      return {
        test: item.test || item.nombre || "Test físico",
        sensibilidad: item.sensibilidad ?? 0.75,
        especificidad: item.especificidad ?? 0.85,
        objetivo: item.objetivo || item.indicacion || "",
        contraindicado_si: item.contraindicado_si || "",
        justificacion: item.justificacion || ""
      };
    }
    
    return null;
  }).filter(test => test !== null);
};

export function normalizeVertexResponse(raw: any): ClinicalAnalysis {
  console.log('[Normalizer] Input:', raw);
  
  // Usar el parser robusto
  const parseResult = parseVertexResponse(raw);
  
  if (!parseResult.success) {
    console.error('[Normalizer] Parse failed:', parseResult.error);
    return {
      motivo_consulta: '',
      hallazgos_clinicos: [],
  hallazgos_relevantes: [],
      diagnosticos_probables: [],
      red_flags: [],
      yellow_flags: [],
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
  
  let evalsSafe = processPhysicalTests(parsed?.evaluaciones_fisicas_sugeridas);
  
  // Si no hay tests sugeridos, usar los por defecto
  if (evalsSafe.length === 0) {
    evalsSafe = DEFAULT_TESTS;
  }
  
  const riesgoSafe: RiesgoLegal = ['bajo', 'medio', 'alto'].includes(parsed?.riesgo_legal) 
    ? parsed.riesgo_legal 
    : 'bajo';
  
  // Compatibilidad: si viene con estructura nueva, usar esos campos
  // Si viene con estructura vieja (hallazgos_relevantes), mantener compatibilidad
  const result = {
    motivo_consulta: String(parsed?.motivo_consulta || ''),
    // Nuevos campos
    hallazgos_clinicos: toArray(parsed?.hallazgos_clinicos),
    hallazgos_relevantes: raw?.hallazgos_relevantes || raw?.hallazgos_clinicos || [],    contexto_ocupacional: toArray(parsed?.contexto_ocupacional),
    contexto_psicosocial: toArray(parsed?.contexto_psicosocial),
    medicacion_actual: toArray(parsed?.medicacion_actual),
    antecedentes_medicos: toArray(parsed?.antecedentes_medicos),
    // Campo legacy para compatibilidad
    diagnosticos_probables: toArray(parsed?.diagnosticos_probables),
    red_flags: cleanFlags(toArray(parsed?.red_flags)),
    yellow_flags: cleanFlags(toArray(parsed?.yellow_flags)),
    evaluaciones_fisicas_sugeridas: evalsSafe,
    plan_tratamiento_sugerido: toArray(parsed?.plan_tratamiento_sugerido),
    derivacion_recomendada: String(parsed?.derivacion_recomendada || ''),
    pronostico_estimado: String(parsed?.pronostico_estimado || ''),
    notas_seguridad: String(parsed?.notas_seguridad || ''),
    riesgo_legal: riesgoSafe
  };
  
  console.log('[Normalizer] Final result:', result);
  return result;
}

export default normalizeVertexResponse;

// Función helper para limpiar arrays de flags
function cleanFlags(flags: any[]): string[] {
  if (!Array.isArray(flags)) return [];
  return flags.filter(f => 
    typeof f === 'string' && 
    !f.toLowerCase().includes('ninguna identificada')
  );
}
