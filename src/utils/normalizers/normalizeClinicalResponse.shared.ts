import { parseVertexResponse, validateClinicalSchema } from "../responseParser";
import type { EvidenceRecommendation } from "../../core/clinical-reasoning/prioritizeEvidence";

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
  plan_tratamiento_sugerido?: string[];
  derivacion_recomendada: string;
  pronostico_estimado: string;
  notas_seguridad: string;
  riesgo_legal: LegalExposure;
  biopsychosocial_psychological?: string[];
  biopsychosocial_social?: string[];
  biopsychosocial_occupational?: string[];
  biopsychosocial_protective?: string[];
  biopsychosocial_functional_limitations?: string[];
  biopsychosocial_patient_strengths?: string[];
  evidence_recommendations?: EvidenceRecommendation[] | null;
}

type StructuredPayload = {
  pre_extracted_major_medical_history?: unknown;
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
    major_medical_history?: unknown;
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

type TextTransform = (value: string) => string;

const DEFAULT_TESTS: any[] = [];

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
  derivacion_recomendada: "",
  pronostico_estimado: "",
  notas_seguridad: "",
  riesgo_legal: "low",
  biopsychosocial_psychological: [],
  biopsychosocial_social: [],
  biopsychosocial_occupational: [],
  biopsychosocial_protective: [],
  biopsychosocial_functional_limitations: [],
  biopsychosocial_patient_strengths: [],
};

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

const buildTestJustification = (item: Record<string, any>, transformText: TextTransform): string => {
  const pieces: string[] = [];

  if (item.rationale) {
    const rationale = transformText(String(item.rationale));
    pieces.push(rationale);
  }

  if (item.region) {
    const region = transformText(`Región: ${item.region}`);
    pieces.push(region);
  }

  if (item.evidence_level) {
    const evidence = transformText(`Evidencia: ${String(item.evidence_level).toLowerCase()}`);
    pieces.push(evidence);
  }

  return pieces.join(" · ").trim();
};

const mapPhysicalTests = (tests: unknown, transformText: TextTransform): any[] => {
  if (!Array.isArray(tests)) return [];

  return tests
    .map((item: any) => {
      if (!item) return null;
      if (typeof item === "string") return item;
      if (typeof item !== "object") return null;

      const name = item.name || item.test || "Physical test";
      const testName = transformText(String(name));
      const sensitivityValue = item.sensibilidad !== undefined ? item.sensibilidad : item.sensitivity;
      const specificityValue = item.especificidad !== undefined ? item.especificidad : item.specificity;
      const sensitivityIsUnknown = sensitivityValue === "unknown" || sensitivityValue === null || sensitivityValue === undefined;
      const specificityIsUnknown = specificityValue === "unknown" || specificityValue === null || specificityValue === undefined;
      const sensitivity = sensitivityIsUnknown ? undefined : sensitivityValue;
      const specificity = specificityIsUnknown ? undefined : specificityValue;
      const hasSource = item.source && item.source !== "unknown" && item.source !== "clinical_reasoning";
      const hasScores = sensitivity !== undefined || specificity !== undefined;

      if (hasScores && !hasSource) {
        const objective = transformText(String(item.objective || item.objetivo || item.indicacion || ""));
        const contraindications = transformText(String(item.contraindicado_si || item.contraindications || ""));
        const justification = buildTestJustification(item, transformText);
        const evidenceLevel = transformText(String(item.evidence_level || item.evidencia || ""));
        const rationale = transformText(String(item.rationale || item.justificacion || justification));
        const region = item.region ? transformText(String(item.region)) : undefined;

        return {
          test: testName,
          sensibilidad: undefined,
          especificidad: undefined,
          sensitivity: undefined,
          specificity: undefined,
          sensitivityQualitative: undefined,
          specificityQualitative: undefined,
          objetivo: objective,
          contraindicado_si: contraindications,
          justificacion: justification,
          evidencia: evidenceLevel,
          evidence_level: evidenceLevel,
          source: "unknown",
          rationale: rationale,
          region: region,
        };
      }

      const objective = transformText(String(item.objective || item.objetivo || item.indicacion || ""));
      const contraindications = transformText(String(item.contraindicado_si || item.contraindications || ""));
      const justification = buildTestJustification(item, transformText);
      const evidenceLevel = transformText(String(item.evidence_level || item.evidencia || ""));
      const rationale = transformText(String(item.rationale || item.justificacion || justification));
      const region = item.region ? transformText(String(item.region)) : undefined;

      return {
        test: testName,
        sensibilidad: sensitivity,
        especificidad: specificity,
        sensitivity,
        specificity,
        sensitivityQualitative: typeof sensitivity === "string" ? sensitivity : undefined,
        specificityQualitative: typeof specificity === "string" ? specificity : undefined,
        objetivo: objective,
        contraindicado_si: contraindications,
        justificacion: justification,
        evidencia: evidenceLevel,
        evidence_level: evidenceLevel,
        source: item.source || "unknown",
        rationale: rationale,
        region: region,
      };
    })
    .filter(Boolean);
};

const cleanFlags = (flags: string[]): string[] => {
  return ensureStringArray(flags).filter((flag) => {
    const normalized = flag.toLowerCase();
    return Boolean(flag) && !normalized.includes("none identified") && !normalized.includes("no critical");
  });
};

const mergeUnique = (...arrays: string[][]): string[] => {
  const set = new Set<string>();
  arrays.flat().filter(Boolean).forEach((item) => set.add(item));
  return Array.from(set);
};

const normalizeKey = (value: string): string => {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
};

const FLAG_MARKER_REGEX = /red\s*flag|yellow\s*flag|bandera\s*roja|bandera\s*amarilla|red_flags|yellow_flags/i;

const transformArray = (items: string[], transformText: TextTransform): string[] => {
  return items.map((item) => transformText(item));
};

const mapStructuredPayload = (payload: StructuredPayload, transformText: TextTransform): ClinicalAnalysis => {
  const alerts = payload.medicolegal_alerts ?? {};
  const highlights = payload.conversation_highlights ?? {};
  const biopsych = payload.biopsychosocial_factors ?? {};
  const preExtractedMajorMedicalHistory = transformArray(
    ensureStringArray(payload.pre_extracted_major_medical_history),
    transformText
  );
  const redFlags = transformArray(cleanFlags(ensureStringArray(alerts.red_flags)), transformText);
  const yellowFlags = transformArray(cleanFlags(ensureStringArray(alerts.yellow_flags)), transformText);
  const alertNotes = transformArray(ensureStringArray(alerts.alert_notes), transformText);
  const psychological = transformArray(ensureStringArray(biopsych.psychological), transformText);
  const social = transformArray(ensureStringArray(biopsych.social), transformText);
  const occupational = transformArray(ensureStringArray(biopsych.occupational), transformText);
  const protective = transformArray(ensureStringArray(biopsych.protective_factors), transformText);
  const functionalLimitations = transformArray(ensureStringArray(biopsych.functional_limitations), transformText);
  const patientStrengths = transformArray(ensureStringArray(biopsych.patient_strengths), transformText);
  const legalEmployment = transformArray(ensureStringArray(biopsych.legal_or_employment_context), transformText);
  const combinedYellow = mergeUnique(yellowFlags, legalEmployment);
  const psychosocialContext = mergeUnique(psychological, social, protective);
  const keyFindingsRaw = transformArray(ensureStringArray(highlights.key_findings), transformText);
  const flagTextSet = new Set([...redFlags, ...combinedYellow].map(normalizeKey));
  const filteredKeyFindings = keyFindingsRaw.filter((item) => {
    const normalized = normalizeKey(item);
    if (FLAG_MARKER_REGEX.test(item)) return false;
    if (flagTextSet.has(normalized)) return false;
    return true;
  });

  return {
    motivo_consulta: transformText(String(highlights.chief_complaint || highlights.summary || "")),
    hallazgos_clinicos: filteredKeyFindings,
    hallazgos_relevantes: [],
    contexto_ocupacional: occupational,
    contexto_psicosocial: psychosocialContext,
    medicacion_actual: (() => {
      const meds = highlights.medications;
      if (!Array.isArray(meds) || meds.length === 0) return [];
      const firstItem = meds[0];
      const isStructured = firstItem && typeof firstItem === 'object' && 'original_text' in firstItem;
      if (isStructured) {
        return meds.map((med: any) => ({
          text: med.normalized_name || med.original_text || '',
          medication_data: med,
        }));
      }
      return transformArray(ensureStringArray(meds), transformText);
    })() as any,
    antecedentes_medicos: mergeUnique(
      preExtractedMajorMedicalHistory,
      transformArray(ensureStringArray(highlights.major_medical_history), transformText),
      transformArray(ensureStringArray(highlights.medical_history), transformText),
    ),
    diagnosticos_probables: [],
    red_flags: redFlags,
    yellow_flags: combinedYellow,
    evaluaciones_fisicas_sugeridas: mapPhysicalTests(payload.recommended_physical_tests, transformText),
    derivacion_recomendada: transformText(""),
    pronostico_estimado: transformText(""),
    notas_seguridad: alertNotes.join(" • "),
    riesgo_legal: mapExposure(alerts.legal_exposure),
    biopsychosocial_psychological: psychological,
    biopsychosocial_social: social,
    biopsychosocial_occupational: occupational,
    biopsychosocial_protective: protective,
    biopsychosocial_functional_limitations: functionalLimitations,
    biopsychosocial_patient_strengths: patientStrengths,
  };
};

const mergePreExtractedMajorMedicalHistory = (
  analysis: ClinicalAnalysis,
  raw: any,
  transformText: TextTransform
): ClinicalAnalysis => {
  const preExtracted = transformArray(
    ensureStringArray(raw?.pre_extracted_major_medical_history),
    transformText
  );

  if (preExtracted.length === 0) {
    return analysis;
  }

  const antecedentesMedicos = mergeUnique(
    preExtracted,
    analysis.antecedentes_medicos
  );

  return {
    ...analysis,
    antecedentes_medicos: antecedentesMedicos,
  };
};

const mapLegacyPayload = (payload: any, transformText: TextTransform): ClinicalAnalysis => {
  const clone = { ...DEFAULT_RESULT };
  clone.motivo_consulta = transformText(String(payload?.motivo_consulta || ""));
  clone.hallazgos_clinicos = transformArray(ensureStringArray(payload?.hallazgos_clinicos), transformText);
  clone.hallazgos_relevantes = ensureStringArray(payload?.hallazgos_relevantes) || clone.hallazgos_clinicos;
  clone.contexto_ocupacional = transformArray(ensureStringArray(payload?.contexto_ocupacional), transformText);
  clone.contexto_psicosocial = transformArray(ensureStringArray(payload?.contexto_psicosocial), transformText);
  clone.medicacion_actual = transformArray(ensureStringArray(payload?.medicacion_actual), transformText);
  clone.antecedentes_medicos = transformArray(ensureStringArray(payload?.antecedentes_medicos), transformText);
  clone.diagnosticos_probables = ensureStringArray(payload?.diagnosticos_probables);
  clone.red_flags = transformArray(cleanFlags(ensureStringArray(payload?.red_flags)), transformText);
  clone.yellow_flags = transformArray(cleanFlags(ensureStringArray(payload?.yellow_flags)), transformText);
  clone.evaluaciones_fisicas_sugeridas = mapPhysicalTests(payload?.evaluaciones_fisicas_sugeridas, transformText);
  clone.derivacion_recomendada = transformText(String(payload?.derivacion_recomendada || ""));
  clone.pronostico_estimado = transformText(String(payload?.pronostico_estimado || ""));
  clone.notas_seguridad = transformText(String(payload?.notas_seguridad || ""));
  clone.riesgo_legal = mapExposure(payload?.riesgo_legal);
  return clone;
};

export const identityTextTransform = (value: string): string => value;

export const normalizeVertexResponseWithTransform = (raw: any, transformText: TextTransform): ClinicalAnalysis => {
  if (raw?.candidates?.[0]?.content?.parts) {
    const part = raw.candidates[0].content.parts.find((item: any) => item?.text || item?.functionCall?.args?.text || item?.inlineData);
    if (part?.text) {
      const analysis = normalizeVertexResponseWithTransform(part.text, transformText);
      return mergePreExtractedMajorMedicalHistory(analysis, raw, transformText);
    }
    if (part?.functionCall?.args?.text) {
      const analysis = normalizeVertexResponseWithTransform(part.functionCall.args.text, transformText);
      return mergePreExtractedMajorMedicalHistory(analysis, raw, transformText);
    }
  }

  if (raw?.output_text) {
    const analysis = normalizeVertexResponseWithTransform(raw.output_text, transformText);
    return mergePreExtractedMajorMedicalHistory(analysis, raw, transformText);
  }
  if (raw?.candidates?.[0]?.content?.parts?.[0]?.text) {
    const analysis = normalizeVertexResponseWithTransform(raw.candidates[0].content.parts[0].text, transformText);
    return mergePreExtractedMajorMedicalHistory(analysis, raw, transformText);
  }

  const parseResult = parseVertexResponse(raw);
  if (!parseResult.success) throw new Error(parseResult.error || "Failed to parse Vertex AI response");

  const parsed = parseResult.data ?? {};
  if (validateClinicalSchema(parsed)) {
    const analysis = mapStructuredPayload(parsed as StructuredPayload, transformText);
    return mergePreExtractedMajorMedicalHistory(analysis, raw, transformText);
  }

  const analysis = mapLegacyPayload(parsed, transformText);
  return mergePreExtractedMajorMedicalHistory(analysis, raw, transformText);
};
