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
  "Test funcional de rango articular",
  "Palpación selectiva",
  "Pruebas de fuerza manual (MMT)",
  "Evaluación neurovascular distal",
  "Screening de banderas rojas"
];

const toArray = (v: unknown): string[] => {
  if (Array.isArray(v)) return v.map(String);
  if (v == null || v === '') return [];
  return [String(v)];
};

const parseMaybeJson = (text: string): any => {
  try { return JSON.parse(text); } catch { return {}; }
};

/**
 * Acepta: string JSON, objeto con {text}, o respuesta cruda de Vertex (candidates[0].content.parts[0].text)
 */
export function cleanVertexResponse(input: unknown): ClinicalAnalysis {
  let rawText = '';

  if (typeof input === 'string') {
    rawText = input.trim();
  } else if (input && typeof input === 'object') {
    // @ts-ignore: acceso defensivo a distintas formas
    rawText = String(
      // @ts-ignore
      (input as any)?.text ??
      // @ts-ignore
      (input as any)?.candidates?.[0]?.content?.parts?.[0]?.text ??
      ''
    ).trim();
  }

  const parsed = rawText ? parseMaybeJson(rawText) : {};

  const riesgo = String(parsed?.riesgo_legal || 'bajo');
  const riesgoSafe: RiesgoLegal = (['bajo','medio','alto'] as const).includes(riesgo as RiesgoLegal)
    ? (riesgo as RiesgoLegal)
    : 'bajo';

  const evals = parsed?.evaluaciones_fisicas_sugeridas;
  const evalsSafe = Array.isArray(evals) && evals.length > 0 ? evals.map(String) : DEFAULT_TESTS;

  return {
    motivo_consulta: String(parsed?.motivo_consulta || ''),
    hallazgos_relevantes: toArray(parsed?.hallazgos_relevantes),
    diagnosticos_probables: toArray(parsed?.diagnosticos_probables),
    red_flags: toArray(parsed?.red_flags),
    evaluaciones_fisicas_sugeridas: evalsSafe,
    plan_tratamiento_sugerido: toArray(parsed?.plan_tratamiento_sugerido),
    riesgo_legal: riesgoSafe
  };
}
