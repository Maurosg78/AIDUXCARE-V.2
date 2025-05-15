import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MCPManager } from '@/core/mcp/MCPManager';
import * as SupabaseDataSource from '@/core/mcp/MCPDataSourceSupabase';
import { MCPMemoryBlock } from '@/core/mcp/schema';

// Mock de las funciones de acceso a Supabase
vi.mock('@/core/mcp/MCPDataSourceSupabase', () => ({
  getContextualMemory: vi.fn(),
  getPersistentMemory: vi.fn(),
  getSemanticMemory: vi.fn()
}));

describe('MCPManager con Supabase', () => {
  const manager = new MCPManager();
  const mockVisitId = 'visit-test-123';
  const mockPatientId = 'patient-test-456';
  const mockTimestamp = new Date().toISOString();

  // Datos de prueba con tipos correctos y todos los campos requeridos
  const mockContextualData: MCPMemoryBlock[] = [
    {
      id: 'ctx-1',
      created_at: mockTimestamp,
      type: 'contextual' as const,
      content: 'Datos contextuales de prueba',
      visit_id: mockVisitId,
      metadata: { source: 'test' }
    }
  ];

  const mockPersistentData: MCPMemoryBlock[] = [
    {
      id: 'per-1',
      created_at: mockTimestamp,
      type: 'persistent' as const,
      content: 'Datos persistentes de prueba',
      patient_id: mockPatientId,
      tags: ['tag1', 'tag2']
    }
  ];

  const mockSemanticData: MCPMemoryBlock[] = [
    {
      id: 'sem-1',
      created_at: mockTimestamp,
      type: 'semantic' as const,
      content: 'Datos semánticos de prueba',
      metadata: { category: 'knowledge' }
    }
  ];

  // Estructura esperada después del procesamiento en el manager
  // Esta estructura debe coincidir con la que realmente genera el MCPManager
  const processingExpectation = (items: MCPMemoryBlock[]) => items.map(item => ({
    id: item.id,
    created_at: item.created_at,
    type: item.type,
    content: item.content,
    timestamp: item.created_at,
  }));

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Configurar mocks para devolver datos de prueba
    vi.mocked(SupabaseDataSource.getContextualMemory).mockResolvedValue(mockContextualData);
    vi.mocked(SupabaseDataSource.getPersistentMemory).mockResolvedValue(mockPersistentData);
    vi.mocked(SupabaseDataSource.getSemanticMemory).mockResolvedValue(mockSemanticData);
  });

  it('debería llamar a las 3 funciones de acceso a Supabase', async () => {
    await manager.buildContext(mockVisitId, mockPatientId);

    expect(SupabaseDataSource.getContextualMemory).toHaveBeenCalledWith(mockVisitId);
    expect(SupabaseDataSource.getPersistentMemory).toHaveBeenCalledWith(mockPatientId);
    expect(SupabaseDataSource.getSemanticMemory).toHaveBeenCalled();
  });

  it('debería construir un contexto válido con datos de Supabase adaptados', async () => {
    const result = await manager.buildContext(mockVisitId, mockPatientId);

    // Verificar la estructura del contexto resultante
    expect(result).toEqual({
      contextual: { source: 'supabase', data: processingExpectation(mockContextualData) },
      persistent: { source: 'supabase', data: processingExpectation(mockPersistentData) },
      semantic: { source: 'supabase', data: processingExpectation(mockSemanticData) }
    });

    // Comprobar que el procesamiento mantiene los timestamps
    expect(result.contextual.data[0].timestamp).toBe(mockTimestamp);
    expect(result.persistent.data[0].timestamp).toBe(mockTimestamp);
    expect(result.semantic.data[0].timestamp).toBe(mockTimestamp);
  });

  it('debería manejar errores y devolver contexto con arrays vacíos', async () => {
    // Simular un error en una de las llamadas
    vi.mocked(SupabaseDataSource.getContextualMemory).mockRejectedValue(new Error('Error de prueba'));

    const result = await manager.buildContext(mockVisitId, mockPatientId);

    // Verificar que se devuelve un contexto con arrays vacíos
    expect(result).toEqual({
      contextual: { source: 'supabase', data: [] },
      persistent: { source: 'supabase', data: [] },
      semantic: { source: 'supabase', data: [] }
    });
  });

  it('debería manejar valores undefined desde las funciones de Supabase', async () => {
    // Simular una respuesta undefined
    vi.mocked(SupabaseDataSource.getPersistentMemory).mockResolvedValue(undefined as unknown as MCPMemoryBlock[]);

    const result = await manager.buildContext(mockVisitId, mockPatientId);

    // Verificar que el valor undefined se convierte en array vacío
    expect(result.persistent.data).toEqual([]);
    
    // Verificar que los otros datos siguen procesándose correctamente
    expect(result.contextual.data).toEqual(processingExpectation(mockContextualData));
    expect(result.semantic.data).toEqual(processingExpectation(mockSemanticData));
  });
}); 