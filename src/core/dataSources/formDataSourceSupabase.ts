import { vi } from 'vitest';
import type { ClinicalFormData } from '@/types/forms';

export const formDataSourceSupabase = {
  async getFormsByVisitId(visitId: string): Promise<ClinicalFormData[]> {
    return [{ form_type: 'SOAP', content: '{}', status: 'draft' }];
  },

  async createForm(formData: ClinicalFormData): Promise<ClinicalFormData & { id: string }> {
    return { id: 'mock-form-id', ...formData };
  },

  async updateForm(formId: string, formData: ClinicalFormData): Promise<ClinicalFormData & { id: string }> {
    return { id: formId, ...formData };
  }
};

