// @ts-nocheck
export interface EMRForm {
  id?: string;
  visitId: string;
  patientId: string;
  professionalId: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  notes: string;
  updatedAt?: string;
  createdAt?: string;
}

export interface EMRContent {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  notes: string;
}

export interface ClinicalFormData {
  id?: string;
  form_type: 'SOAP';
  content: string;
  status: 'draft' | 'final' | 'archived';
  visit_id: string;
  patient_id: string;
  professional_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface Form {
  id: string;
  visit_id: string;
  patient_id: string;
  professional_id: string;
  form_type: string;
  content: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface SuggestionToIntegrate {
  id: string;
  content: string;
  type: 'recommendation' | 'warning' | 'info';
  sourceBlockId: string;
}