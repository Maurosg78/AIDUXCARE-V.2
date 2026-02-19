/**
 * WO-SOAP-UX-02: Invisible Validation Layer
 *
 * Post-generate structural validation. NEVER shown to user.
 * Soft thresholds. Internal signaling only.
 *
 * Principle: "El clínico escribe en narrativa. El sistema valida en silencio."
 */

import type { SOAPNote } from '@/types/vertex-ai';
import type { PhysicalExamResult } from '@/types/vertex-ai';
import { validateSOAPObjective } from '@/core/soap/SOAPObjectiveValidator';
import { validateSOAP, type SOAPValidationResult } from '@/utils/soapValidation';

const SECTION_GUIDELINES = {
  subjective: 200,
  objective: 350,
  assessment: 250,
  plan: 400,
} as const;

const TOTAL_GUIDELINE = 1200;
const MAX_GUIDELINE_DEVIATION_PCT = 0.3; // 30% over = flag

export interface InvisibleValidationResult {
  /** Region coherence: tested vs mentioned (0-1, 1 = perfect) */
  regionCoherence: number;
  /** Section length deviation from guidelines (0 = perfect) */
  sectionLengthDeviation: {
    subjective: number;
    objective: number;
    assessment: number;
    plan: number;
  };
  /** Total SOAP exceeds guideline by >30% */
  exceedsGuidelineLength: boolean;
  /** Semantic redundancy detected */
  hasRedundancy: boolean;
  /** Internal signals - never shown to user */
  internalSignals: string[];
  /** Narrative Compression Ratio input: finalChars / originalTranscriptChars */
  ncrInput: { finalChars: number; originalTranscriptChars: number };
}

/**
 * Runs invisible validation. Result is for backend/telemetry only.
 * Does NOT block generation. Does NOT show UI.
 */
export function runInvisibleValidation(
  soap: SOAPNote,
  context: {
    physicalExamResults?: PhysicalExamResult[];
    /** SOAPContext.physicalEvaluation.tests */
    physicalEvaluationTests?: PhysicalExamResult[];
    originalTranscriptChars?: number;
  }
): InvisibleValidationResult {
  const internalSignals: string[] = [];
  const finalChars =
    (soap.subjective?.length || 0) +
    (soap.objective?.length || 0) +
    (soap.assessment?.length || 0) +
    (soap.plan?.length || 0);

  // 1. Region coherence (tested vs mentioned)
  let regionCoherence = 1;
  const physicalExamResults = context.physicalExamResults ?? context.physicalEvaluationTests ?? [];
  if (physicalExamResults.length > 0 && soap.objective) {
    const regionValidation = validateSOAPObjective(soap.objective, physicalExamResults);
    if (regionValidation.violations.length > 0) {
      const testedCount = regionValidation.testedRegions.length || 1;
      const violationCount = regionValidation.violations.length;
      regionCoherence = Math.max(0, 1 - violationCount / (testedCount + violationCount));
      internalSignals.push(`region_coherence: ${(regionCoherence * 100).toFixed(0)}%`);
    }
  }

  // 2. Section length deviation (soft - no block)
  const sectionLengthDeviation = {
    subjective: Math.max(0, (soap.subjective?.length || 0) - SECTION_GUIDELINES.subjective),
    objective: Math.max(0, (soap.objective?.length || 0) - SECTION_GUIDELINES.objective),
    assessment: Math.max(0, (soap.assessment?.length || 0) - SECTION_GUIDELINES.assessment),
    plan: Math.max(0, (soap.plan?.length || 0) - SECTION_GUIDELINES.plan),
  };

  const totalDeviation =
    sectionLengthDeviation.subjective +
    sectionLengthDeviation.objective +
    sectionLengthDeviation.assessment +
    sectionLengthDeviation.plan;

  if (totalDeviation > 0) {
    internalSignals.push(`section_deviation_total: ${totalDeviation}`);
  }

  // 3. Exceeds guideline length by >30%
  const exceedsGuidelineLength = finalChars > TOTAL_GUIDELINE * (1 + MAX_GUIDELINE_DEVIATION_PCT);
  if (exceedsGuidelineLength) {
    internalSignals.push(`exceeds_guideline: ${finalChars} > ${Math.round(TOTAL_GUIDELINE * 1.3)}`);
  }

  // 4. Redundancy (reuse existing validation)
  const soapValidation: SOAPValidationResult = validateSOAP(soap);
  const hasRedundancy = soapValidation.repetitionCheck.hasRepetition;
  if (hasRedundancy) {
    internalSignals.push('redundancy_detected');
  }

  return {
    regionCoherence,
    sectionLengthDeviation,
    exceedsGuidelineLength,
    hasRedundancy,
    internalSignals,
    ncrInput: {
      finalChars,
      originalTranscriptChars: context.originalTranscriptChars ?? 0,
    },
  };
}

/**
 * Narrative Compression Ratio: finalCharsTotal / originalTranscriptChars
 * High NCR = SOAP too long vs transcript. Low NCR = SOAP too superficial.
 */
export function computeNCR(finalChars: number, originalTranscriptChars: number): number | null {
  if (originalTranscriptChars <= 0) return null;
  return finalChars / originalTranscriptChars;
}
