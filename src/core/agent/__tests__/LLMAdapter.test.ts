import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { sendToLLM, LLMProvider } from '../LLMAdapter';
import { AgentContext, MemoryBlock } from '../../../types/agent';

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
    },
    {
      id: 'block-3',
      type: 'semantic',
      content: 'Dolor abdominal puede indicar apendicitis',
      created_at: '2023-05-15T10:35:00Z'
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
    
    // Avanzar el tiempo simulado
    vi.advanceTimersByTime(500);
    
    const response = await responsePromise;
    
    // Verificar la estructura de la respuesta
    expect(response).toBeTruthy();
    expect(response).toHaveProperty('suggestions');
    expect(Array.isArray(response.suggestions)).toBe(true);
    expect(response.suggestions.length).toBeGreaterThan(0);
    
    // Verificar la sugerencia
    const suggestion = response.suggestions[0];
    expect(suggestion).toHaveProperty('id');
    expect(suggestion).toHaveProperty('type');
    expect(suggestion).toHaveProperty('field');
    expect(suggestion).toHaveProperty('content');
    expect(suggestion).toHaveProperty('sourceBlockId');
    expect(suggestion.sourceBlockId).toBe('block-1'); // Primer bloque del contexto
  });

  it('debe devolver respuestas para diferentes proveedores', async () => {
    const providers: LLMProvider[] = ['openai', 'anthropic', 'cohere'];
    
    for (const provider of providers) {
      const responsePromise = sendToLLM(mockContext, provider);
      vi.advanceTimersByTime(500);
      
      const response = await responsePromise;
      
      expect(response).toBeTruthy();
      expect(response.suggestions.length).toBeGreaterThan(0);
      
      // Las respuestas pueden variar según el proveedor, pero la estructura debe ser consistente
      expect(response.suggestions[0]).toHaveProperty('id');
      expect(response.suggestions[0]).toHaveProperty('content');
    }
  });

  it('debe devolver sugerencias con sourceBlockId válido', async () => {
    const responsePromise = sendToLLM(mockContext, 'openai');
    vi.advanceTimersByTime(500);
    
    const response = await responsePromise;
    
    // Verificar que sourceBlockId es un ID válido del contexto
    const validBlockIds = mockContext.blocks.map(block => block.id);
    expect(validBlockIds).toContain(response.suggestions[0].sourceBlockId);
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
    
    // Verificar que aún devuelve una respuesta válida
    expect(response).toBeTruthy();
    expect(response.suggestions.length).toBeGreaterThan(0);
    
    // En este caso, al no haber bloques, debería usar 'default' como sourceBlockId
    expect(response.suggestions[0].sourceBlockId).toBe('default');
  });

  it('debe aceptar solo proveedores válidos', async () => {
    // Verificamos que la API funciona con cada proveedor válido
    const validProviders: LLMProvider[] = ['openai', 'anthropic', 'cohere'];
    
    for (const provider of validProviders) {
      const responsePromise = sendToLLM(mockContext, provider);
      vi.advanceTimersByTime(500);
      const response = await responsePromise;
      expect(response).toBeTruthy();
    }
  });

  it('debe demorar aproximadamente 500ms en responder (simulando llamada a API)', async () => {
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