import { beforeEach, describe, expect, it, vi } from 'vitest';
import { 
  getContextualMemory, 
  getPersistentMemory, 
  getSemanticMemory 
} from '@/core/mcp/MCPDataSourceSupabase';
import supabase from '@/core/auth/supabaseClient';
import { PostgrestFilterBuilder, PostgrestBuilder } from '@supabase/postgrest-js';
import { MCPMemoryBlock, MCPMemoryBlockSchema } from '@/core/mcp/schema';

// Tipo para un objeto de respuesta de Supabase
type SupabaseResponse<T> = {
  data: T | null;
  error: { message: string } | null;
};

// Función para crear un builder de Supabase tipado y funcional
function createMockSupabaseBuilder<T>(responseData: SupabaseResponse<T[]>) {
  // Creamos un objeto que imita la cadena de métodos de Supabase y que al final
  // devuelve una promesa con los datos que queremos
  const mockBuilder = {
    // Métodos de filtrado
    eq: () => mockBuilder,
    neq: () => mockBuilder,
    gt: () => mockBuilder,
    gte: () => mockBuilder,
    lt: () => mockBuilder,
    lte: () => mockBuilder,
    order: () => mockBuilder,
    
    // Este es el final de la cadena, que retorna una promesa con los datos
    then: <R>(onfulfilled: (value: SupabaseResponse<T[]>) => R) => {
      return Promise.resolve(onfulfilled(responseData));
    },
    catch: () => Promise.resolve(responseData),
  };
  
  return mockBuilder as unknown as PostgrestFilterBuilder<any, any, T[]>;
}

// Mock del cliente Supabase
vi.mock('@/core/auth/supabaseClient', () => {
  return {
    default: {
      from: vi.fn().mockImplementation(() => ({
        select: vi.fn()
      }))
    }
  };
});

describe('MCPDataSourceSupabase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validMemoryBlock: MCPMemoryBlock = {
    id: 'test-1',
    created_at: new Date().toISOString(),
    type: 'contextual',
    content: 'Datos de prueba',
    visit_id: 'visit-123',
    patient_id: 'patient-456'
  };

  const invalidMemoryBlock = {
    id: 'invalid-1',
    created_at: 'fecha-invalida',  // Esto fallará la validación de Zod
    type: 'contextual' as const,
    content: 'Datos inválidos'
  };

  describe('getContextualMemory', () => {
    it('debería devolver datos válidos cuando Supabase responde correctamente', async () => {
      // Crear un mock de respuesta de Supabase
      const mockResponse: SupabaseResponse<MCPMemoryBlock[]> = {
        data: [validMemoryBlock],
        error: null
      };
      
      // Configurar el mock de Supabase
      vi.spyOn(supabase, 'from').mockReturnValue({
        select: () => createMockSupabaseBuilder(mockResponse)
      } as any);

      const result = await getContextualMemory('visit-123');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('test-1');
    });

    it('debería devolver un array vacío cuando no hay datos', async () => {
      // Crear un mock de respuesta de Supabase sin datos
      const mockResponse: SupabaseResponse<MCPMemoryBlock[]> = {
        data: [],
        error: null
      };
      
      // Configurar el mock de Supabase
      vi.spyOn(supabase, 'from').mockReturnValue({
        select: () => createMockSupabaseBuilder(mockResponse)
      } as any);

      const result = await getContextualMemory('visit-123');
      expect(result).toHaveLength(0);
    });

    it('debería manejar errores de red de Supabase', async () => {
      // Crear un mock de respuesta de Supabase con error
      const mockResponse: SupabaseResponse<MCPMemoryBlock[]> = {
        data: null,
        error: { message: 'Error de conexión' }
      };
      
      // Configurar el mock de Supabase
      vi.spyOn(supabase, 'from').mockReturnValue({
        select: () => createMockSupabaseBuilder(mockResponse)
      } as any);

      const result = await getContextualMemory('visit-123');
      expect(result).toHaveLength(0);
    });

    it('debería manejar errores de validación de Zod', async () => {
      // Crear un mock de respuesta con datos inválidos
      const mockResponse: SupabaseResponse<any[]> = {
        data: [invalidMemoryBlock],
        error: null
      };
      
      // Configurar el mock de Supabase
      vi.spyOn(supabase, 'from').mockReturnValue({
        select: () => createMockSupabaseBuilder(mockResponse)
      } as any);

      const result = await getContextualMemory('visit-123');
      expect(result).toHaveLength(0);
    });
  });

  describe('getPersistentMemory', () => {
    it('debería devolver datos válidos cuando Supabase responde correctamente', async () => {
      // Crear un mock de respuesta de Supabase
      const mockResponse: SupabaseResponse<MCPMemoryBlock[]> = {
        data: [validMemoryBlock],
        error: null
      };
      
      // Configurar el mock de Supabase
      vi.spyOn(supabase, 'from').mockReturnValue({
        select: () => createMockSupabaseBuilder(mockResponse)
      } as any);

      const result = await getPersistentMemory('patient-456');
      expect(result).toHaveLength(1);
      expect(result[0].patient_id).toBe('patient-456');
    });

    it('debería manejar errores de red y validación', async () => {
      // Crear un mock que rechaza la promesa para simular un error de red
      vi.spyOn(supabase, 'from').mockReturnValue({
        select: () => ({
          eq: () => ({
            order: () => Promise.reject(new Error('Error de red'))
          })
        })
      } as any);

      const result = await getPersistentMemory('patient-456');
      expect(result).toHaveLength(0);
    });
  });

  describe('getSemanticMemory', () => {
    it('debería devolver datos válidos cuando Supabase responde correctamente', async () => {
      // Crear un mock de respuesta de Supabase
      const mockResponse: SupabaseResponse<MCPMemoryBlock[]> = {
        data: [validMemoryBlock],
        error: null
      };
      
      // Configurar el mock de Supabase
      vi.spyOn(supabase, 'from').mockReturnValue({
        select: () => createMockSupabaseBuilder(mockResponse)
      } as any);

      const result = await getSemanticMemory();
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('contextual');
    });

    it('debería manejar errores de red y validación', async () => {
      // Crear un mock de respuesta de Supabase con error
      const mockResponse: SupabaseResponse<MCPMemoryBlock[]> = {
        data: null,
        error: { message: 'Error de base de datos' }
      };
      
      // Configurar el mock de Supabase
      vi.spyOn(supabase, 'from').mockReturnValue({
        select: () => createMockSupabaseBuilder(mockResponse)
      } as any);

      const result = await getSemanticMemory();
      expect(result).toHaveLength(0);
    });
  });
}); 