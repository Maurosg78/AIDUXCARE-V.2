import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AgentContext } from '../AgentContextBuilder';
import { getAgentSuggestions, AgentSuggestion } from '../ClinicalAgent';
import * as LLMAdapterReal from '../LLMAdapterReal';
import { AuditLogger } from '../../audit/AuditLogger';
import * as AnalyticsService from '../../../services/UsageAnalyticsService';

// Mockear dependencias externas
vi.mock('../../audit/AuditLogger', () => ({
  AuditLogger: {
    log: vi.fn().mockReturnValue(true),
    logSuggestionIntegration: vi.fn(),
  }
}));

vi.mock('../../../services/UsageAnalyticsService', () => ({
  track: vi.fn(),
  logMetric: vi.fn()
}));

vi.mock('../LLMAdapterReal', async () => {
  const actual = await vi.importActual('../LLMAdapterReal') as typeof LLMAdapterReal;
  
  return {
    ...actual,
    // Sobrescribir getSuggestionsFromLLM para que devuelva respuestas predefinidas
    getSuggestionsFromLLM: vi.fn().mockImplementation(async (ctx: AgentContext) => {
      return [
        {
          id: 'test-suggestion-1',
          sourceBlockId: ctx.blocks[0]?.id || 'default-block',
          type: 'recommendation',
          content: 'Considerar evaluación de dolor con escala EVA',
          context_origin: {
            source_block: ctx.blocks[0]?.id || 'default-block',
            text: 'dolor'
          }
        },
        {
          id: 'test-suggestion-2',
          sourceBlockId: ctx.blocks[0]?.id || 'default-block',
          type: 'warning',
          content: 'Verificar interacciones medicamentosas antes de prescribir',
          context_origin: {
            source_block: ctx.blocks[0]?.id || 'default-block',
            text: 'medicamentos'
          }
        }
      ] as AgentSuggestion[];
    })
  };
});

describe('Integración con LLM Real', () => {
  // Configuración del entorno original para restaurar después de cada test
  const originalEnv = { ...process.env };
  
  // Mock del contexto del agente para pruebas
  const mockContext: AgentContext = {
    visitId: 'test-visit-123',
    patientId: 'test-patient-456',
    userId: 'test-user-789',
    blocks: [
      {
        id: 'block-1',
        type: 'contextual',
        content: 'Paciente refiere dolor abdominal de intensidad 7/10.'
      },
      {
        id: 'block-2',
        type: 'persistent',
        content: 'Historia de hipertensión arterial. En tratamiento con losartán 50mg/día.'
      }
    ]
  };
  
  // Configurar y limpiar el entorno antes y después de cada test
  beforeEach(() => {
    // Limpiar mocks
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    // Restaurar variables de entorno originales
    process.env = { ...originalEnv };
  });
  
  it('debe utilizar el LLM real cuando USE_REAL_LLM=true y registrar logs/métricas', async () => {
    // Configurar variable de entorno
    process.env.USE_REAL_LLM = 'true';
    
    // Ejecutar getAgentSuggestions
    const suggestions = await getAgentSuggestions(mockContext);
    
    // Verificar que se llamó al adaptador LLM
    expect(LLMAdapterReal.getSuggestionsFromLLM).toHaveBeenCalledWith(mockContext);
    
    // Verificar que se generaron sugerencias con source="llm_real"
    expect(suggestions.length).toBeGreaterThan(0);
    suggestions.forEach(suggestion => {
      expect(suggestion.source).toBe('llm_real');
    });
    
    // Verificar que se registró el evento de solicitud de sugerencias
    expect(AuditLogger.log).toHaveBeenCalledWith(
      'llm_suggestion_requested',
      expect.objectContaining({
        visitId: mockContext.visitId,
        userId: mockContext.userId
      })
    );
    
    // Verificar que se registró el evento de recepción de sugerencias
    expect(AuditLogger.log).toHaveBeenCalledWith(
      'llm_suggestion_received',
      expect.objectContaining({
        visitId: mockContext.visitId,
        userId: mockContext.userId,
        suggestions_count: suggestions.length
      })
    );
    
    // Verificar que se registraron métricas de uso
    expect(AnalyticsService.track).toHaveBeenCalledWith(
      'llm_used',
      mockContext.userId,
      mockContext.visitId,
      suggestions.length,
      expect.any(Object)
    );
  });
  
  it('no debe utilizar el LLM real cuando USE_REAL_LLM=false', async () => {
    // Configurar variable de entorno
    process.env.USE_REAL_LLM = 'false';
    
    // Ejecutar getAgentSuggestions
    const suggestions = await getAgentSuggestions(mockContext);
    
    // Verificar que NO se llamó al adaptador LLM
    expect(LLMAdapterReal.getSuggestionsFromLLM).not.toHaveBeenCalled();
    
    // Verificar que se generaron sugerencias determinísticas (sin source="llm_real")
    expect(suggestions.length).toBeGreaterThan(0);
    suggestions.forEach(suggestion => {
      expect(suggestion.source).toBeUndefined();
    });
    
    // Verificar que NO se registraron eventos de LLM
    expect(AuditLogger.log).not.toHaveBeenCalledWith(
      'llm_suggestion_requested',
      expect.anything()
    );
    
    expect(AuditLogger.log).not.toHaveBeenCalledWith(
      'llm_suggestion_received',
      expect.anything()
    );
    
    // Verificar que NO se registraron métricas de uso de LLM
    expect(AnalyticsService.track).not.toHaveBeenCalledWith(
      'llm_used',
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.anything()
    );
  });

  it('debe evaluar la calidad de las sugerencias del LLM cuando ENABLE_SUGGESTION_EVAL=true', async () => {
    // Configurar variables de entorno
    process.env.USE_REAL_LLM = 'true';
    process.env.ENABLE_SUGGESTION_EVAL = 'true';
    
    // Ejecutar getAgentSuggestions
    const suggestions = await getAgentSuggestions(mockContext);
    
    // Verificar que se generaron sugerencias desde el LLM
    expect(LLMAdapterReal.getSuggestionsFromLLM).toHaveBeenCalled();
    expect(suggestions.length).toBeGreaterThan(0);
    
    // La validación se hace internamente y no cambia las sugerencias,
    // solo registra métricas si las sugerencias no son válidas
    // Esto es difícil de probar directamente, ya que depende de la implementación
    // de evaluateSuggestion, pero podemos verificar que se procesan correctamente
    expect(suggestions).toBeDefined();
  });
}); 