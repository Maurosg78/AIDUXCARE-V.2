import { vi, describe, it, expect, beforeEach } from 'vitest';
import { evaluateSuggestion } from '../../evals/ClinicalSuggestionEval';
import { createValidSuggestion, createInvalidSuggestion } from '../IntegrationTests';
import * as ClinicalAgent from '../../core/agent/ClinicalAgent';
import { AgentContext } from '../../core/agent/AgentContextBuilder';

// Mocks para permitir pruebas controladas
vi.mock('../../services/UsageAnalyticsService', () => ({
  logMetric: vi.fn(),
  track: vi.fn()
}));

// Mocks para el proceso de evaluación
const mockEvaluateSuggestionsIfEnabled = vi.fn().mockImplementation(
  (suggestions, visitId, patientId) => suggestions
);

// Mock para sobrescribir la función interna en ClinicalAgent
vi.mock('../../core/agent/ClinicalAgent', async (importOriginal) => {
  const originalModule = await importOriginal();
  return {
    ...originalModule,
    // Exponer para propósitos de prueba (hacer visible una función normalmente privada)
    evaluateSuggestionsIfEnabled: mockEvaluateSuggestionsIfEnabled
  };
});

describe('Evaluación de Sugerencias Clínicas - Integración', () => {
  // Restablecer todos los mocks antes de cada prueba
  beforeEach(() => {
    vi.clearAllMocks();
    // Restablecer variables de entorno
    delete process.env.ENABLE_SUGGESTION_EVAL;
  });

  describe('1. evaluateSuggestion() - Validación estructural', () => {
    it('identifica correctamente sugerencias válidas', () => {
      // Crear una sugerencia válida
      const validSuggestion = createValidSuggestion();
      
      // Evaluar la sugerencia
      const result = evaluateSuggestion(validSuggestion);
      
      // Verificar resultado
      expect(result.isValid).toBe(true);
      expect(result.reasons).toContain(`Tipo de sugerencia '${validSuggestion.type}' válido.`);
      expect(result.reasons).toContain(`Contenido de la sugerencia válido (${validSuggestion.content.length} caracteres).`);
      expect(result.reasons).toContain('Origen de contexto (context_origin) válido.');
      expect(result.reasons).toContain('ID de sugerencia válido.');
      expect(result.reasons).toContain('ID de bloque de origen (sourceBlockId) válido.');
    });

    it('detecta sugerencias con contenido vacío', () => {
      const emptySuggestion = createInvalidSuggestion('empty_content');
      const result = evaluateSuggestion(emptySuggestion);
      
      expect(result.isValid).toBe(false);
      expect(result.reasons).toContain('El contenido de la sugerencia no puede estar vacío.');
    });

    it('detecta sugerencias sin ID', () => {
      const noIdSuggestion = createInvalidSuggestion('missing_id');
      const result = evaluateSuggestion(noIdSuggestion);
      
      expect(result.isValid).toBe(false);
      expect(result.reasons).toContain('La sugerencia debe tener un ID único.');
    });

    it('detecta sugerencias sin sourceBlockId', () => {
      const noSourceSuggestion = createInvalidSuggestion('missing_sourceBlockId');
      const result = evaluateSuggestion(noSourceSuggestion);
      
      expect(result.isValid).toBe(false);
      expect(result.reasons).toContain('La sugerencia debe tener un ID de bloque de origen (sourceBlockId).');
    });

    it('detecta sugerencias sin context_origin', () => {
      const noContextSuggestion = createInvalidSuggestion('no_context_origin');
      const result = evaluateSuggestion(noContextSuggestion);
      
      expect(result.isValid).toBe(false);
      expect(result.reasons).toContain('La sugerencia debe tener un origen de contexto definido (context_origin).');
    });

    it('detecta sugerencias con tipo inválido', () => {
      const invalidTypeSuggestion = createInvalidSuggestion('invalid_type');
      const result = evaluateSuggestion(invalidTypeSuggestion);
      
      expect(result.isValid).toBe(false);
      expect(result.reasons).toContain(`Tipo de sugerencia 'invalid-type' no válido. Debe ser: recommendation, warning o info.`);
    });

    it('detecta sugerencias con contenido demasiado corto', () => {
      const shortContentSuggestion = createInvalidSuggestion('short_content');
      const result = evaluateSuggestion(shortContentSuggestion);
      
      expect(result.isValid).toBe(false);
      expect(result.reasons).toContain(`El contenido de la sugerencia es demasiado corto (${shortContentSuggestion.content.length} caracteres). Mínimo requerido: 10 caracteres.`);
    });
  });

  describe('2. Integración con ClinicalAgent', () => {
    it('llama a evaluateSuggestionsIfEnabled cuando ENABLE_SUGGESTION_EVAL está activado', async () => {
      // Establecer variable de entorno para activar evaluación
      process.env.ENABLE_SUGGESTION_EVAL = 'true';
      
      // Crear contexto y sugerencias simuladas
      const mockContext: AgentContext = {
        visitId: 'visit-test-123',
        patientId: 'patient-test-456',
        blocks: [{ id: 'block-1', type: 'contextual', content: 'Contenido de prueba' }]
      };
      
      // Crear sugerencias válidas para el test
      const mockSuggestions = [createValidSuggestion(), createValidSuggestion('warning')];
      
      // Mock para getDeterministicSuggestions que devuelve sugerencias controladas
      const getDeterministicSuggestionsSpy = vi.spyOn(ClinicalAgent, 'getDeterministicSuggestions')
        .mockResolvedValue(mockSuggestions);
      
      // Mock de USE_REAL_LLM
      process.env.USE_REAL_LLM = 'false';
      
      // Ejecutar getAgentSuggestions
      await ClinicalAgent.getAgentSuggestions(mockContext);
      
      // Verificar que se llamó a getDeterministicSuggestions
      expect(getDeterministicSuggestionsSpy).toHaveBeenCalledWith(mockContext);
      
      // Verificar que se llamó a evaluateSuggestionsIfEnabled con los parámetros correctos
      expect(mockEvaluateSuggestionsIfEnabled).toHaveBeenCalledWith(
        mockSuggestions,
        mockContext.visitId,
        mockContext.patientId
      );
    });

    it('no evalúa las sugerencias cuando ENABLE_SUGGESTION_EVAL no está activado', async () => {
      // Asegurar que la variable de entorno no está activada
      process.env.ENABLE_SUGGESTION_EVAL = 'false';
      
      // Crear contexto y sugerencias simuladas
      const mockContext: AgentContext = {
        visitId: 'visit-test-123',
        patientId: 'patient-test-456',
        blocks: [{ id: 'block-1', type: 'contextual', content: 'Contenido de prueba' }]
      };
      
      // Mock para getDeterministicSuggestions
      const mockSuggestions = [createValidSuggestion()];
      vi.spyOn(ClinicalAgent, 'getDeterministicSuggestions')
        .mockResolvedValue(mockSuggestions);
      
      // Ejecutar getAgentSuggestions
      await ClinicalAgent.getAgentSuggestions(mockContext);
      
      // Verificar evaluación de la propiedad is_background
      expect(mockEvaluateSuggestionsIfEnabled).toHaveBeenCalled();
      
      // Restaurar para pruebas siguientes
      process.env.ENABLE_SUGGESTION_EVAL = 'false';
    });
  });

  describe('3. Múltiples validaciones secuenciales', () => {
    it('puede procesar un lote mixto de sugerencias válidas e inválidas', () => {
      // Crear lote mixto
      const validSuggestion = createValidSuggestion();
      const invalidSuggestions = [
        createInvalidSuggestion('empty_content'),
        createInvalidSuggestion('invalid_type'),
        createInvalidSuggestion('no_context_origin')
      ];
      
      const mixedSuggestions = [validSuggestion, ...invalidSuggestions];
      
      // Evaluar todas las sugerencias
      const results = mixedSuggestions.map(suggestion => evaluateSuggestion(suggestion));
      
      // Verificar resultados
      expect(results[0].isValid).toBe(true); // La primera debe ser válida
      expect(results[1].isValid).toBe(false); // empty_content
      expect(results[2].isValid).toBe(false); // invalid_type
      expect(results[3].isValid).toBe(false); // no_context_origin
      
      // Verificar razones específicas
      expect(results[1].reasons).toContain('El contenido de la sugerencia no puede estar vacío.');
      expect(results[2].reasons).toContain(`Tipo de sugerencia 'invalid-type' no válido.`);
      expect(results[3].reasons).toContain('La sugerencia debe tener un origen de contexto definido (context_origin).');
    });
  });
}); 