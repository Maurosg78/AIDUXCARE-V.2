// @ts-nocheck
import { Form, ClinicalFormData } from '@/types/forms';

export type { Form, ClinicalFormData };

export interface FormDataSource {
  getFormsByVisitId(visitId: string): Promise<Form[]>;
  getFormById(formId: string): Promise<Form | null>;
  createForm(formData: ClinicalFormData & {
    visit_id: string;
    patient_id: string;
    professional_id: string;
  }): Promise<Form>;
  updateForm(formId: string, formData: ClinicalFormData): Promise<Form>;
  deleteForm(formId: string): Promise<void>;
} 