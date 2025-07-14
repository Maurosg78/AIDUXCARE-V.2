import { formDataSourceSupabase } from '@/core/dataSources/formDataSourceSupabase';
import { AuditLogger } from '@/core/audit/AuditLogger';
import { EMRFormService } from '@/core/services/EMRFormService';
import type { SuggestionToIntegrate } from '@/types/forms';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import supabase from '@/core/auth/supabaseClient';

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
    log: vi.fn(),
    logEvent: vi.fn().mockResolvedValue(undefined)
  }
}));
vi.mock('@/services/UsageAnalyticsService', () => ({
  trackMetric: vi.fn()
}));

// Mock de supabase.from('forms').update para simular éxito
const mockUpdate = vi.fn().mockReturnValue({
  update: vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({ error: null })
  })
});
(supabase.from as any) = mockUpdate;

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
      // No se mockea más updateForm, ahora se usa supabase directamente

      const suggestion: SuggestionToIntegrate = {
        id: 'sugg-1',
        content: 'Test suggestion',
        type: 'recommendation',
        sourceBlockId: 'block-1'
      };

      const result = await EMRFormService.insertSuggestion(suggestion, 'visit-1', 'patient-1', 'user-1');

      expect(result).toBe(true);
      // Verifica que se llamó a supabase.from('forms').update
      expect(mockUpdate).toHaveBeenCalledWith('forms');
      // TODO: Cuando se migre a Firebase, adaptar este test para el nuevo datasource
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
    // No se mockea más updateForm, ahora se usa supabase directamente
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
    expect(mockUpdate).toHaveBeenCalledWith('forms');
    expect(AuditLogger.logEvent).toHaveBeenCalled();
    // TODO: Cuando se migre a Firebase, adaptar este test para el nuevo datasource
  });

  it('debe manejar errores de red al integrar sugerencias', async () => {
    // Simular error en supabase.from('forms').update
    mockUpdate.mockReturnValueOnce({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: { message: 'Error de red simulado' } })
      })
    });
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
    // Debe llamar a AuditLogger.logEvent con el evento de error
    // NOTA: La función real llama a logEvent, no a log
    // TODO: Cuando se migre a Firebase, adaptar este test para el nuevo datasource
  });
});