import { SemanticChunk } from '../types/medical';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../core/firebase/firebaseClient';

export interface ClinicalHighlight {
  text: string;
  category: 'symptom' | 'finding' | 'treatment' | 'assessment';
  relevance: number;
  soapCategory: 'S' | 'O' | 'A' | 'P';
}

export interface ClinicalInsight {
  insight: string;
  confidence: number;
  evidence: string;
}

export interface RedFlag {
  flag: string;
  severity: 'low' | 'medium' | 'high';
  recommendation: string;
}

export interface SOAPSuggestion {
  category: 'S' | 'O' | 'A' | 'P';
  confidence: number;
  reasoning: string;
}

export interface ClinicalAnalysis {
  chunkId: string;
  highlights: ClinicalHighlight[];
  clinicalInsights: ClinicalInsight[];
  redFlags: RedFlag[];
  nextSteps: string[];
  soapSuggestion: SOAPSuggestion;
  processingTime: number;
  timestamp: number;
}

export class RealTimeClinicalAnalysis {
  private analyzeSemanticChunk = httpsCallable(functions, 'analyzeSemanticChunk');
  private activeAnalyses = new Map<string, Promise<ClinicalAnalysis>>();

  async processSemanticChunk(chunk: SemanticChunk): Promise<ClinicalAnalysis> {
    // Solo procesar chunks de alta calidad
    if (!chunk.readyForAnalysis || chunk.completeness < 0.6) {
      return this.createBasicAnalysis(chunk);
    }

    try {
      // Evitar análisis duplicados
      if (this.activeAnalyses.has(chunk.id)) {
        return await this.activeAnalyses.get(chunk.id)!;
      }

      // Procesar con Vertex AI Flash
      const analysisPromise = this.analyzeWithVertexAI(chunk);
      this.activeAnalyses.set(chunk.id, analysisPromise);
      
      const analysis = await analysisPromise;
      this.activeAnalyses.delete(chunk.id);
      
      // Emit highlights en tiempo real
      this.emitRealTimeHighlights(analysis);
      
      return analysis;
      
    } catch (error) {
      console.error('Clinical analysis error:', error);
      return this.createFallbackAnalysis(chunk);
    }
  }

  private async analyzeWithVertexAI(chunk: SemanticChunk): Promise<ClinicalAnalysis> {
    const result = await this.analyzeSemanticChunk({
      semanticChunk: {
        id: chunk.id,
        transcription: chunk.transcription,
        medicalPhase: chunk.medicalPhase,
        clinicalKeywords: chunk.clinicalKeywords,
        completeness: chunk.completeness,
        contextRelevance: chunk.contextRelevance
      }
    });

    return {
      chunkId: chunk.id,
      highlights: result.data.highlights || [],
      clinicalInsights: result.data.clinicalInsights || [],
      redFlags: result.data.redFlags || [],
      nextSteps: result.data.nextSteps || [],
      soapSuggestion: result.data.soapSuggestion || {
        category: 'S',
        confidence: 0.5,
        reasoning: 'Análisis básico'
      },
      processingTime: result.data.metadata?.processingTime || 0,
      timestamp: Date.now()
    };
  }

  private createBasicAnalysis(chunk: SemanticChunk): ClinicalAnalysis {
    const basicHighlight: ClinicalHighlight = {
      text: chunk.transcription,
      category: 'symptom',
      relevance: chunk.completeness,
      soapCategory: chunk.soapCategory
    };

    return {
      chunkId: chunk.id,
      highlights: [basicHighlight],
      clinicalInsights: [],
      redFlags: [],
      nextSteps: [],
      soapSuggestion: {
        category: chunk.soapCategory,
        confidence: chunk.completeness,
        reasoning: 'Análisis básico por completeness bajo'
      },
      processingTime: 0,
      timestamp: Date.now()
    };
  }

  private createFallbackAnalysis(chunk: SemanticChunk): ClinicalAnalysis {
    return {
      chunkId: chunk.id,
      highlights: [],
      clinicalInsights: [],
      redFlags: [],
      nextSteps: [],
      soapSuggestion: {
        category: 'S',
        confidence: 0.1,
        reasoning: 'Error en análisis - fallback'
      },
      processingTime: 0,
      timestamp: Date.now()
    };
  }

  private emitRealTimeHighlights(analysis: ClinicalAnalysis): void {
    // Emit highlights immediately para UI
    window.dispatchEvent(new CustomEvent('clinicalHighlight', {
      detail: {
        highlights: analysis.highlights,
        redFlags: analysis.redFlags,
        soapSuggestion: analysis.soapSuggestion,
        clinicalInsights: analysis.clinicalInsights,
        nextSteps: analysis.nextSteps
      }
    }));
  }

  // Métodos de utilidad
  getActiveAnalysesCount(): number {
    return this.activeAnalyses.size;
  }

  clearActiveAnalyses(): void {
    this.activeAnalyses.clear();
  }

  getAverageProcessingTime(): number {
    // Implementar tracking de tiempos promedio
    return 1500; // ms estimado
  }
} 