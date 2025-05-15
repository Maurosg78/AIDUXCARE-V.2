import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { executeAgent, AgentExecutionParams } from '../../../src/core/agent/AgentExecutor';
import { AgentContext } from '../../../src/core/agent/AgentContextBuilder';
import * as LLMAdapter from '../../../src/core/agent/LLMAdapter';

// Mock para sendToLLM
vi.mock('../../../src/core/agent/LLMAdapter', () => ({
  sendToLLM: vi.fn().mockImplementation((prompt, provider) => {
    return Promise.resolve(`Respuesta simulada de ${provider} para el prompt recibido. Analizando la información médica proporcionada y generando recomendaciones basadas en la evidencia.`);
  })
}));

describe('AgentExecutor', () => {
  // Contexto de prueba con datos ficticios
  const mockContext: AgentContext = {
    visitId: 'visit-123',
    patientId: 'patient-456',
    blocks: [
      {
        id: 'ctx-1',
        type: 'contextual',
        content: 'Paciente presenta dolor en la región lumbar desde hace 3 días. No responde bien a analgésicos.'
      },
      {
        id: 'ctx-2',
        type: 'contextual',
        content: 'Signos vitales: TA 130/85, FC 78, FR 16, T 36.5°C'
      },
      {
        id: 'per-1',
        type: 'persistent',
        content: 'Historial de hipertensión controlada. Tratamiento habitual con enalapril 10mg/día.'
      },
      {
        id: 'sem-1',
        type: 'semantic',
        content: 'El dolor lumbar puede ser causado por distensión muscular, problemas posturales, hernia de disco o condiciones inflamatorias.'
      }
    ]
  };

  const mockParams: AgentExecutionParams = {
    context: mockContext,
    provider: 'openai'
  };

  // Acelerar los tests reemplazando setTimeout
  beforeAll(() => {
    vi.useFakeTimers();
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('debería devolver un array con al menos 2 sugerencias válidas', async () => {
    const responsePromise = executeAgent(mockParams);
    
    // Avanzar el tiempo simulado para resolver el setTimeout en sendToLLM
    vi.advanceTimersByTime(500);
    
    const suggestions = await responsePromise;
    
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
    await executeAgent(mockParams);
    
    // Avanzar el tiempo simulado
    vi.advanceTimersByTime(500);
    
    // Verificar que se llamó a sendToLLM con un prompt que contiene partes del contexto
    const promptArg = vi.mocked(LLMAdapter.sendToLLM).mock.calls[0][0];
    
    expect(typeof promptArg).toBe('string');
    expect(promptArg).toContain('visit-123'); // visitId
    expect(promptArg).toContain('patient-456'); // patientId
    expect(promptArg).toContain('dolor en la región lumbar'); // contenido de bloque contextual
    expect(promptArg).toContain('Historial de hipertensión'); // contenido de bloque persistente
    expect(promptArg).toContain('hernia de disco'); // contenido de bloque semántico
  });

  it('debería incluir sourceBlockId válido en las sugerencias', async () => {
    const responsePromise = executeAgent(mockParams);
    
    // Avanzar el tiempo simulado
    vi.advanceTimersByTime(500);
    
    const suggestions = await responsePromise;
    
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
      visitId: '',
      patientId: '',
      blocks: []
    };
    
    const minimalParams: AgentExecutionParams = {
      context: minimalContext,
      provider: 'anthropic'
    };
    
    // No debería lanzar errores
    const responsePromise = executeAgent(minimalParams);
    
    // Avanzar el tiempo simulado
    vi.advanceTimersByTime(500);
    
    const suggestions = await responsePromise;
    
    // Verificar que se obtienen sugerencias
    expect(Array.isArray(suggestions)).toBe(true);
    expect(suggestions.length).toBeGreaterThanOrEqual(2);
  });

  it('debería utilizar diferentes LLMProviders según se especifique', async () => {
    // Probar con diferentes proveedores
    const providers: LLMAdapter.LLMProvider[] = ['openai', 'anthropic', 'mistral', 'custom'];
    
    for (const provider of providers) {
      const params: AgentExecutionParams = {
        context: mockContext,
        provider
      };
      
      // Limpiar mocks para nuevo test
      vi.mocked(LLMAdapter.sendToLLM).mockClear();
      
      const responsePromise = executeAgent(params);
      
      // Avanzar el tiempo simulado
      vi.advanceTimersByTime(500);
      
      await responsePromise;
      
      // Verificar que se llamó a sendToLLM con el proveedor correcto
      expect(LLMAdapter.sendToLLM).toHaveBeenCalledWith(expect.any(String), provider);
    }
  });
}); 