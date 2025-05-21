export interface ClinicalFormData {
  form_type: 'SOAP' | 'ANAMNESIS' | 'EVALUATION' | string;
  content: string;
  status: string;
  id?: string;
  visit_id?: string;
  patient_id?: string;
  professional_id?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: string | undefined;
}

export interface EMRContent {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  notes: string;
}

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

