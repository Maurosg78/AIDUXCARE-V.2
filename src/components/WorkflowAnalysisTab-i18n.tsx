type LangKey = "en" | "es";
type TransDict = {
  medicalLegalAlerts: string;
  clinicalFindings: string;
  currentSymptoms: string;
  currentMedication: string;
  proposedPhysicalEvaluation: string;
  psychosocialFactors: string;
  addItem: string;
  selectAll: string;
  clear: string;
  noneIdentified: string;
  [k: string]: string; // permite futuras claves sin romper tipos
};

const translations: Record<LangKey, TransDict> = {
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
  },
};

export type Lang = keyof typeof translations;
export type TransKey = keyof typeof translations["es"];

export const t = (key: TransKey, lang: Lang = "es"): string => {
  const dict = translations as Record<Lang, Record<TransKey, string>>;
  const l = dict[lang] ?? dict.es;
  return l[key] ?? dict.es[key];
};
