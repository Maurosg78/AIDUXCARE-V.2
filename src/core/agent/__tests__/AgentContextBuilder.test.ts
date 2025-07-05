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
    const mockSupabaseQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: mockMemoryBlocks,
        error: null
      })
    };
    
    vi.mocked(supabase.from).mockReturnValue(mockSupabaseQuery as PostgrestMock);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debe construir un contexto válido con bloques de memoria', async () => {
    const result = await buildAgentContext(visitId);
    
    expect(result).toEqual({
      visitId,
      blocks: mockMemoryBlocks,
      metadata: {
        createdAt: mockDate,
        updatedAt: mockDate
      }
    });
    
    expect(supabase.from).toHaveBeenCalledWith('memory_blocks');
  });

  it('debe manejar errores de la base de datos correctamente', async () => {
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
    
    await expect(buildAgentContext(visitId)).rejects.toThrow(mockError);
  });

  it('debe manejar el caso cuando no hay bloques de memoria', async () => {
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
    const dbError = new Error('Error de conexión');
    
    vi.mocked(supabase.from).mockImplementationOnce(() => {
      throw dbError;
    });
    
    await expect(buildAgentContext(visitId)).rejects.toThrow(dbError);
  });

  it('debe cumplir con el tipo AgentContext', async () => {
    const result = await buildAgentContext(visitId);
    
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
    
    result.blocks.forEach(block => {
      expect(block).toHaveProperty('id');
      expect(block).toHaveProperty('type');
      expect(block).toHaveProperty('content');
      expect(block).toHaveProperty('created_at');
    });
  });

  // Nuevos tests para validar casos especiales
  it('debe filtrar bloques de memoria con datos incompletos', async () => {
    const invalidBlocks = [
      { id: 'block-1', type: 'contextual' }, // Falta content y created_at
      { id: 'block-2', content: 'Contenido sin tipo' }, // Falta type y created_at
      { id: 'block-3', type: 'semantic', created_at: '2023-05-15T10:35:00Z' }, // Falta content
      ...mockMemoryBlocks // Bloques válidos
    ];

    const mockQueryWithInvalidBlocks = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: invalidBlocks,
        error: null
      })
    };

    vi.mocked(supabase.from).mockReturnValueOnce(mockQueryWithInvalidBlocks as PostgrestMock);

    const result = await buildAgentContext(visitId);
    
    // Verificar que solo se incluyeron los bloques válidos
    expect(result.blocks).toEqual(mockMemoryBlocks);
    expect(result.blocks.length).toBe(mockMemoryBlocks.length);
  });

  it('debe manejar correctamente diferentes formatos de fecha en created_at', async () => {
    const blocksWithDifferentDateFormats = [
      {
        id: 'block-1',
        type: 'contextual',
        content: 'Contenido con fecha ISO',
        created_at: '2023-05-15T10:30:00Z'
      },
      {
        id: 'block-2',
        type: 'persistent',
        content: 'Contenido con fecha Unix',
        created_at: '1684155000000'
      },
      {
        id: 'block-3',
        type: 'semantic',
        content: 'Contenido con fecha local',
        created_at: '2023-05-15 10:30:00'
      }
    ];

    const mockQueryWithDifferentDates = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: blocksWithDifferentDateFormats,
        error: null
      })
    };

    vi.mocked(supabase.from).mockReturnValueOnce(mockQueryWithDifferentDates as PostgrestMock);

    const result = await buildAgentContext(visitId);
    
    // Verificar que todos los bloques tienen una fecha válida
    result.blocks.forEach(block => {
      expect(new Date(block.created_at).toString()).not.toBe('Invalid Date');
    });
  });

  it('debe manejar correctamente bloques con contenido vacío', async () => {
    const blocksWithEmptyContent = [
      {
        id: 'block-1',
        type: 'contextual',
        content: '',
        created_at: '2023-05-15T10:30:00Z'
      },
      {
        id: 'block-2',
        type: 'persistent',
        content: '   ', // Solo espacios en blanco
        created_at: '2023-05-10T08:15:00Z'
      },
      ...mockMemoryBlocks // Bloques válidos
    ];

    const mockQueryWithEmptyContent = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: blocksWithEmptyContent,
        error: null
      })
    };

    vi.mocked(supabase.from).mockReturnValueOnce(mockQueryWithEmptyContent as PostgrestMock);

    const result = await buildAgentContext(visitId);
    
    // Verificar que solo se incluyeron los bloques con contenido no vacío
    expect(result.blocks).toEqual(mockMemoryBlocks);
    expect(result.blocks.length).toBe(mockMemoryBlocks.length);
  });

  it('debe validar que los metadatos de fecha sean consistentes', async () => {
    const result = await buildAgentContext(visitId);
    
    // Verificar que las fechas de metadata son instancias de Date
    expect(result.metadata.createdAt).toBeInstanceOf(Date);
    expect(result.metadata.updatedAt).toBeInstanceOf(Date);
    
    // Verificar que las fechas son consistentes con el mockDate
    expect(result.metadata.createdAt.getTime()).toBe(mockDate.getTime());
    expect(result.metadata.updatedAt.getTime()).toBe(mockDate.getTime());
    
    // Verificar que updatedAt no es anterior a createdAt
    expect(result.metadata.updatedAt.getTime()).toBeGreaterThanOrEqual(
      result.metadata.createdAt.getTime()
    );
  });
}); 