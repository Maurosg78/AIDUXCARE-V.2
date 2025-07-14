import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AgentExecutor } from '../../../src/core/agent/AgentExecutor';
import { ClinicalAgent } from '../../../src/core/agent/ClinicalAgent';
import type { AgentContext } from '../../../src/types/agent';
import { sendToLLM, LLMProvider, LLMResponse } from '../../../src/core/agent/LLMAdapter';

// Mock para sendToLLM
vi.mock('../../../src/core/agent/LLMAdapter', () => ({
  sendToLLM: vi.fn().mockImplementation(() => {
    return Promise.resolve({
      suggestions: [
        {
          id: 'sug-1',
          type: 'recommendation',
          field: 'diagnosis',
          content: 'Considerar realizar radiografía de columna lumbar para evaluar posibles alteraciones estructurales.',
          sourceBlockId: 'ctx-1',
          explanation: 'El dolor lumbar persistente y la falta de respuesta a analgésicos sugieren la necesidad de estudios imagenológicos.',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'sug-2',
          type: 'warning',
          field: 'treatment',
          content: 'Evaluar la necesidad de ajustar la dosis de enalapril considerando la hipertensión controlada.',
          sourceBlockId: 'per-1',
          explanation: 'El historial de hipertensión y el tratamiento actual sugieren la necesidad de revisar la medicación.',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]
    });
  })
}));

// Definir mockContext antes de usarlo
  const mockContext: AgentContext = {
    visitId: 'visit-123',
  metadata: {
    createdAt: new Date(),
    updatedAt: new Date(),
    professionalId: 'professional-789',
    visitDate: new Date().toISOString()
  },
    blocks: [
      {
        id: 'ctx-1',
        type: 'contextual',
      content: 'Paciente presenta dolor en la región lumbar desde hace 3 días. No responde bien a analgésicos.',
      created_at: new Date().toISOString()
      },
      {
        id: 'ctx-2',
        type: 'contextual',
      content: 'Signos vitales: TA 130/85, FC 78, FR 16, T 36.5°C',
      created_at: new Date().toISOString()
      },
      {
        id: 'per-1',
        type: 'persistent',
      content: 'Historial de hipertensión controlada. Tratamiento habitual con enalapril 10mg/día.',
      created_at: new Date().toISOString()
      },
      {
        id: 'sem-1',
        type: 'semantic',
      content: 'El dolor lumbar puede ser causado por distensión muscular, problemas posturales, hernia de disco o condiciones inflamatorias.',
      created_at: new Date().toISOString()
      }
    ]
  };

// Mock para ClinicalAgent
const mockAgent = {
  getContext: vi.fn().mockResolvedValue(mockContext),
  getSuggestions: vi.fn().mockReturnValue([]),
  addSuggestion: vi.fn().mockResolvedValue(undefined),
  getMemoryBlocks: vi.fn().mockReturnValue(mockContext.blocks),
  getSuggestionTypes: vi.fn().mockReturnValue(['recommendation', 'warning', 'info'])
} as unknown as ClinicalAgent;

describe('AgentExecutor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debería devolver un array con al menos 2 sugerencias válidas', async () => {
    const executor = new AgentExecutor(mockAgent, mockContext, 'openai');
    const suggestions = await executor.execute();
    
    expect(Array.isArray(suggestions)).toBe(true);
    expect(suggestions.length).toBeGreaterThanOrEqual(2);
    
    // Verificar que cada sugerencia tiene la estructura correcta
    suggestions.forEach(suggestion => {
      expect(suggestion).toHaveProperty('id');
      expect(suggestion).toHaveProperty('sourceBlockId');
      expect(suggestion).toHaveProperty('type');
      expect(suggestion).toHaveProperty('content');
      
      // Verificar que el tipo es válido
      expect(['recommendation', 'warning', 'info']).toContain(suggestion.type);
      
      // Verificar que el contenido no está vacío
      expect(suggestion.content.length).toBeGreaterThan(0);
    });
  });

  it('debería generar un prompt que contenga fragmentos del contexto original', async () => {
    const executor = new AgentExecutor(mockAgent, mockContext, 'openai');
    await executor.execute();
    
    // Verificar que se llamó a sendToLLM con el contexto correcto
    expect(sendToLLM).toHaveBeenCalledWith(mockContext, 'openai');
  });

  it('debería incluir sourceBlockId válido en las sugerencias', async () => {
    const executor = new AgentExecutor(mockAgent, mockContext, 'openai');
    const suggestions = await executor.execute();
    
    // Obtener la lista de IDs de bloques válidos del contexto
    const validBlockIds = mockContext.blocks.map(block => block.id);
    
    // Verificar que cada sugerencia tiene un sourceBlockId válido
    suggestions.forEach(suggestion => {
      expect(validBlockIds).toContain(suggestion.sourceBlockId);
    });
  });

  it('no debería lanzar errores si el contexto está parcialmente vacío', async () => {
    // Crear un contexto con datos mínimos
    const minimalContext: AgentContext = {
      visitId: 'visit-123',
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date()
      },
      blocks: []
    };
    
    // No debería lanzar errores
    const executor = new AgentExecutor(mockAgent, minimalContext, 'anthropic');
    const suggestions = await executor.execute();
    
    // Verificar que se obtienen sugerencias
    expect(Array.isArray(suggestions)).toBe(true);
    expect(suggestions.length).toBeGreaterThanOrEqual(2);
  });

  it('debería utilizar diferentes LLMProviders según se especifique', async () => {
    // Probar con diferentes proveedores
    const providers: LLMProvider[] = ['openai', 'anthropic'];
    
    for (const provider of providers) {
      // Limpiar mocks para nuevo test
      vi.mocked(sendToLLM).mockClear();
      
      const executor = new AgentExecutor(mockAgent, mockContext, provider);
      await executor.execute();
      
      // Verificar que se llamó a sendToLLM con el proveedor correcto
      expect(sendToLLM).toHaveBeenCalledWith(mockContext, provider);
    }
  });

  it('debe ejecutar el agente y generar sugerencias', async () => {
    // Mock de la respuesta del LLM
    const mockLLMResponse: LLMResponse = {
      suggestions: [
        {
          id: 'sug-1',
          type: 'recommendation',
          field: 'diagnosis',
          content: 'Considerar realizar radiografía de columna lumbar para evaluar posibles alteraciones estructurales.',
          sourceBlockId: 'ctx-1',
          explanation: 'El dolor lumbar persistente y la falta de respuesta a analgésicos sugieren la necesidad de estudios imagenológicos.',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]
    };

    // Configurar el mock de sendToLLM
    (sendToLLM as any).mockResolvedValue(mockLLMResponse);

    // Crear instancia de AgentExecutor
    const executor = new AgentExecutor(mockAgent, mockContext, 'openai');

    // Ejecutar el agente
    const suggestions = await executor.execute();

    // Verificar resultados
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].type).toBe('recommendation');
    expect(suggestions[0].content).toContain('radiografía');
    expect(mockAgent.addSuggestion).toHaveBeenCalledTimes(1);
  });

  it('debe manejar errores durante la ejecución', async () => {
    // Mock de error en sendToLLM
    (sendToLLM as any).mockRejectedValue(new Error('Error de LLM'));

    // Crear instancia de AgentExecutor
    const executor = new AgentExecutor(mockAgent, mockContext, 'openai');

    // Ejecutar el agente y verificar que retorna array vacío en caso de error
    const suggestions = await executor.execute();
    expect(suggestions).toEqual([]);
  });

  it('debe manejar contexto inválido', async () => {
    // Crear contexto inválido con un array vacío en lugar de null
    const invalidContext: AgentContext = {
      ...mockContext,
      blocks: []
    };

    // Crear instancia de AgentExecutor con contexto inválido
    const executor = new AgentExecutor(mockAgent, invalidContext, 'openai');

    // Ejecutar el agente y verificar que retorna array vacío
    const suggestions = await executor.execute();
    expect(suggestions).toEqual([]);
  });
}); 