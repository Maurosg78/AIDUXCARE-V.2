import { parseVertexResponse, validateClinicalSchema } from "./responseParser";

export type LegalExposure = "low" | "moderate" | "high";

export interface ClinicalAnalysis {
  motivo_consulta: string;
  hallazgos_clinicos: string[];
  hallazgos_relevantes: string[];
  contexto_ocupacional: string[];
  contexto_psicosocial: string[];
  medicacion_actual: string[];
  antecedentes_medicos: string[];
  diagnosticos_probables: string[];
  red_flags: string[];
  yellow_flags: string[];
  evaluaciones_fisicas_sugeridas: any[];
  plan_tratamiento_sugerido: string[];
  derivacion_recomendada: string;
  pronostico_estimado: string;
  notas_seguridad: string;
  riesgo_legal: LegalExposure;
  // Biopsychosocial factors - organized by category
  biopsychosocial_psychological?: string[];
  biopsychosocial_social?: string[];
  biopsychosocial_occupational?: string[];
  biopsychosocial_protective?: string[];
  biopsychosocial_functional_limitations?: string[];
  biopsychosocial_patient_strengths?: string[];
}

type StructuredPayload = {
  medicolegal_alerts?: {
    red_flags?: unknown;
    yellow_flags?: unknown;
    legal_exposure?: unknown;
    alert_notes?: unknown;
  };
  conversation_highlights?: {
    chief_complaint?: unknown;
    key_findings?: unknown;
    medical_history?: unknown;
    medications?: unknown;
    summary?: unknown;
  };
  recommended_physical_tests?: unknown;
  biopsychosocial_factors?: {
    psychological?: unknown;
    social?: unknown;
    occupational?: unknown;
    protective_factors?: unknown;
    functional_limitations?: unknown;
    patient_strengths?: unknown;
    legal_or_employment_context?: unknown;
  };
};

// ✅ P1: Eliminado DEFAULT_TESTS - No más mocks inyectados
// Si no hay tests sugeridos, retornar array vacío
const DEFAULT_TESTS: any[] = [];

const ensureStringArray = (value: unknown): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === "string") return value.trim() ? [value.trim()] : [];
  return [];
};

const mapExposure = (value: unknown): LegalExposure => {
  if (typeof value !== "string") return "low";
  const normalized = value.toLowerCase();
  if (normalized.includes("moderate") || normalized.includes("medium")) return "moderate";
  if (normalized.includes("high") || normalized.includes("alto")) return "high";
  return "low";
};

const buildTestJustification = (item: Record<string, any>): string => {
  const pieces: string[] = [];
  if (item.rationale) pieces.push(item.rationale);
  if (item.region) pieces.push(`Region: ${item.region}`);
  if (item.evidence_level) pieces.push(`Evidence: ${String(item.evidence_level).toLowerCase()}`);
  return pieces.join(" · ").trim();
};

const mapPhysicalTests = (tests: unknown): any[] => {
  const mapped = Array.isArray(tests)
    ? tests
        .map((item: any) => {
          if (!item) return null;

          if (typeof item === "string") {
            return item;
          }

          if (typeof item === "object") {
            const name = item.name || item.test || "Physical test";
            return {
              test: name,
              sensibilidad:
                item.sensibilidad !== undefined
                  ? Number(item.sensibilidad)
                  : item.sensitivity !== undefined
                    ? Number(item.sensitivity)
                    : undefined,
              especificidad:
                item.especificidad !== undefined
                  ? Number(item.especificidad)
                  : item.specificity !== undefined
                    ? Number(item.specificity)
                    : undefined,
              objetivo: item.objective || item.objetivo || item.indicacion || "",
              contraindicado_si: item.contraindicado_si || item.contraindications || "",
              justificacion: buildTestJustification(item),
              evidencia: item.evidence_level || item.evidencia
            };
          }

          return null;
        })
        .filter(Boolean)
    : [];

  // ✅ P1: Retornar array vacío si no hay tests (no más mocks)
  return mapped;
};

const DEFAULT_RESULT: ClinicalAnalysis = {
  motivo_consulta: "",
  hallazgos_clinicos: [],
  hallazgos_relevantes: [],
  contexto_ocupacional: [],
  contexto_psicosocial: [],
  medicacion_actual: [],
  antecedentes_medicos: [],
  diagnosticos_probables: [],
  red_flags: [],
  yellow_flags: [],
  evaluaciones_fisicas_sugeridas: DEFAULT_TESTS,
  plan_tratamiento_sugerido: [],
  derivacion_recomendada: "",
  pronostico_estimado: "",
  notas_seguridad: "",
  riesgo_legal: "low",
  biopsychosocial_psychological: [],
  biopsychosocial_social: [],
  biopsychosocial_occupational: [],
  biopsychosocial_protective: [],
  biopsychosocial_functional_limitations: [],
  biopsychosocial_patient_strengths: []
};

const cleanFlags = (flags: string[]): string[] =>
  ensureStringArray(flags).filter(
    (flag) =>
      flag &&
      typeof flag === "string" &&
      !flag.toLowerCase().includes("none identified") &&
      !flag.toLowerCase().includes("no critical")
  );

const mergeUnique = (...arrays: string[][]): string[] => {
  const set = new Set<string>();
  arrays.flat().filter(Boolean).forEach((item) => set.add(item));
  return Array.from(set);
};

const mapStructuredPayload = (payload: StructuredPayload): ClinicalAnalysis => {
  const alerts = payload.medicolegal_alerts ?? {};
  const highlights = payload.conversation_highlights ?? {};
  const biopsych = payload.biopsychosocial_factors ?? {};

  const redFlags = cleanFlags(ensureStringArray(alerts.red_flags));
  const yellowFlags = cleanFlags(ensureStringArray(alerts.yellow_flags));
  const alertNotes = ensureStringArray(alerts.alert_notes);

  // Extract all biopsychosocial factors separately
  const psychological = ensureStringArray(biopsych.psychological);
  const social = ensureStringArray(biopsych.social);
  const occupational = ensureStringArray(biopsych.occupational);
  const protective = ensureStringArray(biopsych.protective_factors);
  const functionalLimitations = ensureStringArray(biopsych.functional_limitations);
  const patientStrengths = ensureStringArray(biopsych.patient_strengths);
  const legalEmployment = ensureStringArray(biopsych.legal_or_employment_context);

  // Debug logging for biopsychosocial factors
  console.debug('[Normalizer] Biopsychosocial raw:', biopsych);
  console.debug('[Normalizer] Extracted factors:', {
    psychological: psychological.length,
    social: social.length,
    occupational: occupational.length,
    protective: protective.length,
    functionalLimitations: functionalLimitations.length,
    patientStrengths: patientStrengths.length,
    legalEmployment: legalEmployment.length
  });

  // Combine for backward compatibility (yellow_flags still includes some biopsychosocial)
  const combinedYellow = mergeUnique(yellowFlags, legalEmployment);
  const psychosocialContext = mergeUnique(psychological, social, protective);

  return {
    motivo_consulta: String(highlights.chief_complaint || highlights.summary || ""),
    hallazgos_clinicos: ensureStringArray(highlights.key_findings),
    hallazgos_relevantes: ensureStringArray(highlights.key_findings),
    contexto_ocupacional: occupational,
    contexto_psicosocial: psychosocialContext,
    medicacion_actual: ensureStringArray(highlights.medications),
    antecedentes_medicos: ensureStringArray(highlights.medical_history),
    diagnosticos_probables: [],
    red_flags: redFlags,
    yellow_flags: combinedYellow,
    evaluaciones_fisicas_sugeridas: mapPhysicalTests(payload.recommended_physical_tests),
    plan_tratamiento_sugerido: [],
    derivacion_recomendada: "",
    pronostico_estimado: "",
    notas_seguridad: alertNotes.join(" • "),
    riesgo_legal: mapExposure(alerts.legal_exposure),
    // Store biopsychosocial factors separately for proper UI display
    biopsychosocial_psychological: psychological,
    biopsychosocial_social: social,
    biopsychosocial_occupational: occupational,
    biopsychosocial_protective: protective,
    biopsychosocial_functional_limitations: functionalLimitations,
    biopsychosocial_patient_strengths: patientStrengths
  };
};

const mapLegacyPayload = (payload: any): ClinicalAnalysis => {
  const clone = { ...DEFAULT_RESULT };
  clone.motivo_consulta = String(payload?.motivo_consulta || "");
  clone.hallazgos_clinicos = ensureStringArray(payload?.hallazgos_clinicos);
  clone.hallazgos_relevantes =
    ensureStringArray(payload?.hallazgos_relevantes) || clone.hallazgos_clinicos;
  clone.contexto_ocupacional = ensureStringArray(payload?.contexto_ocupacional);
  clone.contexto_psicosocial = ensureStringArray(payload?.contexto_psicosocial);
  clone.medicacion_actual = ensureStringArray(payload?.medicacion_actual);
  clone.antecedentes_medicos = ensureStringArray(payload?.antecedentes_medicos);
  clone.diagnosticos_probables = ensureStringArray(payload?.diagnosticos_probables);
  clone.red_flags = cleanFlags(ensureStringArray(payload?.red_flags));
  clone.yellow_flags = cleanFlags(ensureStringArray(payload?.yellow_flags));
  clone.evaluaciones_fisicas_sugeridas = mapPhysicalTests(payload?.evaluaciones_fisicas_sugeridas);
  clone.plan_tratamiento_sugerido = [];
  clone.derivacion_recomendada = String(payload?.derivacion_recomendada || "");
  clone.pronostico_estimado = String(payload?.pronostico_estimado || "");
  clone.notas_seguridad = String(payload?.notas_seguridad || "");
  clone.riesgo_legal = mapExposure(payload?.riesgo_legal);
  return clone;
};

export function normalizeVertexResponse(raw: any): ClinicalAnalysis {
  console.debug("[Normalizer] Input received:", raw);

  if (raw?.candidates?.[0]?.content?.parts) {
    const part = raw.candidates[0].content.parts.find(
      (p: any) => p?.text || p?.functionCall?.args?.text || p?.inlineData
    );
    if (part?.text) {
      console.debug("[Normalizer] Gemini Flash text part detected");
      return normalizeVertexResponse(part.text);
    }
    if (part?.functionCall?.args?.text) {
      console.debug("[Normalizer] Gemini Flash functionCall detected");
      return normalizeVertexResponse(part.functionCall.args.text);
    }
  }

  if (raw?.output_text) {
    console.debug("[Normalizer] Legacy output_text format detected");
    return normalizeVertexResponse(raw.output_text);
  }

  if (raw?.candidates?.[0]?.content?.parts?.[0]?.text) {
    const text = raw.candidates[0].content.parts[0].text;
    console.debug("[Normalizer] Gemini-style content detected");
    return normalizeVertexResponse(text);
  }

  const parseResult = parseVertexResponse(raw);

  if (!parseResult.success) {
    const errMessage = parseResult.error || "Failed to parse Vertex AI response";
    console.error("[Normalizer] Parse failed:", errMessage);
    throw new Error(errMessage);
  }

  const parsed = parseResult.data ?? {};
  console.log("[Normalizer] Parsed data from", parseResult.source, ":", parsed);

  if (validateClinicalSchema(parsed)) {
    const structured = mapStructuredPayload(parsed as StructuredPayload);
    console.log("[Normalizer] Structured payload normalized:", structured);
    return structured;
  }

  console.warn("[Normalizer] Falling back to legacy schema mapping");
  const legacy = mapLegacyPayload(parsed);
  console.log("[Normalizer] Legacy payload normalized:", legacy);
  return legacy;
}

export default normalizeVertexResponse;
