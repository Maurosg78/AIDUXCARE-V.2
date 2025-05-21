import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AgentExecutor } from '../../../core/agent/AgentExecutor';
import { ClinicalAgent } from '../../../core/agent/ClinicalAgent';
import type { AgentContext, AgentSuggestion, MemoryBlock } from '../../../types/agent';
import { sendToLLM, LLMProvider, LLMResponse } from '../../../core/agent/LLMAdapter';

// Mocks
vi.mock('../../../core/agent/LLMAdapter', () => {
  return {
    sendToLLM: vi.fn()
  };
});

vi.mock('../../../core/agent/ClinicalAgent');

// Datos de prueba
const mockMemoryBlocks: MemoryBlock[] = [
  {
    id: 'block-1',
    type: 'contextual',
    content: 'Paciente presenta dolor abdominal',
    created_at: '2023-01-01T12:00:00Z'
  },
  {
    id: 'block-2',
    type: 'persistent',
    content: 'Historial de hipertensión',
    created_at: '2023-01-01T12:00:00Z'
  }
];

const mockContext: AgentContext = {
  visitId: 'visit-123',
  blocks: mockMemoryBlocks,
  metadata: {
    createdAt: new Date(),
    updatedAt: new Date(),
    patientId: 'patient-456'
  }
};

const mockSuggestions: AgentSuggestion[] = [
  {
    id: 'sugg-1',
    type: 'recommendation',
    field: 'diagnosis',
    content: 'Considerar evaluación de dolor abdominal',
    sourceBlockId: 'block-1',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'sugg-2',
    type: 'warning',
    field: 'vitals',
    content: 'Monitorizar presión arterial',
    sourceBlockId: 'block-2',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

describe('AgentExecutor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Configurar el mock de ClinicalAgent.create
    const mockAgent = {
      getContext: vi.fn().mockReturnValue(mockContext),
      getSuggestions: vi.fn().mockReturnValue([]),
      addSuggestion: vi.fn()
    };
    
    vi.mocked(ClinicalAgent.create).mockResolvedValue(mockAgent as unknown as ClinicalAgent);
    
    // Configurar el mock de sendToLLM
    vi.mocked(sendToLLM).mockResolvedValue({
      suggestions: mockSuggestions
    } as LLMResponse);
  });

  it('debe crear correctamente una instancia de AgentExecutor', async () => {
    const executor = await AgentExecutor.create('visit-123', 'openai');
    
    expect(ClinicalAgent.create).toHaveBeenCalledWith('visit-123');
    expect(executor).toBeInstanceOf(AgentExecutor);
  });

  it('debe ejecutar el agente y devolver sugerencias', async () => {
    const executor = await AgentExecutor.create('visit-123', 'openai');
    
    const result = await executor.execute();
    
    expect(sendToLLM).toHaveBeenCalledWith(mockContext, 'openai');
    
    // Comparar solo las propiedades que no son fechas
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'sugg-1',
          type: 'recommendation',
          field: 'diagnosis',
          content: 'Considerar evaluación de dolor abdominal',
          sourceBlockId: 'block-1'
        }),
        expect.objectContaining({
          id: 'sugg-2',
          type: 'warning',
          field: 'vitals',
          content: 'Monitorizar presión arterial',
          sourceBlockId: 'block-2'
        })
      ])
    );
  });

  it('debe devolver sugerencias con getSuggestions', async () => {
    // Modificar la configuración para este test específico
    const mockAgentWithSuggestions = {
      getContext: vi.fn().mockReturnValue(mockContext),
      getSuggestions: vi.fn().mockReturnValue(mockSuggestions),
      addSuggestion: vi.fn()
    };
    
    vi.mocked(ClinicalAgent.create).mockResolvedValueOnce(mockAgentWithSuggestions as unknown as ClinicalAgent);
    
    const executor = await AgentExecutor.create('visit-123', 'openai');
    const suggestions = executor.getSuggestions();
    
    expect(suggestions).toEqual(mockSuggestions);
  });

  it('debe manejar diferentes proveedores de LLM', async () => {
    const providers: LLMProvider[] = ['openai', 'anthropic', 'cohere'];
    
    for (const provider of providers) {
      vi.clearAllMocks();
      
      const executor = await AgentExecutor.create('visit-123', provider);
      await executor.execute();
      
      expect(sendToLLM).toHaveBeenCalledWith(mockContext, provider);
    }
  });

  it('debe manejar correctamente un contexto vacío', async () => {
    const emptyContext: AgentContext = {
      visitId: 'empty-visit',
      blocks: [],
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date()
      }
    };
    
    // Configurar el mock para devolver contexto vacío
    const mockAgentEmptyContext = {
      getContext: vi.fn().mockReturnValue(emptyContext),
      getSuggestions: vi.fn().mockReturnValue([]),
      addSuggestion: vi.fn()
    };
    
    vi.mocked(ClinicalAgent.create).mockResolvedValueOnce(mockAgentEmptyContext as unknown as ClinicalAgent);
    
    const executor = await AgentExecutor.create('empty-visit', 'openai');
    const result = await executor.execute();
    
    expect(sendToLLM).toHaveBeenCalledWith(emptyContext, 'openai');
    
    // Comparar solo las propiedades que no son fechas
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'sugg-1',
          type: 'recommendation',
          field: 'diagnosis',
          content: 'Considerar evaluación de dolor abdominal',
          sourceBlockId: 'block-1'
        }),
        expect.objectContaining({
          id: 'sugg-2',
          type: 'warning',
          field: 'vitals',
          content: 'Monitorizar presión arterial',
          sourceBlockId: 'block-2'
        })
      ])
    );
  });
}); 