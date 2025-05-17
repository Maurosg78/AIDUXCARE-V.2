import { vi } from "vitest";
// Primero mockeamos supabaseClient antes de importar EMRFormService
vi.mock('../../../core/auth/supabaseClient', () => {
  return {
    default: {
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () => ({ 
              data: { professional_id: 'prof-123' }, 
              error: null 
            }),
          }),
        }),
      }),
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      },
    },
  };
});

// Ahora mockeamos formDataSourceSupabase que es usado por EMRFormService
vi.mock('../../../core/dataSources/formDataSourceSupabase', () => {
  return {
    formDataSourceSupabase: {
      getFormsByVisitId: vi.fn().mockResolvedValue([{
        id: 'form-123',
        visit_id: 'visit-123',
        patient_id: 'patient-123',
        professional_id: 'prof-123',
        form_type: 'SOAP',
        content: JSON.stringify({
          subjective: 'Paciente refiere dolor de cabeza',
          objective: 'Temperatura normal',
          assessment: 'Posible migraña',
          plan: 'Analgésicos',
          notes: 'Paciente alergico a aspirina'
        }),
        status: 'draft',
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z'
      }]),
      updateForm: vi.fn().mockResolvedValue({ id: 'form-123' }),
      createForm: vi.fn().mockResolvedValue({ id: 'new-form-123' })
    }
  };
});

// Mock para el servicio de analytics
vi.mock('../../../services/UsageAnalyticsService', () => ({
  track: vi.fn()
}));

// Mock para el AuditLogger
vi.mock('../../../core/audit/AuditLogger', () => ({
  AuditLogger: {
    logSuggestionIntegration: vi.fn(),
    logFormUpdate: vi.fn()
  }
}));

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EMRFormService, SuggestionToIntegrate } from '../EMRFormService';
import { formDataSourceSupabase } from '../../../core/dataSources/formDataSourceSupabase';
import { AuditLogger } from '../../../core/audit/AuditLogger';
import * as AnalyticsService from '../../../services/UsageAnalyticsService';

describe('EMRFormService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getEMRForm', () => {
    it('debería obtener correctamente un formulario EMR existente', async () => {
      const result = await EMRFormService.getEMRForm('visit-123');
      
      expect(result).not.toBeNull();
      expect(result?.visitId).toBe('visit-123');
      expect(result?.patientId).toBe('patient-123');
      expect(result?.subjective).toBe('Paciente refiere dolor de cabeza');
      expect(formDataSourceSupabase.getFormsByVisitId).toHaveBeenCalledWith('visit-123');
    });
  });
  
  describe('mapSuggestionTypeToEMRSection', () => {
    it('debería mapear cada tipo de sugerencia a la sección correcta', () => {
      expect(EMRFormService.mapSuggestionTypeToEMRSection('recommendation')).toBe('plan');
      expect(EMRFormService.mapSuggestionTypeToEMRSection('warning')).toBe('assessment');
      expect(EMRFormService.mapSuggestionTypeToEMRSection('info')).toBe('notes');
    });
  });
  
  describe('insertSuggestion', () => {
    it('debería insertar correctamente una sugerencia en el EMR', async () => {
      const suggestion: SuggestionToIntegrate = {
        id: 'sugg-123',
        content: 'Considerar radiografía',
        type: 'recommendation',
        sourceBlockId: 'block-123'
      };
      
      const result = await EMRFormService.insertSuggestion(
        suggestion,
        'visit-123',
        'patient-123',
        'user-123'
      );
      
      expect(result).toBe(true);
      expect(formDataSourceSupabase.updateForm).toHaveBeenCalled();
      expect(AuditLogger.logSuggestionIntegration).toHaveBeenCalled();
      
      // Verificar que se registró la métrica
      expect(vi.mocked(AnalyticsService.track)).toHaveBeenCalledWith(
        'suggestions_integrated',
        'user-123',
        'visit-123',
        1,
        expect.objectContaining({
          field: 'plan',
          source: 'block-123',
          suggestion_id: 'sugg-123'
        })
      );
    });
  });
}); 