const request = require('supertest');
const express = require('express');
const { clinicalBrain } = require('../index');

// Mock de las dependencias para testing
jest.mock('@google-cloud/aiplatform');
jest.mock('@google-cloud/storage');

describe('Clinical Brain Integration Tests', () => {
  let app;

  beforeAll(() => {
    // Configurar Express app para testing
    app = express();
    app.use(express.json());
    app.use('/', clinicalBrain);
  });

  beforeEach(() => {
    // Limpiar mocks
    jest.clearAllMocks();
  });

  describe('Health Check', () => {
    test('should return healthy status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toEqual({
        status: 'healthy',
        service: 'clinical-brain',
        timestamp: expect.any(String),
        version: '1.0.0'
      });
    });
  });

  describe('Clinical Analysis', () => {
    test('should validate required fields', async () => {
      const response = await request(app)
        .post('/analyze')
        .send({})
        .expect(400);

      expect(response.body).toEqual({
        error: 'Missing required fields',
        required: ['transcription', 'specialty'],
        received: []
      });
    });

    test('should accept valid analysis request', async () => {
      // Mock successful Vertex AI response
      const mockVertexResponse = {
        warnings: [],
        suggestions: [],
        soap_analysis: {
          subjective_completeness: 85,
          objective_completeness: 70,
          assessment_quality: 90,
          plan_appropriateness: 80,
          overall_quality: 81,
          missing_elements: []
        },
        session_quality: {
          communication_score: 85,
          clinical_thoroughness: 78,
          patient_engagement: 92,
          professional_standards: 88,
          areas_for_improvement: []
        }
      };

      // Mock VertexAI
      const mockVertexAI = {
        getGenerativeModel: jest.fn().mockReturnValue({
          generateContent: jest.fn().mockResolvedValue({
            response: {
              text: () => JSON.stringify(mockVertexResponse)
            }
          })
        })
      };

      // Mock Storage
      const mockStorage = {
        bucket: jest.fn().mockReturnValue({
          file: jest.fn().mockReturnValue({
            exists: jest.fn().mockResolvedValue([true]),
            download: jest.fn().mockResolvedValue([
              JSON.stringify({
                rules: { physiotherapy: ['Test rule'] },
                terminology: { physiotherapy: [] }
              })
            ])
          })
        })
      };

      const validRequest = {
        transcription: "Paciente refiere dolor en hombro derecho de 3 semanas de evolución...",
        specialty: "physiotherapy",
        sessionType: "initial"
      };

      const response = await request(app)
        .post('/analyze')
        .send(validRequest)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        analysis: expect.objectContaining({
          warnings: expect.any(Array),
          suggestions: expect.any(Array),
          soap_analysis: expect.objectContaining({
            subjective_completeness: expect.any(Number),
            objective_completeness: expect.any(Number),
            assessment_quality: expect.any(Number),
            plan_appropriateness: expect.any(Number),
            overall_quality: expect.any(Number),
            missing_elements: expect.any(Array)
          }),
          session_quality: expect.objectContaining({
            communication_score: expect.any(Number),
            clinical_thoroughness: expect.any(Number),
            patient_engagement: expect.any(Number),
            professional_standards: expect.any(Number),
            areas_for_improvement: expect.any(Array)
          })
        }),
        metadata: expect.objectContaining({
          specialty: 'physiotherapy',
          sessionType: 'initial',
          processingTimeMs: expect.any(Number),
          timestamp: expect.any(String),
          version: '1.0.0'
        })
      });
    });

    test('should handle analysis errors gracefully', async () => {
      // Mock error en Vertex AI
      const mockVertexAI = {
        getGenerativeModel: jest.fn().mockReturnValue({
          generateContent: jest.fn().mockRejectedValue(new Error('Vertex AI error'))
        })
      };

      const validRequest = {
        transcription: "Test transcription",
        specialty: "physiotherapy"
      };

      const response = await request(app)
        .post('/analyze')
        .send(validRequest)
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: 'Clinical analysis failed',
        message: expect.any(String),
        metadata: expect.objectContaining({
          processingTimeMs: expect.any(Number),
          timestamp: expect.any(String)
        })
      });
    });
  });

  describe('CORS Configuration', () => {
    test('should handle OPTIONS preflight request', async () => {
      const response = await request(app)
        .options('/analyze')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
      expect(response.headers['access-control-allow-methods']).toBeDefined();
      expect(response.headers['access-control-allow-headers']).toBeDefined();
    });

    test('should include CORS headers in responses', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
      expect(response.headers['access-control-allow-methods']).toBeDefined();
      expect(response.headers['access-control-allow-headers']).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('should return 404 for unknown endpoints', async () => {
      const response = await request(app)
        .get('/unknown-endpoint')
        .expect(404);

      expect(response.body).toEqual({
        error: 'Endpoint not found',
        availableEndpoints: ['/analyze', '/health']
      });
    });

    test('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/analyze')
        .send('invalid json')
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });
});

// Tests unitarios de componentes individuales
describe('Unit Tests', () => {
  describe('PromptFactory', () => {
    const PromptFactory = require('../src/services/PromptFactory');

    test('should generate valid prompt for physiotherapy', () => {
      const knowledgeBase = {
        rules: { physiotherapy: ['Test rule'] },
        terminology: { physiotherapy: [] }
      };

      const factory = new PromptFactory(knowledgeBase);
      const prompt = factory.generatePrompt(
        'Test transcription',
        'physiotherapy',
        'initial'
      );

      expect(prompt).toContain('ESPECIALIZACIÓN: FISIOTERAPIA');
      expect(prompt).toContain('TIPO DE SESIÓN: EVALUACIÓN INICIAL');
      expect(prompt).toContain('Test transcription');
      expect(prompt).toContain('FORMATO DE RESPUESTA REQUERIDO');
    });

    test('should handle missing knowledge base gracefully', () => {
      const factory = new PromptFactory(null);
      const prompt = factory.generatePrompt(
        'Test transcription',
        'physiotherapy',
        'initial'
      );

      expect(prompt).toContain('Base de conocimiento no disponible');
      expect(prompt).toContain('Test transcription');
    });
  });

  describe('ResponseParser', () => {
    const ResponseParser = require('../src/services/ResponseParser');

    test('should parse valid JSON response', () => {
      const parser = new ResponseParser({});
      const validResponse = {
        warnings: [],
        suggestions: [],
        soap_analysis: {
          subjective_completeness: 85,
          objective_completeness: 70,
          assessment_quality: 90,
          plan_appropriateness: 80,
          overall_quality: 81,
          missing_elements: []
        },
        session_quality: {
          communication_score: 85,
          clinical_thoroughness: 78,
          patient_engagement: 92,
          professional_standards: 88,
          areas_for_improvement: []
        }
      };

      const result = parser.parse(JSON.stringify(validResponse), 'physiotherapy');

      expect(result).toEqual(expect.objectContaining({
        warnings: expect.any(Array),
        suggestions: expect.any(Array),
        soap_analysis: expect.any(Object),
        session_quality: expect.any(Object)
      }));
    });

    test('should create fallback response on parse error', () => {
      const parser = new ResponseParser({});
      const result = parser.parse('invalid json', 'physiotherapy');

      expect(result).toEqual(expect.objectContaining({
        warnings: expect.arrayContaining([
          expect.objectContaining({
            id: 'fallback_warning_001',
            severity: 'MEDIUM',
            category: 'clinical_alert'
          })
        ]),
        suggestions: expect.arrayContaining([
          expect.objectContaining({
            id: 'fallback_suggestion_001',
            type: 'additional_evaluation'
          })
        ])
      }));
    });
  });
});

// Tests de performance
describe('Performance Tests', () => {
  test('should process analysis within acceptable time', async () => {
    const startTime = Date.now();
    
    // Mock rápido para test de performance
    const mockResponse = {
      warnings: [],
      suggestions: [],
      soap_analysis: {
        subjective_completeness: 85,
        objective_completeness: 70,
        assessment_quality: 90,
        plan_appropriateness: 80,
        overall_quality: 81,
        missing_elements: []
      },
      session_quality: {
        communication_score: 85,
        clinical_thoroughness: 78,
        patient_engagement: 92,
        professional_standards: 88,
        areas_for_improvement: []
      }
    };

    const validRequest = {
      transcription: "Test transcription for performance",
      specialty: "physiotherapy"
    };

    const response = await request(app)
      .post('/analyze')
      .send(validRequest);

    const processingTime = Date.now() - startTime;
    
    // Verificar que el procesamiento sea rápido (menos de 5 segundos en test)
    expect(processingTime).toBeLessThan(5000);
    
    if (response.body.success) {
      expect(response.body.metadata.processingTimeMs).toBeLessThan(5000);
    }
  });
}); 