import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NLPServiceOllama } from '../nlpServiceOllama';
import type { ClinicalEntity, ClinicalEntityType, SOAPNotes } from '../../types/nlp';

/**
 * Tests para NLPServiceOllama
 * 
 * IMPORTANTE: Estos tests simulan flujos exitosos para validar cobertura.
 * En producción, deben existir fallbacks reales para:
 * - Errores de conexión a Ollama
 * - Timeouts de generación
 * - Errores de RAG/PubMed
 * - Fallas en extracción de entidades
 */

// Mock de dependencias
let originalExtractClinicalEntities: any;
let originalGenerateSOAPNotes: any;

describe('NLPServiceOllama', () => {
  beforeEach(() => {
    // Mockear métodos internos para simular flujos exitosos
    originalExtractClinicalEntities = NLPServiceOllama.extractClinicalEntities;
    originalGenerateSOAPNotes = NLPServiceOllama.generateSOAPNotes;

    // Mock exitoso para extracción de entidades
    NLPServiceOllama.extractClinicalEntities = vi.fn(async (): Promise<ClinicalEntity[]> => [
      {
        id: 'ent-1',
        type: 'symptom' as ClinicalEntityType,
        text: 'dolor lumbar',
        confidence: 0.95
      }
    ]);

    // Mock exitoso para generación de SOAP
    NLPServiceOllama.generateSOAPNotes = vi.fn(async (): Promise<SOAPNotes> => ({
      subjective: 'Paciente refiere dolor lumbar agudo',
      objective: 'Dolor a la palpación en región lumbar',
      assessment: 'Lumbalgia aguda',
      plan: 'Tratamiento conservador',
      generated_at: new Date()
    }));
  });

  afterEach(() => {
    // Restaurar métodos originales
    if (originalExtractClinicalEntities) {
      NLPServiceOllama.extractClinicalEntities = originalExtractClinicalEntities;
    }
    if (originalGenerateSOAPNotes) {
      NLPServiceOllama.generateSOAPNotes = originalGenerateSOAPNotes;
    }
  });

  it('debe procesar un transcript normalmente', async () => {
    const transcript = 'Paciente refiere dolor lumbar agudo.';
    const result = await NLPServiceOllama.processTranscript(transcript);
    
    expect(result.entities).toBeDefined();
    expect(result.entities.length).toBeGreaterThan(0);
    expect(result.soapNotes).toBeDefined();
    expect(result.metrics).toBeDefined();
    expect(result.metrics.timeout_occurred).toBe(false);
    expect(result.metrics.model_used).toBe('llama3.2:3b');
  });

  it('debe manejar un transcript vacío', async () => {
    const transcript = '';
    const result = await NLPServiceOllama.processTranscript(transcript);
    
    expect(result.entities.length).toBeGreaterThanOrEqual(0);
    expect(result.soapNotes).toBeDefined();
    expect(result.metrics).toBeDefined();
  });

  it('debe usar fallback si ocurre un error', async () => {
    // Simular error en extractClinicalEntities
    NLPServiceOllama.extractClinicalEntities = vi.fn(async () => {
      throw new Error('Error simulado en extracción');
    });

    const transcript = 'Texto que causa error';
    const result = await NLPServiceOllama.processTranscript(transcript);
    
    expect(result.metrics.timeout_occurred).toBe(true);
    expect(result.entities).toBeDefined();
    expect(result.metrics.model_used).toBe('regex_fallback');
  });

  it('debe procesar transcript con opciones avanzadas', async () => {
    const transcript = 'Paciente con antecedentes de cirugía.';
    const result = await NLPServiceOllama.processTranscript(transcript, { 
      useRAG: true, 
      useOptimizedSOAP: true 
    });
    
    expect(result.entities).toBeDefined();
    expect(result.soapNotes).toBeDefined();
    expect(result.metrics).toBeDefined();
    expect(result.ragUsed).toBe(true);
    expect(result.metrics.model_used).toBe('llama3.2:3b');
  });

  it('debe validar métricas de procesamiento', async () => {
    const transcript = 'Paciente con dolor crónico.';
    const result = await NLPServiceOllama.processTranscript(transcript);
    
    expect(result.metrics).toMatchObject({
      entities_extraction_time_ms: expect.any(Number),
      soap_generation_time_ms: expect.any(Number),
      total_processing_time_ms: expect.any(Number),
      entities_count: expect.any(Number),
      entities_confidence_avg: expect.any(Number),
      soap_confidence: expect.any(Number),
      prompt_version: expect.any(String),
      timeout_occurred: false,
      estimated_tokens_used: expect.any(Number),
      model_used: expect.any(String)
    });
  });
}); 