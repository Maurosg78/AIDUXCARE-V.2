import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { sendToLLM, LLMProvider } from '../../../src/core/agent/LLMAdapter';

describe('LLMAdapter', () => {
  // Acelerar los tests reemplazando setTimeout
  beforeAll(() => {
    vi.useFakeTimers();
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('debería devolver una respuesta para el proveedor OpenAI', async () => {
    const promptTest = "Analiza los síntomas del paciente";
    const responsePromise = sendToLLM(promptTest, 'openai');
    
    // Avanzar el tiempo simulado para resolver el setTimeout
    vi.advanceTimersByTime(500);
    
    const response = await responsePromise;
    
    expect(response).toBeTruthy();
    expect(typeof response).toBe('string');
    expect(response.length).toBeGreaterThan(0);
    expect(response).toContain('OpenAI GPT response');
    expect(response).toContain(promptTest);
  });

  it('debería devolver una respuesta para el proveedor Anthropic', async () => {
    const promptTest = "Evalúa el historial clínico";
    const responsePromise = sendToLLM(promptTest, 'anthropic');
    
    vi.advanceTimersByTime(500);
    
    const response = await responsePromise;
    
    expect(response).toBeTruthy();
    expect(typeof response).toBe('string');
    expect(response.length).toBeGreaterThan(0);
    expect(response).toContain('Anthropic Claude response');
    expect(response).toContain(promptTest);
  });

  it('debería devolver una respuesta para el proveedor Mistral', async () => {
    const promptTest = "Recomienda un tratamiento";
    const responsePromise = sendToLLM(promptTest, 'mistral');
    
    vi.advanceTimersByTime(500);
    
    const response = await responsePromise;
    
    expect(response).toBeTruthy();
    expect(typeof response).toBe('string');
    expect(response.length).toBeGreaterThan(0);
    expect(response).toContain('Mistral AI response');
    expect(response).toContain(promptTest);
  });

  it('debería devolver una respuesta para el proveedor Custom', async () => {
    const promptTest = "Sugiere un diagnóstico diferencial";
    const responsePromise = sendToLLM(promptTest, 'custom');
    
    vi.advanceTimersByTime(500);
    
    const response = await responsePromise;
    
    expect(response).toBeTruthy();
    expect(typeof response).toBe('string');
    expect(response.length).toBeGreaterThan(0);
    expect(response).toContain('Custom LLM response');
    expect(response).toContain(promptTest);
  });

  it('debería rechazar la promesa con un error si el proveedor no es soportado', async () => {
    // Asignar un tipo inválido utilizando 'as' solo para propósitos de prueba
    const invalidProvider = 'invalid-provider' as LLMProvider;
    
    const responsePromise = sendToLLM("Prompt de prueba", invalidProvider);
    
    // No es necesario avanzar el tiempo ya que el rechazo es inmediato
    
    await expect(responsePromise).rejects.toThrow('Unsupported LLM provider');
  });

  it('debería demorar aproximadamente 500ms en devolver la respuesta', async () => {
    const promptTest = "Test de tiempo";
    const responsePromise = sendToLLM(promptTest, 'openai');
    
    // Avanzar 499ms (no debería resolver aún)
    vi.advanceTimersByTime(499);
    const notResolved = await Promise.race([
      responsePromise.then(() => true),
      Promise.resolve(false)
    ]);
    
    expect(notResolved).toBe(false); // La promesa no debería resolverse aún
    
    // Avanzar 1ms más para llegar a 500ms
    vi.advanceTimersByTime(1);
    
    const response = await responsePromise;
    expect(response).toBeTruthy();
    expect(response).toContain('OpenAI GPT response');
  });
}); 