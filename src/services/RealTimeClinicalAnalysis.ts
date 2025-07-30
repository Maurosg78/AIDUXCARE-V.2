// RealTimeClinicalAnalysis.ts - Análisis clínico en tiempo real con Vertex AI
import { httpsCallable } from 'firebase/functions';
import { functions } from '../core/firebase/firebaseClient';
import { SemanticChunk } from './SemanticChunkingService';

export interface ClinicalHighlight {
  id: string;
  text: string;
  category: 'symptom' | 'finding' | 'treatment' | 'assessment';
  soapCategory: 'S' | 'O' | 'A' | 'P';
  relevance: number; // 0-1
  timestamp: number;
  chunkId: string;
}

export interface ClinicalInsight {
  id: string;
  insight: string;
  type: 'suggestion' | 'observation' | 'concern';
  confidence: number;
  sources: string[];
}

export interface RedFlag {
  id: string;
  flag: string;
  severity: 'low' | 'medium' | 'high';
  recommendation: string;
  chunkId: string;
}

export interface SOAPSuggestion {
  S: string;
  O: string;
  A: string;
  P: string;
}

export interface ClinicalAnalysis {
  highlights: ClinicalHighlight[];
  clinicalInsights: ClinicalInsight[];
  redFlags: RedFlag[];
  nextSteps: string[];
  soapSuggestion: SOAPSuggestion;
  confidence: number;
  processingTime: number;
  timestamp: number;
}

export class RealTimeClinicalAnalysis {
  private processedChunks: Set<string> = new Set();
  private isAnalyzing: boolean = false;
  private analysisQueue: SemanticChunk[] = [];

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Escuchar chunks completados
    window.addEventListener('chunkCompleted', this.handleChunkCompleted.bind(this) as EventListener);
  }

  private async handleChunkCompleted(event: any): Promise<void> {
    const { chunk, confidence } = event.detail;
    
    if (confidence < 0.6) {
      console.log('🔍 Chunk con baja confianza, enviando a análisis básico');
      this.createBasicAnalysis(chunk);
      return;
    }

    await this.processSemanticChunk(chunk);
  }

  public async processSemanticChunk(chunk: SemanticChunk): Promise<ClinicalAnalysis> {
    // Evitar procesamiento duplicado
    if (this.processedChunks.has(chunk.id)) {
      console.log('⚠️ Chunk ya procesado, omitiendo:', chunk.id);
      return this.createFallbackAnalysis(chunk);
    }

    this.processedChunks.add(chunk.id);
    this.isAnalyzing = true;

    // Emitir evento de procesamiento
    window.dispatchEvent(new CustomEvent('semanticChunkProcessing', {
      detail: { chunkId: chunk.id, status: 'analyzing' }
    }));

    try {
      const startTime = Date.now();
      const analysis = await this.analyzeWithVertexAI(chunk);
      const processingTime = Date.now() - startTime;

      const finalAnalysis = {
        ...analysis,
        processingTime,
        timestamp: Date.now()
      };

      // Emitir highlights en tiempo real
      this.emitRealTimeHighlights(finalAnalysis, chunk);

      return finalAnalysis;

    } catch (error) {
      console.error('❌ Error en análisis Vertex AI:', error);
      return this.createFallbackAnalysis(chunk);
    } finally {
      this.isAnalyzing = false;
      
      window.dispatchEvent(new CustomEvent('semanticChunkProcessing', {
        detail: { chunkId: chunk.id, status: 'completed' }
      }));
    }
  }

  private async analyzeWithVertexAI(chunk: SemanticChunk): Promise<ClinicalAnalysis> {
    const analyzeChunk = httpsCallable(functions, 'analyzeSemanticChunk');
    
    const payload = {
      transcription: chunk.transcription,
      medicalPhase: chunk.medicalPhase,
      soapCategory: chunk.soapCategory,
      clinicalKeywords: chunk.clinicalKeywords,
      completeness: chunk.completeness,
      contextRelevance: chunk.contextRelevance,
      duration: chunk.duration
    };

    const result = await analyzeChunk(payload);
    const data = result.data as any;
    
    return {
      highlights: data?.highlights || [],
      clinicalInsights: data?.clinicalInsights || [],
      redFlags: data?.redFlags || [],
      nextSteps: data?.nextSteps || [],
      soapSuggestion: data?.soapSuggestion || {
        S: '', O: '', A: '', P: ''
      },
      confidence: 0.85,
      processingTime: data?.metadata?.processingTime || 0,
      timestamp: Date.now()
    };
  }

  private createBasicAnalysis(chunk: SemanticChunk): ClinicalAnalysis {
    // Análisis básico para chunks de baja confianza
    const highlights: ClinicalHighlight[] = chunk.clinicalKeywords.map((keyword, index) => ({
      id: `highlight_${chunk.id}_${index}`,
      text: `Término clínico detectado: ${keyword}`,
      category: 'finding' as const,
      soapCategory: chunk.soapCategory,
      relevance: 0.6,
      timestamp: Date.now(),
      chunkId: chunk.id
    }));

    const analysis: ClinicalAnalysis = {
      highlights,
      clinicalInsights: [],
      redFlags: [],
      nextSteps: ['Continuar recopilando información'],
      soapSuggestion: { S: '', O: '', A: '', P: '' },
      confidence: 0.6,
      processingTime: 50,
      timestamp: Date.now()
    };

    this.emitRealTimeHighlights(analysis, chunk);
    return analysis;
  }

  private createFallbackAnalysis(chunk: SemanticChunk): ClinicalAnalysis {
    return {
      highlights: [],
      clinicalInsights: [{
        id: `fallback_${chunk.id}`,
        insight: 'Información registrada para revisión posterior',
        type: 'observation',
        confidence: 0.5,
        sources: ['local_processing']
      }],
      redFlags: [],
      nextSteps: [],
      soapSuggestion: { S: '', O: '', A: '', P: '' },
      confidence: 0.5,
      processingTime: 10,
      timestamp: Date.now()
    };
  }

  private emitRealTimeHighlights(analysis: ClinicalAnalysis, chunk: SemanticChunk): void {
    // Emitir highlights individuales
    analysis.highlights.forEach(highlight => {
      window.dispatchEvent(new CustomEvent('clinicalHighlight', {
        detail: { highlight, chunkId: chunk.id }
      }));
    });

    // Emitir red flags
    analysis.redFlags.forEach(redFlag => {
      window.dispatchEvent(new CustomEvent('clinicalRedFlag', {
        detail: { redFlag, chunkId: chunk.id }
      }));
    });

    // Emitir métricas
    window.dispatchEvent(new CustomEvent('clinicalMetricsUpdate', {
      detail: {
        processingTime: analysis.processingTime,
        confidence: analysis.confidence,
        highlightsCount: analysis.highlights.length,
        redFlagsCount: analysis.redFlags.length,
        soapSuggestion: analysis.soapSuggestion
      }
    }));

    console.log('📊 Análisis Clínico Completado:', {
      chunkId: chunk.id,
      highlights: analysis.highlights.length,
      redFlags: analysis.redFlags.length,
      confidence: `${(analysis.confidence * 100).toFixed(0)}%`,
      processingTime: `${analysis.processingTime}ms`
    });
  }

  // Métodos públicos
  public getProcessingStatus(): { isAnalyzing: boolean; queueLength: number; processedCount: number } {
    return {
      isAnalyzing: this.isAnalyzing,
      queueLength: this.analysisQueue.length,
      processedCount: this.processedChunks.size
    };
  }

  public reset(): void {
    this.processedChunks.clear();
    this.analysisQueue = [];
    this.isAnalyzing = false;
  }
}