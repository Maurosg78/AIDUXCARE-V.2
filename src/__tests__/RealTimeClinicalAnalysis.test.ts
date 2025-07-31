import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { RealTimeClinicalAnalysis } from '../services/RealTimeClinicalAnalysis';
import { SemanticChunk } from '../services/SemanticChunkingService';

// Mock Firebase Functions
vi.mock('firebase/functions', () => ({
  httpsCallable: vi.fn(() => vi.fn())
}));

// Mock Firebase Client
vi.mock('../core/firebase/firebaseClient', () => ({
  functions: {}
}));

describe('RealTimeClinicalAnalysis', () => {
  let service: RealTimeClinicalAnalysis;
  let mockAnalyzeFunction: any;

  beforeEach(() => {
    service = new RealTimeClinicalAnalysis();
    mockAnalyzeFunction = vi.fn();
    (service as any).analyzeSemanticChunk = mockAnalyzeFunction;
  });

  afterEach(() => {
    service.clearActiveAnalyses();
  });

  const createMockSemanticChunk = (overrides: Partial<SemanticChunk> = {}): SemanticChunk => ({
    id: 'chunk_123',
    audioBlob: new Blob(['test'], { type: 'audio/webm' }),
    transcription: 'El paciente presenta dolor lumbar de inicio gradual',
    startTime: 1000,
    endTime: 5000,
    duration: 4000,
    medicalPhase: 'anamnesis',
    clinicalKeywords: ['dolor', 'lumbar'],
    completeness: 0.85,
    contextRelevance: 0.92,
    soapCategory: 'S',
    readyForAnalysis: true,
    ...overrides
  });

  test('should be created successfully', () => {
    expect(service).toBeDefined();
    expect(service.getActiveAnalysesCount()).toBe(0);
  });

  test('should process high-quality semantic chunk', async () => {
    const chunk = createMockSemanticChunk();
    
    mockAnalyzeFunction.mockResolvedValue({
      data: {
        highlights: [
          {
            text: 'Dolor lumbar irradiado',
            category: 'symptom',
            relevance: 0.95,
            soapCategory: 'S'
          }
        ],
        clinicalInsights: [
          {
            insight: 'Dolor neuropático sugerido',
            confidence: 0.88,
            evidence: 'Irradiación hacia extremidad'
          }
        ],
        redFlags: [
          {
            flag: 'Dolor nocturno intenso',
            severity: 'medium',
            recommendation: 'Evaluar causas orgánicas'
          }
        ],
        nextSteps: ['Test de Lasègue', 'Evaluación neurológica'],
        soapSuggestion: {
          category: 'S',
          confidence: 0.92,
          reasoning: 'Síntomas subjetivos del paciente'
        },
        metadata: {
          processingTime: 1500,
          chunkId: chunk.id,
          medicalPhase: 'anamnesis',
          timestamp: Date.now()
        }
      }
    });

    const analysis = await service.processSemanticChunk(chunk);

    expect(analysis.chunkId).toBe(chunk.id);
    expect(analysis.highlights).toHaveLength(1);
    expect(analysis.highlights[0].text).toBe('Dolor lumbar irradiado');
    expect(analysis.clinicalInsights).toHaveLength(1);
    expect(analysis.redFlags).toHaveLength(1);
    expect(analysis.nextSteps).toHaveLength(2);
    expect(analysis.processingTime).toBe(1500);
  });

  test('should create basic analysis for low-quality chunks', async () => {
    const chunk = createMockSemanticChunk({
      completeness: 0.3,
      readyForAnalysis: false
    });

    const analysis = await service.processSemanticChunk(chunk);

    expect(analysis.chunkId).toBe(chunk.id);
    expect(analysis.highlights).toHaveLength(1);
    expect(analysis.highlights[0].text).toBe(chunk.transcription);
    expect(analysis.highlights[0].category).toBe('symptom');
    expect(analysis.soapSuggestion.reasoning).toContain('completeness bajo');
  });

  test('should handle Vertex AI errors gracefully', async () => {
    const chunk = createMockSemanticChunk();
    
    mockAnalyzeFunction.mockRejectedValue(new Error('Vertex AI error'));

    const analysis = await service.processSemanticChunk(chunk);

    expect(analysis.chunkId).toBe(chunk.id);
    expect(analysis.highlights).toHaveLength(0);
    expect(analysis.soapSuggestion.confidence).toBe(0.1);
    expect(analysis.soapSuggestion.reasoning).toContain('Error en análisis');
  });

  test('should avoid duplicate analyses', async () => {
    const chunk = createMockSemanticChunk();
    
    mockAnalyzeFunction.mockResolvedValue({
      data: {
        highlights: [{ text: 'Test highlight', category: 'symptom', relevance: 0.8, soapCategory: 'S' }],
        clinicalInsights: [],
        redFlags: [],
        nextSteps: [],
        soapSuggestion: { category: 'S', confidence: 0.8, reasoning: 'Test' },
        metadata: { processingTime: 1000, chunkId: chunk.id, medicalPhase: 'anamnesis', timestamp: Date.now() }
      }
    });

    // Start first analysis
    const analysisPromise1 = service.processSemanticChunk(chunk);
    expect(service.getActiveAnalysesCount()).toBe(1);

    // Start second analysis (should be same promise)
    const analysisPromise2 = service.processSemanticChunk(chunk);
    expect(service.getActiveAnalysesCount()).toBe(1);

    const [analysis1, analysis2] = await Promise.all([analysisPromise1, analysisPromise2]);

    expect(analysis1).toEqual(analysis2);
    expect(service.getActiveAnalysesCount()).toBe(0);
  });

  test('should emit real-time highlights', async () => {
    const chunk = createMockSemanticChunk();
    const mockEvent = vi.fn();
    
    window.addEventListener('clinicalHighlight', mockEvent);
    
    mockAnalyzeFunction.mockResolvedValue({
      data: {
        highlights: [{ text: 'Test highlight', category: 'symptom', relevance: 0.8, soapCategory: 'S' }],
        clinicalInsights: [],
        redFlags: [],
        nextSteps: [],
        soapSuggestion: { category: 'S', confidence: 0.8, reasoning: 'Test' },
        metadata: { processingTime: 1000, chunkId: chunk.id, medicalPhase: 'anamnesis', timestamp: Date.now() }
      }
    });

    await service.processSemanticChunk(chunk);

    expect(mockEvent).toHaveBeenCalled();
    const eventDetail = mockEvent.mock.calls[0][0].detail;
    expect(eventDetail.highlights).toHaveLength(1);
    expect(eventDetail.highlights[0].text).toBe('Test highlight');

    window.removeEventListener('clinicalHighlight', mockEvent);
  });

  test('should track average processing time', () => {
    const avgTime = service.getAverageProcessingTime();
    expect(avgTime).toBe(1500); // Default estimated time
  });

  test('should clear active analyses', () => {
    service.clearActiveAnalyses();
    expect(service.getActiveAnalysesCount()).toBe(0);
  });
}); 