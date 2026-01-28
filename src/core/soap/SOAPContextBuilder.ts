/**
 * SOAP Context Builder
 * 
 * Aggregates data from Tab 1 (Analysis) and Tab 2 (Physical Evaluation)
 * to build a structured context for SOAP note generation.
 * 
 * Market: CA · en-CA · PHIPA/PIPEDA Ready
 */

import type { ClinicalAnalysis } from "../../utils/cleanVertexResponse";
import type { PhysicalExamResult } from "../../types/vertex-ai";

export type VisitType = 'initial' | 'follow-up';

export interface SOAPContext {
  visitType: VisitType;
  transcript: string;
  analysis: {
    redFlags: string[];
    yellowFlags: string[];
    medications: string[];
    chiefComplaint?: string;
    keyFindings: string[];
    medicalHistory: string[];
    biopsychosocial: {
      psychological: string[];
      social: string[];
      occupational: string[];
      protective: string[];
      functionalLimitations: string[];
      patientStrengths: string[];
    };
  };
  physicalEvaluation: {
    tests: PhysicalExamResult[];
    summary?: string; // Human-readable summary
  };
  patientContext?: {
    previousVisits?: number;
    lastVisitDate?: string;
    ongoingTreatment?: string;
    painScale?: string; // Bloque 4: Agregado para uso en prompts
  };
  physicalExamResults?: unknown[]; // Bloque 4: Agregado para compatibilidad con código existente
  // WO-FLOW-005: Focos clínicos editables del plan previo (solo follow-up)
  todayFocus?: Array<{
    id: string;
    label: string;
    notes?: string;
    source: 'plan';
  }>;
}

export interface VisitTypeDetectionResult {
  detectedType: VisitType;
  reason: string;
  canOverride: boolean;
}

/**
 * Detects visit type using hybrid approach:
 * - Heuristic 1: No previous SOAP = Initial
 * - Heuristic 2: >30 days since last SOAP = Initial (new episode)
 * - Heuristic 3: <30 days and previous SOAP exists = Follow-up
 */
export function detectVisitType(
  hasPreviousSOAP: boolean,
  daysSinceLastVisit?: number
): VisitTypeDetectionResult {
  // Heuristic 1: No previous SOAP
  if (!hasPreviousSOAP) {
    return {
      detectedType: 'initial',
      reason: 'No previous SOAP notes found',
      canOverride: true,
    };
  }

  // Heuristic 2: >30 days = new episode (Initial)
  if (daysSinceLastVisit !== undefined && daysSinceLastVisit > 30) {
    return {
      detectedType: 'initial',
      reason: `Last visit was ${daysSinceLastVisit} days ago (new episode)`,
      canOverride: true,
    };
  }

  // Heuristic 3: <30 days = Follow-up
  if (daysSinceLastVisit !== undefined && daysSinceLastVisit <= 30) {
    return {
      detectedType: 'follow-up',
      reason: `Last visit was ${daysSinceLastVisit} days ago`,
      canOverride: true,
    };
  }

  // Default: if we have previous SOAP but no date info, assume follow-up
  return {
    detectedType: 'follow-up',
    reason: 'Previous SOAP notes found',
    canOverride: true,
  };
}

/**
 * Builds SOAP context from Tab 1 (Analysis) and Tab 2 (Physical Evaluation) data
 */
export function buildSOAPContext(
  transcript: string,
  analysis: ClinicalAnalysis | null,
  physicalExamResults: PhysicalExamResult[],
  visitType: VisitType,
  patientContext?: {
    previousVisits?: number;
    lastVisitDate?: string;
    ongoingTreatment?: string;
  },
  todayFocus?: Array<{
    id: string;
    label: string;
    notes?: string;
    source: 'plan';
  }>
): SOAPContext {
  const context: SOAPContext = {
    visitType,
    transcript: transcript || '',
    analysis: {
      redFlags: analysis?.red_flags || [],
      yellowFlags: analysis?.yellow_flags || [],
      medications: analysis?.medicacion_actual || [],
      chiefComplaint: analysis?.motivo_consulta || undefined,
      keyFindings: analysis?.hallazgos_clinicos || [],
      medicalHistory: analysis?.antecedentes_medicos || [],
      biopsychosocial: {
        psychological: analysis?.biopsychosocial_psychological || [],
        social: analysis?.biopsychosocial_social || [],
        occupational: analysis?.biopsychosocial_occupational || [],
        protective: analysis?.biopsychosocial_protective || [],
        functionalLimitations: analysis?.biopsychosocial_functional_limitations || [],
        patientStrengths: analysis?.biopsychosocial_patient_strengths || [],
      },
    },
    physicalEvaluation: {
      tests: physicalExamResults,
      summary: undefined, // Will be set by caller if needed
    },
    patientContext,
    todayFocus, // WO-FLOW-005: Focos clínicos editables
  };

  return context;
}

/**
 * Validates that context has minimum required data for SOAP generation
 */
export function validateSOAPContext(context: SOAPContext): {
  isValid: boolean;
  missingFields: string[];
} {
  const missingFields: string[] = [];

  // Minimum requirements
  if (!context.transcript?.trim() && context.analysis.keyFindings.length === 0) {
    missingFields.push('transcript or key findings');
  }

  if (context.physicalEvaluation.tests.length === 0) {
    missingFields.push('at least one physical test');
  }

  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
}

