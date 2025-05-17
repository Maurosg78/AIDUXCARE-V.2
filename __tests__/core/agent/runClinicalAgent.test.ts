import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { MCPContext } from '../../../src/core/mcp/schema';
import { runClinicalAgent } from '../../../src/core/agent/runClinicalAgent';
import * as AgentContextBuilder from '../../../src/core/agent/AgentContextBuilder';
import * as AgentExecutor from '../../../src/core/agent/AgentExecutor';

// Mock de AgentExecutor.executeAgent
vi.mock('../../../src/core/agent/AgentExecutor', () => ({
  executeAgent: vi.fn().mockImplementation(() => {
    return Promise.resolve([
      {
        id: 'sugg-1',
        sourceBlockId: 'ctx-1',
        type: 'recommendation',
        content: 'Recomendación de prueba 1'
      },
      {
        id: 'sugg-2',
        sourceBlockId: 'ctx-2',
        type: 'warning',
        content: 'Advertencia de prueba 2'
      },
      {
        id: 'sugg-3',
        sourceBlockId: 'sem-1',
        type: 'info',
        content: 'Información de prueba 3'
      }
    ]);
  })
}));

// Mock de AgentContextBuilder.buildAgentContext
vi.mock('../../../src/core/agent/AgentContextBuilder', () => ({
  buildAgentContext: vi.fn().mockImplementation((mcpContext) => {
    // Verificar si el contexto está vacío y devolver un contexto mínimo en ese caso
    if (!mcpContext || !mcpContext.contextual.data.length) {
      return {
        visitId: '',
        patientId: '',
        blocks: []
      };
    }
    
    // Simulamos la construcción de un contexto de agente a partir del MCP
    return {
      visitId: 'visit-123',
      patientId: 'patient-456',
      blocks: [
        {
          id: 'ctx-1',
          type: 'contextual',
          content: 'Datos de prueba contextual'
        },
        {
          id: 'ctx-2',
          type: 'contextual',
          content: 'Más datos de prueba contextual'
        },
        {
          id: 'sem-1',
          type: 'semantic',
          content: 'Datos de prueba semánticos'
        }
      ]
    };
  })
}));

describe('runClinicalAgent', () => {
  // Acelerar los tests reemplazando setTimeout
  beforeAll(() => {
    vi.useFakeTimers();
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  // Datos de prueba: contexto MCP ficticio válido
  const validMcpContext: MCPContext = {
    contextual: {
      source: 'test',
      data: [
        {
          id: 'ctx-1',
          timestamp: '2023-01-01T12:00:00Z',
          type: 'contextual',
          content: 'Prueba contextual'
        }
      ]
    },
    persistent: {
      source: 'test',
      data: [
        {
          id: 'per-1',
          timestamp: '2023-01-01T12:00:00Z',
          type: 'persistent',
          content: 'Prueba persistente'
        }
      ]
    },
    semantic: {
      source: 'test',
      data: [
        {
          id: 'sem-1',
          timestamp: '2023-01-01T12:00:00Z',
          type: 'semantic',
          content: 'Prueba semántica'
        }
      ]
    }
  };

  // Datos de prueba: contexto MCP vacío
  const emptyMcpContext: MCPContext = {
    contextual: { source: 'test', data: [] },
    persistent: { source: 'test', data: [] },
    semantic: { source: 'test', data: [] }
  };

  it('debería completar el flujo completo con un contexto válido', async () => {
    const result = await runClinicalAgent(validMcpContext);
    
    // Avanzar el tiempo simulado para resolver cualquier promesa pendiente
    vi.advanceTimersByTime(500);
    
    // Verificar que se llamaron correctamente las funciones
    expect(AgentContextBuilder.buildAgentContext).toHaveBeenCalledWith(validMcpContext);
    expect(AgentExecutor.executeAgent).toHaveBeenCalled();
    
    // Verificar el resultado
    expect(result).toHaveProperty('suggestions');
    expect(result).toHaveProperty('auditLogs');
    expect(Array.isArray(result.suggestions)).toBe(true);
    expect(Array.isArray(result.auditLogs)).toBe(true);
  });

  it('debería devolver al menos 2 sugerencias cuando todo está OK', async () => {
    const result = await runClinicalAgent(validMcpContext, 'anthropic');
    
    // Avanzar el tiempo simulado
    vi.advanceTimersByTime(500);
    
    // Verificar que hay al menos 2 sugerencias
    expect(result.suggestions.length).toBeGreaterThanOrEqual(2);
    
    // Verificar que cada sugerencia tiene la estructura correcta
    result.suggestions.forEach(suggestion => {
      expect(suggestion).toHaveProperty('id');
      expect(suggestion).toHaveProperty('sourceBlockId');
      expect(suggestion).toHaveProperty('type');
      expect(suggestion).toHaveProperty('content');
    });
  });

  it('debería manejar correctamente un contexto vacío sin lanzar errores', async () => {
    const result = await runClinicalAgent(emptyMcpContext);
    
    // Avanzar el tiempo simulado
    vi.advanceTimersByTime(500);
    
    // Verificar que se construyó el contexto
    expect(AgentContextBuilder.buildAgentContext).toHaveBeenCalledWith(emptyMcpContext);
    
    // Verificar que se devolvió un resultado válido
    expect(result).toHaveProperty('suggestions');
    expect(Array.isArray(result.suggestions)).toBe(true);
  });

  it('debería devolver un array vacío si el contexto es null o inválido', async () => {
    // @ts-expect-error: Pasar null intencionalmente para probar el manejo de errores
    const result = await runClinicalAgent(null);
    
    // Verificar que no se llamó a buildAgentContext
    expect(AgentContextBuilder.buildAgentContext).not.toHaveBeenCalled();
    
    // Verificar que se devolvió un array vacío de sugerencias
    expect(result.suggestions).toEqual([]);
    expect(result.auditLogs).toEqual([]);
  });

  it('debería manejar errores internos sin lanzar excepciones', async () => {
    // Simular un error en executeAgent
    vi.mocked(AgentExecutor.executeAgent).mockRejectedValueOnce(
      new Error('Error simulado en executeAgent')
    );
    
    // No debería lanzar excepción
    const result = await runClinicalAgent(validMcpContext);
    
    // Verificar que el resultado es el esperado en caso de error
    expect(result.suggestions).toEqual([]);
    expect(result.auditLogs).toEqual([]);
  });

  it('debería usar openai como proveedor por defecto', async () => {
    await runClinicalAgent(validMcpContext);
    
    // Avanzar el tiempo simulado
    vi.advanceTimersByTime(500);
    
    // Verificar que se llamó a executeAgent con el provider correcto
    expect(AgentExecutor.executeAgent).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'openai'
      })
    );
  });

  it('debería permitir especificar un proveedor diferente', async () => {
    await runClinicalAgent(validMcpContext, 'anthropic');
    
    // Avanzar el tiempo simulado
    vi.advanceTimersByTime(500);
    
    // Verificar que se llamó a executeAgent con el provider correcto
    expect(AgentExecutor.executeAgent).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'anthropic'
      })
    );
  });
}); 