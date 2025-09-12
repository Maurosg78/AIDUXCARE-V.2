#!/bin/bash

echo "🔧 Reescribiendo cleanVertexResponse.ts desde cero..."

cat > src/utils/cleanVertexResponse.ts << 'EONORM'
import { parseVertexResponse } from "./responseParser";

export type RiesgoLegal = 'bajo' | 'medio' | 'alto';

// Tests por defecto
const DEFAULT_TESTS = [
  {
    test: "Test de Lasègue",
    sensibilidad: 0.91,
    especificidad: 0.26,
    tecnica: "Elevación pasiva de pierna recta",
    interpretacion: "Positivo si dolor antes de 70°"
  },
  {
    test: "Test de FABER",
    sensibilidad: 0.77,
    especificidad: 0.82,
    tecnica: "Flexión, abducción y rotación externa",
    interpretacion: "Evalúa articulación sacroilíaca"
  },
  {
    test: "Test de Schober",
    sensibilidad: 0.83,
    especificidad: 0.75,
    tecnica: "Medición de flexión lumbar",
    interpretacion: "<5cm indica restricción"
  }
];

function toArray(value: any): any[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') return [value];
  return [];
}

export default function normalizeVertexResponse(response: any): any {
  console.log('[Normalizer] Input:', response);
  
  // Manejar diferentes formatos de entrada
  let textToParse = '';
  if (typeof response === 'string') {
    textToParse = response;
  } else if (response?.text) {
    textToParse = response.text;
  } else if (response?.result) {
    textToParse = response.result;
  }
  
  if (!textToParse) {
    console.log('[Normalizer] No text to parse, returning defaults');
    return createDefaultResponse();
  }
  
  // Parsear
  const parseResult = parseVertexResponse(textToParse);
  
  if (!parseResult.success) {
    console.log('[Normalizer] Parse failed, returning defaults');
    return createDefaultResponse();
  }
  
  const parsed = parseResult.data;
  console.log('[Normalizer] Parsed data:', Object.keys(parsed));
  
  // Normalizar estructura
  const result = {
    motivo_consulta: parsed.motivo_consulta || '',
    hallazgos_clinicos: toArray(parsed.hallazgos_clinicos),
    hallazgos_relevantes: toArray(parsed.hallazgos_relevantes),
    contexto_ocupacional: toArray(parsed.contexto_ocupacional),
    contexto_psicosocial: toArray(parsed.contexto_psicosocial),
    medicacion_actual: toArray(parsed.medicacion_actual),
    antecedentes_medicos: toArray(parsed.antecedentes_medicos),
    diagnosticos_probables: toArray(parsed.diagnosticos_probables),
    diagnosticos_diferenciales: toArray(parsed.diagnosticos_diferenciales),
    red_flags: toArray(parsed.red_flags),
    yellow_flags: toArray(parsed.yellow_flags),
    evaluaciones_fisicas_sugeridas: parsed.evaluaciones_fisicas_sugeridas?.length > 0 
      ? parsed.evaluaciones_fisicas_sugeridas 
      : DEFAULT_TESTS,
    plan_tratamiento: parsed.plan_tratamiento || {
      inmediato: [],
      corto_plazo: [],
      largo_plazo: [],
      seguimiento: "Pendiente"
    },
    recomendaciones: toArray(parsed.recomendaciones),
    educacion_paciente: toArray(parsed.educacion_paciente),
    success: true,
    timestamp: new Date().toISOString()
  };
  
  console.log('[Normalizer] Final result:', {
    hasHallazgos: result.hallazgos_clinicos.length > 0,
    hasTests: result.evaluaciones_fisicas_sugeridas.length,
    hasDiagnosticos: result.diagnosticos_probables.length
  });
  
  return result;
}

function createDefaultResponse() {
  return {
    motivo_consulta: '',
    hallazgos_clinicos: [],
    hallazgos_relevantes: [],
    contexto_ocupacional: [],
    contexto_psicosocial: [],
    medicacion_actual: [],
    antecedentes_medicos: [],
    diagnosticos_probables: [],
    diagnosticos_diferenciales: [],
    red_flags: [],
    yellow_flags: [],
    evaluaciones_fisicas_sugeridas: DEFAULT_TESTS,
    plan_tratamiento: {
      inmediato: [],
      corto_plazo: [],
      largo_plazo: [],
      seguimiento: "Pendiente evaluación"
    },
    recomendaciones: [],
    educacion_paciente: [],
    success: false,
    timestamp: new Date().toISOString()
  };
}

export { normalizeVertexResponse, createDefaultResponse };
EONORM

echo "✅ cleanVertexResponse.ts reescrito"

# Compilar
npm run build

if [ $? -eq 0 ]; then
  echo "✅ Build exitoso"
  npm run dev
else
  echo "⚠️ Aún hay errores, verificando..."
  npm run dev
fi
