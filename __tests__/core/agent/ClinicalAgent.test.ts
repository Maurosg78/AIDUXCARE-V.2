import { describe, it, expect } from 'vitest';
import { getAgentSuggestions } from '../../../src/core/agent/ClinicalAgent';
import { AgentContext } from '../../../src/core/agent/AgentContextBuilder';

describe('ClinicalAgent', () => {
  /**
   * Función para crear un contexto de agente simulado para las pruebas
   */
  const createMockAgentContext = (): AgentContext => {
    return {
      visitId: 'visit-123',
      patientId: 'patient-456',
      blocks: [
        {
          id: 'ctx-1',
          type: 'contextual',
          content: 'Paciente refiere dolor abdominal de intensidad 7/10 desde hace 2 días.'
        },
        {
          id: 'ctx-2',
          type: 'contextual',
          content: 'Tensión arterial elevada: 150/90 mmHg.'
        },
        {
          id: 'sem-1',
          type: 'semantic',
          content: 'Historial de diabetes tipo 2 diagnosticada hace 5 años.'
        },
        {
          id: 'pers-1',
          type: 'persistent',
          content: 'Alergia a penicilina documentada en 2020.'
        }
      ]
    };
  };

  /**
   * Función para crear un contexto con contenido que no genera sugerencias específicas
   */
  const createGenericAgentContext = (): AgentContext => {
    return {
      visitId: 'visit-789',
      patientId: 'patient-012',
      blocks: [
        {
          id: 'ctx-g1',
          type: 'contextual',
          content: 'Paciente acude a control de rutina.'
        },
        {
          id: 'sem-g1',
          type: 'semantic',
          content: 'Sin antecedentes de interés.'
        }
      ]
    };
  };

  it('debe generar al menos 2 sugerencias simuladas', async () => {
    const context = createMockAgentContext();
    const suggestions = await getAgentSuggestions(context);
    
    // Verificar que se generan al menos 2 sugerencias
    expect(suggestions.length).toBeGreaterThanOrEqual(2);
  });

  it('debe generar sugerencias con sourceBlockId válido', async () => {
    const context = createMockAgentContext();
    const suggestions = await getAgentSuggestions(context);
    
    // Verificar que cada sugerencia tiene un sourceBlockId válido
    for (const suggestion of suggestions) {
      const blockExists = context.blocks.some(block => block.id === suggestion.sourceBlockId);
      expect(blockExists).toBe(true);
    }
  });

  it('debe generar sugerencias de tipo válido', async () => {
    const context = createMockAgentContext();
    const suggestions = await getAgentSuggestions(context);
    
    // Verificar que cada sugerencia tiene un tipo válido
    const validTypes = ['recommendation', 'warning', 'info'];
    for (const suggestion of suggestions) {
      expect(validTypes).toContain(suggestion.type);
    }
  });

  it('debe generar sugerencias basadas en las palabras clave', async () => {
    const context = createMockAgentContext();
    const suggestions = await getAgentSuggestions(context);
    
    // Verificar que se generan sugerencias específicas para el contenido
    const hasDolor = suggestions.some(s => 
      s.content.includes('dolor') || 
      s.content.includes('analgésicos') ||
      s.sourceBlockId === 'ctx-1'
    );
    
    const hasTension = suggestions.some(s => 
      s.content.includes('tensión') || 
      s.content.includes('arterial') ||
      s.sourceBlockId === 'ctx-2'
    );
    
    const hasDiabetes = suggestions.some(s => 
      s.content.includes('diabetes') || 
      s.content.includes('glucemia') ||
      s.sourceBlockId === 'sem-1'
    );
    
    expect(hasDolor || hasTension || hasDiabetes).toBe(true);
  });

  it('debe generar sugerencias genéricas si no hay palabras clave', async () => {
    const context = createGenericAgentContext();
    const suggestions = await getAgentSuggestions(context);
    
    // Verificar que se generan al menos 2 sugerencias genéricas
    expect(suggestions.length).toBeGreaterThanOrEqual(2);
    
    // Verificar que las sugerencias tienen un sourceBlockId válido
    for (const suggestion of suggestions) {
      const blockExists = context.blocks.some(block => block.id === suggestion.sourceBlockId);
      expect(blockExists).toBe(true);
    }
  });
}); 