import { parseVertexResponse, validateClinicalSchema } from "../responseParser";
import type { EvidenceRecommendation } from "../../core/clinical-reasoning/prioritizeEvidence";
import { safeLogger } from "../../utils/safeLogger";
import type {
  ClinicalMedicationEntry,
  MedicationConfidence,
  MedicationMentionStatus,
  MedicationSource,
} from '@/core/clinical/ClinicalMedicationEntry';

export type LegalExposure = "low" | "moderate" | "high";

export interface ClinicalAnalysis {
  motivo_consulta: string;
  hallazgos_clinicos: string[];
  hallazgos_relevantes: string[];
  contexto_ocupacional: string[];
  contexto_psicosocial: string[];
  medicacion_actual: string[];
  adverseDrugReactions?: AdverseDrugReaction[];
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

export interface AdverseDrugReaction {
  drugName: string;
  reactionDescription: string;
  patientReported: boolean;
  clinicianReviewRequired: boolean;
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
    adverse_drug_reactions?: unknown;
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

const mapAdverseDrugReaction = (reaction: unknown, transformText: TextTransform): AdverseDrugReaction | null => {
  if (!reaction || typeof reaction !== "object") {
    return null;
  }

  const reactionRecord = reaction as Record<string, unknown>;
  const drugNameRaw = reactionRecord.drug_name;
  const reactionDescriptionRaw = reactionRecord.reaction_description;
  const patientReportedRaw = reactionRecord.patient_reported;
  const clinicianReviewRequiredRaw = reactionRecord.clinician_review_required;
  const drugName = transformText(String(drugNameRaw || ""));
  const reactionDescription = transformText(String(reactionDescriptionRaw || ""));
  const patientReported = patientReportedRaw === undefined ? true : Boolean(patientReportedRaw);
  const clinicianReviewRequired =
    clinicianReviewRequiredRaw === undefined ? true : Boolean(clinicianReviewRequiredRaw);

  if (!drugName && !reactionDescription) {
    return null;
  }

  return {
    drugName,
    reactionDescription,
    patientReported,
    clinicianReviewRequired,
  };
};

const mapAdverseDrugReactions = (
  adverseDrugReactions: unknown,
  transformText: TextTransform
): AdverseDrugReaction[] => {
  if (!Array.isArray(adverseDrugReactions)) {
    return [];
  }

  return adverseDrugReactions
    .map((reaction) => mapAdverseDrugReaction(reaction, transformText))
    .filter((reaction): reaction is AdverseDrugReaction => Boolean(reaction));
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
  adverseDrugReactions: [],
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

const stringifyClinicalListItem = (item: unknown): string => {
  if (!item) return "";
  if (typeof item === "string") return item.trim();
  if (typeof item !== "object") return String(item).trim();

  const record = item as Record<string, unknown>;
  const primaryText = record.flag ?? record.text ?? record.label ?? record.name ?? record.description;
  const rationale = record.rationale ?? record.reason;
  const primaryString = typeof primaryText === "string" ? primaryText.trim() : "";
  const rationaleString = typeof rationale === "string" ? rationale.trim() : "";

  if (primaryString && rationaleString) {
    return `${primaryString} — ${rationaleString}`;
  }

  if (primaryString) {
    return primaryString;
  }

  return "";
};

const ensureStringArray = (value: unknown): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(stringifyClinicalListItem).filter(Boolean);
  if (typeof value === "string") return value.trim() ? [value.trim()] : [];
  if (typeof value === "object") {
    const item = stringifyClinicalListItem(value);
    return item ? [item] : [];
  }
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
  const rawAdverseReactions = highlights.adverse_drug_reactions ?? [];
  const adverseDrugReactions = mapAdverseDrugReactions(rawAdverseReactions, transformText);

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
        return meds.map((med: any) => {
          const medData: ClinicalMedicationEntry = {
            original_text: String(med.original_text || ''),
            canonical_name: med.canonical_name ?? null,
            normalized_name: String(med.normalized_name || ''),
            dose: String(med.dose || ''),
            frequency: String(med.frequency || ''),
            duration: String(med.duration || ''),
            active_ingredient: String(med.active_ingredient || ''),
            mention_status: (med.mention_status as MedicationMentionStatus) ?? 'current',
            confidence: (med.confidence as MedicationConfidence) ?? 'low',
            requires_review: med.requires_review ?? true,
            source: 'main_analysis' as MedicationSource,
            ...(med.suggested_name ? { suggested_name: String(med.suggested_name) } : {}),
          };
          return {
            text: medData.original_text || medData.normalized_name,
            medication_data: medData,
          };
        });
      }
      return transformArray(ensureStringArray(meds), transformText);
    })() as any,
    adverseDrugReactions,
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

// §1.6 ENGINEERING.md: deterministic guard — mention_status controls routing, not prompt instructions
// Statuses that belong in medicacion_actual (patient currently uses / used)
const MEDICATION_STATUSES_FOR_CURRENT: ReadonlySet<string> = new Set([
  'current',
  'previous',
  'topical_or_supplement',
  'unclear',
]);


const mergePreExtractedMedications = (
  analysis: ClinicalAnalysis,
  raw: any,
  transformText: TextTransform
): ClinicalAnalysis => {
  const preExtracted = raw?.pre_extracted_medications;
  if (!Array.isArray(preExtracted) || preExtracted.length === 0) {
    return analysis;
  }

  // existingByCanonical: canonical_name (from main analysis) → index in currentMeds
  // existingByOriginal: original_text lookup + within-batch dedup
  const existingByCanonical = new Map<string, number>();
  const existingByOriginal = new Set<string>();
  // Shallow copy so mutations do not affect the original analysis object
  const currentMeds = [...((analysis.medicacion_actual ?? []) as any[])];

  for (let i = 0; i < currentMeds.length; i++) {
    const med = currentMeds[i];
    if (typeof med === 'string') {
      existingByOriginal.add(med.toLowerCase().trim());
    } else if (med && typeof med === 'object') {
      const originalText =
        (med as any).medication_data?.original_text || (med as any).text || '';
      if (originalText) {
        existingByOriginal.add(String(originalText).toLowerCase().trim());
      }
      const canonicalName = (med as any).medication_data?.canonical_name;
      if (canonicalName) {
        existingByCanonical.set(String(canonicalName).toLowerCase().trim(), i);
      }
    }
  }

  const newMeds: { text: string; medication_data: ClinicalMedicationEntry }[] = [];
  const newAdverseReactions: AdverseDrugReaction[] = [];
  const mergedIndices = new Set<number>();
  // Upgrade map: index in currentMeds → structured replacement data
  // Used when LLM has the plain-string version and pre-extractor has suggested_name
  type UpgradeEntry = { suggestedName: string; mentionStatus: string; dose: string; frequency: string };
  const upgradeIndices = new Map<number, UpgradeEntry>();

  for (const item of preExtracted) {
    if (!item || typeof item !== 'object') continue;

    const originalText = String((item as any).original_text || '').trim();
    if (!originalText) continue;

    // Extract all fields before routing decisions — needed for merge and upgrade logic
    const mentionStatus = String((item as any).mention_status || 'unclear').trim();
    const dose = String((item as any).dose || '').trim();
    const frequency = String((item as any).frequency || '').trim();
    const suggestedName = String((item as any).suggested_name || '').trim();
    const rawCanonical = (item as any).canonical_name;
    const canonicalName: string | null =
      rawCanonical != null && rawCanonical !== '' ? String(rawCanonical).trim() : null;

    // Scenario B: LLM already has the corrected name — no duplicate, no chip needed
    if (suggestedName && existingByOriginal.has(suggestedName.toLowerCase())) {
      continue;
    }

    // Merge: canonical match with main analysis entry.
    // Enrich the existing entry: pre-extractor contributes original_text (with dose),
    // mention_status and canonical_name; Niagara contributes confidence, requires_review,
    // normalized_name and active_ingredient.
    if (canonicalName && mentionStatus !== 'stopped_adverse') {
      const canonicalKey = canonicalName.toLowerCase();
      const existingIdx = existingByCanonical.get(canonicalKey);
      if (existingIdx !== undefined) {
        const existingMed = currentMeds[existingIdx] as any;
        const existingData = existingMed?.medication_data as ClinicalMedicationEntry | undefined;
        const mergedData: ClinicalMedicationEntry = {
          original_text: originalText,
          canonical_name: canonicalName,
          normalized_name: existingData?.normalized_name || '',
          dose: dose || existingData?.dose || '',
          frequency: frequency || existingData?.frequency || '',
          duration: existingData?.duration || '',
          active_ingredient: existingData?.active_ingredient || '',
          mention_status: mentionStatus as MedicationMentionStatus,
          confidence: existingData?.confidence ?? 'low',
          requires_review: existingData?.requires_review ?? true,
          source: 'merged',
          ...(suggestedName
            ? { suggested_name: suggestedName }
            : existingData?.suggested_name
            ? { suggested_name: existingData.suggested_name }
            : {}),
        };
        currentMeds[existingIdx] = {
          text: transformText(originalText),
          medication_data: mergedData,
        };
        mergedIndices.add(existingIdx);
        continue;
      }
    }

    // Scenario A: exact original_text match against main analysis.
    // If a suggested_name exists, upgrade the plain-string entry to carry medication_data
    // so the chip can render. Only upgrade if the status belongs in medicacion_actual.
    if (existingByOriginal.has(originalText.toLowerCase())) {
      if (
        suggestedName &&
        mentionStatus !== 'stopped_adverse' &&
        MEDICATION_STATUSES_FOR_CURRENT.has(mentionStatus)
      ) {
        const existingIdx = currentMeds.findIndex(
          (m: any) => typeof m === 'string' && m.toLowerCase().trim() === originalText.toLowerCase()
        );
        if (existingIdx >= 0) {
          upgradeIndices.set(existingIdx, { suggestedName, mentionStatus, dose, frequency });
        }
      }
      continue;
    }

    // §1.6 deterministic guard: stopped_adverse routes to adverseDrugReactions, not medicacion_actual
    if (mentionStatus === 'stopped_adverse') {
      const adverseText = dose
        ? `${transformText(originalText)} ${dose}`
        : transformText(originalText);
      newAdverseReactions.push({
        drugName: adverseText,
        reactionDescription: 'Suspendido por reacción adversa (reportado por paciente)',
        patientReported: true,
        clinicianReviewRequired: true,
      });
      existingByOriginal.add(originalText.toLowerCase());
      if (canonicalName) existingByOriginal.add(canonicalName.toLowerCase());
      continue;
    }

    // Guard: only statuses that represent actual patient medication enter medicacion_actual
    if (!MEDICATION_STATUSES_FOR_CURRENT.has(mentionStatus)) continue;

    const newMedData: ClinicalMedicationEntry = {
      original_text: originalText,
      canonical_name: canonicalName,
      normalized_name: '',
      active_ingredient: '',
      confidence: 'low',
      requires_review: true,
      mention_status: mentionStatus as MedicationMentionStatus,
      dose,
      frequency,
      duration: '',
      source: 'pre_extracted',
      ...(suggestedName ? { suggested_name: suggestedName } : {}),
    };
    newMeds.push({ text: transformText(originalText), medication_data: newMedData });
    existingByOriginal.add(originalText.toLowerCase());
    if (canonicalName) existingByOriginal.add(canonicalName.toLowerCase());
  }

  // Apply upgrades: replace plain-string entries with structured entries carrying suggested_name
  for (const [idx, upgrade] of upgradeIndices) {
    const originalString = currentMeds[idx] as string;
    const upgradeData: ClinicalMedicationEntry = {
      original_text: originalString.trim(),
      canonical_name: null,
      normalized_name: '',
      active_ingredient: '',
      confidence: 'low',
      requires_review: true,
      mention_status: upgrade.mentionStatus as MedicationMentionStatus,
      dose: upgrade.dose,
      frequency: upgrade.frequency,
      duration: '',
      suggested_name: upgrade.suggestedName,
      source: 'pre_extracted',
    };
    currentMeds[idx] = {
      text: transformText(originalString.trim()),
      medication_data: upgradeData,
    };
  }

  const hasNewMeds = newMeds.length > 0;
  const hasNewAdverse = newAdverseReactions.length > 0;
  const hasUpgraded = upgradeIndices.size > 0;
  const hasMerged = mergedIndices.size > 0;

  if (!hasNewMeds && !hasNewAdverse && !hasUpgraded && !hasMerged) {
    return analysis;
  }

  const updatedMedicacion = (hasNewMeds || hasUpgraded || hasMerged)
    ? ([...currentMeds, ...newMeds] as any)
    : analysis.medicacion_actual;

  const existingAdverse = Array.isArray(analysis.adverseDrugReactions)
    ? analysis.adverseDrugReactions
    : [];
  const updatedAdverse = hasNewAdverse
    ? [...existingAdverse, ...newAdverseReactions]
    : existingAdverse;

  return {
    ...analysis,
    medicacion_actual: updatedMedicacion,
    adverseDrugReactions: updatedAdverse,
  };
};

const logClinicalExtractionCounts = (normalizedResult: ClinicalAnalysis): void => {
  const medicationCount = normalizedResult.medicacion_actual?.length ?? 0;
  const adverseReactionCount = normalizedResult.adverseDrugReactions?.length ?? 0;
  const medicalHistoryCount = normalizedResult.antecedentes_medicos?.length ?? 0;
  const redFlagCount = normalizedResult.red_flags?.length ?? 0;
  const extractionCountKeys = [
    'medication_count',
    'adverse_reaction_count',
    'medical_history_count',
    'red_flag_count',
  ];
  const extractionCountStage =
    `extraction_counts: meds=${medicationCount} adr=${adverseReactionCount} history=${medicalHistoryCount} flags=${redFlagCount}`;

  safeLogger.clinicalContextBuilt(extractionCountKeys, extractionCountStage);
};

const finalizeClinicalAnalysis = (
  analysis: ClinicalAnalysis,
  raw: any,
  transformText: TextTransform,
  shouldLogCounts: boolean
): ClinicalAnalysis => {
  const withHistory = mergePreExtractedMajorMedicalHistory(analysis, raw, transformText);
  const withMedications = mergePreExtractedMedications(withHistory, raw, transformText);
  if (shouldLogCounts) {
    logClinicalExtractionCounts(withMedications);
  }

  return withMedications;
};

const mapLegacyPayload = (payload: any, transformText: TextTransform): ClinicalAnalysis => {
  const clone = { ...DEFAULT_RESULT };
  clone.motivo_consulta = transformText(String(payload?.motivo_consulta || ""));
  clone.hallazgos_clinicos = transformArray(ensureStringArray(payload?.hallazgos_clinicos), transformText);
  clone.hallazgos_relevantes = ensureStringArray(payload?.hallazgos_relevantes) || clone.hallazgos_clinicos;
  clone.contexto_ocupacional = transformArray(ensureStringArray(payload?.contexto_ocupacional), transformText);
  clone.contexto_psicosocial = transformArray(ensureStringArray(payload?.contexto_psicosocial), transformText);
  clone.medicacion_actual = transformArray(ensureStringArray(payload?.medicacion_actual), transformText);
  clone.adverseDrugReactions = mapAdverseDrugReactions(
    payload?.adverseDrugReactions ?? payload?.adverse_drug_reactions,
    transformText
  );
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

export const normalizeVertexResponseWithTransform = (
  raw: any,
  transformText: TextTransform,
  shouldLogCounts = true
): ClinicalAnalysis => {
  if (raw?.candidates?.[0]?.content?.parts) {
    const part = raw.candidates[0].content.parts.find((item: any) => item?.text || item?.functionCall?.args?.text || item?.inlineData);
    if (part?.text) {
      const analysis = normalizeVertexResponseWithTransform(part.text, transformText, false);
      return finalizeClinicalAnalysis(analysis, raw, transformText, shouldLogCounts);
    }
    if (part?.functionCall?.args?.text) {
      const analysis = normalizeVertexResponseWithTransform(part.functionCall.args.text, transformText, false);
      return finalizeClinicalAnalysis(analysis, raw, transformText, shouldLogCounts);
    }
  }

  if (raw?.output_text) {
    const analysis = normalizeVertexResponseWithTransform(raw.output_text, transformText, false);
    return finalizeClinicalAnalysis(analysis, raw, transformText, shouldLogCounts);
  }
  if (raw?.candidates?.[0]?.content?.parts?.[0]?.text) {
    const analysis = normalizeVertexResponseWithTransform(raw.candidates[0].content.parts[0].text, transformText, false);
    return finalizeClinicalAnalysis(analysis, raw, transformText, shouldLogCounts);
  }

  const parseResult = parseVertexResponse(raw);
  if (!parseResult.success) throw new Error(parseResult.error || "Failed to parse Vertex AI response");

  const parsed = parseResult.data ?? {};
  const schemaIsValid = validateClinicalSchema(parsed);
  if (schemaIsValid) {
    const structuredAnalysis = mapStructuredPayload(parsed as StructuredPayload, transformText);
    return finalizeClinicalAnalysis(structuredAnalysis, raw, transformText, shouldLogCounts);
  }

  console.warn(
    '[ClinicalNormalizer] Schema validation failed — falling back to legacy payload mapping.',
    'This indicates Vertex AI returned an unexpected structure.',
    'Check prompt version and schema definition.',
    { rawKeys: Object.keys(parsed ?? {}) }
  );

  const legacyAnalysis = mapLegacyPayload(parsed, transformText);
  return finalizeClinicalAnalysis(legacyAnalysis, raw, transformText, shouldLogCounts);
};
