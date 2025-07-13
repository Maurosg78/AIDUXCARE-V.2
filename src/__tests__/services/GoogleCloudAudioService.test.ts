import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GoogleCloudAudioService, ClinicalAnalysisRequest } from '../../services/GoogleCloudAudioService';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock AbortController
const mockAbortSignal = {
  aborted: false,
  onabort: null,
  reason: undefined,
  throwIfAborted: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn()
};

const mockAbortController = {
  signal: mockAbortSignal,
  abort: vi.fn()
};

global.AbortController = vi.fn(() => mockAbortController) as any;

// Mock setTimeout y clearTimeout
const mockSetTimeout = vi.fn().mockReturnValue('timeout-id');
const mockClearTimeout = vi.fn();
global.setTimeout = mockSetTimeout as any;
global.clearTimeout = mockClearTimeout as any;

describe('GoogleCloudAudioService - Escenarios Reales y Adaptables', () => {
  let service: GoogleCloudAudioService;
  let consoleSpy: any;

  beforeEach(() => {
    service = new GoogleCloudAudioService();
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Reset mocks
    mockFetch.mockReset();
    mockAbortController.abort.mockReset();
    mockSetTimeout.mockReset();
    mockClearTimeout.mockReset();
    
    // Mock default timeout behavior
    mockSetTimeout.mockReturnValue('timeout-id');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('🔍 Validación de Transcripción - Escenarios Reales', () => {
    it('debe rechazar transcripciones vacías con mensaje clínico apropiado', async () => {
      const request: ClinicalAnalysisRequest = {
        transcription: '',
        specialty: 'physiotherapy',
        sessionType: 'initial'
      };

      const result = await service.analyzeClinicalTranscription(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Validación fallida: La transcripción está vacía');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('debe rechazar transcripciones muy cortas con mensaje de longitud', async () => {
      const request: ClinicalAnalysisRequest = {
        transcription: 'Hola',
        specialty: 'psychology',
        sessionType: 'follow_up'
      };

      const result = await service.analyzeClinicalTranscription(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('La transcripción es demasiado corta (mínimo 10 caracteres)');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('debe rechazar transcripciones con pocas palabras con mensaje de micrófono', async () => {
      const request: ClinicalAnalysisRequest = {
        transcription: 'Hola mundo',
        specialty: 'psychology',
        sessionType: 'follow_up'
      };

      const result = await service.analyzeClinicalTranscription(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('No se ha podido detectar una transcripción clara');
      expect(result.error).toContain('verifique su micrófono');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('debe rechazar transcripciones excesivamente largas', async () => {
      const longTranscription = 'A'.repeat(50001);
      const request: ClinicalAnalysisRequest = {
        transcription: longTranscription,
        specialty: 'general_medicine',
        sessionType: 'initial'
      };

      const result = await service.analyzeClinicalTranscription(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('La transcripción es demasiado larga');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('debe aceptar transcripciones válidas y proceder con el análisis', async () => {
      const validTranscription = 'El paciente presenta dolor en la rodilla derecha desde hace dos semanas. Refiere que el dolor empeora al subir escaleras.';
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map(),
        json: async () => ({
          success: true,
          analysis: {
            warnings: [],
            suggestions: [],
            soap_analysis: { overall_quality: 85 },
            session_quality: { communication_score: 90 }
          }
        })
      });

      const request: ClinicalAnalysisRequest = {
        transcription: validTranscription,
        specialty: 'physiotherapy',
        sessionType: 'initial'
      };

      const result = await service.analyzeClinicalTranscription(request);

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://us-east1-aiduxcare-stt-20250706.cloudfunctions.net/clinical-brain',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request)
        })
      );
    });
  });

  describe('⏰ Timeout Real - Escenarios de Rendimiento', () => {
    it('debe manejar timeout de 60 segundos con mensaje clínico apropiado', async () => {
      const request: ClinicalAnalysisRequest = {
        transcription: 'Transcripción válida para test de timeout',
        specialty: 'physiotherapy',
        sessionType: 'initial'
      };

      // Simular timeout inmediato sin usar setTimeout real
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      mockFetch.mockRejectedValueOnce(abortError);

      const result = await service.analyzeClinicalTranscription(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('El Cerebro Clínico tardó más de 60 segundos');
      expect(result.error).toContain('Todas las funciones médicas están disponibles');
      expect(result.message).toBe('timeout_cerebro_clinico');
    });

    it('debe configurar timeout correctamente con AbortController', async () => {
      const request: ClinicalAnalysisRequest = {
        transcription: 'Transcripción para verificar configuración de timeout',
        specialty: 'psychology',
        sessionType: 'follow_up'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map(),
        json: async () => ({ success: true, analysis: {} })
      });

      await service.analyzeClinicalTranscription(request);

      expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 60000);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          signal: mockAbortController.signal
        })
      );
    });
  });

  describe('🚨 Errores HTTP Específicos - Escenarios de Infraestructura', () => {
    it('debe manejar error 400 con mensaje de validación clínica', async () => {
      const request: ClinicalAnalysisRequest = {
        transcription: 'El paciente presenta dolor en la rodilla derecha desde hace dos semanas. Refiere que el dolor empeora al subir escaleras.',
        specialty: 'physiotherapy',
        sessionType: 'initial'
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        headers: new Map(),
        text: async () => JSON.stringify({ 
          error: 'Invalid transcription format',
          message: 'La transcripción contiene caracteres no válidos'
        })
      });

      const result = await service.analyzeClinicalTranscription(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('⚠️ Solicitud inválida');
      expect(result.error).toContain('Verifique que la transcripción sea válida');
    });

    it('debe manejar error 500 con diagnóstico específico de Vertex AI', async () => {
      const request: ClinicalAnalysisRequest = {
        transcription: 'Paciente de 45 años, sexo femenino, acude por dolor lumbar de 3 semanas de evolución. El dolor se irradia hacia la pierna derecha.',
        specialty: 'general_medicine',
        sessionType: 'initial'
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: new Map(),
        text: async () => JSON.stringify({ 
          error: 'Vertex AI INVALID_ARGUMENT: Request too large',
          message: 'El modelo no puede procesar transcripciones tan largas'
        })
      });

      const result = await service.analyzeClinicalTranscription(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('🚨 Error interno del Cerebro Clínico');
      expect(result.error).toContain('El sistema está procesando pero encontró un problema técnico');
    });

    it('debe manejar error 429 con mensaje de límites de uso', async () => {
      const request: ClinicalAnalysisRequest = {
        transcription: 'El paciente refiere síntomas de ansiedad y estrés laboral. Presenta dificultades para dormir y concentrarse en el trabajo.',
        specialty: 'psychology',
        sessionType: 'follow_up'
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        headers: new Map(),
        text: async () => JSON.stringify({ 
          error: 'Rate limit exceeded',
          message: 'Se han excedido los límites de uso del servicio'
        })
      });

      const result = await service.analyzeClinicalTranscription(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('⏱️ Límite de uso excedido');
      expect(result.error).toContain('Intente nuevamente en unos minutos');
    });

    it('debe manejar error 503 con mensaje de mantenimiento', async () => {
      const request: ClinicalAnalysisRequest = {
        transcription: 'Paciente con diagnóstico de esguince de tobillo grado II. Refiere dolor e inflamación desde hace 5 días.',
        specialty: 'physiotherapy',
        sessionType: 'initial'
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        headers: new Map(),
        text: async () => JSON.stringify({ 
          error: 'Service maintenance',
          message: 'El Cerebro Clínico está en mantenimiento programado'
        })
      });

      const result = await service.analyzeClinicalTranscription(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('⚙️ Servicio no disponible');
      expect(result.error).toContain('El Cerebro Clínico está en mantenimiento');
    });
  });

  describe('🌐 Errores de Red - Escenarios de Conectividad', () => {
    it('debe manejar errores de red con mensaje de conectividad', async () => {
      const request: ClinicalAnalysisRequest = {
        transcription: 'Paciente de 35 años, sexo masculino, acude por dolor de cabeza intenso de 2 días de evolución.',
        specialty: 'general_medicine',
        sessionType: 'initial'
      };

      mockFetch.mockRejectedValueOnce(new Error('Network error: Failed to fetch'));

      const result = await service.analyzeClinicalTranscription(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('🌐 Error de conexión de red');
      expect(result.error).toContain('Verifique su conexión a internet');
    });

    it('debe manejar errores de Vertex AI con mensaje específico', async () => {
      const request: ClinicalAnalysisRequest = {
        transcription: 'El paciente continúa con síntomas de depresión moderada. Refiere mejoría en el estado de ánimo pero persiste la falta de energía.',
        specialty: 'psychology',
        sessionType: 'follow_up'
      };

      mockFetch.mockRejectedValueOnce(new Error('INVALID_ARGUMENT: Request contains invalid characters'));

      const result = await service.analyzeClinicalTranscription(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('⚠️ Formato de transcripción no válido');
      expect(result.error).toContain('La transcripción no pudo ser procesada por el modelo de IA');
    });

    it('debe manejar errores de quota con mensaje de recursos', async () => {
      const request: ClinicalAnalysisRequest = {
        transcription: 'Paciente con dolor crónico en la espalda baja. Refiere que el dolor se irradia hacia ambas piernas.',
        specialty: 'physiotherapy',
        sessionType: 'initial'
      };

      mockFetch.mockRejectedValueOnce(new Error('quota exceeded: Daily limit reached'));

      const result = await service.analyzeClinicalTranscription(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('📊 Límites de uso alcanzados');
      expect(result.error).toContain('Se han agotado los recursos del servicio de IA');
    });
  });

  describe('✅ Casos de Éxito - Escenarios Clínicos Reales', () => {
    it('debe procesar análisis clínico completo exitosamente', async () => {
      const clinicalTranscription = `
        Paciente de 45 años, sexo femenino, acude por dolor lumbar de 3 semanas de evolución. 
        El dolor se irradia hacia la pierna derecha y empeora al estar sentada. 
        Refiere antecedentes de hernia discal L4-L5 diagnosticada hace 2 años. 
        No presenta síntomas neurológicos asociados.
      `;

      const mockAnalysis = {
        success: true,
        analysis: {
          warnings: [
            {
              id: 'warn-001',
              severity: 'MEDIUM' as const,
              category: 'diagnosis',
              title: 'Posible radiculopatía',
              description: 'El dolor irradiado sugiere compromiso radicular',
              recommendation: 'Considerar estudios de imagen',
              evidence: 'Dolor que se irradia hacia la pierna derecha'
            }
          ],
          suggestions: [
            {
              id: 'sugg-001',
              type: 'assessment',
              title: 'Evaluación neurológica completa',
              description: 'Realizar examen neurológico detallado',
              rationale: 'Para descartar compromiso radicular',
              priority: 'HIGH' as const
            }
          ],
          soap_analysis: {
            subjective_completeness: 85,
            objective_completeness: 60,
            assessment_quality: 75,
            plan_appropriateness: 80,
            overall_quality: 75,
            missing_elements: ['Examen físico detallado', 'Plan de tratamiento específico']
          },
          session_quality: {
            communication_score: 90,
            clinical_thoroughness: 75,
            patient_engagement: 85,
            professional_standards: 95,
            areas_for_improvement: ['Documentar examen físico', 'Establecer objetivos claros']
          }
        },
        metadata: {
          specialty: 'physiotherapy',
          sessionType: 'initial',
          processingTimeMs: 2500,
          timestamp: new Date().toISOString()
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map(),
        json: async () => mockAnalysis
      });

      const request: ClinicalAnalysisRequest = {
        transcription: clinicalTranscription,
        specialty: 'physiotherapy',
        sessionType: 'initial'
      };

      const result = await service.analyzeClinicalTranscription(request);

      expect(result.success).toBe(true);
      expect(result.analysis).toBeDefined();
      expect(result.analysis?.warnings).toHaveLength(1);
      expect(result.analysis?.suggestions).toHaveLength(1);
      expect(result.analysis?.soap_analysis.overall_quality).toBe(75);
      expect(result.metadata?.processingTimeMs).toBe(2500);
    });

    it('debe manejar respuesta exitosa sin análisis detallado', async () => {
      const request: ClinicalAnalysisRequest = {
        transcription: 'Transcripción básica válida',
        specialty: 'psychology',
        sessionType: 'follow_up'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map(),
        json: async () => ({
          success: true,
          analysis: {},
          metadata: {
            specialty: 'psychology',
            sessionType: 'follow_up',
            processingTimeMs: 1200,
            timestamp: new Date().toISOString()
          }
        })
      });

      const result = await service.analyzeClinicalTranscription(request);

      expect(result.success).toBe(true);
      expect(result.analysis).toBeDefined();
      expect(result.metadata?.processingTimeMs).toBe(1200);
    });
  });

  describe('🔧 Métodos Auxiliares - Funcionalidad de Soporte', () => {
    it('debe validar transcripciones correctamente', () => {
      expect(service.validateTranscription('')).toEqual({
        isValid: false,
        error: 'La transcripción está vacía'
      });

      expect(service.validateTranscription('Hola')).toEqual({
        isValid: false,
        error: 'La transcripción es demasiado corta (mínimo 10 caracteres)'
      });

      expect(service.validateTranscription('Hola mundo')).toEqual({
        isValid: false,
        error: 'No se ha podido detectar una transcripción clara. Por favor, verifique su micrófono e inténtelo de nuevo en un entorno con menos ruido de fondo.'
      });

      expect(service.validateTranscription('A'.repeat(50001))).toEqual({
        isValid: false,
        error: 'La transcripción es demasiado larga (máximo 50,000 caracteres)'
      });

      expect(service.validateTranscription('Transcripción válida con palabras reales')).toEqual({
        isValid: true
      });
    });

    it('debe verificar estado del servicio correctamente', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ version: 'v2.1.0', status: 'healthy' })
      });

      const status = await service.getServiceStatus();

      expect(status.available).toBe(true);
      expect(status.message).toContain('✅ Cerebro Clínico disponible');
      expect(status.message).toContain('v2.1.0');
    });

    it('debe manejar error en verificación de estado', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const status = await service.getServiceStatus();

      expect(status.available).toBe(false);
      expect(status.message).toContain('❌ Error verificando estado');
    });
  });

  describe('📊 Logging y Diagnóstico - Monitoreo en Producción', () => {
    it('debe registrar información detallada del request', async () => {
      const request: ClinicalAnalysisRequest = {
        transcription: 'Transcripción para logging',
        specialty: 'physiotherapy',
        sessionType: 'initial'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map(),
        json: async () => ({ success: true, analysis: {} })
      });

      await service.analyzeClinicalTranscription(request);

      expect(consoleSpy).toHaveBeenCalledWith(
        '🧠 INICIANDO DIAGNÓSTICO CLOUD FUNCTION:',
        expect.objectContaining({
          transcriptionLength: request.transcription.length,
          specialty: request.specialty,
          sessionType: request.sessionType
        })
      );
    });

    it('debe registrar información de respuesta exitosa', async () => {
      const request: ClinicalAnalysisRequest = {
        transcription: 'El paciente refiere mejoría en los síntomas de ansiedad. Ha implementado las técnicas de respiración recomendadas.',
        specialty: 'psychology',
        sessionType: 'follow_up'
      };

      // Mock con análisis completo para asegurar el log esperado
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map(),
        json: async () => ({
          success: true,
          analysis: {
            warnings: [{ id: 'w1' }],
            suggestions: [{ id: 's1' }],
            soap_analysis: { overall_quality: 85 }
          }
        })
      });

      await service.analyzeClinicalTranscription(request);

      // Verifica que el log esperado fue llamado en algún momento
      expect(consoleSpy).toHaveBeenCalledWith(
        '✅ Análisis recibido del Cerebro Clínico:',
        expect.objectContaining({
          success: true,
          warningsCount: 1,
          suggestionsCount: 1,
          overallQuality: 85
        })
      );
    });
  });
}); 