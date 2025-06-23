export interface FormData {
  id: string;
  visitId: string;
  patientId: string;
  userId: string;
  formType: 'SOAP' | 'ASSESSMENT' | 'NOTES';
  content: Record<string, any>;
  timestamp: Date;
  status: 'DRAFT' | 'COMPLETED' | 'REVIEWED';
}

export interface FormField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'select' | 'textarea' | 'checkbox';
  label: string;
  required: boolean;
  options?: string[];
  validation?: any;
}

export interface FormSection {
  id: string;
  title: string;
  fields: FormField[];
  order: number;
}

export interface FormTemplate {
  id: string;
  name: string;
  version: string;
  sections: FormSection[];
  metadata: Record<string, any>;
}

export interface Form {
  id: string;
  name: string;
  version: string;
  fields: FormField[];
  content: string;
  visit_id: string;
  patient_id: string;
  professional_id: string;
  form_type: string;
  status: string;
  updated_at: string;
  created_at: string;
}

export interface ClinicalFormData {
  id?: string;
  patientId?: string;
  formId?: string;
  data?: Record<string, any>;
  timestamp?: Date;
  status: 'DRAFT' | 'COMPLETED';
  content?: string;
  form_type?: string;
  visit_id?: string;
  patient_id?: string;
  professional_id?: string;
  updated_at?: string;
  created_at?: string;
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

// Tipo faltante que estaba causando errores
export interface SuggestionToIntegrate {
  id: string;
  content: string;
  type: 'CLINICAL' | 'ADMINISTRATIVE' | 'MEDICATION';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  targetSection?: string;
  reasoning?: string;
  sourceBlockId?: string;
}

export interface FormSubmission {
  formId: string;
  data: Record<string, any>;
  timestamp: Date;
  submittedBy: string;
}

export interface FormValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
  }>;
}
