import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ClinicalAgent } from '../../../core/agent/ClinicalAgent';

// Mock de servicios externos
vi.mock('../../../services/GoogleCloudAudioService');
vi.mock('../../../services/AudioPipelineService');

describe('ClinicalAgent Enterprise Test Suite', () => {
  let clinicalAgent: ClinicalAgent;

  beforeEach(() => {
    // Configurar mocks antes de cada test
    vi.clearAllMocks();
    
    // Mock de configuración de entorno
    vi.stubEnv('GOOGLE_CLOUD_PROJECT_ID', 'test-project');
    vi.stubEnv('VERTEX_AI_LOCATION', 'us-central1');
    
    clinicalAgent = new ClinicalAgent({
      specialty: 'physiotherapy',
      sessionType: 'initial',
      enableRealTimeAnalysis: true
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('🧠 Análisis Clínico Completo', () => {
    it('debe procesar transcripción completa con análisis SOAP', async () => {
      // Arrange
      const mockTranscription = `
        Paciente de 45 años consulta por dolor lumbar de 3 semanas de evolución.
        El dolor se irradia hacia la pierna derecha y empeora con la flexión.
        No presenta pérdida de control de esfínteres ni debilidad progresiva.
        Refiere mejoría con reposo y empeoramiento con actividades de la vida diaria.
      `;

      const mockAnalysisResponse = {
        success: true,
        warnings: [
          {
            id: 'warning_001',
            severity: 'MEDIUM' as const,
            category: 'clinical_alert',
            title: 'Dolor irradiado a extremidad',
            description: 'Dolor lumbar con irradiación a pierna derecha',
            recommendation: 'Evaluar signos de compresión radicular',
            evidence: 'Síntomas sugestivos de radiculopatía'
          }
        ],
        suggestions: [
          {
            id: 'suggestion_001',
            type: 'assessment',
            title: 'Evaluación neurológica completa',
            description: 'Realizar test de Lasegue y evaluación de fuerza muscular',
            rationale: 'Necesario para evaluar compromiso neurológico',
            priority: 'HIGH' as const
          }
        ],
        soap_analysis: {
          subjective: {
            chief_complaint: 'Dolor lumbar con irradiación',
            history_present_illness: '3 semanas de evolución',
            relevant_history: 'Sin antecedentes relevantes'
          },
          objective: {
            examination_findings: 'Dolor a la palpación L4-L5',
            functional_assessment: 'Limitación en flexión lumbar'
          },
          assessment: {
            clinical_impression: 'Lumbociatalgia mecánica',
            differential_diagnosis: ['Hernia discal', 'Estenosis lumbar'],
            prognosis: 'Favorable con tratamiento conservador'
          },
          plan: {
            treatment_plan: 'Terapia manual y ejercicios específicos',
            follow_up_schedule: 'Control en 1 semana'
          }
        }
      };

      // Mock del servicio de análisis clínico
      vi.mocked(clinicalAgent['audioService'].analyzeClinicalTranscription).mockResolvedValue({
        success: true,
        analysis: {
          warnings: mockAnalysisResponse.warnings,
          suggestions: mockAnalysisResponse.suggestions,
          soap_analysis: {
            subjective_completeness: 85,
            objective_completeness: 80,
            assessment_quality: 90,
            plan_appropriateness: 85,
            overall_quality: 85,
            missing_elements: []
          },
          session_quality: {
            communication_score: 85,
            clinical_thoroughness: 80,
            patient_engagement: 85,
            professional_standards: 90,
            areas_for_improvement: []
          }
        },
        metadata: {
          specialty: 'physiotherapy',
          sessionType: 'initial',
          processingTimeMs: 1500,
          timestamp: new Date().toISOString()
        }
      });

      // Act
      const result = await clinicalAgent.analyzeTranscription(mockTranscription);

      // Assert
      expect(result.success).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.suggestions).toHaveLength(1);
      expect(result.soap_analysis).toBeDefined();
      // El SOAP analysis se construye con datos vacíos en el mock, no con los datos del mockAnalysisResponse
      expect(result.soap_analysis.subjective.chief_complaint).toBe('');
      
      // Verificar que se llamó al servicio con parámetros correctos
      expect(vi.mocked(clinicalAgent['audioService'].analyzeClinicalTranscription)).toHaveBeenCalledWith({
        transcription: mockTranscription,
        specialty: 'physiotherapy',
        sessionType: 'initial'
      });
    });

    it('debe manejar errores de análisis clínico graciosamente', async () => {
      // Arrange
      const mockTranscription = 'Transcripción de prueba';
      const mockError = new Error('Error de conexión con Cloud Function');

      // Mock del servicio que falla
      vi.mocked(clinicalAgent['audioService'].analyzeClinicalTranscription).mockRejectedValue(mockError);

      // Act
      const result = await clinicalAgent.analyzeTranscription(mockTranscription);

      // Assert - ClinicalAgent maneja errores retornando success: false, no lanzando excepciones
      expect(result.success).toBe(false);
      expect(result.error).toBe('Error de conexión con Cloud Function');
      expect(result.warnings).toHaveLength(0);
      expect(result.suggestions).toHaveLength(0);
    });

    it('debe validar transcripción antes del análisis', async () => {
      // Arrange
      const emptyTranscription = '';
      const veryLongTranscription = 'a'.repeat(10001); // Más de 10,000 caracteres

      // Act & Assert
      const emptyResult = await clinicalAgent.analyzeTranscription(emptyTranscription);
      expect(emptyResult.success).toBe(false);
      expect(emptyResult.error).toBe('Transcripción no puede estar vacía');

      const longResult = await clinicalAgent.analyzeTranscription(veryLongTranscription);
      expect(longResult.success).toBe(false);
      expect(longResult.error).toBe('Transcripción excede el límite máximo de 10,000 caracteres');
    });
  });

  describe('🎙️ Procesamiento de Audio en Tiempo Real', () => {
    it('debe iniciar grabación de audio con configuración correcta', async () => {
      // Arrange
      const mockStartRecording = vi.fn().mockResolvedValue(undefined);
      vi.mocked(clinicalAgent['audioPipeline'].startRecording).mockImplementation(mockStartRecording);
      
      const mockCallback = vi.fn();

      // Act
      await clinicalAgent.startAudioCapture(mockCallback);

      // Assert
      expect(mockStartRecording).toHaveBeenCalledWith();
      expect(clinicalAgent.isRecording).toBe(true);
    });

    it('debe detener grabación de audio correctamente', async () => {
      // Arrange
      const mockStopRecording = vi.fn().mockResolvedValue(true);
      vi.mocked(clinicalAgent['audioPipeline'].stopRecording).mockImplementation(mockStopRecording);
      
      clinicalAgent.isRecording = true;

      // Act
      await clinicalAgent.stopAudioCapture();

      // Assert
      expect(mockStopRecording).toHaveBeenCalled();
      expect(clinicalAgent.isRecording).toBe(false);
    });

    it('debe manejar errores de grabación de audio', async () => {
      // Arrange
      const mockError = new Error('Error de permisos de micrófono');
      vi.mocked(clinicalAgent['audioPipeline'].startRecording).mockRejectedValue(mockError);

      const mockCallback = vi.fn();

      // Act & Assert
      await expect(clinicalAgent.startAudioCapture(mockCallback))
        .rejects.toThrow('Error de permisos de micrófono');
    });
  });

  describe('🔍 Detección de Banderas Rojas', () => {
    it('debe detectar banderas rojas críticas en transcripción', async () => {
      // Arrange
      const transcriptionWithRedFlags = `
        Paciente refiere dolor lumbar severo que empeora por la noche.
        También presenta pérdida de peso inexplicada de 10 kg en 2 meses.
        Refiere hormigueo en ambas piernas y pérdida de control de esfínteres.
      `;

      const mockResponseWithRedFlags = {
        success: true,
        warnings: [
          {
            id: 'red_flag_001',
            severity: 'HIGH' as const,
            category: 'red_flag' as const,
            title: 'Pérdida de control de esfínteres',
            description: 'Síntoma de compresión medular',
            recommendation: 'Derivación urgente a neurocirugía',
            evidence: 'Bandera roja crítica detectada'
          },
          {
            id: 'red_flag_002',
            severity: 'HIGH' as const,
            category: 'red_flag' as const,
            title: 'Pérdida de peso inexplicada',
            description: 'Posible patología sistémica',
            recommendation: 'Evaluación médica urgente',
            evidence: 'Bandera roja crítica detectada'
          }
        ],
        suggestions: [],
        soap_analysis: {}
      };

      vi.mocked(clinicalAgent['audioService'].analyzeClinicalTranscription)
        .mockResolvedValue({
          success: true,
          analysis: {
            warnings: mockResponseWithRedFlags.warnings,
            suggestions: mockResponseWithRedFlags.suggestions,
            soap_analysis: {
              subjective_completeness: 85,
              objective_completeness: 80,
              assessment_quality: 90,
              plan_appropriateness: 85,
              overall_quality: 85,
              missing_elements: []
            },
            session_quality: {
              communication_score: 85,
              clinical_thoroughness: 80,
              patient_engagement: 85,
              professional_standards: 90,
              areas_for_improvement: []
            }
          },
          metadata: {
            specialty: 'physiotherapy',
            sessionType: 'initial',
            processingTimeMs: 1500,
            timestamp: new Date().toISOString()
          }
        });

      // Act
      const result = await clinicalAgent.analyzeTranscription(transcriptionWithRedFlags);

      // Assert
      expect(result.warnings).toHaveLength(2);
      expect(result.warnings[0].severity).toBe('HIGH');
      expect(result.warnings[0].category).toBe('red_flag');
      expect(result.warnings[1].title).toContain('Pérdida de peso');
    });
  });

  describe('📊 Métricas de Calidad Clínica', () => {
    it('debe calcular métricas de calidad del análisis', async () => {
      // Arrange
      const mockTranscription = 'Transcripción de prueba para métricas';
      const mockResponse = {
        success: true,
        warnings: [],
        suggestions: [
          { id: '1', type: 'assessment' as const, title: 'Test 1', description: 'Desc 1', rationale: 'Motivo 1', priority: 'HIGH' as const },
          { id: '2', type: 'treatment' as const, title: 'Test 2', description: 'Desc 2', rationale: 'Motivo 2', priority: 'MEDIUM' as const }
        ],
        soap_analysis: {
          subjective: { chief_complaint: 'Dolor lumbar' },
          objective: { examination_findings: 'Limitación ROM' },
          assessment: { clinical_impression: 'Lumbalgia' },
          plan: { treatment_plan: 'Ejercicios' }
        }
      };

      vi.mocked(clinicalAgent['audioService'].analyzeClinicalTranscription)
        .mockResolvedValue({
          success: true,
          analysis: {
            warnings: mockResponse.warnings,
            suggestions: mockResponse.suggestions,
            soap_analysis: {
              subjective_completeness: 85,
              objective_completeness: 80,
              assessment_quality: 90,
              plan_appropriateness: 85,
              overall_quality: 85,
              missing_elements: []
            },
            session_quality: {
              communication_score: 85,
              clinical_thoroughness: 80,
              patient_engagement: 85,
              professional_standards: 90,
              areas_for_improvement: []
            }
          },
          metadata: {
            specialty: 'physiotherapy',
            sessionType: 'initial',
            processingTimeMs: 1500,
            timestamp: new Date().toISOString()
          }
        });

      // Act
      const result = await clinicalAgent.analyzeTranscription(mockTranscription);

      // Assert
      expect(result.success).toBe(true);
      expect(result.suggestions).toHaveLength(2);
      expect(result.soap_analysis).toBeDefined();
      // El SOAP analysis se construye con datos vacíos en el mock, no con los datos del mockResponse
      expect(result.soap_analysis.subjective.chief_complaint).toBe('');
    });
  });

  describe('⚙️ Configuración y Inicialización', () => {
    it('debe inicializar con configuración correcta', () => {
      // Assert
      expect(clinicalAgent.specialty).toBe('physiotherapy');
      expect(clinicalAgent.sessionType).toBe('initial');
      expect(clinicalAgent.enableRealTimeAnalysis).toBe(true);
      expect(clinicalAgent.isRecording).toBe(false);
    });

    it('debe validar configuración de especialidad', () => {
      // Act & Assert
      expect(() => new ClinicalAgent({ 
        specialty: 'invalid_specialty' as any,
        sessionType: 'initial'
      }))
        .toThrow('Especialidad no válida');
    });

    it('debe configurar timeouts apropiados', () => {
      // Assert
      expect(clinicalAgent['timeoutMs']).toBe(30000); // 30 segundos
      expect(clinicalAgent['retryAttempts']).toBe(3);
    });
  });
}); 