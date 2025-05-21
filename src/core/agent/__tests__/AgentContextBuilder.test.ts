import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildAgentContext } from '../AgentContextBuilder';
import { AgentContext, MemoryBlock } from '../../../types/agent';
import supabase from '../../../core/auth/supabaseClient';

// Mock de supabase
vi.mock('../../../core/auth/supabaseClient', () => ({
  default: {
    from: vi.fn()
  }
}));

// Aplicamos un tipo más genérico para evitar problemas de linter
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PostgrestMock = any;

describe('AgentContextBuilder', () => {
  // Datos de prueba
  const mockDate = new Date('2023-06-15T10:00:00Z');
  const visitId = 'test-visit-123';
  
  const mockMemoryBlocks: MemoryBlock[] = [
    {
      id: 'block-1',
      type: 'contextual',
      content: 'Paciente presenta dolor abdominal intenso',
      created_at: '2023-05-15T10:30:00Z'
    },
    {
      id: 'block-2',
      type: 'persistent',
      content: 'Historial de hipertensión arterial',
      created_at: '2023-05-10T08:15:00Z'
    },
    {
      id: 'block-3',
      type: 'semantic',
      content: 'Dolor abdominal puede indicar apendicitis',
      created_at: '2023-05-15T10:35:00Z'
    }
  ];

  // Mock para fechas y configuración inicial
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(mockDate);
    
    // Configurar el mock básico de Supabase
    // Esta es una simplificación necesaria para los tests
    // En un entorno real, usaríamos un mock más detallado
    const mockSupabaseQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: mockMemoryBlocks,
        error: null
      })
    };
    
    // Usamos un tipo genérico para evitar errores de linter con la API de Supabase
    vi.mocked(supabase.from).mockReturnValue(mockSupabaseQuery as PostgrestMock);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debe construir un contexto válido con bloques de memoria', async () => {
    const result = await buildAgentContext(visitId);
    
    // Verificar que el contexto se construyó correctamente
    expect(result).toEqual({
      visitId,
      blocks: mockMemoryBlocks,
      metadata: {
        createdAt: mockDate,
        updatedAt: mockDate
      }
    });
    
    // Verificar que se llamó correctamente a supabase
    expect(supabase.from).toHaveBeenCalledWith('memory_blocks');
  });

  it('debe manejar errores de la base de datos correctamente', async () => {
    // Configurar el mock para simular un error
    const mockError = new Error('Error de base de datos');
    
    const mockErrorQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: null,
        error: mockError
      })
    };
    
    vi.mocked(supabase.from).mockReturnValueOnce(mockErrorQuery as PostgrestMock);
    
    // Verificar que el error se propaga correctamente
    await expect(buildAgentContext(visitId)).rejects.toThrow(mockError);
  });

  it('debe manejar el caso cuando no hay bloques de memoria', async () => {
    // Configurar el mock para devolver un array vacío
    const mockEmptyQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [],
        error: null
      })
    };
    
    vi.mocked(supabase.from).mockReturnValueOnce(mockEmptyQuery as PostgrestMock);
    
    const result = await buildAgentContext(visitId);
    
    // Verificar que se devuelve un contexto válido con un array vacío de bloques
    expect(result).toEqual({
      visitId,
      blocks: [],
      metadata: {
        createdAt: mockDate,
        updatedAt: mockDate
      }
    });
  });

  it('debe rechazar con un error si falla la consulta', async () => {
    // Simular un error en la consulta
    const dbError = new Error('Error de conexión');
    
    vi.mocked(supabase.from).mockImplementationOnce(() => {
      throw dbError;
    });
    
    // Verificar que el error se propaga
    await expect(buildAgentContext(visitId)).rejects.toThrow(dbError);
  });

  it('debe cumplir con el tipo AgentContext', async () => {
    const result = await buildAgentContext(visitId);
    
    // Verificamos que el resultado cumple con la estructura de AgentContext
    const validateAgentContext = (context: AgentContext): boolean => {
      return (
        typeof context.visitId === 'string' &&
        Array.isArray(context.blocks) &&
        context.metadata &&
        context.metadata.createdAt instanceof Date &&
        context.metadata.updatedAt instanceof Date
      );
    };
    
    expect(validateAgentContext(result)).toBe(true);
    
    // Verificar también cada bloque
    result.blocks.forEach(block => {
      expect(block).toHaveProperty('id');
      expect(block).toHaveProperty('type');
      expect(block).toHaveProperty('content');
      expect(block).toHaveProperty('created_at');
    });
  });
}); 