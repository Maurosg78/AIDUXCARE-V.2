import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { sendToLLM, LLMProvider } from '../../../src/core/agent/LLMAdapter';
import { AgentContext, MemoryBlock } from '../../../src/types/agent';

describe('LLMAdapter', () => {
  // Configuración de mocks y datos de prueba
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
    }
  ];

  const mockContext: AgentContext = {
    visitId: 'visit-123',
    blocks: mockMemoryBlocks,
    metadata: {
      createdAt: new Date('2023-05-15T10:40:00Z'),
      updatedAt: new Date('2023-05-15T10:40:00Z'),
      patientId: 'patient-456'
    }
  };

  // Acelerar los tests reemplazando setTimeout
  beforeAll(() => {
    vi.useFakeTimers();
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('debe devolver una respuesta válida con sugerencias para OpenAI', async () => {
    const responsePromise = sendToLLM(mockContext, 'openai');
    vi.advanceTimersByTime(500);
    
    const response = await responsePromise;
    
    expect(response).toBeTruthy();
    expect(response).toHaveProperty('suggestions');
    expect(Array.isArray(response.suggestions)).toBe(true);
    expect(response.suggestions.length).toBeGreaterThan(0);
    
    const suggestion = response.suggestions[0];
    expect(suggestion).toHaveProperty('id');
    expect(suggestion).toHaveProperty('type');
    expect(suggestion).toHaveProperty('field');
    expect(suggestion).toHaveProperty('content');
    expect(suggestion).toHaveProperty('sourceBlockId');
    expect(suggestion.sourceBlockId).toBe('block-1');
  });

  it('debe devolver respuestas para diferentes proveedores', async () => {
    const providers: LLMProvider[] = ['openai', 'anthropic', 'cohere'];
    
    for (const provider of providers) {
      const responsePromise = sendToLLM(mockContext, provider);
      vi.advanceTimersByTime(500);
      
      const response = await responsePromise;
      
      expect(response).toBeTruthy();
      expect(response.suggestions.length).toBeGreaterThan(0);
      expect(response.suggestions[0]).toHaveProperty('id');
      expect(response.suggestions[0]).toHaveProperty('content');
    }
  });

  it('debe manejar un contexto vacío sin errores', async () => {
    const emptyContext: AgentContext = {
      visitId: 'empty-visit',
      blocks: [],
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date()
      }
    };
    
    const responsePromise = sendToLLM(emptyContext, 'openai');
    vi.advanceTimersByTime(500);
    
    const response = await responsePromise;
    
    expect(response).toBeTruthy();
    expect(response.suggestions.length).toBeGreaterThan(0);
    expect(response.suggestions[0].sourceBlockId).toBe('default');
  });

  it('debe rechazar la promesa con un error si el proveedor no es soportado', async () => {
    const invalidProvider = 'invalid-provider' as LLMProvider;
    
    await expect(sendToLLM(mockContext, invalidProvider))
      .rejects
      .toThrow('Unsupported LLM provider');
  });

  it('debe demorar aproximadamente 500ms en responder', async () => {
    const responsePromise = sendToLLM(mockContext, 'openai');
    
    // Avanzar 400ms (no debería resolverse aún)
    vi.advanceTimersByTime(400);
    
    // Verificar que no se ha resuelto
    const notResolved = await Promise.race([
      responsePromise.then(() => true).catch(() => true),
      Promise.resolve(false)
    ]);
    
    expect(notResolved).toBe(false);
    
    // Avanzar 100ms más para completar los 500ms
    vi.advanceTimersByTime(100);
    
    // Ahora debería resolverse
    const response = await responsePromise;
    expect(response).toBeTruthy();
    expect(response.suggestions.length).toBeGreaterThan(0);
  });
}); 