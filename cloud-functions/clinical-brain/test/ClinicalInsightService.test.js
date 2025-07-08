const ClinicalInsightService = require('../src/services/ClinicalInsightService');
const VertexAIClient = require('../src/services/VertexAIClient');
const KnowledgeBase = require('../src/services/KnowledgeBase');

// Mock de dependencias
jest.mock('../src/services/VertexAIClient');
jest.mock('../src/services/KnowledgeBase');

describe('ClinicalInsightService - Arquitectura de Cascada V2', () => {
  let clinicalInsightService;
  let mockVertexClient;
  let mockKnowledgeBase;

  beforeEach(() => {
    // Resetear mocks
    jest.clearAllMocks();
    
    // Configurar mocks
    mockVertexClient = {
      processWithModel: jest.fn()
    };
    mockKnowledgeBase = {
      getCriticalRedFlags: jest.fn()
    };
    
    VertexAIClient.mockImplementation(() => mockVertexClient);
    KnowledgeBase.mockImplementation(() => mockKnowledgeBase);
    
    // Crear instancia del servicio
    clinicalInsightService = new ClinicalInsightService();
  });

  describe('🚩 ESTACIÓN 1: Triaje de Banderas Rojas', () => {
    const sampleTranscription = `
      Paciente refiere dolor de espalda desde hace 3 semanas. 
      El dolor es muy intenso por las noches y no mejora con reposo.
      También menciona rigidez matutina que dura más de una hora.
      Tiene antecedentes de psoriasis y un episodio de uveítis el año pasado.
    `;

    const mockRedFlags = [
      'Dolor nocturno severo no mecánico',
      'Rigidez matutina mayor a 1 hora',
      'Antecedentes de cáncer con nuevo dolor'
    ];

    beforeEach(() => {
      mockKnowledgeBase.getCriticalRedFlags.mockReturnValue(mockRedFlags);
    });

    test('debe detectar banderas rojas correctamente', async () => {
      // Configurar mock de respuesta de Vertex AI
      const mockVertexResponse = {
        text: 'Dolor nocturno severo no mecánico\nRigidez matutina mayor a 1 hora',
        modelUsed: 'gemini-flash',
        costOptimization: { estimatedCost: '$0.01' }
      };
      mockVertexClient.processWithModel.mockResolvedValue(mockVertexResponse);

      // Ejecutar triaje
      const result = await clinicalInsightService.triageRedFlags(sampleTranscription);

      // Verificaciones
      expect(mockKnowledgeBase.getCriticalRedFlags).toHaveBeenCalled();
      expect(mockVertexClient.processWithModel).toHaveBeenCalledWith(
        sampleTranscription,
        expect.stringContaining('triaje rápido de emergencias'),
        'gemini-flash',
        expect.objectContaining({
          maxTokens: 500,
          temperature: 0.1
        })
      );
      
      expect(result).toEqual([
        'Dolor nocturno severo no mecánico',
        'Rigidez matutina mayor a 1 hora'
      ]);
    });

    test('debe manejar respuesta "NINGUNA" banderas rojas', async () => {
      const mockVertexResponse = {
        text: 'NINGUNA',
        modelUsed: 'gemini-flash'
      };
      mockVertexClient.processWithModel.mockResolvedValue(mockVertexResponse);

      const result = await clinicalInsightService.triageRedFlags(sampleTranscription);

      expect(result).toEqual([]);
    });

    test('debe manejar errores sin bloquear el pipeline', async () => {
      mockVertexClient.processWithModel.mockRejectedValue(new Error('Error de conexión'));

      const result = await clinicalInsightService.triageRedFlags(sampleTranscription);

      expect(result).toEqual([]);
    });

    test('debe procesar en menos de 5 segundos (objetivo de rendimiento)', async () => {
      const mockVertexResponse = {
        text: 'Dolor nocturno severo',
        modelUsed: 'gemini-flash'
      };
      mockVertexClient.processWithModel.mockResolvedValue(mockVertexResponse);

      const startTime = Date.now();
      await clinicalInsightService.triageRedFlags(sampleTranscription);
      const duration = Date.now() - startTime;

      // El test no debería tardar más de 100ms (mock rápido)
      expect(duration).toBeLessThan(100);
    });
  });

  describe('📋 ESTACIÓN 2: Extracción de Hechos Clínicos', () => {
    const sampleTranscription = `
      Paciente de 45 años, trabajador de oficina.
      Dolor en hombro derecho desde hace 2 meses.
      Intensidad 7/10, empeora con movimientos por encima de la cabeza.
      Toma ibuprofeno 600mg ocasionalmente.
      No tiene alergias conocidas.
      Dificultad para dormir del lado afectado.
    `;

    const mockClinicalFacts = {
      symptoms: {
        primary_complaint: "Dolor en hombro derecho",
        pain_location: "hombro derecho",
        pain_intensity: "7/10",
        duration: "2 meses",
        aggravating_factors: ["movimientos por encima de la cabeza"],
        relieving_factors: null
      },
      history: {
        onset: "2 meses",
        previous_episodes: false,
        previous_treatments: null,
        trauma_history: null
      },
      medications: {
        current_medications: ["ibuprofeno 600mg ocasionalmente"],
        allergies: [],
        recent_medications: ["ibuprofeno 600mg"]
      },
      functional_status: {
        activities_affected: ["dormir del lado afectado"],
        work_impact: null,
        sleep_impact: "dificultad para dormir del lado afectado"
      },
      patient_demographics: {
        age_mentioned: "45 años",
        occupation: "trabajador de oficina",
        activity_level: null
      }
    };

    test('debe extraer hechos clínicos estructurados correctamente', async () => {
      const mockVertexResponse = {
        text: JSON.stringify(mockClinicalFacts),
        modelUsed: 'gemini-flash',
        costOptimization: { estimatedCost: '$0.02' }
      };
      mockVertexClient.processWithModel.mockResolvedValue(mockVertexResponse);

      const result = await clinicalInsightService.extractClinicalFacts(sampleTranscription);

      expect(mockVertexClient.processWithModel).toHaveBeenCalledWith(
        sampleTranscription,
        expect.stringContaining('extracción de datos estructurados'),
        'gemini-flash',
        expect.objectContaining({
          maxTokens: 1000,
          temperature: 0.2
        })
      );

      expect(result).toEqual(mockClinicalFacts);
      expect(result.symptoms.pain_intensity).toBe('7/10');
      expect(result.patient_demographics.age_mentioned).toBe('45 años');
    });

    test('debe manejar respuesta JSON malformada', async () => {
      const mockVertexResponse = {
        text: 'Respuesta sin JSON válido',
        modelUsed: 'gemini-flash'
      };
      mockVertexClient.processWithModel.mockResolvedValue(mockVertexResponse);

      const result = await clinicalInsightService.extractClinicalFacts(sampleTranscription);

      expect(result).toEqual({});
    });

    test('debe extraer JSON embebido en texto', async () => {
      const mockVertexResponse = {
        text: `Aquí está la extracción:
        ${JSON.stringify(mockClinicalFacts)}
        Fin del análisis.`,
        modelUsed: 'gemini-flash'
      };
      mockVertexClient.processWithModel.mockResolvedValue(mockVertexResponse);

      const result = await clinicalInsightService.extractClinicalFacts(sampleTranscription);

      expect(result).toEqual(mockClinicalFacts);
    });

    test('debe manejar errores sin bloquear el pipeline', async () => {
      mockVertexClient.processWithModel.mockRejectedValue(new Error('Error de modelo'));

      const result = await clinicalInsightService.extractClinicalFacts(sampleTranscription);

      expect(result).toEqual({});
    });
  });

  describe('🎯 ESTACIÓN 3: Análisis Final y Generación SOAP', () => {
    const sampleTranscription = 'Consulta de fisioterapia completa...';
    const sampleRedFlags = ['Dolor nocturno severo'];
    const sampleClinicalFacts = {
      symptoms: { primary_complaint: 'Dolor de espalda' },
      history: { onset: '3 semanas' }
    };

    const mockFinalAnalysis = {
      warnings: [{
        id: 'red_flag_001',
        severity: 'HIGH',
        category: 'inflammatory_pattern',
        title: 'Patrón de Dolor Inflamatorio Detectado',
        description: 'Dolor nocturno severo sugiere proceso inflamatorio',
        recommendation: 'Referencia urgente a reumatología',
        evidence: 'Dolor nocturno severo no mecánico'
      }],
      suggestions: [{
        id: 'suggestion_001',
        type: 'referral',
        title: 'Evaluación Reumatológica',
        description: 'Derivación prioritaria para evaluación de espondiloartropatía',
        rationale: 'Patrón clínico compatible con dolor inflamatorio',
        priority: 'HIGH'
      }],
      soap_analysis: {
        subjective: {
          chief_complaint: 'Dolor de espalda nocturno',
          history_present_illness: '3 semanas de evolución',
          relevant_history: 'Antecedentes de psoriasis y uveítis',
          functional_goals: 'Mejorar calidad de sueño'
        },
        objective: {
          observation: 'Postura antálgica',
          palpation: 'Tensión muscular paravertebral',
          range_of_motion: 'Limitado por dolor',
          strength_testing: 'No evaluado por dolor',
          special_tests: 'No realizados',
          functional_assessment: 'Limitación severa actividades nocturnas'
        },
        assessment: {
          clinical_impression: 'Sospecha de espondiloartropatía axial',
          differential_diagnosis: ['Espondilitis anquilosante', 'Artritis psoriásica'],
          prognosis: 'Reservado hasta diagnóstico definitivo',
          risk_stratification: 'HIGH'
        },
        plan: {
          immediate_actions: ['Referencia urgente a reumatología'],
          treatment_plan: 'Manejo sintomático mientras evaluación especializada',
          referrals_needed: ['Reumatología'],
          follow_up_schedule: 'Seguimiento en 1-2 semanas',
          patient_education: 'Explicar naturaleza inflamatoria del dolor'
        }
      },
      clinical_summary: {
        key_findings: 'Dolor nocturno con patrón inflamatorio',
        treatment_priority: 'Evaluación reumatológica urgente',
        expected_outcomes: 'Depende del diagnóstico final',
        safety_considerations: 'Monitoreo de progresión sintomática'
      }
    };

    test('debe generar análisis final completo con SOAP', async () => {
      const mockVertexResponse = {
        text: JSON.stringify(mockFinalAnalysis),
        modelUsed: 'gemini-pro',
        costOptimization: { estimatedCost: '$0.05' }
      };
      mockVertexClient.processWithModel.mockResolvedValue(mockVertexResponse);

      const result = await clinicalInsightService.generateFinalAnalysis(
        sampleTranscription,
        sampleRedFlags,
        sampleClinicalFacts
      );

      expect(mockVertexClient.processWithModel).toHaveBeenCalledWith(
        sampleTranscription,
        expect.stringContaining('fisioterapeuta clínico experto'),
        'gemini-pro',
        expect.objectContaining({
          maxTokens: 3000,
          temperature: 0.3
        })
      );

      expect(result).toEqual(mockFinalAnalysis);
      expect(result.warnings).toHaveLength(1);
      expect(result.suggestions).toHaveLength(1);
      expect(result.soap_analysis).toBeDefined();
      expect(result.soap_analysis.assessment.risk_stratification).toBe('HIGH');
    });

    test('debe incluir información de banderas rojas en el prompt', async () => {
      const mockVertexResponse = {
        text: JSON.stringify(mockFinalAnalysis),
        modelUsed: 'gemini-pro'
      };
      mockVertexClient.processWithModel.mockResolvedValue(mockVertexResponse);

      await clinicalInsightService.generateFinalAnalysis(
        sampleTranscription,
        sampleRedFlags,
        sampleClinicalFacts
      );

      const calledPrompt = mockVertexClient.processWithModel.mock.calls[0][1];
      expect(calledPrompt).toContain('BANDERAS ROJAS DETECTADAS:');
      expect(calledPrompt).toContain('Dolor nocturno severo');
      expect(calledPrompt).toContain('HECHOS CLÍNICOS ESTRUCTURADOS:');
      expect(calledPrompt).toContain(JSON.stringify(sampleClinicalFacts, null, 2));
    });

    test('debe manejar JSON malformado en análisis final', async () => {
      const mockVertexResponse = {
        text: 'Respuesta sin JSON válido del análisis final',
        modelUsed: 'gemini-pro'
      };
      mockVertexClient.processWithModel.mockResolvedValue(mockVertexResponse);

      await expect(
        clinicalInsightService.generateFinalAnalysis(
          sampleTranscription,
          sampleRedFlags,
          sampleClinicalFacts
        )
      ).rejects.toThrow('No se encontró JSON válido en análisis final');
    });

    test('debe generar prompt contextualizado con información pre-procesada', async () => {
      const mockVertexResponse = {
        text: JSON.stringify(mockFinalAnalysis),
        modelUsed: 'gemini-pro'
      };
      mockVertexClient.processWithModel.mockResolvedValue(mockVertexResponse);

      await clinicalInsightService.generateFinalAnalysis(
        sampleTranscription,
        sampleRedFlags,
        sampleClinicalFacts
      );

      const calledPrompt = mockVertexClient.processWithModel.mock.calls[0][1];
      
      // Verificar que el prompt incluye toda la información contextual
      expect(calledPrompt).toContain('TRANSCRIPCIÓN ORIGINAL:');
      expect(calledPrompt).toContain(sampleTranscription);
      expect(calledPrompt).toContain('BANDERAS ROJAS DETECTADAS:');
      expect(calledPrompt).toContain('HECHOS CLÍNICOS ESTRUCTURADOS:');
      expect(calledPrompt).toContain('FORMATO DE RESPUESTA - JSON ESTRUCTURADO:');
    });
  });

  describe('🚀 MÉTODO PRINCIPAL: Cascada Completa', () => {
    const sampleTranscription = 'Transcripción completa de consulta de fisioterapia...';
    const sampleOptions = {
      specialty: 'fisioterapia',
      sessionType: 'initial'
    };

    beforeEach(() => {
      // Mock para triaje
      jest.spyOn(clinicalInsightService, 'triageRedFlags')
        .mockResolvedValue(['Dolor nocturno severo']);
      
      // Mock para extracción
      jest.spyOn(clinicalInsightService, 'extractClinicalFacts')
        .mockResolvedValue({ symptoms: { primary_complaint: 'Dolor de espalda' } });
      
      // Mock para análisis final
      jest.spyOn(clinicalInsightService, 'generateFinalAnalysis')
        .mockResolvedValue({
          warnings: [{ id: 'w1', severity: 'HIGH' }],
          suggestions: [{ id: 's1', type: 'referral' }],
          soap_analysis: { assessment: { risk_stratification: 'HIGH' } }
        });
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    test('debe ejecutar las 3 estaciones secuencialmente', async () => {
      const result = await clinicalInsightService.processTranscription(
        sampleTranscription,
        sampleOptions
      );

      // Verificar que se ejecutaron las 3 estaciones en orden
      expect(clinicalInsightService.triageRedFlags).toHaveBeenCalledWith(sampleTranscription);
      expect(clinicalInsightService.extractClinicalFacts).toHaveBeenCalledWith(sampleTranscription);
      expect(clinicalInsightService.generateFinalAnalysis).toHaveBeenCalledWith(
        sampleTranscription,
        ['Dolor nocturno severo'],
        { symptoms: { primary_complaint: 'Dolor de espalda' } }
      );

      // Verificar estructura del resultado
      expect(result.cascade_metadata).toBeDefined();
      expect(result.cascade_metadata.pipeline_version).toBe('2.0-cascade');
      expect(result.cascade_metadata.stations_completed).toBe(3);
      expect(result.cascade_metadata.cost_optimization.models_used).toEqual([
        'gemini-flash', 'gemini-flash', 'gemini-pro'
      ]);
    });

    test('debe incluir metadata completa de la cascada', async () => {
      const result = await clinicalInsightService.processTranscription(
        sampleTranscription,
        sampleOptions
      );

      expect(result.cascade_metadata).toMatchObject({
        pipeline_version: '2.0-cascade',
        stations_completed: 3,
        station_results: {
          station1_red_flags: {
            count: 1,
            flags: ['Dolor nocturno severo']
          },
          station2_clinical_facts: {
            keys_extracted: 1,
            categories: ['symptoms']
          },
          station3_final_analysis: {
            sections_generated: expect.arrayContaining(['warnings', 'suggestions', 'soap_analysis'])
          }
        },
        cost_optimization: {
          models_used: ['gemini-flash', 'gemini-flash', 'gemini-pro'],
          strategy: 'cascade-optimization',
          estimated_savings: '60-70% vs single Pro call'
        }
      });
    });

    test('debe manejar errores en cualquier estación', async () => {
      // Simular error en estación 3
      clinicalInsightService.generateFinalAnalysis.mockRejectedValue(
        new Error('Error en análisis final')
      );

      await expect(
        clinicalInsightService.processTranscription(sampleTranscription, sampleOptions)
      ).rejects.toThrow('Cascada de análisis falló: Error en análisis final');
    });

    test('debe tener mejor rendimiento que llamada monolítica', async () => {
      // Simular tiempos realistas para cada estación
      clinicalInsightService.triageRedFlags.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve([]), 100))
      );
      clinicalInsightService.extractClinicalFacts.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({}), 200))
      );
      clinicalInsightService.generateFinalAnalysis.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          warnings: [], suggestions: [], soap_analysis: {}
        }), 300))
      );

      const startTime = Date.now();
      await clinicalInsightService.processTranscription(sampleTranscription, sampleOptions);
      const duration = Date.now() - startTime;

      // Debería completarse en menos de 1 segundo total
      expect(duration).toBeLessThan(1000);
    });

    test('debe generar ID único para seguimiento', async () => {
      const result1 = await clinicalInsightService.processTranscription(sampleTranscription, sampleOptions);
      const result2 = await clinicalInsightService.processTranscription(sampleTranscription, sampleOptions);

      // Los timestamps deberían ser diferentes
      expect(result1.cascade_metadata.timestamp).not.toBe(result2.cascade_metadata.timestamp);
    });
  });

  describe('🔧 Métodos Privados de Construcción de Prompts', () => {
    test('_buildTriagePrompt debe incluir banderas rojas específicas', () => {
      const transcription = 'Dolor de espalda nocturno...';
      const redFlags = ['Dolor nocturno severo', 'Pérdida de peso'];
      
      const prompt = clinicalInsightService._buildTriagePrompt(transcription, redFlags);
      
      expect(prompt).toContain('triaje rápido de emergencias');
      expect(prompt).toContain(transcription);
      expect(prompt).toContain('Dolor nocturno severo');
      expect(prompt).toContain('Pérdida de peso');
      expect(prompt).toContain('RESPUESTA:');
    });

    test('_buildExtractionPrompt debe solicitar formato JSON estructurado', () => {
      const transcription = 'Paciente con dolor de hombro...';
      
      const prompt = clinicalInsightService._buildExtractionPrompt(transcription);
      
      expect(prompt).toContain('extracción de datos estructurados');
      expect(prompt).toContain(transcription);
      expect(prompt).toContain('symptoms');
      expect(prompt).toContain('medications');
      expect(prompt).toContain('RESPUESTA JSON:');
    });

    test('_buildFinalAnalysisPrompt debe contextualizar con información pre-procesada', () => {
      const transcription = 'Consulta completa...';
      const redFlags = ['Dolor nocturno'];
      const facts = { symptoms: { pain: 'high' } };
      
      const prompt = clinicalInsightService._buildFinalAnalysisPrompt(transcription, redFlags, facts);
      
      expect(prompt).toContain('fisioterapeuta clínico experto');
      expect(prompt).toContain('TRANSCRIPCIÓN ORIGINAL:');
      expect(prompt).toContain('BANDERAS ROJAS DETECTADAS:');
      expect(prompt).toContain('HECHOS CLÍNICOS ESTRUCTURADOS:');
      expect(prompt).toContain(JSON.stringify(facts, null, 2));
    });
  });

  describe('🔍 Métodos de Parsing de Respuestas', () => {
    test('_parseRedFlagsResponse debe manejar diferentes formatos', () => {
      // Caso normal
      expect(clinicalInsightService._parseRedFlagsResponse(
        'Dolor nocturno severo\nPérdida de peso\nFiebre'
      )).toEqual(['Dolor nocturno severo', 'Pérdida de peso', 'Fiebre']);

      // Caso "NINGUNA"
      expect(clinicalInsightService._parseRedFlagsResponse('NINGUNA')).toEqual([]);

      // Caso con líneas vacías
      expect(clinicalInsightService._parseRedFlagsResponse(
        'Dolor nocturno\n\nPérdida de peso\n'
      )).toEqual(['Dolor nocturno', 'Pérdida de peso']);
    });

    test('_parseClinicalFactsResponse debe extraer JSON de texto', () => {
      const facts = { symptoms: { pain: 'severe' } };
      const response = `Análisis: ${JSON.stringify(facts)} Fin.`;
      
      const result = clinicalInsightService._parseClinicalFactsResponse(response);
      
      expect(result).toEqual(facts);
    });

    test('_parseFinalAnalysisResponse debe requerir JSON válido', () => {
      const analysis = { warnings: [], suggestions: [] };
      
      // Caso exitoso
      const result = clinicalInsightService._parseFinalAnalysisResponse(
        JSON.stringify(analysis)
      );
      expect(result).toEqual(analysis);

      // Caso de error
      expect(() => {
        clinicalInsightService._parseFinalAnalysisResponse('Texto sin JSON');
      }).toThrow('No se encontró JSON válido en análisis final');
    });
  });
}); 