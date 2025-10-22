export interface ClinicalEntity {
  id: string;
  text: string;
  type: string;
  clinicalRelevance?: string;
  confidence?: number;
}

export interface ClinicalAnalysis {
  success: boolean;
  chief_complaint?: string;
  clinical_findings?: string;
  relevant_findings?: string;
  occupational_context?: string;
  psychosocial_context?: string;
  current_medication?: string;
  medical_history?: string;
  probable_diagnoses?: string;
  red_flags?: string;
  yellow_flags?: string;
  physical_assessments_suggested?: string;
  treatment_plan_suggested?: string;
  referral_recommended?: string;
  estimated_prognosis?: string;
  safety_notes?: string;
  legal_risk?: string;
  entities?: ClinicalEntity[];
  rawResponse?: string;
}
