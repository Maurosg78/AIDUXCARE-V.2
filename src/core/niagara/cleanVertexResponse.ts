export type NiagaraTest = { test:string; sensibilidad?:number; especificidad?:number; objetivo?:string; contraindicado_si?:string; };
export type NiagaraResult = {
  motivo_consulta?: string;
  hallazgos_clinicos?: string[];
  hallazgos_relevantes?: string[];
  contexto_ocupacional?: string[];
  contexto_psicosocial?: string[];
  medicacion_actual?: string[];
  antecedentes_medicos?: string[];
  diagnosticos_probables?: string[];
  red_flags?: string[];
  yellow_flags?: string[];
  evaluaciones_fisicas_sugeridas?: NiagaraTest[];
  plan_tratamiento_sugerido?: string[];
  derivacion_recomendada?: string;
  pronostico_estimado?: string;
  notas_seguridad?: string;
  riesgo_legal?: 'bajo'|'medio'|'alto'|string;
};

const KEY_MAP: Record<string,string> = {
  motivo_consulta:'motivo_consulta', chief_complaint:'motivo_consulta',
  hallazgos_clinicos:'hallazgos_clinicos', clinical_findings:'hallazgos_clinicos',
  hallazgos_relevantes:'hallazgos_relevantes', key_findings:'hallazgos_relevantes',
  contexto_ocupacional:'contexto_ocupacional', occupational_context:'contexto_ocupacional',
  contexto_psicosocial:'contexto_psicosocial', psychosocial_factors:'contexto_psicosocial',
  medicacion_actual:'medicacion_actual', medications:'medicacion_actual',
  antecedentes_medicos:'antecedentes_medicos', medical_history:'antecedentes_medicos',
  diagnosticos_probables:'diagnosticos_probables', probable_diagnoses:'diagnosticos_probables',
  red_flags:'red_flags', yellow_flags:'yellow_flags',
  evaluaciones_fisicas_sugeridas:'evaluaciones_fisicas_sugeridas', suggested_physical_tests:'evaluaciones_fisicas_sugeridas',
  plan_tratamiento_sugerido:'plan_tratamiento_sugerido', treatment_plan:'plan_tratamiento_sugerido',
  derivacion_recomendada:'derivacion_recomendada', referral:'derivacion_recomendada',
  pronostico_estimado:'pronostico_estimado', prognosis:'pronostico_estimado',
  notas_seguridad:'notas_seguridad', safety_notes:'notas_seguridad',
  riesgo_legal:'riesgo_legal', legal_risk:'riesgo_legal',
};

export function cleanVertexResponse(input: any): NiagaraResult {
  const out: NiagaraResult = {
    motivo_consulta: '',
    hallazgos_clinicos: [],
    hallazgos_relevantes: [],
    contexto_ocupacional: [],
    contexto_psicosocial: [],
    medicacion_actual: [],
    antecedentes_medicos: [],
    diagnosticos_probables: [],
    red_flags: [],
    yellow_flags: [],
    evaluaciones_fisicas_sugeridas: [],
    plan_tratamiento_sugerido: [],
    derivacion_recomendada: '',
    pronostico_estimado: '',
    notas_seguridad: '',
    riesgo_legal: 'bajo',
  };
  if (!input || typeof input !== 'object') return out;

  const mapped: Record<string, any> = {};
  for (const [k, v] of Object.entries(input)) mapped[KEY_MAP[k] ?? k] = v;

  for (const [k, v] of Object.entries(mapped)) {
    const curr: any = (out as any)[k];
    if (Array.isArray(curr)) { if (Array.isArray(v) && v.length) (out as any)[k] = v; continue; }
    if (typeof curr === 'string') { if (typeof v === 'string' && v.trim()) (out as any)[k] = v.trim(); continue; }
    if (v != null) (out as any)[k] = v;
  }

  const ensureArray = (a: any) => Array.isArray(a) ? a.map(x => typeof x === 'string' ? x.trim() : x).filter(Boolean) : [];
  out.hallazgos_clinicos      = ensureArray(out.hallazgos_clinicos);
  out.hallazgos_relevantes    = ensureArray(out.hallazgos_relevantes);
  out.contexto_ocupacional    = ensureArray(out.contexto_ocupacional);
  out.contexto_psicosocial    = ensureArray(out.contexto_psicosocial);
  out.medicacion_actual       = ensureArray(out.medicacion_actual);
  out.antecedentes_medicos    = ensureArray(out.antecedentes_medicos);
  out.diagnosticos_probables  = ensureArray(out.diagnosticos_probables);
  out.red_flags               = ensureArray(out.red_flags);
  out.yellow_flags            = ensureArray(out.yellow_flags);
  out.plan_tratamiento_sugerido = ensureArray(out.plan_tratamiento_sugerido);
  return out;
}
