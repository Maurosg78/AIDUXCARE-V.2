// Buscar en vertex-ai-service-firebase.ts la función que construye el prompt
// y agregar al inicio del prompt:

const getLanguageInstruction = () => {
  const language = localStorage.getItem('preferredLanguage') || 'es';
  if (language === 'en') {
    return `IMPORTANT: Respond ENTIRELY in English. 
    Use these exact field names:
    - chief_complaint (not motivo_consulta)
    - clinical_findings (not hallazgos_clinicos)
    - medical_history (not antecedentes_medicos)
    - current_medication (not medicacion_actual)
    - probable_diagnoses (not diagnosticos_probables)
    - suggested_physical_evaluations (not evaluaciones_fisicas_sugeridas)
    - suggested_treatment_plan (not plan_tratamiento_sugerido)
    All medical terms, descriptions, and recommendations must be in English.\n\n`;
  }
  return '';
};

// En la función processClinicalTranscript, modificar:
const fullPrompt = getLanguageInstruction() + promptFactory.getClinicalAnalysisPrompt(transcript);
