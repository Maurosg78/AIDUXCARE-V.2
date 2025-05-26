import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SuggestionIntegrationService } from '../../core/agent/SuggestionIntegrationService';
import { AgentSuggestion } from '../../types/agent';
import { AuditLogger } from '../../core/audit/AuditLogger';
import supabase from '../../core/auth/supabaseClient';

// Mock de supabase
vi.mock('../../core/auth/supabaseClient', () => ({
  default: {
    from: vi.fn()
  }
}));

// Mock de AuditLogger
vi.mock('../../core/audit/AuditLogger', () => ({
  AuditLogger: {
    log: vi.fn()
  }
}));

describe('SuggestionIntegrationService', () => {
  const mockSuggestion: AgentSuggestion = {
    id: 'test-suggestion-1',
    sourceBlockId: 'test-block-1',
    type: 'recommendation',
    content: 'Test suggestion content',
    field: 'notes',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockVisitId = 'test-visit-1';
  const mockUserId = 'test-user-1';
  const mockPatientId = 'test-patient-1';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('integrateSuggestion', () => {
    it('debe integrar una sugerencia en un campo vacío', async () => {
      // Mock para verificar visita
      (supabase.from as any).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: mockVisitId, patient_id: mockPatientId },
          error: null
        })
      });

      // Mock para insertar en integrated_suggestions
      (supabase.from as any).mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue({ error: null })
      });

      // Mock para obtener campo actual (no existe)
      (supabase.from as any).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'Not found' }
          })
      });

      // Mock para upsert del campo
      (supabase.from as any).mockReturnValueOnce({
        upsert: vi.fn().mockResolvedValue({ error: null })
      });

      await SuggestionIntegrationService.integrateSuggestion(mockSuggestion, mockVisitId, mockUserId);

      // Verificar que se registró el evento
      expect(AuditLogger.log).toHaveBeenCalledWith('suggestion.integrated', {
        visitId: mockVisitId,
        userId: mockUserId,
        patientId: mockPatientId,
        suggestionId: mockSuggestion.id,
        field: mockSuggestion.field,
        acceptedAt: expect.any(String)
      });
    });

    it('debe agregar una sugerencia a un campo existente con prefijo', async () => {
      const existingContent = 'Existing content';
      
      // Mock para verificar visita
      (supabase.from as any).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
          data: { id: mockVisitId, patient_id: mockPatientId },
              error: null
            })
      });

      // Mock para insertar en integrated_suggestions
      (supabase.from as any).mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue({ error: null })
      });

      // Mock para obtener campo actual (existe)
      (supabase.from as any).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { content: existingContent },
          error: null
        })
      });

      // Mock para upsert del campo
      (supabase.from as any).mockReturnValueOnce({
        upsert: vi.fn().mockResolvedValue({ error: null })
      });

      await SuggestionIntegrationService.integrateSuggestion(mockSuggestion, mockVisitId, mockUserId);

      // Verificar que se registró el evento
      expect(AuditLogger.log).toHaveBeenCalledWith('suggestion.integrated', {
        visitId: mockVisitId,
        userId: mockUserId,
        patientId: mockPatientId,
        suggestionId: mockSuggestion.id,
        field: mockSuggestion.field,
        acceptedAt: expect.any(String)
      });
    });

    it('debe lanzar error si la visita no existe', async () => {
      // Mock para verificar visita (no existe)
      (supabase.from as any).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'Not found' }
        })
      });

      await expect(
        SuggestionIntegrationService.integrateSuggestion(mockSuggestion, mockVisitId, mockUserId)
      ).rejects.toThrow(`La visita ${mockVisitId} no existe`);
    });

    it('debe lanzar error si hay un problema al obtener el campo', async () => {
      // Mock para verificar visita
      (supabase.from as any).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: mockVisitId, patient_id: mockPatientId },
          error: null
        })
      });

      // Mock para insertar en integrated_suggestions
      (supabase.from as any).mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue({ error: null })
      });

      // Mock para obtener campo actual (error)
      (supabase.from as any).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' }
        })
      });

      await expect(
        SuggestionIntegrationService.integrateSuggestion(mockSuggestion, mockVisitId, mockUserId)
      ).rejects.toThrow('Error al obtener el campo: Database error');
    });
  });
}); 