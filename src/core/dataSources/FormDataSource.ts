import { ClinicalFormData } from '@/types/forms';

export interface Form {
  id?: string;
  visit_id: string;
  patient_id: string;
  professional_id: string;
  content: string;
  status: string;
  form_type: string;
  created_at?: string;
  updated_at?: string;
}

export interface FormDataSource {
  getFormByVisitId(visitId: string): Promise<Form | null>;
  getFormById(formId: string): Promise<Form | null>;
  updateForm(formId: string, formData: ClinicalFormData): Promise<void>;
  createForm(formData: ClinicalFormData): Promise<void>;
} 