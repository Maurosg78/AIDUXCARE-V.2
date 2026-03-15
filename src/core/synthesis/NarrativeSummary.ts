/**
 * NarrativeSummary - clinical synthesis layer.
 *
 * Bridges ClinicalFactSet-like data and concrete report formats.
 * No transport or rendering concerns here; only clinical prioritization.
 */

export interface NarrativeEvolutionSummary {
  hasChange: boolean;
  direction?: 'improved' | 'worsened' | 'stable' | 'redflag';
  painChangeText?: string;
  functionChangeText?: string;
  mobilityChangeText?: string;
  evolutionHighlight?: string;
  clinicianEvolutionNote?: string;
  redFlagText?: string;
}

export interface NarrativeKeyFindings {
  painFinding?: string;
  mobilityFinding?: string;
  neuroOrTestFindings?: string;
  redFlagStatus?: string;
  otherFindings?: string[];
}

export interface NarrativeTreatmentSummary {
  inClinic?: string[];
  homeProgram?: string[];
  education?: string[];
}

export interface NarrativePlanSummary {
  mainPlanText: string;
  followUpHorizon?: string;
  referralAdvice?: string;
}

export interface NarrativeSummary {
  mainProblem: string;
  secondaryProblems?: string[];
  evolution: NarrativeEvolutionSummary;
  keyFindings: NarrativeKeyFindings;
  treatmentSummary: NarrativeTreatmentSummary;
  planSummary: NarrativePlanSummary;
}

