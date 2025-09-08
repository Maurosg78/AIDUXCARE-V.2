// Al inicio del archivo, agregar las traducciones
const translations = {
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
    noneIdentified: "None identified in the transcript"
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
    noneIdentified: "Ninguna identificada en la transcripción"
  }
};

// Función para obtener traducciones
const t = (key: string) => {
  const lang = localStorage.getItem('preferredLanguage') || 'es';
  return translations[lang]?.[key] || translations.es[key];
};
