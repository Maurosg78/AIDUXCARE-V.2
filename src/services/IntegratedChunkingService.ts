/**
 * TARGET: SERVICIO INTEGRADO DE CHUNKING - Implementación exacta de Mauricio
 * Combina BufferedTranscriptionService con chunking semántico por utterances
 * OBJETIVO VITAL: Eliminar procesamiento "sílaba por sílaba" completamente
 */

import { BufferedTranscriptionService, BufferedSegment, TranscriptionCallbacks } from './BufferedTranscriptionService';
import { 
  chunkTranscript, 
  parseTranscriptToUtterances, 
  processChunkWithLLM,
  Utterance, 
  Chunk, 
  ChunkingConfig,
  CHUNKING_CONFIGS,
  debugChunking,
  verifyOverlap
} from './TranscriptionChunkingService';
import RealWorldSOAPProcessor, { ProcessingResult } from './RealWorldSOAPProcessor';

// === INTERFACES ===

export interface ChunkedTranscriptionResult {
  originalSegments: BufferedSegment[];
  utterances: Utterance[];
  chunks: Chunk[];
  soapResults: ChunkSOAPResult[];
  totalProcessingTime: number;
  chunkingStats: {
    totalChunks: number;
    averageChunkSize: number;
    overlapUtterances: number;
    processingEfficiency: number;
  };
}

export interface ChunkSOAPResult {
  chunkId: string;
  chunk: Chunk;
  soapResult: ProcessingResult;
  processingTime: number;
  confidence: number;
}

export interface IntegratedConfig {
  // Config del buffer (para eliminar sílaba por sílaba)
  bufferConfig: {
    minWordCount: number;      // VITAL: Mínimo 8-10 palabras por segmento
    maxWaitTime: number;       // Tiempo máximo para completar
    pauseThreshold: number;    // Pausa para completar segmento
    confidenceThreshold: number;
  };
  
  // Config del chunking (según especificación Mauricio)
  chunkingConfig: ChunkingConfig;
  
  // Procesamiento
  enableRealTimeChunking: boolean;
  batchSize: number;         // Cuántos segmentos acumular antes de chunking
  enableSOAPProcessing: boolean;
}

// === SERVICIO PRINCIPAL ===

export class IntegratedChunkingService {
  private bufferService: BufferedTranscriptionService;
  private soapProcessor: RealWorldSOAPProcessor;
  private accumulatedSegments: BufferedSegment[] = [];
  private fullTranscript = '';
  private isProcessing = false;
  
  private config: IntegratedConfig = {
    bufferConfig: {
      minWordCount: 10,        // VITAL: Forzar mínimo 10 palabras (NO sílabas)
      maxWaitTime: 5000,       // 5 segundos máximo
      pauseThreshold: 2000,    // 2 segundos de pausa
      confidenceThreshold: 0.6 // Confianza mínima
    },
    chunkingConfig: CHUNKING_CONFIGS.STANDARD, // 8 utterances, 2 overlap
    enableRealTimeChunking: true,
    batchSize: 4,              // Procesar cada 4 segmentos buffered
    enableSOAPProcessing: true
  };

  // Callbacks del usuario
  private userCallbacks: {
    onChunkCreated?: (chunk: Chunk) => void;
    onChunkProcessed?: (result: ChunkSOAPResult) => void;
    onBatchCompleted?: (result: ChunkedTranscriptionResult) => void;
    onError?: (error: Error) => void;
  } = {};

  constructor(
    callbacks: typeof IntegratedChunkingService.prototype.userCallbacks,
    customConfig?: Partial<IntegratedConfig>
  ) {
    this.userCallbacks = callbacks;
    this.config = { ...this.config, ...customConfig };
    this.soapProcessor = new RealWorldSOAPProcessor();
    
    console.log('TARGET: Iniciando servicio integrado de chunking');
    console.log('STATS: Configuración buffer:', this.config.bufferConfig);
    console.log('📦 Configuración chunking:', this.config.chunkingConfig);
    
    this.initializeBufferService();
  }

  /**
   * Inicializar BufferedTranscriptionService con callbacks integrados
   */
  private initializeBufferService(): void {
    const bufferCallbacks: TranscriptionCallbacks = {
      onRealTimeUpdate: (text: string, speaker: string) => {
        // Mostrar transcripción en tiempo real pero NO procesar
        console.log(`AUDIO: Tiempo real: ${speaker} - "${text}"`);
      },
      
      onBufferedSegment: (segment: BufferedSegment) => {
        console.log(`NOTES Segmento buffered: ${segment.wordCount} palabras - "${segment.text.substring(0, 50)}..."`);
        this.handleBufferedSegment(segment);
      },
      
      onSOAPProcessing: (segments: BufferedSegment[]) => {
        console.log(`AI: Solicitud SOAP para ${segments.length} segmentos - USANDO CHUNKING`);
        this.handleSOAPProcessingRequest(segments);
      },
      
      onError: (error: string) => {
        console.error('ERROR: Error en buffer:', error);
        if (this.userCallbacks.onError) {
          this.userCallbacks.onError(new Error(error));
        }
      }
    };

    this.bufferService = new BufferedTranscriptionService(
      bufferCallbacks,
      this.config.bufferConfig
    );
  }

  /**
   * HANDLER VITAL: Procesar segmento buffered (NO sílaba por sílaba)
   */
  private async handleBufferedSegment(segment: BufferedSegment): Promise<void> {
    // Verificar que el segmento tenga contenido sustancial
    if (segment.wordCount < this.config.bufferConfig.minWordCount) {
      console.log(`⏭️ Segmento descartado: solo ${segment.wordCount} palabras`);
      return;
    }

    console.log(`SUCCESS: Segmento válido recibido: ${segment.wordCount} palabras`);
    console.log(`📄 Contenido: "${segment.text}"`);
    
    // Acumular segmento
    this.accumulatedSegments.push(segment);
    this.fullTranscript += `${segment.speaker}: ${segment.text}\n`;

    // Procesar si tenemos suficientes segmentos
    if (this.accumulatedSegments.length >= this.config.batchSize) {
      await this.processAccumulatedSegments();
    }
  }

  /**
   * HANDLER VITAL: Procesar con chunking en lugar de SOAP directo
   */
  private async handleSOAPProcessingRequest(segments: BufferedSegment[]): Promise<void> {
    console.log('RELOAD: Interceptando solicitud SOAP - Aplicando CHUNKING en su lugar');
    
    // Agregar segmentos faltantes
    for (const segment of segments) {
      if (!this.accumulatedSegments.find(s => s.id === segment.id)) {
        this.accumulatedSegments.push(segment);
        this.fullTranscript += `${segment.speaker}: ${segment.text}\n`;
      }
    }

    // Procesar con chunking
    await this.processAccumulatedSegments();
  }

  /**
   * PROCESAMIENTO PRINCIPAL: Aplicar chunking según especificación de Mauricio
   */
  private async processAccumulatedSegments(): Promise<void> {
    if (this.isProcessing || this.accumulatedSegments.length === 0) {
      return;
    }

    this.isProcessing = true;
    const startTime = Date.now();

    try {
      console.log('\nTARGET: === INICIANDO CHUNKING SEGÚN MAURICIO ===');
      console.log(`📄 Procesando ${this.accumulatedSegments.length} segmentos buffered`);
      console.log(`NOTES Transcripción completa: ${this.fullTranscript.length} caracteres`);

      // PASO 1: Convertir transcripción completa a utterances
      console.log('\nNOTES PASO 1: Convirtiendo a utterances...');
      const utterances = parseTranscriptToUtterances(this.fullTranscript);
      console.log(`SUCCESS: ${utterances.length} utterances creadas`);

      // PASO 2: Crear chunks con solapamiento (especificación exacta de Mauricio)
      console.log('\n📦 PASO 2: Creando chunks con solapamiento...');
      const chunks = chunkTranscript(
        utterances,
        this.config.chunkingConfig.chunkSize,    // Default: 8 utterances
        this.config.chunkingConfig.overlap       // Default: 2 utterances overlap
      );
      
      console.log(`SUCCESS: ${chunks.length} chunks creados`);
      
      // Debug del chunking
      debugChunking(chunks);
      verifyOverlap(chunks);

      // PASO 3: Procesar cada chunk con LLM
      console.log('\nAI: PASO 3: Procesando chunks...');
      const chunkResults: ChunkSOAPResult[] = [];

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        console.log(`\nRELOAD: Procesando ${chunk.id} (${i + 1}/${chunks.length})`);
        
        try {
          const chunkStartTime = Date.now();
          
          // Construir texto del chunk para procesamiento
          const chunkText = chunk.utterances
            .map(u => `${u.speaker}: ${u.text}`)
            .join('\n');

          console.log(`📄 Texto del chunk:\n${chunkText}`);

          // Procesar con SOAP real
          let soapResult: ProcessingResult;
          if (this.config.enableSOAPProcessing) {
            soapResult = await this.soapProcessor.processTranscription(chunkText);
          } else {
            // Resultado simulado para testing
            soapResult = {
              segments: [{ 
                text: `Chunk ${chunk.id} procesado`,
                section: 'S',
                confidence: 0.8,
                entities: []
              }],
              processingMetrics: {
                totalSegments: 1,
                averageConfidence: 0.8,
                processingTime: 100,
                errors: []
              },
              fullAssessment: `Assessment para ${chunk.id}`,
              log: [`Chunk ${chunk.id} procesado correctamente`]
            };
          }

          const processingTime = Date.now() - chunkStartTime;
          const confidence = this.calculateChunkConfidence(chunk, soapResult);

          const chunkResult: ChunkSOAPResult = {
            chunkId: chunk.id,
            chunk,
            soapResult,
            processingTime,
            confidence
          };

          chunkResults.push(chunkResult);

          console.log(`SUCCESS: ${chunk.id} completado: ${soapResult.segments.length} segmentos SOAP, confianza: ${confidence.toFixed(2)}`);

          // Callback por chunk procesado
          if (this.userCallbacks.onChunkProcessed) {
            this.userCallbacks.onChunkProcessed(chunkResult);
          }

        } catch (error) {
          console.error(`ERROR: Error procesando ${chunk.id}:`, error);
          // Continuar con el siguiente chunk
        }
      }

      // PASO 4: Compilar resultado final
      const totalProcessingTime = Date.now() - startTime;
      const chunkingStats = this.calculateChunkingStats(chunks, chunkResults, totalProcessingTime);

      const finalResult: ChunkedTranscriptionResult = {
        originalSegments: [...this.accumulatedSegments],
        utterances,
        chunks,
        soapResults: chunkResults,
        totalProcessingTime,
        chunkingStats
      };

      console.log('\nSTATS: === RESULTADOS FINALES ===');
      console.log(`TIME: Tiempo total: ${totalProcessingTime}ms`);
      console.log(`📦 Chunks procesados: ${chunks.length}`);
      console.log(`METRICS: Eficiencia: ${chunkingStats.processingEfficiency.toFixed(2)}x`);
      console.log(`STATS: Tamaño promedio chunk: ${chunkingStats.averageChunkSize.toFixed(1)} utterances`);

      // Callback resultado completo
      if (this.userCallbacks.onBatchCompleted) {
        this.userCallbacks.onBatchCompleted(finalResult);
      }

      // Limpiar acumuladores para siguiente batch
      this.resetAccumulators();

      console.log('TARGET: === FIN CHUNKING ===\n');

    } catch (error) {
      console.error('ERROR: Error en procesamiento chunking:', error);
      if (this.userCallbacks.onError) {
        this.userCallbacks.onError(error as Error);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Calcular confianza del chunk procesado
   */
  private calculateChunkConfidence(chunk: Chunk, soapResult: ProcessingResult): number {
    let confidence = soapResult.processingMetrics.averageConfidence || 0.5;
    
    // Bonificar por tamaño adecuado del chunk
    if (chunk.utterances.length >= 5 && chunk.utterances.length <= 12) {
      confidence += 0.1;
    }
    
    // Bonificar por diversidad de hablantes
    const speakers = new Set(chunk.utterances.map(u => u.speaker));
    if (speakers.size > 1) {
      confidence += 0.1;
    }
    
    // Bonificar por contenido clínico identificado
    if (chunk.metadata?.hasSymptoms || chunk.metadata?.hasExamination) {
      confidence += 0.1;
    }

    return Math.min(0.95, confidence);
  }

  /**
   * Calcular estadísticas del chunking
   */
  private calculateChunkingStats(
    chunks: Chunk[], 
    results: ChunkSOAPResult[], 
    totalTime: number
  ) {
    const totalUtterances = chunks.reduce((sum, chunk) => sum + chunk.utterances.length, 0);
    const averageChunkSize = totalUtterances / chunks.length;
    
    // Calcular solapamiento total
    let overlapUtterances = 0;
    for (let i = 0; i < chunks.length - 1; i++) {
      const currentChunk = chunks[i];
      const nextChunk = chunks[i + 1];
      overlapUtterances += Math.max(0, currentChunk.endIndex - nextChunk.startIndex);
    }

    // Calcular eficiencia vs procesamiento tradicional
    const traditionalTime = chunks.length * 2000; // Simulación tiempo tradicional
    const processingEfficiency = traditionalTime / totalTime;

    return {
      totalChunks: chunks.length,
      averageChunkSize,
      overlapUtterances,
      processingEfficiency
    };
  }

  /**
   * Resetear acumuladores para siguiente batch
   */
  private resetAccumulators(): void {
    this.accumulatedSegments = [];
    this.fullTranscript = '';
  }

  // === MÉTODOS PÚBLICOS ===

  /**
   * Iniciar grabación con chunking integrado
   */
  async startRecording(): Promise<void> {
    console.log('AUDIO: Iniciando grabación con chunking integrado');
    console.log(`STATS: Config: min ${this.config.bufferConfig.minWordCount} palabras por segmento`);
    console.log(`📦 Chunking: ${this.config.chunkingConfig.chunkSize} utterances, ${this.config.chunkingConfig.overlap} overlap`);
    
    this.resetAccumulators();
    await this.bufferService.startRecording();
  }

  /**
   * Detener grabación y procesar chunks finales
   */
  async stopRecording(): Promise<ChunkedTranscriptionResult | null> {
    console.log('🛑 Deteniendo grabación...');
    
    await this.bufferService.stopRecording();
    
    // Procesar segmentos restantes
    if (this.accumulatedSegments.length > 0) {
      await this.processAccumulatedSegments();
      // El resultado se envía vía callback
    }

    return null; // Resultado se envía por callback
  }

  /**
   * Procesar transcripción completa (modo offline)
   */
  async processFullTranscription(transcriptText: string): Promise<ChunkedTranscriptionResult> {
    console.log('📄 Procesando transcripción completa en modo offline');
    console.log(`NOTES Longitud: ${transcriptText.length} caracteres`);

    this.fullTranscript = transcriptText;
    this.accumulatedSegments = []; // No hay segmentos buffered en modo offline

    const startTime = Date.now();

    // Simular proceso de chunking directo
    const utterances = parseTranscriptToUtterances(transcriptText);
    const chunks = chunkTranscript(
      utterances,
      this.config.chunkingConfig.chunkSize,
      this.config.chunkingConfig.overlap
    );

    const chunkResults: ChunkSOAPResult[] = [];

    for (const chunk of chunks) {
      const chunkText = chunk.utterances
        .map(u => `${u.speaker}: ${u.text}`)
        .join('\n');

      const soapResult = await this.soapProcessor.processTranscription(chunkText);
      
      chunkResults.push({
        chunkId: chunk.id,
        chunk,
        soapResult,
        processingTime: 100, // Simulado
        confidence: this.calculateChunkConfidence(chunk, soapResult)
      });
    }

    const totalProcessingTime = Date.now() - startTime;
    const chunkingStats = this.calculateChunkingStats(chunks, chunkResults, totalProcessingTime);

    return {
      originalSegments: [],
      utterances,
      chunks,
      soapResults: chunkResults,
      totalProcessingTime,
      chunkingStats
    };
  }

  /**
   * Actualizar configuración
   */
  updateConfig(newConfig: Partial<IntegratedConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (newConfig.bufferConfig) {
      this.bufferService.updateConfig(newConfig.bufferConfig);
    }
    
    console.log('STATS: Configuración actualizada:', this.config);
  }

  /**
   * Obtener configuración actual
   */
  getConfig(): IntegratedConfig {
    return { ...this.config };
  }

  /**
   * Obtener estadísticas actuales
   */
  getStats() {
    return {
      accumulatedSegments: this.accumulatedSegments.length,
      isProcessing: this.isProcessing,
      fullTranscriptLength: this.fullTranscript.length,
      bufferStats: this.bufferService.getStats()
    };
  }
}

// === CONFIGURACIONES PREDEFINIDAS ===

export const INTEGRATED_CONFIGS = {
  // Configuración exacta según especificación de Mauricio
  MAURICIO_SPEC: {
    bufferConfig: {
      minWordCount: 8,         // Mínimo 8 palabras (NO sílabas)
      maxWaitTime: 4000,
      pauseThreshold: 1500,
      confidenceThreshold: 0.6
    },
    chunkingConfig: CHUNKING_CONFIGS.STANDARD, // 8 utterances, 2 overlap
    enableRealTimeChunking: true,
    batchSize: 3,
    enableSOAPProcessing: true
  } as IntegratedConfig,

  // Para desarrollo y testing
  DEVELOPMENT: {
    bufferConfig: {
      minWordCount: 5,
      maxWaitTime: 3000,
      pauseThreshold: 1000,
      confidenceThreshold: 0.5
    },
    chunkingConfig: CHUNKING_CONFIGS.COMPACT,
    enableRealTimeChunking: true,
    batchSize: 2,
    enableSOAPProcessing: false // Solo simulación
  } as IntegratedConfig,

  // Para producción optimizada
  PRODUCTION: {
    bufferConfig: {
      minWordCount: 10,
      maxWaitTime: 5000,
      pauseThreshold: 2000,
      confidenceThreshold: 0.7
    },
    chunkingConfig: CHUNKING_CONFIGS.DETAILED,
    enableRealTimeChunking: true,
    batchSize: 4,
    enableSOAPProcessing: true
  } as IntegratedConfig
}; 