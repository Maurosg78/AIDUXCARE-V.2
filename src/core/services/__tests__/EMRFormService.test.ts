import { z } from 'zod';
import { supabase } from '@/lib/supabaseClient';
import { formDataSourceSupabase } from '@/core/dataSources/formDataSourceSupabase';
import { AuditLogger } from '@/core/audit/AuditLogger';
import { trackMetric } from '@/services/UsageAnalyticsService';
import { EMRFormService, type EMRSection } from '@/core/services/EMRFormService';
import type { FormDataSource, Form } from '@/core/dataSources/FormDataSource';
import type { ClinicalFormData, EMRForm, SuggestionToIntegrate } from '@/types/forms';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock de dependencias externas
vi.mock('@/core/dataSources/formDataSourceSupabase', () => ({
  formDataSourceSupabase: {
    getFormsByVisitId: vi.fn(),
    updateForm: vi.fn(),
    createForm: vi.fn()
  }
}));
vi.mock('@/core/audit/AuditLogger', () => ({
  AuditLogger: {
    logSuggestionIntegration: vi.fn(),
    log: vi.fn()
  }
}));
vi.mock('@/services/UsageAnalyticsService', () => ({
  trackMetric: vi.fn()
}));

const mockForm = {
  id: 'form-1',
  visit_id: 'visit-1',
  patient_id: 'patient-1',
  professional_id: 'prof-1',
  form_type: 'SOAP',
  content: JSON.stringify({
    subjective: 'subj',
    objective: 'obj',
    assessment: 'assess',
    plan: 'plan',
    notes: 'notes'
  }),
  updated_at: '2023-01-01T00:00:00Z',
  created_at: '2023-01-01T00:00:00Z',
  status: 'draft'
};

describe('EMRFormService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getEMRForm', () => {
    it('should return EMR form for valid visit ID', async () => {
      vi.mocked(formDataSourceSupabase.getFormsByVisitId).mockResolvedValue([mockForm]);

      const result = await EMRFormService.getEMRForm('visit-1');

      expect(result).toEqual({
        id: 'form-1',
        visitId: 'visit-1',
        patientId: 'patient-1',
        professionalId: 'prof-1',
        subjective: 'subj',
        objective: 'obj',
        assessment: 'assess',
        plan: 'plan',
        notes: 'notes',
        updatedAt: '2023-01-01T00:00:00Z',
        createdAt: '2023-01-01T00:00:00Z'
      });
    });

    it('should insert suggestion successfully', async () => {
      vi.mocked(formDataSourceSupabase.getFormsByVisitId).mockResolvedValue([mockForm]);
      vi.mocked(formDataSourceSupabase.updateForm).mockResolvedValue(mockForm);

      const suggestion: SuggestionToIntegrate = {
        id: 'sugg-1',
        content: 'Test suggestion',
        type: 'recommendation',
        sourceBlockId: 'block-1'
      };

      const result = await EMRFormService.insertSuggestion(suggestion, 'visit-1', 'patient-1', 'user-1');

      expect(result).toBe(true);
      expect(formDataSourceSupabase.updateForm).toHaveBeenCalled();
    });

    it('should not insert duplicate suggestion', async () => {
      const formWithSuggestion = {
        ...mockForm,
        content: JSON.stringify({
          subjective: 'subj',
          objective: 'obj',
          assessment: 'assess',
          plan: '🔎 Test suggestion',
          notes: 'notes'
        })
      };

      vi.mocked(formDataSourceSupabase.getFormsByVisitId).mockResolvedValue([formWithSuggestion]);

      const suggestion: SuggestionToIntegrate = {
        id: 'sugg-1',
        content: 'Test suggestion',
        type: 'recommendation',
        sourceBlockId: 'block-1'
      };

      const result = await EMRFormService.insertSuggestion(suggestion, 'visit-1', 'patient-1', 'user-1');

      expect(result).toBe(false);
      expect(formDataSourceSupabase.updateForm).not.toHaveBeenCalled();
    });
  });

  it('getEMRForm devuelve null si no hay forms', async () => {
    vi.mocked(formDataSourceSupabase.getFormsByVisitId).mockResolvedValue([]);
    const result = await EMRFormService.getEMRForm('visit-1');
    expect(result).toBeNull();
  });

  it('getSectionContent devuelve el contenido correcto', async () => {
    vi.mocked(formDataSourceSupabase.getFormsByVisitId).mockResolvedValue([mockForm]);
    const result = await EMRFormService.getSectionContent('visit-1', 'plan');
    expect(result).toBe('plan');
  });

  it('updateEMRForm actualiza correctamente', async () => {
    vi.mocked(formDataSourceSupabase.updateForm).mockResolvedValue(mockForm);
    const emrForm = {
      id: 'form-1',
      visitId: 'visit-1',
      patientId: 'patient-1',
      professionalId: 'prof-1',
      subjective: 'subj',
      objective: 'obj',
      assessment: 'assess',
      plan: 'plan',
      notes: 'notes',
      updatedAt: '2023-01-01T00:00:00Z',
      createdAt: '2023-01-01T00:00:00Z'
    };
    const result = await EMRFormService.updateEMRForm(emrForm, 'user-1');
    expect(result).toBe(true);
    expect(formDataSourceSupabase.updateForm).toHaveBeenCalled();
    expect(AuditLogger.log).toHaveBeenCalled();
  });

  it('debe manejar errores de red al integrar sugerencias', async () => {
    // Configurar mock para que falle con error de red
    vi.mocked(formDataSourceSupabase.updateForm).mockRejectedValueOnce(new Error('Error de red simulado'));
    vi.mocked(formDataSourceSupabase.getFormsByVisitId).mockResolvedValue([mockForm]);
    
    const suggestion = { 
      id: 'sug-1', 
      content: 'Nueva sugerencia', 
      type: 'recommendation' as const, 
      sourceBlockId: 'block-1' 
    };
    
    const result = await EMRFormService.insertSuggestion(suggestion, 'visit-1', 'patient-1', 'user-1');
    
    // Debe retornar false en caso de error
    expect(result).toBe(false);
    
    // Debe llamar a AuditLogger.log con el evento de error
    expect(AuditLogger.log).toHaveBeenCalledWith(
      'suggestion_integration_error',
      expect.objectContaining({
        error: 'Error de red simulado',
        userId: 'user-1',
        visitId: 'visit-1',
        suggestionId: 'sug-1'
      })
    );
  });
});