import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';

import {
  getContextualMemory,
  getPersistentMemory,
  getSemanticMemory
} from '../../../core/mcp/MCPDataSourceSupabase';
import supabase from '../../../core/auth/supabaseClient';

// Definimos el tipo exacto que maneja el DataSource
type MemoryBlock = {
  id: string;
  created_at: string;
  type: 'contextual' | 'persistent' | 'semantic';
  content: string;
  visit_id?: string;
  patient_id?: string;
};

// Estructura de la respuesta mockeada
type MockResponse = {
  data: MemoryBlock[] | null;
  error: { message: string } | null;
};

// Builder simplificado, tipado sin any
type MockBuilder = {
  select: () => MockBuilder;
  eq: () => MockBuilder;
  then: () => Promise<MockResponse>;
};

function createMockBuilder(response: MockResponse): MockBuilder {
  // Creamos un único objeto que se devuelve en cada llamada
  const builder: MockBuilder = {
    select: () => builder,
    eq: () => builder,
    then: () => Promise.resolve(response)
  };
  return builder;
}

// Sobrescribimos supabase.from para que devuelva nuestro builder
vi.mock('../../../core/auth/supabaseClient', () => ({
  default: {
    from: vi.fn()
  }
}));

describe('MCPDataSourceSupabase', () => {
  let fromMock: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    // Identificamos el mock original de supabase.from
    fromMock = supabase.from as unknown as Mock;
    // Silenciar logs de consola
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  describe('getContextualMemory', () => {
    it('retorna memoria contextual', async () => {
      const visitId = 'visit-123';
      const mockResp: MockResponse = {
        data: [
          {
            id: '1',
            created_at: '2024-01-01T00:00:00Z',
            type: 'contextual',
            content: 'Test content',
            visit_id: visitId
          }
        ],
        error: null
      };

      // Configuramos el mock
      fromMock.mockReturnValue(createMockBuilder(mockResp));

      const result = await getContextualMemory(visitId);
      expect(result).toEqual(mockResp.data);
    });

    it('lanza error cuando Supabase regresa error', async () => {
      const mockResp: MockResponse = { data: null, error: { message: 'Fetch failed' } };
      fromMock.mockReturnValue(createMockBuilder(mockResp));

      await expect(getContextualMemory('x')).rejects.toThrow('Fetch failed');
    });
  });

  describe('getPersistentMemory', () => {
    it('retorna memoria persistente', async () => {
      const patientId = 'patient-456';
      const mockResp: MockResponse = {
        data: [
          {
            id: '2',
            created_at: '2024-02-02T00:00:00Z',
            type: 'persistent',
            content: 'Persisted data',
            patient_id: patientId
          }
        ],
        error: null
      };

      fromMock.mockReturnValue(createMockBuilder(mockResp));

      const result = await getPersistentMemory(patientId);
      expect(result).toEqual(mockResp.data);
    });

    it('lanza error en caso de fallo', async () => {
      const mockResp: MockResponse = { data: null, error: { message: 'Persist failed' } };
      fromMock.mockReturnValue(createMockBuilder(mockResp));

      await expect(getPersistentMemory('p-x')).rejects.toThrow('Persist failed');
    });
  });

  describe('getSemanticMemory', () => {
    it('retorna memoria semántica', async () => {
      const mockResp: MockResponse = {
        data: [
          {
            id: '3',
            created_at: '2024-03-03T00:00:00Z',
            type: 'semantic',
            content: 'Semantic info'
          }
        ],
        error: null
      };

      fromMock.mockReturnValue(createMockBuilder(mockResp));

      const result = await getSemanticMemory();
      expect(result).toEqual(mockResp.data);
    });

    it('lanza error cuando falla', async () => {
      const mockResp: MockResponse = { data: null, error: { message: 'Semantic fail' } };
      fromMock.mockReturnValue(createMockBuilder(mockResp));

      await expect(getSemanticMemory()).rejects.toThrow('Semantic fail');
    });
  });
});
