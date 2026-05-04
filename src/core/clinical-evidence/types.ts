// ADR-004: Clinical evidence library
// Update workflow: diff proposed -> CTO clinical review -> approve -> commit

export type EvidenceSource = 'pedro' | 'cochrane' | 'pubmed_central' | 'open_access_journal';
export type EvidenceDesign = 'rct' | 'systematic_review' | 'meta_analysis';
export type EvidenceGrade = 'high' | 'moderate' | 'low';
export type InterventionCategory =
  | 'manual_therapy'
  | 'exercise_therapy'
  | 'electrotherapy'
  | 'taping'
  | 'orthosis'
  | 'dry_needling'
  | 'shockwave'
  | 'education'
  | 'other';

export interface EvidenceReference {
  readonly authors: string;
  readonly year: number;
  readonly title: string;
  readonly source: EvidenceSource;
  readonly doi: string;
  readonly pedroScore?: number;
  readonly grade: EvidenceGrade;
  readonly design: EvidenceDesign;
  readonly sampleSize: number;
  readonly fullTextReviewed: boolean;
  readonly abstractConsistentWithFullText: boolean | null;
}

export interface ClinicalIntervention {
  readonly id: string;
  readonly name: string;
  readonly category: InterventionCategory;
  readonly description: string;
  readonly evidenceLevel: EvidenceGrade;
  readonly references: EvidenceReference[];
  readonly requiredTechniques: string[];
  readonly requiredEquipment: string[];
  readonly contraindications: string[];
  readonly relativeContraindications: string[];
  readonly notes: string;
}

export interface DiagnosisEvidence {
  readonly diagnosisId: string;
  readonly diagnosisName: string;
  readonly icdCode: string;
  readonly version: string;
  readonly lastReviewed: string;
  readonly nextReviewDue: string;
  readonly reviewedBy: string;
  readonly interventions: ClinicalIntervention[];
}
