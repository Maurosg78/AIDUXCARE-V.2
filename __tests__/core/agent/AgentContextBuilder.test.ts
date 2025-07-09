import { describe, it, expect } from 'vitest';
import { buildAgentContextFromMCP } from '../../../src/core/agent/AgentContextBuilder';
import { MCPContext } from '../../../src/core/mcp/schema';

describe('AgentContextBuilder', () => {
  // Función para crear un contexto MCP simulado para pruebas
  const createMockMCPContext = (): MCPContext => {
    // Para simplificar, creamos un contexto básico y extendemos con propiedades extra
    const mockContext: MCPContext = {
      contextual: {
        source: 'test',
        data: [
          {
            id: 'ctx-1',
            type: 'contextual',
            content: 'Contenido contextual 1',
            timestamp: '2023-01-01T00:00:00Z',
          },
          {
            id: 'ctx-2',
            type: 'contextual',
            content: '', // Contenido vacío, debería ser excluido
            timestamp: '2023-01-01T00:00:00Z'
          },
          {
            id: '', // ID vacío, debería ser excluido
            type: 'contextual',
            content: 'Contenido sin ID',
            timestamp: '2023-01-01T00:00:00Z'
          }
        ]
      },
      persistent: {
        source: 'test',
        data: [
          {
            id: 'pers-1',
            type: 'persistent',
            content: 'Contenido persistente 1',
            timestamp: '2023-01-01T00:00:00Z',
          }
        ]
      },
      semantic: {
        source: 'test',
        data: [
          {
            id: 'sem-1',
            type: 'semantic',
            content: 'Contenido semántico 1',
            timestamp: '2023-01-01T00:00:00Z'
          }
        ]
      }
    };
    
    // Añadimos propiedades adicionales (que serán accesibles con el operador 'as' en el código real)
    // @ts-expect-error - Esto simula como el código real podría acceder a propiedades que no están en el tipo
    mockContext.contextual.data[0].visit_id = 'visit-123';
    // @ts-expect-error - Esto simula como el código real podría acceder a propiedades que no están en el tipo
    mockContext.persistent.data[0].patient_id = 'patient-456';
    
    return mockContext;
  };
  
  it('debe generar un AgentContext válido a partir de un MCPContext', () => {
    const mockContext = createMockMCPContext();
    const agentContext = buildAgentContextFromMCP(mockContext);
    
    // Verificar estructura básica
    expect(agentContext).toBeDefined();
    expect(agentContext.visitId).toBe('visit-123');
    expect(agentContext.patientId).toBe('patient-456');
    expect(Array.isArray(agentContext.blocks)).toBe(true);
    
    // Verificar que se incluyeron solo los bloques válidos
    expect(agentContext.blocks.length).toBe(3); // Deben ser solo 3 (excluyendo los inválidos)
    
    // Verificar que se excluyeron los bloques sin ID o sin contenido
    const contextualBlocks = agentContext.blocks.filter(b => b.type === 'contextual');
    expect(contextualBlocks.length).toBe(1);
    expect(contextualBlocks[0].id).toBe('ctx-1');
    
    // Verificar que los bloques tienen el tipo correcto
    const types = agentContext.blocks.map(b => b.type);
    expect(types).toContain('contextual');
    expect(types).toContain('persistent');
    expect(types).toContain('semantic');
  });
  
  it('debe excluir bloques vacíos o sin ID', () => {
    const mockContext = createMockMCPContext();
    const agentContext = buildAgentContextFromMCP(mockContext);
    
    // Verificar que no hay bloques sin ID ni contenido vacío
    expect(agentContext.blocks.every(b => b.id && b.content)).toBe(true);
    
    // Verificar que se excluyeron específicamente bloques problemáticos
    const allIds = agentContext.blocks.map(b => b.id);
    expect(allIds).not.toContain('');
    expect(allIds).not.toContain('ctx-2'); // Este tenía contenido vacío
  });
  
  it('debe manejar valores por defecto cuando no hay datos', () => {
    // Crear un contexto vacío
    const emptyContext: MCPContext = {
      contextual: { source: 'test', data: [] },
      persistent: { source: 'test', data: [] },
      semantic: { source: 'test', data: [] }
    };
    
    const agentContext = buildAgentContextFromMCP(emptyContext);
    
    // Verificar valores por defecto
    expect(agentContext.visitId).toBe('');
    expect(agentContext.patientId).toBe('');
    expect(agentContext.blocks).toEqual([]);
  });
}); 