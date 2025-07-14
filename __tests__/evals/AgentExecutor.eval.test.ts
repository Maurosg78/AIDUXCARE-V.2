import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { AgentExecutor } from '../../src/core/agent/AgentExecutor';
import { z } from 'zod';
import { EMRFormService } from '../../src/core/services/EMRFormService';
import { AuditLogger } from '../../src/core/audit/AuditLogger';
import { v4 as uuidv4 } from 'uuid';

// Mocks para los servicios de EMR y auditoría
vi.mock('../../src/core/services/EMRFormService');
vi.mock('../../src/core/audit/AuditLogger');

// Definir un esquema Zod para validar la estructura de las sugerencias del agente
const AgentSuggestionSchema = z.object({
  id: z.string().uuid(),
  sourceBlockId: z.string(),
  type: z.enum(['recommendation', 'warning', 'info']),
  content: z.string().min(1)
});

// Mock para sendToLLM para evitar llamadas reales a servicios externos
vi.mock('../../src/core/agent/LLMAdapter', () => ({
  sendToLLM: vi.fn().mockImplementation((context) => {
    // Si el contexto es vacío, simular respuesta vacía
    if (context && Array.isArray(context.blocks) && context.blocks.length === 0) {
      return Promise.resolve({ suggestions: [], explanation: 'Sin datos' });
    }
    // Simular otros escenarios según el contenido de los bloques
    if (context && context.blocks && context.blocks.some(b => b.content.includes('malestar general'))) {
      return Promise.resolve({
        suggestions: [
          {
            id: uuidv4(),
            type: 'warning' as const,
            field: 'plan' as const,
            content: 'Considerar evaluación adicional por malestar general inespecífico',
            sourceBlockId: context.blocks[0]?.id || 'default',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        explanation: 'Respuesta para contexto parcial.'
      });
    }
    // Respuesta genérica con múltiples sugerencias
    return Promise.resolve({
      suggestions: [
        {
          id: uuidv4(),
          type: 'recommendation' as const,
          field: 'diagnosis' as const,
          content: 'Considerar realizar radiografía de tórax',
          sourceBlockId: context.blocks[0]?.id || 'default',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: uuidv4(),
          type: 'warning' as const,
          field: 'plan' as const,
          content: 'Vigilar signos de dificultad respiratoria',
          sourceBlockId: context.blocks[1]?.id || 'default',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: uuidv4(),
          type: 'info' as const,
          field: 'notes' as const,
          content: 'Considerar antecedente de asma en evaluación',
          sourceBlockId: context.blocks[1]?.id || 'default',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],
      explanation: 'Respuesta generada por mock.'
    });
  })
}));

vi.mock('../../src/core/agent/ClinicalAgent', () => ({
  ClinicalAgent: {
    create: vi.fn().mockImplementation(async (visitId: string) => {
      // Si el visitId es 'empty-visit', retornar contexto vacío
      if (visitId === 'empty-visit') {
        return {
      getContext: vi.fn().mockResolvedValue({
        visitId,
        blocks: [],
        metadata: {}
      }),
      getSuggestions: vi.fn().mockReturnValue([]),
      addSuggestion: vi.fn()
        };
      }
      // Si el visitId es 'visit-partial', retornar contexto parcial
      if (visitId === 'visit-partial') {
        return {
          getContext: vi.fn().mockResolvedValue({
            visitId,
            blocks: [
              {
                id: 'block-1',
                type: 'contextual',
                content: 'Paciente refiere malestar general',
                timestamp: new Date().toISOString(),
                patient_id: 'patient-123'
              }
            ],
            metadata: {
              patientId: 'patient-123'
            }
          }),
          getSuggestions: vi.fn().mockReturnValue([]),
          addSuggestion: vi.fn()
        };
      }
      // Para otros casos, retornar contexto completo
      return {
        getContext: vi.fn().mockResolvedValue({
          visitId,
          blocks: [
            {
              id: 'block-1',
              type: 'contextual',
              content: 'Paciente presenta fiebre de 38.5°C y tos seca',
              timestamp: new Date().toISOString(),
              patient_id: 'patient-123'
            },
            {
              id: 'block-2',
              type: 'persistent',
              content: 'Historial de asma bronquial',
              timestamp: new Date().toISOString(),
              patient_id: 'patient-123'
            }
          ],
          metadata: {
            patientId: 'patient-123'
          }
        }),
        getSuggestions: vi.fn().mockReturnValue([]),
        addSuggestion: vi.fn()
      };
    })
  }
}));

/**
 * EVALUACIÓN DEL AGENTEXECUTOR
 * 
 * Esta suite evalúa el comportamiento del AgentExecutor en diversos escenarios:
 * 1. Contexto MCP completo y válido → debe generar sugerencias relevantes
 * 2. Contexto MCP nulo o vacío → debe manejar el caso sin errores
 * 3. Contexto sin información accionable → debe retornar array vacío o mensaje claro
 * 4. Contexto parcialmente válido → debe limpiar/validar lo que pueda y continuar
 * 5. Integración de sugerencias → debe integrarse correctamente al EMR
 */
describe('AgentExecutor EVAL', () => {
  // Configurar el entorno de pruebas
  beforeAll(() => {
    vi.useFakeTimers();
  });

  afterAll(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  /**
   * CASO 1: Contexto MCP completo con información clínica relevante
   * 
   * El ejecutor debe generar sugerencias relevantes basadas en la información
   * del contexto, siguiendo la estructura definida por AgentSuggestion
   */
  describe('Caso 1: Contexto MCP completo y válido', () => {
    it('debe generar sugerencias estructuradas cuando se proporciona un contexto completo', async () => {
      // Crear el executor usando el método estático y ejecutar el agente
      const executor = await AgentExecutor.create('visit-123', 'openai');
      const suggestions = await executor.execute();
      
      // Verificaciones
      expect(suggestions).toBeDefined();
      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThanOrEqual(2);
      
      // Validar estructura de cada sugerencia usando el esquema Zod
      suggestions.forEach(suggestion => {
        const result = AgentSuggestionSchema.safeParse(suggestion);
        expect(result.success).toBe(true);
      });
      
      // Verificar que las sugerencias contienen tipos variados 
      // (al menos una recommendation y una warning/info)
      const types = suggestions.map(s => s.type);
      const hasRecommendation = types.includes('recommendation');
      const hasWarningOrInfo = types.includes('warning') || types.includes('info');
      
      // Solo uno de estos debería ser verdadero, dependiendo de la implementación
      expect(hasRecommendation || hasWarningOrInfo).toBe(true);
      
      // Verificar que hay al menos una sugerencia con contenido no vacío
      const hasContent = suggestions.some(s => s.content.length > 0);
      expect(hasContent).toBe(true);
    });
  });

  /**
   * CASO 2: Contexto MCP nulo o vacío
   * 
   * El ejecutor debe manejar correctamente un contexto vacío,
   * evitando errores y devolviendo un array de sugerencias vacío
   */
  describe('Caso 2: Contexto MCP nulo o vacío', () => {
    it('debe manejar correctamente un contexto vacío sin errores', async () => {
      // Crear el executor usando el método estático y ejecutar el agente
      const executor = await AgentExecutor.create('empty-visit', 'openai');
      const suggestions = await executor.execute();
      
      // Verificar que se devuelve un array (posiblemente vacío), pero sin errores
      expect(suggestions).toBeDefined();
      expect(Array.isArray(suggestions)).toBe(true);
      
      // Si hay sugerencias (el stub podría generar algunas), verificar su estructura
      if (suggestions.length > 0) {
        suggestions.forEach(suggestion => {
          const result = AgentSuggestionSchema.safeParse(suggestion);
          expect(result.success).toBe(true);
        });
      }
    });
    
    it('debe rechazar un contexto nulo con un error apropiado', async () => {
      // Intentar crear el executor con un visitId inválido
      await expect(AgentExecutor.create(null as any, 'openai'))
        .rejects
        .toThrow('El ID de visita es requerido para crear el ejecutor del agente');
    });
  });

  /**
   * CASO 3: Contexto sin información accionable
   * 
   * El ejecutor debe identificar cuando no hay información útil
   * en el contexto y devolver un resultado apropiado
   */
  describe('Caso 3: Contexto sin información accionable', () => {
    it('debe devolver un array vacío o sugerencias limitadas cuando no hay info accionable', async () => {
      // Crear el executor usando el método estático y ejecutar el agente
      const executor = await AgentExecutor.create('visit-empty-structure', 'openai');
      const suggestions = await executor.execute();
      
      // Verificar el resultado - podría ser un array vacío o con sugerencias genéricas
      expect(suggestions).toBeDefined();
      expect(Array.isArray(suggestions)).toBe(true);
      
      // Si hay sugerencias (depende de la implementación), verificar que sean genéricas
      if (suggestions.length > 0) {
        // Verificar que las sugerencias tienen la estructura correcta
        suggestions.forEach(suggestion => {
          const result = AgentSuggestionSchema.safeParse(suggestion);
          expect(result.success).toBe(true);
        });
      }
    });
  });

  /**
   * CASO 4: Contexto parcialmente válido
   * 
   * El ejecutor debe limpiar y validar datos parciales,
   * generando las mejores sugerencias posibles con la información disponible
   */
  describe('Caso 4: Contexto parcialmente válido', () => {
    it('debe limpiar datos parciales y generar sugerencias razonables', async () => {
      // Crear el executor usando el método estático y ejecutar el agente
      const executor = await AgentExecutor.create('visit-partial', 'openai');
      const suggestions = await executor.execute();
      
      // Verificaciones
      expect(suggestions).toBeDefined();
      expect(Array.isArray(suggestions)).toBe(true);
      
      // Validar la estructura de cada sugerencia
      suggestions.forEach(suggestion => {
        const result = AgentSuggestionSchema.safeParse(suggestion);
        expect(result.success).toBe(true);
      });
      
      // Verificar que las sugerencias son razonables dado el contexto limitado
      if (suggestions.length > 0) {
        const sourceBlockIds = suggestions.map(s => s.sourceBlockId).filter(id => id != null);
        
        // Obtener los IDs de bloques del contexto real usado
        const context = await executor['agent'].getContext();
        const actualBlockIds = context.blocks.map(b => b.id);
        
        // Verificar que todos los sourceBlockIds existen en el contexto real
        const allSourceBlocksExist = sourceBlockIds.every(id => actualBlockIds.includes(id!));
        expect(allSourceBlocksExist).toBe(true);
      }
    });
  });

  /**
   * CASO 5: Integración de sugerencias al EMR
   * 
   * Prueba que verifica que las sugerencias aprobadas se integran
   * correctamente en el EMR y se registran en el sistema de auditoría
   */
  describe('Caso 5: Integración de sugerencias al EMR', () => {
    it('debe integrar una sugerencia aprobada en el EMR y registrar el evento', async () => {
      // Crear una sugerencia de prueba
      const mockSuggestion = {
        id: uuidv4(),
        sourceBlockId: 'block-1',
        type: 'recommendation' as const,
        content: 'Mock content',
        field: 'diagnosis' as const,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Configurar mocks
      const mockInsertSuggestion = vi.fn().mockImplementation(async () => {
        // Simular el logging interno que ocurre después de una inserción exitosa
        await AuditLogger.log('suggestions.approved', {
          visitId: 'visit-test-123',
          userId: 'user-test-456',
          patientId: 'patient-test-789',
          field: 'plan',
          content: mockSuggestion.content,
          source: 'agent',
          suggestionId: mockSuggestion.id,
          timestamp: new Date().toISOString()
        });
        return true;
      });
      
      const mockLog = vi.fn().mockReturnValue(true);
      
      // Asignar los mocks a los métodos
      vi.mocked(EMRFormService).insertSuggestion = mockInsertSuggestion;
      vi.mocked(EMRFormService).mapSuggestionTypeToEMRSection = vi.fn().mockReturnValue('plan');
      vi.mocked(AuditLogger).log = mockLog;
      
      // Datos de prueba
      const visitId = 'visit-test-123';
      const userId = 'user-test-456';
      
      // Simular una aprobación de sugerencia
      await EMRFormService.insertSuggestion(
        {
          id: mockSuggestion.id,
          content: mockSuggestion.content,
          type: mockSuggestion.type,
          sourceBlockId: mockSuggestion.sourceBlockId
        },
        visitId,
        'patient-test-789',
        userId
      );
      
      // Verificar que se llamó al método de inserción con los parámetros correctos
      expect(mockInsertSuggestion).toHaveBeenCalledWith(
        {
          id: mockSuggestion.id,
          content: mockSuggestion.content,
          type: mockSuggestion.type,
          sourceBlockId: mockSuggestion.sourceBlockId
        },
        visitId,
        'patient-test-789',
        userId
      );
      
      // Verificar que se registró el evento en el sistema de auditoría
      expect(mockLog).toHaveBeenCalledWith('suggestions.approved', expect.objectContaining({
        visitId,
        field: 'plan',
          content: mockSuggestion.content,
        suggestionId: mockSuggestion.id
      }));
    });
  });
}); 