import { vi } from "vitest";
export const formDataSourceSupabase = {
  async getFormsByVisitId(visitId: string): Promise<any[]> {
    return [{ form_type: 'SOAP' }];
  },

  async createForm(formData: any) {
    return { id: 'mock-form-id', ...formData };
  },

  async updateForm(formId: string, formData: any) {
    return { id: formId, ...formData };
  }
};
