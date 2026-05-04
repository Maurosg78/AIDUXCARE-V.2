import type { ProfessionalProfile } from '@/context/ProfessionalProfileContext';
import type { DiagnosisEvidence, EvidenceGrade, ClinicalIntervention } from '@/core/clinical-evidence/types';
import type { ClinicalAnalysis } from '@/utils/normalizers/normalizeClinicalResponse.shared';

export type EvidencePriority = 'high' | 'medium' | 'low' | 'defer';

export interface EvidenceRecommendation {
  interventionId: string;
  interventionName: string;
  priority: EvidencePriority;
  reason: string;
  warnings: string[];
  missingCapabilities: string[];
  evidenceLevel: EvidenceGrade;
}

type PrioritizeEvidenceInput = {
  diagnosisEvidence: DiagnosisEvidence;
  clinicalAnalysis: ClinicalAnalysis;
  professionalProfile?: ProfessionalProfile | null;
};

const CONTROL_CONTEXT_TERMS = [
  'control',
  'controlado',
  'cardiologo',
  'cardiologa',
  'tratamiento',
  'tomo',
  'medicacion',
  'seguimiento',
  'operado',
  'stent',
  'adiro',
];

const MIN_TOKEN_LENGTH = 4;

const normalizeText = (value: string): string => {
  const lowerCaseValue = value.toLowerCase();
  const decomposedValue = lowerCaseValue.normalize('NFD');
  const withoutDiacritics = decomposedValue.replace(/[\u0300-\u036f]/g, '');
  const normalizedSeparators = withoutDiacritics.replace(/[^a-z0-9]+/g, ' ');
  const trimmedValue = normalizedSeparators.trim();
  const normalizedWhitespace = trimmedValue.replace(/\s+/g, ' ');
  return normalizedWhitespace;
};

const getPriorityFromEvidence = (evidenceLevel: EvidenceGrade): EvidencePriority => {
  if (evidenceLevel === 'high') {
    return 'high';
  }

  if (evidenceLevel === 'moderate') {
    return 'medium';
  }

  return 'low';
};

const getProfileTechniqueLabels = (
  professionalProfile?: ProfessionalProfile | null
): string[] => {
  const techniques = professionalProfile?.techniques ?? [];
  const labels = techniques.map((technique) => technique.label);
  const normalizedLabels = labels.map(normalizeText);
  return normalizedLabels;
};

const getProfileEquipmentLabels = (
  professionalProfile?: ProfessionalProfile | null
): string[] => {
  const profileRecord = professionalProfile as unknown as Record<string, unknown> | null | undefined;
  const equipment = profileRecord?.equipment;
  const equipmentList = Array.isArray(equipment) ? equipment : [];
  const equipmentLabels = equipmentList.map((item) => String(item));
  const preferredTreatments = professionalProfile?.practicePreferences?.preferredTreatments ?? [];
  const normalizedEquipment = equipmentLabels.map(normalizeText);
  const normalizedPreferredTreatments = preferredTreatments.map(normalizeText);
  return [...normalizedEquipment, ...normalizedPreferredTreatments];
};

const hasCapabilityMatch = (
  requiredCapability: string,
  availableCapabilities: string[]
): boolean => {
  const normalizedRequired = normalizeText(requiredCapability);

  return availableCapabilities.some((capability) => {
    const capabilityContainsRequired = capability.includes(normalizedRequired);
    const requiredContainsCapability = normalizedRequired.includes(capability);
    return capabilityContainsRequired || requiredContainsCapability;
  });
};

const getMissingCapabilities = (
  requiredCapabilities: string[],
  availableCapabilities: string[]
): string[] => {
  return requiredCapabilities.filter((requiredCapability) => {
    const hasMatch = hasCapabilityMatch(requiredCapability, availableCapabilities);
    return !hasMatch;
  });
};

const getMissingTechniqueGroup = (
  requiredTechniques: string[],
  availableTechniques: string[]
): string[] => {
  if (requiredTechniques.length === 0) {
    return [];
  }

  const hasAnyTechniqueMatch = requiredTechniques.some((requiredTechnique) => {
    const hasMatch = hasCapabilityMatch(requiredTechnique, availableTechniques);
    return hasMatch;
  });

  if (hasAnyTechniqueMatch) {
    return [];
  }

  return requiredTechniques;
};

const stringifyClinicalValue = (value: unknown): string => {
  if (!value) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value !== 'object') {
    return String(value);
  }

  const record = value as Record<string, unknown>;
  const medicationData = record.medication_data as Record<string, unknown> | undefined;
  const medicationName = medicationData?.normalized_name ?? medicationData?.original_text;
  const text = record.text ?? medicationName;
  return String(text ?? '');
};

const getClinicalContext = (clinicalAnalysis: ClinicalAnalysis): string[] => {
  const medications = clinicalAnalysis.medicacion_actual ?? [];
  const medicationText = medications.map(stringifyClinicalValue);
  const medicalHistory = clinicalAnalysis.antecedentes_medicos ?? [];
  const clinicalContext = [...medicationText, ...medicalHistory];
  const populatedContext = clinicalContext.filter((item) => item.trim().length > 0);
  return populatedContext;
};

const getMeaningfulTokens = (value: string): string[] => {
  const normalizedValue = normalizeText(value);
  const tokens = normalizedValue.split(' ');
  const meaningfulTokens = tokens.filter((token) => token.length >= MIN_TOKEN_LENGTH);
  return meaningfulTokens;
};

const hasClinicalContextMatch = (
  safetyRule: string,
  clinicalContext: string[]
): boolean => {
  const normalizedRule = normalizeText(safetyRule);
  const ruleTokens = getMeaningfulTokens(safetyRule);

  return clinicalContext.some((contextItem) => {
    const normalizedContext = normalizeText(contextItem);

    if (!normalizedContext) {
      return false;
    }

    const ruleContainsContext = normalizedRule.includes(normalizedContext);
    const contextContainsRule = normalizedContext.includes(normalizedRule);
    const tokenMatch = ruleTokens.some((token) => normalizedContext.includes(token));
    return ruleContainsContext || contextContainsRule || tokenMatch;
  });
};

const getMatchingSafetyRules = (
  safetyRules: string[],
  clinicalContext: string[]
): string[] => {
  return safetyRules.filter((safetyRule) => {
    const hasMatch = hasClinicalContextMatch(safetyRule, clinicalContext);
    return hasMatch;
  });
};

const hasUncontrolledRedFlag = (clinicalAnalysis: ClinicalAnalysis): boolean => {
  const redFlags = clinicalAnalysis.red_flags ?? [];

  if (redFlags.length === 0) {
    return false;
  }

  const contextItems = [
    ...(clinicalAnalysis.yellow_flags ?? []),
    ...(clinicalAnalysis.antecedentes_medicos ?? []),
    ...((clinicalAnalysis.medicacion_actual ?? []).map(stringifyClinicalValue)),
  ];

  const normalizedContext = contextItems.map(normalizeText).join(' ');

  return redFlags.some((redFlag) => {
    const normalizedRedFlag = normalizeText(redFlag);
    const hasControlContext = CONTROL_CONTEXT_TERMS.some((term) => normalizedContext.includes(term));
    const redFlagInContext = normalizedContext.includes(normalizedRedFlag);
    return !hasControlContext && !redFlagInContext;
  });
};

const buildEvidenceReason = (
  priority: EvidencePriority,
  intervention: ClinicalIntervention
): string => {
  if (priority === 'defer') {
    return 'Diferir: faltan capacidades o existe una restricción clínica documentada.';
  }

  if (intervention.evidenceLevel === 'high') {
    return 'Prioridad alta por evidencia aprobada de nivel alto.';
  }

  if (intervention.evidenceLevel === 'moderate') {
    return 'Prioridad media por evidencia aprobada de nivel moderado.';
  }

  return 'Prioridad baja por evidencia aprobada de nivel bajo.';
};

export const prioritizeEvidence = ({
  diagnosisEvidence,
  clinicalAnalysis,
  professionalProfile,
}: PrioritizeEvidenceInput): EvidenceRecommendation[] => {
  const profileTechniques = getProfileTechniqueLabels(professionalProfile);
  const profileEquipment = getProfileEquipmentLabels(professionalProfile);
  const clinicalContext = getClinicalContext(clinicalAnalysis);
  const uncontrolledRedFlag = hasUncontrolledRedFlag(clinicalAnalysis);

  return diagnosisEvidence.interventions.map((intervention) => {
    const warnings: string[] = [];
    const missingCapabilities: string[] = [];
    const basePriority = getPriorityFromEvidence(intervention.evidenceLevel);
    let priority = basePriority;

    if (uncontrolledRedFlag) {
      warnings.push('Red flag sin contexto de control médico documentado. Requiere revisión clínica antes de aplicar.');
    }

    const missingTechniques = getMissingTechniqueGroup(intervention.requiredTechniques, profileTechniques);
    missingCapabilities.push(...missingTechniques);

    if (missingTechniques.length > 0) {
      priority = 'defer';
    }

    const missingEquipment = getMissingCapabilities(intervention.requiredEquipment, profileEquipment);
    missingCapabilities.push(...missingEquipment);

    if (missingEquipment.length > 0) {
      priority = 'defer';
    }

    const contraindications = getMatchingSafetyRules(intervention.contraindications, clinicalContext);

    if (contraindications.length > 0) {
      warnings.push(...contraindications.map((item) => `Contraindicación detectada: ${item}`));
      priority = 'defer';
    }

    const relativeContraindications = getMatchingSafetyRules(
      intervention.relativeContraindications,
      clinicalContext
    );

    if (relativeContraindications.length > 0) {
      warnings.push(...relativeContraindications.map((item) => `Precaución relativa: ${item}`));
    }

    const reason = buildEvidenceReason(priority, intervention);

    return {
      interventionId: intervention.id,
      interventionName: intervention.name,
      priority,
      reason,
      warnings,
      missingCapabilities,
      evidenceLevel: intervention.evidenceLevel,
    };
  });
};
