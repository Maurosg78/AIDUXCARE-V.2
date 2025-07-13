/**
 * TESTS MODELSELECTOR V3.0 - VERIFICACIÓN DE ESCALAMIENTO DE SEGURIDAD
 * 
 * Este archivo contiene tests críticos para validar que el ModelSelector
 * escala correctamente al modelo Pro cuando se detectan riesgos HIGH.
 */

const ModelSelector = require('../src/services/ModelSelector');

// Mock del VertexAIClient
const mockVertexClient = {
  processWithModel: jest.fn()
};

const winston = require('winston');
winston.configure({
  level: 'error', // Silenciar logs en tests
  transports: []
});

describe('ModelSelector - Escalamiento de Seguridad Crítico', () => {
  let modelSelector;

  beforeEach(() => {
    modelSelector = new ModelSelector(mockVertexClient);
    jest.clearAllMocks();
  });

  describe('🔥 TESTS CRÍTICOS DE ESCALAMIENTO DE SEGURIDAD', () => {
    
    test('CRÍTICO: Debe escalar a Pro cuando riskLevel es HIGH', async () => {
      // ARRANGE - Simular respuesta de triaje con riesgo HIGH
      const triageResponseWithHighRisk = {
        redFlags: ["dolor nocturno severo", "pérdida de peso inexplicada"],
        riskLevel: "HIGH",
        confidence: 0.95,
        reasoning: "Banderas rojas críticas detectadas"
      };

      mockVertexClient.processWithModel.mockResolvedValue(triageResponseWithHighRisk);

      // ACT - Ejecutar selección de modelo
      const result = await modelSelector.selectModel("Transcripción de prueba con dolor nocturno y pérdida de peso");

      // ASSERT - VERIFICACIÓN CRÍTICA
      expect(result.selectedModel).toBe('gemini-2.5-pro');
      expect(result.triageResult.riskLevel).toBe('HIGH');
      expect(result.triageResult.redFlags).toHaveLength(2);
      expect(result.reasoning).toContain('Banderas rojas detectadas');
      expect(result.reasoning).toContain('modelo Pro');
      expect(result.costOptimization).toContain('seguridad clínica');
    });

    test('CRÍTICO: Debe escalar a Pro cuando hay 1+ banderas rojas (incluso con riskLevel LOW)', async () => {
      // ARRANGE - Caso edge: bandera roja presente pero riskLevel inconsistente  
      const triageResponseWithRedFlag = {
        redFlags: ["dolor nocturno severo"],
        riskLevel: "LOW", // Inconsistente, pero bandera roja presente
        confidence: 0.85,
        reasoning: "Bandera roja detectada pero riesgo bajo"
      };

      mockVertexClient.processWithModel.mockResolvedValue(triageResponseWithRedFlag);

      // ACT
      const result = await modelSelector.selectModel("Transcripción con dolor nocturno");

      // ASSERT - Debe escalar por presencia de bandera roja
      expect(result.selectedModel).toBe('gemini-2.5-pro');
      expect(result.triageResult.redFlags).toHaveLength(1);
      expect(result.reasoning).toContain('Banderas rojas detectadas');
    });

    test('SEGURIDAD: Debe usar Flash cuando no hay banderas rojas ni riesgo HIGH', async () => {
      // ARRANGE - Caso estándar sin riesgos
      const triageResponseLowRisk = {
        redFlags: [],
        riskLevel: "LOW",
        confidence: 0.90,
        reasoning: "Caso estándar sin alarmas"
      };

      mockVertexClient.processWithModel.mockResolvedValue(triageResponseLowRisk);

      // ACT
      const result = await modelSelector.selectModel("Transcripción de dolor mecánico leve");

      // ASSERT
      expect(result.selectedModel).toBe('gemini-2.5-flash');
      expect(result.triageResult.riskLevel).toBe('LOW');
      expect(result.triageResult.redFlags).toHaveLength(0);
      expect(result.reasoning).toContain('Flash');
      expect(result.costOptimization.savingsVsPro).toContain('88% ahorro');
    });

    test('ESCALAMIENTO PREVENTIVO: Debe escalar a Pro con riesgo MEDIUM y baja confianza', async () => {
      // ARRANGE - Caso de escalamiento preventivo
      const triageResponseMediumRisk = {
        redFlags: [],
        riskLevel: "MEDIUM",
        confidence: 0.75, // Baja confianza < 0.8
        reasoning: "Riesgo medio con incertidumbre"
      };

      mockVertexClient.processWithModel.mockResolvedValue(triageResponseMediumRisk);

      // ACT
      const result = await modelSelector.selectModel("Transcripción ambigua");

      // ASSERT
      expect(result.selectedModel).toBe('gemini-2.5-pro');
      expect(result.triageResult.riskLevel).toBe('MEDIUM');
      expect(result.reasoning).toContain('Escalado preventivo');
    });

    test('PARSING SEGURO: Debe manejar respuestas ya parseadas como objeto', () => {
      // ARRANGE - Simular respuesta que ya viene como objeto (caso actual)
      const objectResponse = {
        redFlags: ["dolor nocturno severo"],
        riskLevel: "HIGH",
        confidence: 0.98,
        reasoning: "Bandera roja crítica"
      };

      // ACT - Usar directamente el parser interno
      const result = modelSelector._parseTriageResponse(objectResponse);

      // ASSERT
      expect(result.redFlags).toHaveLength(1);
      expect(result.redFlags[0]).toBe("dolor nocturno severo");
      expect(result.riskLevel).toBe("HIGH");
      expect(result.confidence).toBe(0.98);
    });

    test('PARSING SEGURO: Debe manejar respuestas string con markdown', () => {
      // ARRANGE - Simular respuesta string con markdown
      const stringResponse = `\`\`\`json
{
  "redFlags": ["pérdida de peso inexplicada"],
  "riskLevel": "HIGH",
  "confidence": 0.92,
  "reasoning": "Bandera roja crítica presente"
}
\`\`\``;

      // ACT
      const result = modelSelector._parseTriageResponse(stringResponse);

      // ASSERT
      expect(result.redFlags).toHaveLength(1);
      expect(result.redFlags[0]).toBe("pérdida de peso inexplicada");
      expect(result.riskLevel).toBe("HIGH");
      expect(result.confidence).toBe(0.92);
    });

    test('FALLBACK SEGURO: Debe usar fallback LOW en caso de parsing error', () => {
      // ARRANGE - Simular respuesta malformada
      const malformedResponse = "respuesta inválida no JSON";

      // ACT
      const result = modelSelector._parseTriageResponse(malformedResponse);

      // ASSERT - Fallback seguro
      expect(result.redFlags).toHaveLength(0);
      expect(result.riskLevel).toBe("LOW");
      expect(result.confidence).toBe(0.5);
      expect(result.reasoning).toContain("Error en parsing");
    });
  });

  describe('🔧 TESTS DE FUNCIONALIDAD ADICIONAL', () => {
    
    test('Debe devolver estadísticas de optimización correctas', () => {
      const stats = modelSelector.getOptimizationStats();
      
      expect(stats.triageModel).toBe('gemini-2.5-flash');
      expect(stats.premiumModel).toBe('gemini-2.5-pro');
      expect(stats.clinicalSafety).toBe('100% - triaje con IA real');
    });

    test('Debe permitir forzar modelo específico para testing', () => {
      const result = modelSelector.forceModel('gemini-2.5-pro');
      
      expect(result.selectedModel).toBe('gemini-2.5-pro');
      expect(result.forced).toBe(true);
      expect(result.reasoning).toContain('forzado por configuración');
    });

    test('Debe rechazar modelos no disponibles', () => {
      expect(() => {
        modelSelector.forceModel('modelo-inexistente');
      }).toThrow('Modelo no disponible');
    });
  });
});

module.exports = {
  mockVertexClient
}; 