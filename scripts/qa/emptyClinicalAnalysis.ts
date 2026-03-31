import type { ClinicalAnalysis } from '@/utils/cleanVertexResponse';

export function emptyClinicalAnalysis(): ClinicalAnalysis {
  return {
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
    derivacion_recomendada: '',
    pronostico_estimado: '',
    notas_seguridad: '',
    riesgo_legal: 'low',
    biopsychosocial_psychological: [],
    biopsychosocial_social: [],
    biopsychosocial_occupational: [],
    biopsychosocial_protective: [],
    biopsychosocial_functional_limitations: [],
    biopsychosocial_patient_strengths: [],
  };
}

export function mergeClinicalAnalysis(partial: Partial<ClinicalAnalysis> | null | undefined): ClinicalAnalysis {
  const base = emptyClinicalAnalysis();
  if (!partial) return base;
  return {
    ...base,
    ...partial,
    hallazgos_clinicos: partial.hallazgos_clinicos ?? base.hallazgos_clinicos,
    red_flags: partial.red_flags ?? base.red_flags,
    yellow_flags: partial.yellow_flags ?? base.yellow_flags,
    medicacion_actual: partial.medicacion_actual ?? base.medicacion_actual,
    antecedentes_medicos: partial.antecedentes_medicos ?? base.antecedentes_medicos,
    biopsychosocial_psychological: partial.biopsychosocial_psychological ?? base.biopsychosocial_psychological,
    biopsychosocial_social: partial.biopsychosocial_social ?? base.biopsychosocial_social,
    biopsychosocial_occupational: partial.biopsychosocial_occupational ?? base.biopsychosocial_occupational,
    biopsychosocial_protective: partial.biopsychosocial_protective ?? base.biopsychosocial_protective,
    biopsychosocial_functional_limitations:
      partial.biopsychosocial_functional_limitations ?? base.biopsychosocial_functional_limitations,
    biopsychosocial_patient_strengths: partial.biopsychosocial_patient_strengths ?? base.biopsychosocial_patient_strengths,
  };
}
