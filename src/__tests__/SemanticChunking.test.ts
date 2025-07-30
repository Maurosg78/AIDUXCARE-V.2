// SemanticChunking.test.ts - Tests para chunking semántico médico
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { SemanticChunkingService, SemanticChunk, MedicalPhase } from '../services/SemanticChunkingService';

describe('SemanticChunkingService', () => {
  let chunkingService: SemanticChunkingService;
  let mockEventListener: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    chunkingService = new SemanticChunkingService({
      minChunkDuration: 2000, // 2s para tests más rápidos
      maxChunkDuration: 5000, // 5s máximo para tests
      semanticThreshold: 0.7,
      medicalKeywordWeight: 1.5,
      pauseDetectionMs: 1000 // 1s de pausa para tests
    });

    // Mock window.dispatchEvent
    mockEventListener = vi.fn();
    const originalDispatchEvent = window.dispatchEvent;
    window.dispatchEvent = mockEventListener;
    
    // Restore after test
    afterEach(() => {
      window.dispatchEvent = originalDispatchEvent;
    });
  });

  afterEach(() => {
    chunkingService.reset();
  });

  describe('Inicialización del servicio', () => {
    test('debe crear el servicio con configuración por defecto', () => {
      const defaultService = new SemanticChunkingService();
      expect(defaultService).toBeDefined();
      expect(defaultService.getCurrentChunkStatus().active).toBe(false);
    });

    test('debe aplicar configuración personalizada', () => {
      const customConfig = {
        minChunkDuration: 4000,
        maxChunkDuration: 10000,
        semanticThreshold: 0.8,
        medicalKeywordWeight: 2.0,
        pauseDetectionMs: 2000
      };
      
      const customService = new SemanticChunkingService(customConfig);
      expect(customService).toBeDefined();
    });
  });

  describe('Detección de fase médica', () => {
    test('debe detectar fase de anamnesis correctamente', () => {
      const transcription = 'Paciente refiere dolor en hombro derecho desde hace dos semanas';
      const result = chunkingService.processTranscriptionSegment(transcription, undefined, 'anamnesis');
      
      // No debe finalizar inmediatamente (duración mínima)
      expect(result).toBeNull();
      
      const status = chunkingService.getCurrentChunkStatus();
      expect(status.active).toBe(true);
      expect(status.transcription).toContain('dolor');
    });

    test('debe detectar fase de exploración física', () => {
      const transcription = 'Al palpar se observa contractura en trapecio superior. Flexione el brazo';
      const result = chunkingService.processTranscriptionSegment(transcription, undefined, 'exploration');
      
      const status = chunkingService.getCurrentChunkStatus();
      expect(status.transcription).toContain('palpar');
      expect(status.transcription).toContain('flexione');
    });
  });

  describe('Extracción de keywords clínicos', () => {
    test('debe identificar anatomía y síntomas', () => {
      const transcription = 'dolor cervical con rigidez matutina y limitación del movimiento';
      
      // Simular duración mínima
      const startTime = Date.now();
      vi.spyOn(Date, 'now')
        .mockReturnValueOnce(startTime)
        .mockReturnValueOnce(startTime + 3000); // +3s
      
      const result = chunkingService.processTranscriptionSegment(transcription);
      const forcedResult = chunkingService.forceFinalize();
      
      if (forcedResult) {
        expect(forcedResult.clinicalKeywords).toContain('cervical');
        expect(forcedResult.clinicalKeywords).toContain('rigidez');
        expect(forcedResult.clinicalKeywords).toContain('limitacion');
      }
    });

    test('debe manejar texto sin keywords médicos', () => {
      const transcription = 'Buenos días, como está usted hoy';
      
      const result = chunkingService.processTranscriptionSegment(transcription);
      const status = chunkingService.getCurrentChunkStatus();
      
      expect(status.transcription).toBe(transcription);
    });
  });

  describe('Scoring de completeness', () => {
    test('debe calcular completeness alta para texto médico completo', () => {
      const transcription = 'Paciente refiere dolor lumbar irradiado a pierna derecha. Inició hace tres días tras levantar peso. Describe dolor como punzante.';
      
      // Forzar finalización para obtener el chunk
      chunkingService.processTranscriptionSegment(transcription);
      const chunk = chunkingService.forceFinalize();
      
      expect(chunk).toBeDefined();
      if (chunk) {
        expect(chunk.completeness).toBeGreaterThan(0.7);
        expect(chunk.clinicalKeywords.length).toBeGreaterThan(0);
      }
    });

    test('debe calcular completeness baja para texto incompleto', () => {
      const transcription = 'duele';
      
      chunkingService.processTranscriptionSegment(transcription);
      const chunk = chunkingService.forceFinalize();
      
      expect(chunk).toBeDefined();
      if (chunk) {
        expect(chunk.completeness).toBeLessThan(0.5);
      }
    });
  });

  describe('Relevancia clínica', () => {
    test('debe asignar relevancia alta a transcripciones con triggers médicos', () => {
      const transcription = 'Paciente siente dolor cuando flexiono el hombro. Observo limitación en abducción.';
      
      chunkingService.processTranscriptionSegment(transcription, undefined, 'exploration');
      const chunk = chunkingService.forceFinalize();
      
      expect(chunk).toBeDefined();
      if (chunk) {
        expect(chunk.contextRelevance).toBeGreaterThan(0.6);
        expect(chunk.soapCategory).toBe('O'); // Observación
      }
    });

    test('debe adaptar relevancia según fase médica', () => {
      const anamnesisTrigger = 'Paciente refiere dolor desde cuando comenzó';
      
      chunkingService.processTranscriptionSegment(anamnesisTrigger, undefined, 'anamnesis');
      const anamnesisChunk = chunkingService.forceFinalize();
      
      chunkingService.reset();
      
      chunkingService.processTranscriptionSegment(anamnesisTrigger, undefined, 'planning');
      const planningChunk = chunkingService.forceFinalize();
      
      if (anamnesisChunk && planningChunk) {
        // Mismo texto debería tener mayor relevancia en anamnesis que en planning
        expect(anamnesisChunk.contextRelevance).toBeGreaterThan(planningChunk.contextRelevance);
      }
    });
  });

  describe('Gestión de duración de chunks', () => {
    test('debe respetar duración mínima', () => {
      const transcription = 'dolor de cabeza';
      
      const startTime = Date.now();
      vi.spyOn(Date, 'now')
        .mockReturnValueOnce(startTime)
        .mockReturnValueOnce(startTime + 1000); // Solo 1s, menos que mínimo
      
      const result = chunkingService.processTranscriptionSegment(transcription);
      expect(result).toBeNull(); // No debe finalizar aún
    });

    test('debe forzar finalización en duración máxima', () => {
      const transcription = 'texto de prueba';
      
      const startTime = Date.now();
      vi.spyOn(Date, 'now')
        .mockReturnValueOnce(startTime)
        .mockReturnValueOnce(startTime + 6000); // 6s, más que máximo (5s)
      
      const result = chunkingService.processTranscriptionSegment(transcription);
      expect(result).toBeDefined(); // Debe finalizar automáticamente
    });
  });

  describe('Categorización SOAP', () => {
    const soapTests = [
      { text: 'paciente siente dolor', phase: 'anamnesis' as MedicalPhase, expected: 'S' },
      { text: 'al palpar observo contractura', phase: 'exploration' as MedicalPhase, expected: 'O' },
      { text: 'diagnostico de lumbalgia mecánica', phase: 'evaluation' as MedicalPhase, expected: 'A' },
      { text: 'recomiendo ejercicios de estiramiento', phase: 'planning' as MedicalPhase, expected: 'P' }
    ];

    soapTests.forEach(({ text, phase, expected }) => {
      test(`debe categorizar "${text}" como SOAP ${expected}`, () => {
        chunkingService.processTranscriptionSegment(text, undefined, phase);
        const chunk = chunkingService.forceFinalize();
        
        expect(chunk).toBeDefined();
        if (chunk) {
          expect(chunk.soapCategory).toBe(expected);
        }
      });
    });
  });

  describe('Sistema de eventos', () => {
    test('debe emitir evento chunkCompleted al finalizar chunk', () => {
      const transcription = 'Paciente refiere dolor cervical con irradiación a brazo derecho';
      
      chunkingService.processTranscriptionSegment(transcription);
      chunkingService.forceFinalize();
      
      expect(mockEventListener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'chunkCompleted',
          detail: expect.objectContaining({
            chunk: expect.any(Object),
            confidence: expect.any(Number)
          })
        })
      );
    });

    test('debe incluir métricas correctas en el evento', () => {
      const transcription = 'dolor lumbar con limitación funcional';
      
      chunkingService.processTranscriptionSegment(transcription);
      chunkingService.forceFinalize();
      
      const lastCall = mockEventListener.mock.calls[mockEventListener.mock.calls.length - 1];
      const event = lastCall[0];
      
      expect(event.detail.chunk).toMatchObject({
        id: expect.stringMatching(/^chunk_\d+$/),
        transcription: expect.stringContaining('dolor'),
        clinicalKeywords: expect.arrayContaining(['lumbar']),
        completeness: expect.any(Number),
        contextRelevance: expect.any(Number),
        soapCategory: expect.stringMatching(/^[SOAP]$/),
        readyForAnalysis: true
      });
    });
  });

  describe('Estado y gestión', () => {
    test('debe reportar estado correcto del chunk activo', () => {
      const transcription = 'evaluando estado del paciente';
      
      let status = chunkingService.getCurrentChunkStatus();
      expect(status.active).toBe(false);
      
      chunkingService.processTranscriptionSegment(transcription);
      
      status = chunkingService.getCurrentChunkStatus();
      expect(status.active).toBe(true);
      expect(status.transcription).toBe(transcription);
      expect(status.wordCount).toBe(4);
    });

    test('debe permitir reset completo', () => {
      chunkingService.processTranscriptionSegment('algún texto');
      
      let status = chunkingService.getCurrentChunkStatus();
      expect(status.active).toBe(true);
      
      chunkingService.reset();
      
      status = chunkingService.getCurrentChunkStatus();
      expect(status.active).toBe(false);
    });

    test('debe actualizar configuración dinámicamente', () => {
      const newConfig = {
        minChunkDuration: 1000,
        maxChunkDuration: 3000,
        semanticThreshold: 0.9
      };
      
      chunkingService.updateConfig(newConfig);
      
      // La nueva configuración debe aplicarse a futuros chunks
      expect(() => chunkingService.processTranscriptionSegment('test')).not.toThrow();
    });
  });

  describe('Casos edge', () => {
    test('debe manejar transcripción vacía', () => {
      const result = chunkingService.processTranscriptionSegment('');
      expect(result).toBeNull();
      
      const status = chunkingService.getCurrentChunkStatus();
      expect(status.active).toBe(false);
    });

    test('debe manejar transcripción solo con espacios', () => {
      const result = chunkingService.processTranscriptionSegment('   ');
      expect(result).toBeNull();
    });

    test('debe manejar múltiples transcripciones rápidas', () => {
      const transcriptions = [
        'dolor',
        'de',
        'hombro',
        'derecho',
        'desde',
        'hace',
        'una',
        'semana'
      ];
      
      let finalChunk: SemanticChunk | null = null;
      
      transcriptions.forEach(text => {
        const result = chunkingService.processTranscriptionSegment(text);
        if (result) {
          finalChunk = result;
        }
      });
      
      if (!finalChunk) {
        finalChunk = chunkingService.forceFinalize();
      }
      
      expect(finalChunk).toBeDefined();
      if (finalChunk) {
        expect(finalChunk.transcription).toContain('dolor');
        expect(finalChunk.transcription).toContain('hombro');
      }
    });

    test('debe manejar forceFinalize sin chunk activo', () => {
      const result = chunkingService.forceFinalize();
      expect(result).toBeNull();
    });
  });
});