export type MedicationMentionStatus =
  | 'current'
  | 'previous'
  | 'stopped_adverse'
  | 'topical_or_supplement'
  | 'unclear';

export type MedicationConfidence = 'high' | 'medium' | 'low';

export type MedicationSource = 'main_analysis' | 'pre_extracted' | 'merged';

export interface ClinicalMedicationEntry {
  original_text: string;
  canonical_name: string | null;
  normalized_name: string;
  dose: string;
  frequency: string;
  duration: string;
  active_ingredient: string;
  mention_status: MedicationMentionStatus;
  confidence: MedicationConfidence;
  requires_review: boolean;
  suggested_name?: string;
  source: MedicationSource;
}
