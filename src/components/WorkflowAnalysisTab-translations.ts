export const translations = {
  en: {
    medicalLegalAlerts: "Medical-Legal Alerts",
    clinicalFindings: "Clinical Findings",
    currentSymptoms: "CURRENT SYMPTOMS",
    currentMedication: "CURRENT MEDICATION",
    proposedPhysicalEvaluation: "Proposed Physical Evaluation",
    psychosocialFactors: "Psychosocial Factors & Human Context",
    addItem: "Add item",
    selectAll: "Select All",
    clear: "Clear",
    noneIdentified: "None identified in the transcript",
    todo: "All",
    limpiar: "Clear"
  },
  es: {
    medicalLegalAlerts: "Alertas Médico-Legales",
    clinicalFindings: "Hallazgos Clínicos",
    currentSymptoms: "SÍNTOMAS ACTUALES",
    currentMedication: "MEDICACIÓN ACTUAL",
    proposedPhysicalEvaluation: "Evaluación Física Propuesta",
    psychosocialFactors: "Factores Psicosociales y Contexto Humano",
    addItem: "Agregar ítem",
    selectAll: "Todo",
    clear: "Limpiar",
    noneIdentified: "Ninguna identificada en la transcripción",
    todo: "Todo",
    limpiar: "Limpiar"
  }
};

export const t = (key: string): string => {
  const lang = typeof window !== 'undefined' ? (localStorage.getItem('preferredLanguage') || 'es') : 'es';
  return translations[lang as 'en' | 'es']?.[key as keyof typeof translations['en']] || key;
};
