import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import {
  getContextualMemory,
  getPersistentMemory,
  getSemanticMemory
} from '../../../core/mcp/MCPDataSourceSupabase';
import supabase from '../../../core/auth/supabaseClient';

// Mock de supabase
vi.mock('../../../core/auth/supabaseClient', () => ({
  default: {
    from: vi.fn()
  }
}));

// Definimos el tipo exacto que maneja el DataSource
type MemoryBlock = {
  id: string;
  created_at: string;
  type: 'contextual' | 'persistent' | 'semantic';
  content: string;
  visit_id?: string;
  patient_id?: string;
};

describe('MCPDataSourceSupabase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Silenciar logs de consola
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  describe('getContextualMemory', () => {
    it('retorna memoria contextual', async () => {
      const visitId = 'visit-123';
      const mockData = [{
            id: '1',
            created_at: '2024-01-01T00:00:00Z',
            type: 'contextual',
            content: 'Test content',
            visit_id: visitId
      }];

      (supabase.from as Mock).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockData, error: null })
      });

      const result = await getContextualMemory(visitId);
      expect(result).toEqual(mockData);
      expect(supabase.from).toHaveBeenCalledWith('contextual_memory');
    });

    it('lanza error cuando Supabase regresa error', async () => {
      const error = { message: 'Fetch failed' };
      
      (supabase.from as Mock).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error })
      });

      await expect(getContextualMemory('x')).resolves.toEqual([]);
    });
  });

  describe('getPersistentMemory', () => {
    it('retorna memoria persistente', async () => {
      const patientId = 'patient-456';
      const mockData = [{
            id: '2',
            created_at: '2024-02-02T00:00:00Z',
            type: 'persistent',
            content: 'Persisted data',
            patient_id: patientId
      }];

      (supabase.from as Mock).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockData, error: null })
      });

      const result = await getPersistentMemory(patientId);
      expect(result).toEqual(mockData);
      expect(supabase.from).toHaveBeenCalledWith('persistent_memory');
    });

    it('lanza error en caso de fallo', async () => {
      const error = { message: 'Persist failed' };
      
      (supabase.from as Mock).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error })
      });

      await expect(getPersistentMemory('p-x')).resolves.toEqual([]);
    });
  });

  describe('getSemanticMemory', () => {
    it('retorna memoria semántica', async () => {
      const mockData = [{
            id: '3',
            created_at: '2024-03-03T00:00:00Z',
            type: 'semantic',
            content: 'Semantic info'
      }];

      (supabase.from as Mock).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockData, error: null })
      });

      const result = await getSemanticMemory();
      expect(result).toEqual(mockData);
      expect(supabase.from).toHaveBeenCalledWith('semantic_memory');
    });

    it('lanza error cuando falla', async () => {
      const error = { message: 'Semantic fail' };
      
      (supabase.from as Mock).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error })
      });

      await expect(getSemanticMemory()).resolves.toEqual([]);
    });
  });
});
