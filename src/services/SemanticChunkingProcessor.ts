/**
 * 🧠 AiDuxCare - Procesador de Chunking Semántico
 * Implementa la visión de Mauricio: captura completa → chunking inteligente → análisis contextual
 * Evita el problema de "palabra por palabra" manteniendo coherencia narrativa
 */

import RealWorldSOAPProcessor, { ProcessingResult } from './RealWorldSOAPProcessor';

// === INTERFACES ===

export interface SemanticChunk {
  id: string;
  text: string;
  sentences: string[];
  speakers: string[];
  startIndex: number;
  endIndex: number;
  overlapWith: string[];  // IDs de chunks que se solapan
  narrative: {
    hasTemporalMarkers: boolean;    // "desde hace", "después de"
    hasCausalRelations: boolean;    // "por eso", "debido a"
    hasNegations: boolean;          // "no me duele", "ya no"
    hasCorrections: boolean;        // "bueno, en realidad"
    hasIrony: boolean;              // "claro que no duele" [sarcástico]
  };
  clinicalContext: {
    hasSymptoms: boolean;
    hasExamination: boolean;
    hasAssessment: boolean;
    hasPlan: boolean;
    complexity: 'simple' | 'medium' | 'complex';
  };
}

export interface ChunkingConfig {
  chunkSize: number;           // Número de oraciones por chunk
  overlapSize: number;         // Oraciones de solapamiento
  minChunkSize: number;        // Mínimo de oraciones válidas
  maxChunkSize: number;        // Máximo antes de forzar división
  preserveDialogue: boolean;   // Mantener diálogos completos
  preserveContext: boolean;    // Mantener contexto clínico
}

export interface ChunkedSOAPResult {
  fullTranscript: string;
  chunks: SemanticChunk[];
  processedChunks: ChunkProcessingResult[];
  mergedSOAP: ProcessingResult;
  metadata: {
    totalChunks: number;
    averageChunkSize: number;
    processingTime: number;
    narrativeCoherence: number;  // Score 0-1
    clinicalCoherence: number;   // Score 0-1
  };
}

export interface ChunkProcessingResult {
  chunkId: string;
  soapResult: ProcessingResult;
  confidence: number;
  narrative: {
    temporalFlow: string[];      // Secuencia temporal detectada
    causalChain: string[];       // Cadena causal síntoma→examen→diagnóstico
    corrections: string[];       // Correcciones del paciente detectadas
    negations: string[];         // Negaciones importantes
  };
  clinicalInsights: {
    primarySymptoms: string[];
    secondarySymptoms: string[];
    examinationFindings: string[];
    provisionalDiagnosis: string[];
    treatmentDirection: string[];
  };
}

export class SemanticChunkingProcessor {
  private config: ChunkingConfig = {
    chunkSize: 5,              // 5 oraciones por chunk (Mauricio's suggestion)
    overlapSize: 2,            // 2 oraciones de solapamiento
    minChunkSize: 3,           // Mínimo 3 oraciones
    maxChunkSize: 8,           // Máximo 8 oraciones
    preserveDialogue: true,    // Mantener diálogos completos
    preserveContext: true      // Preservar contexto clínico
  };

  private soapProcessor: RealWorldSOAPProcessor;

  constructor(customConfig?: Partial<ChunkingConfig>) {
    this.config = { ...this.config, ...customConfig };
    this.soapProcessor = new RealWorldSOAPProcessor();
  }

  /**
   * MÉTODO PRINCIPAL: Procesar transcripción completa con chunking semántico
   * Implementa la visión de Mauricio de análisis contextual vs palabra-por-palabra
   */
  async processFullTranscript(
    fullTranscript: string,
    options?: {
      preserveNarrative?: boolean;
      parallelProcessing?: boolean;
      generateInsights?: boolean;
    }
  ): Promise<ChunkedSOAPResult> {
    const startTime = Date.now();
    
    console.log('🧠 Iniciando procesamiento con chunking semántico...');
    console.log(`📄 Transcripción completa: ${fullTranscript.length} caracteres`);

    try {
      // PASO 1: Crear chunks semánticos con solapamiento
      const chunks = this.createSemanticChunks(fullTranscript);
      console.log(`📦 ${chunks.length} chunks semánticos creados`);

      // PASO 2: Procesar cada chunk con contexto (en paralelo)
      const processedChunks = options?.parallelProcessing !== false 
        ? await this.processChunksInParallel(chunks)
        : await this.processChunksSequentially(chunks);

      // PASO 3: Fusionar resultados manteniendo coherencia narrativa
      const mergedSOAP = this.mergeChunkedResults(processedChunks, chunks);

      // PASO 4: Generar insights adicionales si se solicita
      const insights = options?.generateInsights 
        ? this.generateClinicalInsights(processedChunks)
        : null;

      // PASO 5: Calcular métricas de coherencia
      const metadata = this.calculateCoherenceMetrics(chunks, processedChunks, startTime);

      console.log(`✅ Procesamiento completado en ${metadata.processingTime}ms`);
      console.log(`📊 Coherencia narrativa: ${Math.round(metadata.narrativeCoherence * 100)}%`);
      console.log(`🏥 Coherencia clínica: ${Math.round(metadata.clinicalCoherence * 100)}%`);

      return {
        fullTranscript,
        chunks,
        processedChunks,
        mergedSOAP,
        metadata: {
          ...metadata,
          ...(insights && { insights })
        }
      };

    } catch (error) {
      console.error('❌ Error en procesamiento semántico:', error);
      throw new Error(`Error en chunking semántico: ${error}`);
    }
  }

  /**
   * PASO 1: Crear chunks semánticos con solapamiento inteligente
   * Evita cortar en medio de diálogos o contextos clínicos importantes
   */
  private createSemanticChunks(transcript: string): SemanticChunk[] {
    console.log('📝 Creando chunks semánticos...');

    // Dividir en oraciones preservando diálogos
    const sentences = this.splitIntoSentences(transcript);
    console.log(`📋 ${sentences.length} oraciones identificadas`);

    const chunks: SemanticChunk[] = [];
    let currentIndex = 0;

    while (currentIndex < sentences.length) {
      const chunkSentences = this.extractChunkSentences(sentences, currentIndex);
      
      if (chunkSentences.length >= this.config.minChunkSize) {
        const chunk = this.createChunk(chunkSentences, currentIndex, chunks.length);
        chunks.push(chunk);
        
        console.log(`📦 Chunk ${chunk.id}: ${chunk.sentences.length} oraciones, ${chunk.speakers.length} hablantes`);
      }

      // Avanzar considerando solapamiento
      currentIndex += Math.max(1, chunkSentences.length - this.config.overlapSize);
    }

    // Crear referencias de solapamiento
    this.createOverlapReferences(chunks);

    return chunks;
  }

  /**
   * Dividir transcript en oraciones inteligentemente
   * Preserva contexto de hablantes y diálogos
   */
  private splitIntoSentences(transcript: string): string[] {
    // Normalizar texto
    const normalized = transcript
      .replace(/\s+/g, ' ')
      .trim();

    // Dividir por patrones de fin de oración, preservando contexto
    const sentences = normalized
      .split(/(?<=[.!?])\s+(?=[A-Z]|Paciente:|Terapeuta:)/g)
      .filter(s => s.trim().length > 10) // Filtrar oraciones muy cortas
      .map(s => s.trim());

    return sentences;
  }

  /**
   * Extraer oraciones para un chunk respetando límites semánticos
   */
  private extractChunkSentences(sentences: string[], startIndex: number): string[] {
    const chunkSentences: string[] = [];
    let currentIdx = startIndex;
    
    while (chunkSentences.length < this.config.maxChunkSize && currentIdx < sentences.length) {
      const sentence = sentences[currentIdx];
      chunkSentences.push(sentence);
      
      // Si tenemos suficientes oraciones, verificar si es buen punto de corte
      if (chunkSentences.length >= this.config.chunkSize) {
        if (this.isGoodBreakPoint(sentence, sentences[currentIdx + 1])) {
          break;
        }
      }
      
      currentIdx++;
    }

    return chunkSentences;
  }

  /**
   * Determinar si es un buen punto para cortar chunk
   * Evita cortar en medio de diálogos o explicaciones
   */
  private isGoodBreakPoint(currentSentence: string, nextSentence?: string): boolean {
    if (!nextSentence) return true;

    // No cortar si el siguiente es continuación del mismo hablante
    const currentSpeaker = this.detectSpeakerFromSentence(currentSentence);
    const nextSpeaker = this.detectSpeakerFromSentence(nextSentence);
    
    if (currentSpeaker === nextSpeaker) {
      // Permitir corte si es cambio de tema
      const topicChange = this.detectTopicChange(currentSentence, nextSentence);
      return topicChange;
    }

    return true; // Buen punto de corte al cambiar hablante
  }

  /**
   * Detectar cambio de tema en oraciones consecutivas
   */
  private detectTopicChange(sentence1: string, sentence2: string): boolean {
    const topicMarkers = [
      'por otro lado', 'además', 'también', 'pero',
      'ahora', 'después', 'luego', 'finalmente',
      'en cuanto a', 'respecto a', 'sobre'
    ];

    return topicMarkers.some(marker => 
      sentence2.toLowerCase().includes(marker)
    );
  }

  /**
   * Crear chunk con análisis narrativo y clínico
   */
  private createChunk(sentences: string[], startIndex: number, chunkIndex: number): SemanticChunk {
    const text = sentences.join(' ');
    const speakers = [...new Set(sentences.map(s => this.detectSpeakerFromSentence(s)))];

    return {
      id: `chunk_${chunkIndex}`,
      text,
      sentences,
      speakers,
      startIndex,
      endIndex: startIndex + sentences.length - 1,
      overlapWith: [],
      narrative: this.analyzeNarrative(text),
      clinicalContext: this.analyzeClinicalContext(text)
    };
  }

  /**
   * Analizar elementos narrativos del chunk
   * Detecta temporalidad, causalidad, negaciones, correcciones, ironía
   */
  private analyzeNarrative(text: string): SemanticChunk['narrative'] {
    const lowerText = text.toLowerCase();

    return {
      hasTemporalMarkers: /desde hace|después de|antes de|ahora|luego|entonces|mientras|durante/.test(lowerText),
      hasCausalRelations: /por eso|debido a|porque|ya que|como resultado|por lo tanto/.test(lowerText),
      hasNegations: /no me|no puedo|nunca|jamás|para nada|en absoluto/.test(lowerText),
      hasCorrections: /bueno|en realidad|mejor dicho|o sea|quiero decir|más bien/.test(lowerText),
      hasIrony: /claro que no|por supuesto que no|obviamente no|como si/.test(lowerText)
    };
  }

  /**
   * Analizar contexto clínico del chunk
   */
  private analyzeClinicalContext(text: string): SemanticChunk['clinicalContext'] {
    const lowerText = text.toLowerCase();
    
    const hasSymptoms = /dolor|molestia|siento|duele|cuesta|difícil|problema/.test(lowerText);
    const hasExamination = /flexione|extienda|presione|palpe|observe|examine|evalúe/.test(lowerText);
    const hasAssessment = /parece|indica|sugiere|compatible|diagnóstico|evaluación/.test(lowerText);
    const hasPlan = /recomiendo|tratamiento|ejercicio|terapia|plan|continuar/.test(lowerText);

    const complexity = this.calculateComplexity(hasSymptoms, hasExamination, hasAssessment, hasPlan);

    return {
      hasSymptoms,
      hasExamination,
      hasAssessment,
      hasPlan,
      complexity
    };
  }

  /**
   * Calcular complejidad del chunk basado en elementos clínicos
   */
  private calculateComplexity(symptoms: boolean, exam: boolean, assessment: boolean, plan: boolean): 'simple' | 'medium' | 'complex' {
    const elements = [symptoms, exam, assessment, plan].filter(Boolean).length;
    
    if (elements <= 1) return 'simple';
    if (elements <= 2) return 'medium';
    return 'complex';
  }

  /**
   * Detectar hablante de una oración específica
   */
  private detectSpeakerFromSentence(sentence: string): string {
    const lowerSentence = sentence.toLowerCase();
    
    // Patrones explícitos
    if (sentence.includes('Paciente:') || sentence.includes('PACIENTE:')) return 'PACIENTE';
    if (sentence.includes('Terapeuta:') || sentence.includes('TERAPEUTA:')) return 'TERAPEUTA';
    
    // Patrones implícitos TERAPEUTA
    const therapistPatterns = [
      /vamos a|necesito que|observe|recomiendo|el tratamiento/,
      /flexione|extienda|gire|presione|evalúe|examine/
    ];
    
    // Patrones implícitos PACIENTE
    const patientPatterns = [
      /me duele|siento|no puedo|me cuesta|desde hace/,
      /está mejor|está peor|me molesta|tengo/
    ];
    
    if (therapistPatterns.some(pattern => pattern.test(lowerSentence))) return 'TERAPEUTA';
    if (patientPatterns.some(pattern => pattern.test(lowerSentence))) return 'PACIENTE';
    
    return 'DESCONOCIDO';
  }

  /**
   * PASO 2A: Procesar chunks en paralelo (más rápido)
   */
  private async processChunksInParallel(chunks: SemanticChunk[]): Promise<ChunkProcessingResult[]> {
    console.log(`🚀 Procesando ${chunks.length} chunks en paralelo...`);

    const promises = chunks.map(async (chunk, index) => {
      try {
        return await this.processChunkWithContext(chunk, chunks);
      } catch (error) {
        console.error(`❌ Error procesando chunk ${index}:`, error);
        return this.createErrorResult(chunk);
      }
    });

    return await Promise.all(promises);
  }

  /**
   * PASO 2B: Procesar chunks secuencialmente (más contexto)
   */
  private async processChunksSequentially(chunks: SemanticChunk[]): Promise<ChunkProcessingResult[]> {
    console.log(`🔄 Procesando ${chunks.length} chunks secuencialmente...`);

    const results: ChunkProcessingResult[] = [];
    
    for (let i = 0; i < chunks.length; i++) {
      try {
        const result = await this.processChunkWithContext(chunks[i], chunks, results);
        results.push(result);
        console.log(`✅ Chunk ${i + 1}/${chunks.length} procesado`);
      } catch (error) {
        console.error(`❌ Error procesando chunk ${i}:`, error);
        results.push(this.createErrorResult(chunks[i]));
      }
    }

    return results;
  }

  /**
   * Procesar chunk individual con contexto de chunks adyacentes
   */
  private async processChunkWithContext(
    chunk: SemanticChunk, 
    allChunks: SemanticChunk[],
    previousResults?: ChunkProcessingResult[]
  ): Promise<ChunkProcessingResult> {
    
    // Construir contexto extendido con chunks solapados
    const contextualText = this.buildContextualText(chunk, allChunks);
    
    // Procesar con SOAP usando contexto completo
    const soapResult = await this.soapProcessor.processTranscription(contextualText);
    
    // Analizar elementos narrativos específicos
    const narrative = this.extractNarrativeElements(chunk, soapResult);
    
    // Extraer insights clínicos
    const clinicalInsights = this.extractClinicalInsights(chunk, soapResult);
    
    // Calcular confianza basada en coherencia
    const confidence = this.calculateChunkConfidence(chunk, soapResult, narrative);

    return {
      chunkId: chunk.id,
      soapResult,
      confidence,
      narrative,
      clinicalInsights
    };
  }

  /**
   * Construir texto contextual incluyendo chunks solapados
   */
  private buildContextualText(chunk: SemanticChunk, allChunks: SemanticChunk[]): string {
    let contextualText = chunk.text;
    
    // Agregar contexto de chunks solapados si está configurado
    if (this.config.preserveContext) {
      const overlapIds = chunk.overlapWith;
      const overlapTexts = allChunks
        .filter(c => overlapIds.includes(c.id))
        .map(c => c.text);
      
      if (overlapTexts.length > 0) {
        contextualText = overlapTexts.join(' ') + ' ' + chunk.text;
      }
    }

    return contextualText;
  }

  /**
   * Extraer elementos narrativos específicos del chunk procesado
   */
  private extractNarrativeElements(chunk: SemanticChunk, soapResult: ProcessingResult): ChunkProcessingResult['narrative'] {
    // Analizar flujo temporal
    const temporalFlow = this.extractTemporalFlow(chunk.text);
    
    // Analizar cadena causal clínica
    const causalChain = this.extractCausalChain(chunk.text, soapResult);
    
    // Extraer correcciones del paciente
    const corrections = this.extractCorrections(chunk.text);
    
    // Extraer negaciones importantes
    const negations = this.extractNegations(chunk.text);

    return {
      temporalFlow,
      causalChain,
      corrections,
      negations
    };
  }

  /**
   * Extraer flujo temporal de eventos
   */
  private extractTemporalFlow(text: string): string[] {
    const temporalMarkers = text.match(/desde hace \w+|después de \w+|antes de \w+|ahora|luego|entonces/g) || [];
    return temporalMarkers;
  }

  /**
   * Extraer cadena causal clínica
   */
  private extractCausalChain(text: string, soapResult: ProcessingResult): string[] {
    const causalElements: string[] = [];
    
    // Buscar relaciones síntoma → examen → diagnóstico
    soapResult.segments.forEach(segment => {
      if (segment.section === 'S' && segment.section === 'O') {
        causalElements.push(`${segment.text} → Examen físico`);
      }
      if (segment.section === 'O' && segment.section === 'A') {
        causalElements.push(`Hallazgo → ${segment.text}`);
      }
    });

    return causalElements;
  }

  /**
   * Extraer correcciones del paciente
   */
  private extractCorrections(text: string): string[] {
    const correctionPatterns = /bueno,? ([^.!?]+)|en realidad ([^.!?]+)|mejor dicho ([^.!?]+)/g;
    const corrections: string[] = [];
    
    let match;
    while ((match = correctionPatterns.exec(text)) !== null) {
      const correction = match[1] || match[2] || match[3];
      if (correction) {
        corrections.push(correction.trim());
      }
    }

    return corrections;
  }

  /**
   * Extraer negaciones importantes clínicamente
   */
  private extractNegations(text: string): string[] {
    const negationPatterns = /no (me duele|puedo|siento|tengo)[^.!?]*/g;
    const negations: string[] = [];
    
    let match;
    while ((match = negationPatterns.exec(text)) !== null) {
      negations.push(match[0].trim());
    }

    return negations;
  }

  /**
   * Extraer insights clínicos específicos
   */
  private extractClinicalInsights(chunk: SemanticChunk, soapResult: ProcessingResult): ChunkProcessingResult['clinicalInsights'] {
    const symptoms = soapResult.segments
      .filter(s => s.section === 'S')
      .map(s => s.text);
      
    const findings = soapResult.segments
      .filter(s => s.section === 'O')
      .map(s => s.text);
      
    const assessments = soapResult.segments
      .filter(s => s.section === 'A')
      .map(s => s.text);
      
    const plans = soapResult.segments
      .filter(s => s.section === 'P')
      .map(s => s.text);

    return {
      primarySymptoms: symptoms.slice(0, 2),
      secondarySymptoms: symptoms.slice(2),
      examinationFindings: findings,
      provisionalDiagnosis: assessments,
      treatmentDirection: plans
    };
  }

  /**
   * Calcular confianza del chunk basada en coherencia
   */
  private calculateChunkConfidence(
    chunk: SemanticChunk, 
    soapResult: ProcessingResult, 
    narrative: ChunkProcessingResult['narrative']
  ): number {
    let confidence = soapResult.processingMetrics.averageConfidence;
    
    // Bonificar por coherencia narrativa
    if (narrative.temporalFlow.length > 0) confidence += 0.1;
    if (narrative.causalChain.length > 0) confidence += 0.1;
    
    // Penalizar por correcciones excesivas
    if (narrative.corrections.length > 2) confidence -= 0.1;
    
    // Bonificar por complejidad clínica
    if (chunk.clinicalContext.complexity === 'complex') confidence += 0.05;

    return Math.min(1.0, Math.max(0.0, confidence));
  }

  /**
   * Crear resultado de error para chunk fallido
   */
  private createErrorResult(chunk: SemanticChunk): ChunkProcessingResult {
    return {
      chunkId: chunk.id,
      soapResult: {
        segments: [],
        processingMetrics: {
          totalSegments: 0,
          averageConfidence: 0,
          processingTime: 0,
          errors: ['Error procesando chunk']
        },
        fullAssessment: 'Error en procesamiento',
        log: []
      } as ProcessingResult,
      confidence: 0,
      narrative: {
        temporalFlow: [],
        causalChain: [],
        corrections: [],
        negations: []
      },
      clinicalInsights: {
        primarySymptoms: [],
        secondarySymptoms: [],
        examinationFindings: [],
        provisionalDiagnosis: [],
        treatmentDirection: []
      }
    };
  }

  /**
   * PASO 3: Fusionar resultados manteniendo coherencia narrativa
   */
  private mergeChunkedResults(processedChunks: ChunkProcessingResult[], chunks: SemanticChunk[]): ProcessingResult {
    console.log('🔄 Fusionando resultados con coherencia narrativa...');

    // Combinar todos los segmentos SOAP
    const allSegments = processedChunks.flatMap(result => result.soapResult.segments);
    
    // Deduplicar segmentos similares del solapamiento
    const uniqueSegments = this.deduplicateSegments(allSegments);
    
    // Reordenar según flujo narrativo temporal
    const orderedSegments = this.reorderByNarrativeFlow(uniqueSegments, processedChunks);
    
    // Generar assessment fusionado
    const fusedAssessment = this.generateFusedAssessment(processedChunks);
    
    // Calcular métricas agregadas
    const aggregatedMetrics = this.calculateAggregatedMetrics(processedChunks);

    return {
      segments: orderedSegments,
      processingMetrics: aggregatedMetrics,
      fullAssessment: fusedAssessment,
      log: this.generateProcessingLog(processedChunks)
    };
  }

  /**
   * Deduplicar segmentos similares del solapamiento
   */
  private deduplicateSegments(segments: any[]): any[] {
    const uniqueSegments: any[] = [];
    
    for (const segment of segments) {
      const isDuplicate = uniqueSegments.some(existing => 
        this.calculateTextSimilarity(segment.text, existing.text) > 0.8
      );
      
      if (!isDuplicate) {
        uniqueSegments.push(segment);
      }
    }

    return uniqueSegments;
  }

  /**
   * Calcular similitud entre textos (0-1)
   */
  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  /**
   * Reordenar segmentos según flujo narrativo
   */
  private reorderByNarrativeFlow(segments: any[], processedChunks: ChunkProcessingResult[]): any[] {
    // Implementar ordenamiento basado en temporalidad y causalidad
    return segments.sort((a, b) => {
      // Priorizar S → O → A → P
      const sectionOrder = { 'S': 1, 'O': 2, 'A': 3, 'P': 4 };
      const orderA = sectionOrder[a.section as keyof typeof sectionOrder] || 5;
      const orderB = sectionOrder[b.section as keyof typeof sectionOrder] || 5;
      
      return orderA - orderB;
    });
  }

  /**
   * Generar assessment fusionado de todos los chunks
   */
  private generateFusedAssessment(processedChunks: ChunkProcessingResult[]): string {
    const assessments = processedChunks.map(chunk => chunk.soapResult.fullAssessment).filter(Boolean);
    
    if (assessments.length === 0) {
      return 'Assessment no disponible';
    }

    // Combinar assessments manteniendo coherencia
    const primarySymptoms = processedChunks.flatMap(c => c.clinicalInsights.primarySymptoms);
    const mainFindings = processedChunks.flatMap(c => c.clinicalInsights.examinationFindings);
    const diagnoses = processedChunks.flatMap(c => c.clinicalInsights.provisionalDiagnosis);

    return `Cuadro clínico con ${primarySymptoms.join(', ')}. Hallazgos: ${mainFindings.join(', ')}. Evaluación: ${diagnoses.join(', ')}.`;
  }

  /**
   * Calcular métricas agregadas
   */
  private calculateAggregatedMetrics(processedChunks: ChunkProcessingResult[]): any {
    const totalSegments = processedChunks.reduce((sum, chunk) => sum + chunk.soapResult.segments.length, 0);
    const averageConfidence = processedChunks.reduce((sum, chunk) => sum + chunk.confidence, 0) / processedChunks.length;
    const totalProcessingTime = processedChunks.reduce((sum, chunk) => sum + (chunk.soapResult.processingMetrics.processingTime || 0), 0);

    return {
      totalSegments,
      averageConfidence,
      processingTime: totalProcessingTime,
      chunksProcessed: processedChunks.length,
      errors: processedChunks.flatMap(c => c.soapResult.processingMetrics.errors || [])
    };
  }

  /**
   * Generar log del procesamiento
   */
  private generateProcessingLog(processedChunks: ChunkProcessingResult[]): string[] {
    const log: string[] = [];
    
    processedChunks.forEach((chunk, index) => {
      log.push(`Chunk ${index + 1}: ${chunk.confidence.toFixed(2)} confianza, ${chunk.soapResult.segments.length} segmentos`);
    });

    return log;
  }

  /**
   * Crear referencias de solapamiento entre chunks
   */
  private createOverlapReferences(chunks: SemanticChunk[]): void {
    for (let i = 0; i < chunks.length - 1; i++) {
      const currentChunk = chunks[i];
      const nextChunk = chunks[i + 1];
      
      // Verificar si hay solapamiento de oraciones
      const overlap = this.findSentenceOverlap(currentChunk.sentences, nextChunk.sentences);
      
      if (overlap.length > 0) {
        currentChunk.overlapWith.push(nextChunk.id);
        nextChunk.overlapWith.push(currentChunk.id);
      }
    }
  }

  /**
   * Encontrar solapamiento de oraciones entre chunks
   */
  private findSentenceOverlap(sentences1: string[], sentences2: string[]): string[] {
    return sentences1.filter(s1 => 
      sentences2.some(s2 => this.calculateTextSimilarity(s1, s2) > 0.9)
    );
  }

  /**
   * PASO 4: Generar insights clínicos adicionales
   */
  private generateClinicalInsights(processedChunks: ChunkProcessingResult[]): any {
    // Implementar análisis de patrones clínicos globales
    return {
      globalPatterns: this.identifyGlobalPatterns(processedChunks),
      temporalProgression: this.analyzeTemporalProgression(processedChunks),
      clinicalCoherence: this.assessClinicalCoherence(processedChunks)
    };
  }

  /**
   * Identificar patrones globales en todos los chunks
   */
  private identifyGlobalPatterns(processedChunks: ChunkProcessingResult[]): any {
    // Analizar patrones que emergen del análisis completo
    const allSymptoms = processedChunks.flatMap(c => c.clinicalInsights.primarySymptoms);
    const symptomFrequency = this.calculateFrequency(allSymptoms);

    return {
      mostFrequentSymptoms: symptomFrequency,
      narrativeFlow: this.analyzeNarrativeFlow(processedChunks)
    };
  }

  /**
   * Calcular frecuencia de elementos
   */
  private calculateFrequency(items: string[]): Record<string, number> {
    return items.reduce((freq, item) => {
      freq[item] = (freq[item] || 0) + 1;
      return freq;
    }, {} as Record<string, number>);
  }

  /**
   * Analizar flujo narrativo global
   */
  private analyzeNarrativeFlow(processedChunks: ChunkProcessingResult[]): any {
    const temporalMarkers = processedChunks.flatMap(c => c.narrative.temporalFlow);
    const corrections = processedChunks.flatMap(c => c.narrative.corrections);

    return {
      hasConsistentTimeline: temporalMarkers.length > 0,
      numberOfCorrections: corrections.length,
      narrativeCoherence: this.calculateNarrativeCoherence(processedChunks)
    };
  }

  /**
   * Analizar progresión temporal
   */
  private analyzeTemporalProgression(processedChunks: ChunkProcessingResult[]): any {
    // Implementar análisis de progresión temporal de síntomas y tratamiento
    return {
      symptomProgression: 'analysis_placeholder',
      treatmentProgression: 'analysis_placeholder'
    };
  }

  /**
   * Evaluar coherencia clínica global
   */
  private assessClinicalCoherence(processedChunks: ChunkProcessingResult[]): number {
    // Calcular score de coherencia clínica global (0-1)
    const hasConsistentSymptoms = this.checkSymptomConsistency(processedChunks);
    const hasLogicalProgression = this.checkLogicalProgression(processedChunks);
    
    return (hasConsistentSymptoms + hasLogicalProgression) / 2;
  }

  /**
   * Verificar consistencia de síntomas
   */
  private checkSymptomConsistency(processedChunks: ChunkProcessingResult[]): number {
    // Implementar verificación de consistencia
    return 0.8; // Placeholder
  }

  /**
   * Verificar progresión lógica
   */
  private checkLogicalProgression(processedChunks: ChunkProcessingResult[]): number {
    // Implementar verificación de progresión lógica S→O→A→P
    return 0.9; // Placeholder
  }

  /**
   * PASO 5: Calcular métricas de coherencia
   */
  private calculateCoherenceMetrics(
    chunks: SemanticChunk[], 
    processedChunks: ChunkProcessingResult[], 
    startTime: number
  ): ChunkedSOAPResult['metadata'] {
    
    const narrativeCoherence = this.calculateNarrativeCoherence(processedChunks);
    const clinicalCoherence = this.assessClinicalCoherence(processedChunks);
    const averageChunkSize = chunks.reduce((sum, chunk) => sum + chunk.sentences.length, 0) / chunks.length;

    return {
      totalChunks: chunks.length,
      averageChunkSize,
      processingTime: Date.now() - startTime,
      narrativeCoherence,
      clinicalCoherence
    };
  }

  /**
   * Calcular coherencia narrativa global
   */
  private calculateNarrativeCoherence(processedChunks: ChunkProcessingResult[]): number {
    const totalChunks = processedChunks.length;
    if (totalChunks === 0) return 0;

    let coherenceScore = 0;

    // Evaluar elementos narrativos
    processedChunks.forEach(chunk => {
      if (chunk.narrative.temporalFlow.length > 0) coherenceScore += 0.2;
      if (chunk.narrative.causalChain.length > 0) coherenceScore += 0.3;
      if (chunk.narrative.corrections.length <= 2) coherenceScore += 0.2; // Pocas correcciones = más coherencia
      if (chunk.narrative.negations.length > 0) coherenceScore += 0.1; // Negaciones manejadas
    });

    return Math.min(1.0, coherenceScore / totalChunks);
  }

  /**
   * Obtener configuración actual
   */
  getConfig(): ChunkingConfig {
    return { ...this.config };
  }

  /**
   * Actualizar configuración
   */
  updateConfig(newConfig: Partial<ChunkingConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('📊 Configuración de chunking actualizada:', this.config);
  }

  /**
   * Obtener estadísticas del procesamiento
   */
  getProcessingStats(result: ChunkedSOAPResult) {
    return {
      efficiency: {
        chunksCreated: result.chunks.length,
        averageChunkSize: result.metadata.averageChunkSize,
        processingTime: result.metadata.processingTime,
        timePerChunk: result.metadata.processingTime / result.chunks.length
      },
      quality: {
        narrativeCoherence: result.metadata.narrativeCoherence,
        clinicalCoherence: result.metadata.clinicalCoherence,
        averageConfidence: result.processedChunks.reduce((sum, c) => sum + c.confidence, 0) / result.processedChunks.length
      },
      insights: {
        totalSymptoms: result.processedChunks.flatMap(c => c.clinicalInsights.primarySymptoms).length,
        totalFindings: result.processedChunks.flatMap(c => c.clinicalInsights.examinationFindings).length,
        temporalMarkers: result.processedChunks.flatMap(c => c.narrative.temporalFlow).length,
        corrections: result.processedChunks.flatMap(c => c.narrative.corrections).length
      }
    };
  }
} 