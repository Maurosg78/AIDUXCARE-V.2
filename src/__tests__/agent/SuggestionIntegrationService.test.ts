import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SuggestionIntegrationService } from '../../core/agent/SuggestionIntegrationService';
import { AgentSuggestion } from '../../types/agent';
import supabase from '../../core/auth/supabaseClient';
import { AuditLogger } from '../../core/audit/AuditLogger';

// Mock de supabase
vi.mock('../../core/auth/supabaseClient', () => ({
  default: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn()
        }))
      })),
      insert: vi.fn(() => ({
        error: null
      })),
      upsert: vi.fn(() => ({
        error: null
      }))
    }))
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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('integrateSuggestion', () => {
    it('debe integrar una sugerencia en un campo vacío', async () => {
      // Mock de la respuesta de Supabase para campo vacío
      (supabase.from as jest.Mock).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
          })
        }),
        insert: vi.fn().mockReturnValue({ error: null })
      });

      await SuggestionIntegrationService.integrateSuggestion(mockSuggestion, mockVisitId, mockUserId);

      // Verificar que se llamó a insert con el contenido correcto
      expect(supabase.from).toHaveBeenCalledWith('integrated_suggestions');
      expect(supabase.from('integrated_suggestions').insert).toHaveBeenCalledWith({
        suggestion_id: mockSuggestion.id,
        visit_id: mockVisitId,
        field: mockSuggestion.field,
        content: mockSuggestion.content,
        created_at: expect.any(String)
      });

      // Verificar que se registró el evento
      expect(AuditLogger.log).toHaveBeenCalledWith('suggestion.integrated', {
        visitId: mockVisitId,
        userId: mockUserId,
        suggestionId: mockSuggestion.id,
        field: mockSuggestion.field,
        acceptedAt: expect.any(String)
      });
    });

    it('debe agregar una sugerencia a un campo existente con prefijo', async () => {
      const existingContent = 'Existing content';
      
      // Mock de la respuesta de Supabase para campo existente
      (supabase.from as jest.Mock).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                content: existingContent
              },
              error: null
            })
          })
        }),
        insert: vi.fn().mockReturnValue({ error: null })
      });

      await SuggestionIntegrationService.integrateSuggestion(mockSuggestion, mockVisitId, mockUserId);

      // Verificar que se llamó a insert con el contenido concatenado
      expect(supabase.from('integrated_suggestions').insert).toHaveBeenCalledWith({
        suggestion_id: mockSuggestion.id,
        visit_id: mockVisitId,
        field: mockSuggestion.field,
        content: `${existingContent}\n\n🔎 ${mockSuggestion.content}`,
        created_at: expect.any(String)
      });
    });

    it('debe lanzar error si la visita no existe', async () => {
      // Mock de la respuesta de Supabase para visita inexistente
      (supabase.from as jest.Mock).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
          })
        })
      });

      await expect(
        SuggestionIntegrationService.integrateSuggestion(mockSuggestion, mockVisitId, mockUserId)
      ).rejects.toThrow(`La visita ${mockVisitId} no existe`);
    });

    it('debe lanzar error si hay un problema al obtener el campo', async () => {
      // Mock de la respuesta de Supabase con error
      (supabase.from as jest.Mock).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' }
            })
          })
        })
      });

      await expect(
        SuggestionIntegrationService.integrateSuggestion(mockSuggestion, mockVisitId, mockUserId)
      ).rejects.toThrow('Error al obtener el campo: Database error');
    });
  });
}); 