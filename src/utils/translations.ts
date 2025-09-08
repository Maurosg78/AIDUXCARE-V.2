export const translations = {
  en: {
    // Headers
    "Alertas Médico-Legales": "Medical-Legal Alerts",
    "Hallazgos Clínicos": "Clinical Findings",
    "Evaluación Física Propuesta": "Proposed Physical Evaluation",
    "Factores Psicosociales y Contexto Humano": "Psychosocial Factors & Human Context",
    "SÍNTOMAS ACTUALES": "CURRENT SYMPTOMS",
    "MEDICACIÓN ACTUAL": "CURRENT MEDICATION",
    // Actions
    "Agregar ítem": "Add item",
    "Todo": "Select All",
    "Limpiar": "Clear",
    "Ninguna identificada en la transcripción": "None identified in the transcript"
  },
  es: {
    // Headers
    "Alertas Médico-Legales": "Alertas Médico-Legales",
    "Hallazgos Clínicos": "Hallazgos Clínicos",
    "Evaluación Física Propuesta": "Evaluación Física Propuesta",
    "Factores Psicosociales y Contexto Humano": "Factores Psicosociales y Contexto Humano",
    "SÍNTOMAS ACTUALES": "SÍNTOMAS ACTUALES",
    "MEDICACIÓN ACTUAL": "MEDICACIÓN ACTUAL",
    // Actions
    "Agregar ítem": "Agregar ítem",
    "Todo": "Todo",
    "Limpiar": "Limpiar",
    "Ninguna identificada en la transcripción": "Ninguna identificada en la transcripción"
  }
};

export const t = (key: string): string => {
  const lang = typeof window !== 'undefined' ? (localStorage.getItem('preferredLanguage') || 'es') : 'es';
  return translations[lang as 'en' | 'es']?.[key as keyof typeof translations['en']] || key;
};

// Agregar más traducciones
Object.assign(translations.en, {
  "Flujo Profesional": "Professional Workflow",
  "Análisis Inicial": "Initial Analysis",
  "Evaluación Física": "Physical Evaluation",
  "Informe SOAP": "SOAP Report",
  "Contenido de la Consulta": "Consultation Content",
  "Analizar con IA": "Analyze with AI",
  "Expandir": "Expand",
  "Grabar": "Record"
});

Object.assign(translations.es, {
  "Flujo Profesional": "Flujo Profesional",
  "Análisis Inicial": "Análisis Inicial",
  "Evaluación Física": "Evaluación Física",
  "Informe SOAP": "Informe SOAP",
  "Contenido de la Consulta": "Contenido de la Consulta",
  "Analizar con IA": "Analizar con IA",
  "Expandir": "Expandir",
  "Grabar": "Grabar"
});
