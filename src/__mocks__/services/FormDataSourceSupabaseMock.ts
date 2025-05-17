import { vi } from "vitest";
// Mock para FormDataSourceSupabase para ser utilizado en pruebas
export default class FormDataSourceSupabaseMock {
  constructor() {}
  
  // Mock de getFormFields
  async getFormFields() {
    return [
      {
        id: 'field-1',
        key: 'symptoms',
        label: 'Síntomas',
        type: 'textarea',
        value: '',
        placeholder: 'Describa los síntomas',
        required: true,
        order: 1
      },
      {
        id: 'field-2',
        key: 'diagnosis',
        label: 'Diagnóstico',
        type: 'textarea',
        value: '',
        placeholder: 'Diagnóstico presuntivo',
        required: true,
        order: 2
      }
    ];
  }
  
  // Mock de updateFormField
  async updateFormField(formId: string, fieldKey: string, newValue: string) {
    return {
      success: true,
      data: {
        id: formId,
        key: fieldKey,
        value: newValue,
        updated_at: new Date().toISOString()
      }
    };
  }
  
  // Mock de getFormById
  async getFormById(formId: string) {
    return {
      id: formId,
      visit_id: 'visit-123',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      fields: [
        {
          id: 'field-1',
          key: 'symptoms',
          label: 'Síntomas',
          type: 'textarea',
          value: '',
          placeholder: 'Describa los síntomas',
          required: true,
          order: 1
        }
      ]
    };
  }
  
  // Mock de createForm
  async createForm(visitId: string) {
    return {
      id: 'new-form-id',
      visit_id: visitId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      fields: []
    };
  }
  
  // Mock de getFormByVisitId
  async getFormByVisitId(visitId: string) {
    return {
      id: 'form-for-' + visitId,
      visit_id: visitId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      fields: [
        {
          id: 'field-1',
          key: 'symptoms',
          label: 'Síntomas',
          type: 'textarea',
          value: '',
          placeholder: 'Describa los síntomas',
          required: true,
          order: 1
        }
      ]
    };
  }
} 