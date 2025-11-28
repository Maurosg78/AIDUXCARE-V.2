/**
 * SOAP Data Organizer
 * 
 * Unifies and organizes data from Tab 1 (Clinical Analysis) and Tab 2 (Physical Evaluation)
 * into a structured format ready for SOAP prompt generation.
 * 
 * This ensures that ALL clinical data documented by the physiotherapist flows
 * correctly into the second Vertex AI call for SOAP generation.
 * 
 * Market: CA · en-CA · PHIPA/PIPEDA Ready
 */

import type { ClinicalAnalysis } from '../../utils/cleanVertexResponse';
import type { PhysicalExamResult } from '../../types/vertex-ai';
import { buildPhysicalExamResults, buildPhysicalEvaluationSummary, type EvaluationTestEntry } from './PhysicalExamResultBuilder';
import { buildSOAPContext, type VisitType, type SOAPContext } from './SOAPContextBuilder';
import type { MskTestDefinition } from '../msk-tests/library/mskTestLibrary';

/**
 * Unified clinical data structure containing all information from Tab 1 and Tab 2
 */
export interface UnifiedClinicalData {
  // Tab 1: Clinical Analysis Data
  tab1: {
    transcript: string;
    analysis: ClinicalAnalysis | null;
    attachments?: any[]; // Clinical attachments (lab results, images, etc.)
  };
  
  // Tab 2: Physical Evaluation Data
  tab2: {
    evaluationTests: EvaluationTestEntry[];
    library: MskTestDefinition[];
  };
  
  // Visit context
  visit: {
    type: VisitType;
    patientId?: string;
    patientName?: string;
    previousVisits?: number;
    lastVisitDate?: string;
  };
}

/**
 * Organized SOAP input ready for prompt generation
 */
export interface OrganizedSOAPInput {
  context: SOAPContext;
  structuredData: {
    physicalExamResults: PhysicalExamResult[];
    physicalEvaluationSummary: string;
    physicalEvaluationStructured: string; // JSON string
  };
  metadata: {
    transcriptLength: number;
    testCount: number;
    hasRedFlags: boolean;
    hasMedications: boolean;
    hasBiopsychosocial: boolean;
  };
}

/**
 * Organizes all clinical data from Tab 1 and Tab 2 into a unified structure
 * ready for SOAP prompt generation.
 * 
 * This is the SINGLE SOURCE OF TRUTH for preparing data for the second Vertex AI call.
 */
export function organizeSOAPData(
  data: UnifiedClinicalData
): OrganizedSOAPInput {
  const { tab1, tab2, visit } = data;

  // Step 1: Build structured PhysicalExamResult[] from Tab 2 data
  const physicalExamResults = buildPhysicalExamResults(
    tab2.evaluationTests,
    tab2.library
  );

  // Step 2: Build human-readable summary
  const physicalEvaluationSummary = buildPhysicalEvaluationSummary(physicalExamResults);

  // Step 3: Build structured JSON string (source of truth for Vertex)
  const physicalEvaluationStructured = JSON.stringify(physicalExamResults, null, 2);

  // Step 4: Build complete SOAP context
  const context = buildSOAPContext(
    tab1.transcript,
    tab1.analysis,
    physicalExamResults,
    visit.type,
    {
      previousVisits: visit.previousVisits,
      lastVisitDate: visit.lastVisitDate,
    }
  );

  // Add summary to context
  context.physicalEvaluation.summary = physicalEvaluationSummary;

  // Step 5: Calculate metadata for validation and logging
  const metadata = {
    transcriptLength: (tab1.transcript || '').split(/\s+/).filter(Boolean).length,
    testCount: physicalExamResults.length,
    hasRedFlags: (tab1.analysis?.red_flags?.length || 0) > 0,
    hasMedications: (tab1.analysis?.medicacion_actual?.length || 0) > 0,
    hasBiopsychosocial: 
      (tab1.analysis?.biopsychosocial_psychological?.length || 0) > 0 ||
      (tab1.analysis?.biopsychosocial_social?.length || 0) > 0 ||
      (tab1.analysis?.biopsychosocial_occupational?.length || 0) > 0 ||
      (tab1.analysis?.biopsychosocial_functional_limitations?.length || 0) > 0,
  };

  return {
    context,
    structuredData: {
      physicalExamResults,
      physicalEvaluationSummary,
      physicalEvaluationStructured,
    },
    metadata,
  };
}

/**
 * Validates that all required data is present before SOAP generation
 */
export function validateUnifiedData(data: UnifiedClinicalData): {
  isValid: boolean;
  missingFields: string[];
  warnings: string[];
} {
  const missingFields: string[] = [];
  const warnings: string[] = [];

  // Tab 1 validation
  if (!data.tab1.transcript?.trim() && !data.tab1.analysis) {
    missingFields.push('transcript or clinical analysis');
  }

  if (!data.tab1.analysis) {
    warnings.push('No clinical analysis available - SOAP will be limited');
  }

  // Tab 2 validation
  if (!data.tab2.evaluationTests || data.tab2.evaluationTests.length === 0) {
    missingFields.push('at least one physical evaluation test');
  }

  if (!data.tab2.library || data.tab2.library.length === 0) {
    warnings.push('MSK test library is empty - custom tests may not have structured fields');
  }

  // Visit type validation
  if (!data.visit.type) {
    missingFields.push('visit type (initial or follow-up)');
  }

  return {
    isValid: missingFields.length === 0,
    missingFields,
    warnings,
  };
}

/**
 * Creates a summary report of the organized data (for debugging/logging)
 */
export function createDataSummary(organized: OrganizedSOAPInput): string {
  const { context, structuredData, metadata } = organized;
  
  const lines: string[] = [];
  lines.push('=== SOAP Data Organization Summary ===');
  lines.push('');
  lines.push(`Visit Type: ${context.visitType}`);
  lines.push(`Transcript: ${metadata.transcriptLength} words`);
  lines.push(`Physical Tests: ${metadata.testCount}`);
  lines.push('');
  lines.push('Clinical Analysis:');
  lines.push(`  - Red Flags: ${context.analysis.redFlags.length}`);
  lines.push(`  - Yellow Flags: ${context.analysis.yellowFlags.length}`);
  lines.push(`  - Medications: ${context.analysis.medications.length}`);
  lines.push(`  - Key Findings: ${context.analysis.keyFindings.length}`);
  lines.push(`  - Medical History: ${context.analysis.medicalHistory.length}`);
  lines.push('');
  lines.push('Physical Evaluation:');
  lines.push(`  - Tests Performed: ${structuredData.physicalExamResults.length}`);
  lines.push(`  - Summary Length: ${structuredData.physicalEvaluationSummary.length} chars`);
  lines.push(`  - Structured JSON Length: ${structuredData.physicalEvaluationStructured.length} chars`);
  lines.push('');
  lines.push('Biopsychosocial Factors:');
  lines.push(`  - Psychological: ${context.analysis.biopsychosocial.psychological.length}`);
  lines.push(`  - Social: ${context.analysis.biopsychosocial.social.length}`);
  lines.push(`  - Occupational: ${context.analysis.biopsychosocial.occupational.length}`);
  lines.push(`  - Functional Limitations: ${context.analysis.biopsychosocial.functionalLimitations.length}`);
  lines.push(`  - Patient Strengths: ${context.analysis.biopsychosocial.patientStrengths.length}`);
  
  return lines.join('\n');
}

