import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { MCPContext } from '../../../src/core/mcp/schema';
import { runClinicalAgent } from '../../../src/core/agent/runClinicalAgent';
import * as AgentContextBuilder from '../../../src/core/agent/AgentContextBuilder';
import * as AgentExecutor from '../../../src/core/agent/AgentExecutor';

// Mock de AgentExecutor
vi.mock('../../../src/core/agent/AgentExecutor', async () => {
  const actual = await vi.importActual('../../../src/core/agent/AgentExecutor') as Record<string, unknown>;
  return {
    ...(actual.default || actual),
    AgentExecutor: {
      create: vi.fn().mockResolvedValue({
        execute: vi.fn().mockResolvedValue([
          {
            id: 'suggestion-1',
            sourceBlockId: 'block-1',
            type: 'recommendation',
            content: 'Sugerencia de prueba',
            field: 'diagnosis',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 'suggestion-2',
            sourceBlockId: 'block-2',
            type: 'warning',
            content: 'Advertencia de prueba',
            field: 'medication',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]),
        getSuggestions: vi.fn().mockReturnValue([
          {
            id: 'suggestion-1',
            sourceBlockId: 'block-1',
            type: 'recommendation',
            content: 'Sugerencia de prueba',
            field: 'diagnosis',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 'suggestion-2',
            sourceBlockId: 'block-2',
            type: 'warning',
            content: 'Advertencia de prueba',
            field: 'medication',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ])
      })
    }
  };
});

// Mock de AgentContextBuilder.buildAgentContext
vi.mock('../../../src/core/agent/AgentContextBuilder', () => ({
  buildAgentContext: vi.fn().mockImplementation((mcpContext) => {
    // Siempre devolver un contexto válido
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
          id: 'sem-1',
          type: 'semantic',
          content: 'Datos de prueba semánticos'
        }
      ],
      metadata: {
        professionalId: 'professional-123'
      }
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
    const result = await runClinicalAgent('visit-123');
    vi.advanceTimersByTime(500);
    expect(Array.isArray(result)).toBe(true);
  });

  it('debería devolver un array vacío si el contexto es null o inválido', async () => {
    // Ajustar el mock para que devuelva null cuando visitId es null
    vi.mocked(AgentContextBuilder.buildAgentContext).mockResolvedValueOnce(null);
    // @ts-expect-error: Pasar null intencionalmente para probar el manejo de errores
    const result = await runClinicalAgent(null);
    expect(result).toEqual([]);
  });

  it('debería manejar correctamente un contexto vacío sin lanzar errores', async () => {
    const result = await runClinicalAgent('empty-visit');
    vi.advanceTimersByTime(500);
    expect(Array.isArray(result)).toBe(true);
  });

  it('debería devolver al menos 2 sugerencias cuando todo está OK', async () => {
    const result = await runClinicalAgent('visit-123');
    vi.advanceTimersByTime(500);
    expect(result.length).toBeGreaterThanOrEqual(2);
    result.forEach(suggestion => {
      expect(suggestion).toHaveProperty('id');
      expect(suggestion).toHaveProperty('sourceBlockId');
      expect(suggestion).toHaveProperty('type');
      expect(suggestion).toHaveProperty('content');
    });
  });

  it('debería manejar errores internos sin lanzar excepciones', async () => {
    // Simular un error en execute
    const mockExecutor = {
      execute: vi.fn().mockRejectedValue(new Error('Error simulado en execute')),
      getSuggestions: vi.fn().mockReturnValue([])
    };
    vi.mocked(AgentExecutor.AgentExecutor.create).mockResolvedValueOnce(mockExecutor as any);
    const result = await runClinicalAgent('visit-123');
    expect(result).toEqual([]);
  });

  it('debería usar openai como proveedor por defecto', async () => {
    const spy = vi.spyOn(AgentExecutor.AgentExecutor, 'create');
    await runClinicalAgent('visit-123');
    vi.advanceTimersByTime(500);
    expect(spy).toHaveBeenCalledWith('visit-123', 'openai');
  });
}); 