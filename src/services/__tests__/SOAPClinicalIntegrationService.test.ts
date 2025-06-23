/**
 * 🧪 TESTS UNITARIOS - SOAP CLINICAL INTEGRATION SERVICE
 * 
 * Tests completos para el servicio de integración SOAP-Clínica optimizado
 * Incluye tests para las nuevas funcionalidades de Tarea 1.2:
 * - Validación robusta de entrada
 * - Cache de entidades
 * - Manejo de errores con fallback
 * - Métricas de rendimiento
 * 
 * @author AiDuxCare Development Team
 * @version 1.0.0
 */

import SOAPClinicalIntegrationService, { 
  IntegratedProcessingResult, 
  IntegrationOptions 
} from '../SOAPClinicalIntegrationService';
import { Patient, ProfessionalContext, MedicalIndication } from '../ClinicalAssistantService';

// Mock de los servicios dependientes
jest.mock('../RealWorldSOAPProcessor');
jest.mock('../ClinicalAssistantService');

describe('SOAPClinicalIntegrationService', () => {
  let service: SOAPClinicalIntegrationService;
  let mockPatient: Patient;
  let mockProfessionalContext: ProfessionalContext;
  let mockMedicalIndications: MedicalIndication[];

  beforeEach(() => {
    // Configuración de mocks
    mockPatient = {
      id: 'test-patient-1',
      name: 'Juan Pérez',
      age: 35,
      gender: 'M',
      medicalHistory: [],
      currentMedications: []
    };

    mockProfessionalContext = {
      role: 'PHYSIOTHERAPIST',
      specialty: 'fisioterapia',
      location: 'Madrid, España',
      license: 'PT-12345',
      experience: 5
    };

    mockMedicalIndications = [
      {
        id: 'ind-1',
        name: 'Lumbalgia mecánica',
        category: 'MUSCULOSKELETAL',
        description: 'Dolor lumbar de origen mecánico',
        contraindications: [],
        warnings: []
      }
    ];

    // Crear instancia del servicio con configuración de test
    service = new SOAPClinicalIntegrationService({
      enableDetailedLogging: true,
      enablePerformanceMetrics: true,
      enableEntityCache: true,
      maxRetries: 2,
      timeoutMs: 5000
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    service.clearLog();
    service.clearExpiredCache();
  });

  describe('Constructor y Configuración', () => {
    test('debe crear instancia con configuración por defecto', () => {
      const defaultService = new SOAPClinicalIntegrationService();
      expect(defaultService).toBeInstanceOf(SOAPClinicalIntegrationService);
    });

    test('debe crear instancia con configuración personalizada', () => {
      const customOptions: IntegrationOptions = {
        soapOptions: {
          specialty: 'psicologia',
          confidenceThreshold: 0.8
        },
        clinicalOptions: {
          enableRedFlagDetection: false
        },
        enableEntityCache: false,
        maxRetries: 5
      };

      const customService = new SOAPClinicalIntegrationService(customOptions);
      expect(customService).toBeInstanceOf(SOAPClinicalIntegrationService);
    });
  });

  describe('Validación de Entrada', () => {
    test('debe validar transcripción válida', async () => {
      const validTranscription = 'Paciente refiere dolor lumbar desde hace una semana.';
      
      const result = await service.processCompletePipeline(
        validTranscription,
        mockPatient,
        mockProfessionalContext,
        mockMedicalIndications
      );

      expect(result.processingStatus).toBe('SUCCESS');
      expect(result.errors).toHaveLength(0);
    });

    test('debe rechazar transcripción muy corta', async () => {
      const shortTranscription = 'Dolor.';
      
      const result = await service.processCompletePipeline(
        shortTranscription,
        mockPatient,
        mockProfessionalContext,
        mockMedicalIndications
      );

      expect(result.processingStatus).toBe('FAILED');
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toContain('al menos 10 caracteres');
    });

    test('debe rechazar transcripción vacía', async () => {
      const emptyTranscription = '';
      
      const result = await service.processCompletePipeline(
        emptyTranscription,
        mockPatient,
        mockProfessionalContext,
        mockMedicalIndications
      );

      expect(result.processingStatus).toBe('FAILED');
      expect(result.errors).toHaveLength(1);
    });

    test('debe rechazar paciente sin ID', async () => {
      const invalidPatient = { ...mockPatient, id: '' };
      const validTranscription = 'Paciente refiere dolor lumbar desde hace una semana.';
      
      const result = await service.processCompletePipeline(
        validTranscription,
        invalidPatient,
        mockProfessionalContext,
        mockMedicalIndications
      );

      expect(result.processingStatus).toBe('FAILED');
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toContain('ID válido');
    });

    test('debe rechazar contexto profesional sin rol', async () => {
      const invalidContext = { ...mockProfessionalContext, role: '' };
      const validTranscription = 'Paciente refiere dolor lumbar desde hace una semana.';
      
      const result = await service.processCompletePipeline(
        validTranscription,
        mockPatient,
        invalidContext,
        mockMedicalIndications
      );

      expect(result.processingStatus).toBe('FAILED');
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toContain('rol válido');
    });
  });

  describe('Cache de Entidades', () => {
    test('debe usar cache cuando está habilitado', async () => {
      const transcription = 'Paciente refiere dolor lumbar desde hace una semana.';
      
      // Primera llamada - debe ser cache miss
      const result1 = await service.processCompletePipeline(
        transcription,
        mockPatient,
        mockProfessionalContext,
        mockMedicalIndications
      );

      // Segunda llamada - debe ser cache hit
      const result2 = await service.processCompletePipeline(
        transcription,
        mockPatient,
        mockProfessionalContext,
        mockMedicalIndications
      );

      const cacheStats = service.getCacheStats();
      expect(cacheStats.hits).toBeGreaterThan(0);
      expect(cacheStats.misses).toBeGreaterThan(0);
      expect(cacheStats.hitRate).toBeGreaterThan(0);
    });

    test('debe obtener estadísticas de cache correctas', () => {
      const stats = service.getCacheStats();
      
      expect(stats).toHaveProperty('hits');
      expect(stats).toHaveProperty('misses');
      expect(stats).toHaveProperty('hitRate');
      expect(stats).toHaveProperty('size');
      
      expect(typeof stats.hits).toBe('number');
      expect(typeof stats.misses).toBe('number');
      expect(typeof stats.hitRate).toBe('number');
      expect(typeof stats.size).toBe('number');
    });

    test('debe limpiar cache expirado', () => {
      // Simular cache con entradas expiradas
      const mockCache = {
        'key1': {
          entities: [],
          timestamp: Date.now() - 10 * 60 * 1000, // 10 minutos atrás
          ttl: 5 * 60 * 1000 // 5 minutos TTL
        },
        'key2': {
          entities: [],
          timestamp: Date.now(),
          ttl: 5 * 60 * 1000
        }
      };

      // Mock del cache interno
      (service as any).entityCache = mockCache;
      
      service.clearExpiredCache();
      
      const stats = service.getCacheStats();
      expect(stats.size).toBe(1); // Solo debe quedar key2
    });
  });

  describe('Manejo de Errores y Fallback', () => {
    test('debe manejar errores de procesamiento SOAP', async () => {
      // Mock para simular error en RealWorldSOAPProcessor
      const mockProcessor = require('../RealWorldSOAPProcessor').default;
      mockProcessor.mockImplementation(() => ({
        processTranscription: jest.fn().mockRejectedValue(new Error('Error de procesamiento SOAP'))
      }));

      const transcription = 'Paciente refiere dolor lumbar desde hace una semana.';
      
      const result = await service.processCompletePipeline(
        transcription,
        mockPatient,
        mockProfessionalContext,
        mockMedicalIndications
      );

      expect(result.processingStatus).toBe('FAILED');
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].step).toBe('SOAP_PROCESSING');
    });

    test('debe manejar errores de filtrado de indicaciones', async () => {
      // Mock para simular error en ClinicalAssistantService
      const mockAssistant = require('../ClinicalAssistantService').ClinicalAssistantService;
      mockAssistant.mockImplementation(() => ({
        filterMedicalIndications: jest.fn().mockImplementation(() => {
          throw new Error('Error de filtrado de indicaciones');
        })
      }));

      const transcription = 'Paciente refiere dolor lumbar desde hace una semana.';
      
      const result = await service.processCompletePipeline(
        transcription,
        mockPatient,
        mockProfessionalContext,
        mockMedicalIndications
      );

      expect(result.processingStatus).toBe('PARTIAL_SUCCESS');
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].step).toBe('INDICATION_FILTERING');
      expect(result.medicalIndications.relevantIndications).toHaveLength(0);
    });

    test('debe retornar estructura válida en caso de error total', async () => {
      // Mock para simular error fatal
      const mockProcessor = require('../RealWorldSOAPProcessor').default;
      mockProcessor.mockImplementation(() => ({
        processTranscription: jest.fn().mockRejectedValue(new Error('Error fatal'))
      }));

      const transcription = 'Paciente refiere dolor lumbar desde hace una semana.';
      
      const result = await service.processCompletePipeline(
        transcription,
        mockPatient,
        mockProfessionalContext,
        mockMedicalIndications
      );

      expect(result.processingStatus).toBe('FAILED');
      expect(result.soapResult.segments).toHaveLength(0);
      expect(result.clinicalEntities).toHaveLength(0);
      expect(result.medicalIndications.relevantIndications).toHaveLength(0);
      expect(result.integrationMetrics.errorCount).toBeGreaterThan(0);
    });
  });

  describe('Métricas de Rendimiento', () => {
    test('debe calcular métricas de integración correctamente', async () => {
      const transcription = 'Paciente refiere dolor lumbar desde hace una semana.';
      
      const result = await service.processCompletePipeline(
        transcription,
        mockPatient,
        mockProfessionalContext,
        mockMedicalIndications
      );

      expect(result.integrationMetrics).toHaveProperty('totalProcessingTimeMs');
      expect(result.integrationMetrics).toHaveProperty('soapProcessingTimeMs');
      expect(result.integrationMetrics).toHaveProperty('clinicalAnalysisTimeMs');
      expect(result.integrationMetrics).toHaveProperty('entityExtractionCount');
      expect(result.integrationMetrics).toHaveProperty('warningCount');
      expect(result.integrationMetrics).toHaveProperty('guidelineCount');
      expect(result.integrationMetrics).toHaveProperty('cacheHitRate');
      expect(result.integrationMetrics).toHaveProperty('errorCount');

      expect(typeof result.integrationMetrics.totalProcessingTimeMs).toBe('number');
      expect(result.integrationMetrics.totalProcessingTimeMs).toBeGreaterThan(0);
    });

    test('debe incluir métricas de cache en el resultado', async () => {
      const transcription = 'Paciente refiere dolor lumbar desde hace una semana.';
      
      const result = await service.processCompletePipeline(
        transcription,
        mockPatient,
        mockProfessionalContext,
        mockMedicalIndications
      );

      expect(result.integrationMetrics.cacheHitRate).toBeGreaterThanOrEqual(0);
      expect(result.integrationMetrics.cacheHitRate).toBeLessThanOrEqual(1);
    });
  });

  describe('Logging y Auditoría', () => {
    test('debe registrar logs detallados cuando está habilitado', async () => {
      const transcription = 'Paciente refiere dolor lumbar desde hace una semana.';
      
      await service.processCompletePipeline(
        transcription,
        mockPatient,
        mockProfessionalContext,
        mockMedicalIndications
      );

      const logs = service.getProcessingLog();
      expect(logs.length).toBeGreaterThan(0);
      
      // Verificar que hay logs de inicio y fin
      const startLog = logs.find(log => log.step === 'PIPELINE_START');
      const completeLog = logs.find(log => log.step === 'PIPELINE_COMPLETE');
      
      expect(startLog).toBeDefined();
      expect(completeLog).toBeDefined();
    });

    test('debe limpiar logs correctamente', async () => {
      const transcription = 'Paciente refiere dolor lumbar desde hace una semana.';
      
      await service.processCompletePipeline(
        transcription,
        mockPatient,
        mockProfessionalContext,
        mockMedicalIndications
      );

      expect(service.getProcessingLog().length).toBeGreaterThan(0);
      
      service.clearLog();
      expect(service.getProcessingLog().length).toBe(0);
    });
  });

  describe('Resumen de Procesamiento', () => {
    test('debe generar resumen de procesamiento válido', async () => {
      const transcription = 'Paciente refiere dolor lumbar desde hace una semana.';
      
      const result = await service.processCompletePipeline(
        transcription,
        mockPatient,
        mockProfessionalContext,
        mockMedicalIndications
      );

      const summary = service.getProcessingSummary(result);
      
      expect(summary).toHaveProperty('summary');
      expect(summary).toHaveProperty('keyFindings');
      expect(summary).toHaveProperty('recommendations');
      expect(summary).toHaveProperty('riskLevel');
      
      expect(typeof summary.summary).toBe('string');
      expect(Array.isArray(summary.keyFindings)).toBe(true);
      expect(Array.isArray(summary.recommendations)).toBe(true);
      expect(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).toContain(summary.riskLevel);
    });
  });

  describe('Casos de Uso Específicos', () => {
    test('debe procesar transcripción con banderas rojas', async () => {
      const transcriptionWithRedFlags = 'Paciente refiere dolor lumbar con pérdida de control de esfínteres y debilidad en las piernas.';
      
      const result = await service.processCompletePipeline(
        transcriptionWithRedFlags,
        mockPatient,
        mockProfessionalContext,
        mockMedicalIndications
      );

      expect(result.processingStatus).toBe('SUCCESS');
      expect(result.medicalIndications.warnings.length).toBeGreaterThan(0);
    });

    test('debe procesar transcripción larga eficientemente', async () => {
      const longTranscription = 'Paciente refiere dolor lumbar desde hace una semana. ' +
        'El dolor se irradia hacia la pierna derecha y empeora con la sedestación. ' +
        'Al examinar se evidencia contractura de musculatura paravertebral L4-L5. ' +
        'Test de Lasègue positivo a la derecha. Rango de movimiento lumbar limitado. ' +
        'Cuadro compatible con lumbociatalgia derecha. Recomiendo terapia manual y ejercicios.';
      
      const startTime = Date.now();
      const result = await service.processCompletePipeline(
        longTranscription,
        mockPatient,
        mockProfessionalContext,
        mockMedicalIndications
      );
      const endTime = Date.now();

      expect(result.processingStatus).toBe('SUCCESS');
      expect(endTime - startTime).toBeLessThan(10000); // Menos de 10 segundos
      expect(result.integrationMetrics.totalProcessingTimeMs).toBeLessThan(10000);
    });

    test('debe manejar múltiples especialidades', async () => {
      const fisioContext = { ...mockProfessionalContext, specialty: 'fisioterapia' };
      const psicoContext = { ...mockProfessionalContext, specialty: 'psicologia' };
      
      const transcription = 'Paciente refiere dolor lumbar desde hace una semana.';
      
      const resultFisio = await service.processCompletePipeline(
        transcription,
        mockPatient,
        fisioContext,
        mockMedicalIndications
      );

      const resultPsico = await service.processCompletePipeline(
        transcription,
        mockPatient,
        psicoContext,
        mockMedicalIndications
      );

      expect(resultFisio.processingStatus).toBe('SUCCESS');
      expect(resultPsico.processingStatus).toBe('SUCCESS');
    });
  });
});
