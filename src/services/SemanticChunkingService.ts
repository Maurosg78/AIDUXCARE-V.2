// SemanticChunkingService.ts - Chunking inteligente para análisis médico
// Optimizado para Vertex AI Flash (3-8 segundos por chunk)

export interface SemanticChunk {
  id: string;
  audioBlob?: Blob;
  transcription?: string;
  startTime?: number;
  endTime: number;
  duration: number;
  medicalPhase?: MedicalPhase;
  clinicalKeywords: string[];
  completeness: number; // 0-1
  contextRelevance: number; // 0-1
  soapCategory: 'S' | 'O' | 'A' | 'P';
  readyForAnalysis: boolean;
}

export type MedicalPhase = 'anamnesis' | 'exploration' | 'evaluation' | 'planning';

export interface ChunkingConfig {
  minChunkDuration: number; // ms
  maxChunkDuration: number; // ms
  semanticThreshold: number; // 0-1
  medicalKeywordWeight: number; // multiplicador
  pauseDetectionMs: number; // silencio para corte
}

export interface SemanticTrigger {
  keyword: string;
  weight: number;
  soapCategory: 'S' | 'O' | 'A' | 'P';
  phase: MedicalPhase[];
}

export interface ClinicalKeyword {
  term: string;
  category: string;
  relevance: number;
}

export class SemanticChunkingService {
  private currentChunk: Partial<SemanticChunk> | null = null;
  private chunkBuffer: string = '';
  private lastTranscriptionTime: number = 0;
  private config: ChunkingConfig;
  private medicalTriggers: SemanticTrigger[] = [];
  private clinicalKeywords: ClinicalKeyword[] = [];

  constructor(config?: Partial<ChunkingConfig>) {
    this.config = {
      minChunkDuration: 3000, // 3 segundos mínimo
      maxChunkDuration: 8000, // 8 segundos máximo  
      semanticThreshold: 0.7,
      medicalKeywordWeight: 1.5,
      pauseDetectionMs: 1500, // 1.5s de pausa para corte
      ...config
    };

    this.initializeMedicalTriggers();
    this.initializeClinicalKeywords();
  }

  private initializeMedicalTriggers(): void {
    this.medicalTriggers = [
      // Anamnesis - Subjetivo
      { keyword: 'dolor', weight: 0.9, soapCategory: 'S', phase: ['anamnesis'] },
      { keyword: 'siento', weight: 0.8, soapCategory: 'S', phase: ['anamnesis'] },
      { keyword: 'molesta', weight: 0.8, soapCategory: 'S', phase: ['anamnesis'] },
      { keyword: 'desde cuando', weight: 0.9, soapCategory: 'S', phase: ['anamnesis'] },
      
      // Exploración - Objetivo  
      { keyword: 'palpo', weight: 0.9, soapCategory: 'O', phase: ['exploration'] },
      { keyword: 'observo', weight: 0.8, soapCategory: 'O', phase: ['exploration'] },
      { keyword: 'flexione', weight: 0.9, soapCategory: 'O', phase: ['exploration'] },
      { keyword: 'rango de movimiento', weight: 0.9, soapCategory: 'O', phase: ['exploration'] },
      
      // Evaluación - Assessment
      { keyword: 'diagnostico', weight: 0.9, soapCategory: 'A', phase: ['evaluation'] },
      { keyword: 'compatible con', weight: 0.8, soapCategory: 'A', phase: ['evaluation'] },
      { keyword: 'sugiere', weight: 0.7, soapCategory: 'A', phase: ['evaluation'] },
      
      // Planificación - Plan
      { keyword: 'recomiendo', weight: 0.9, soapCategory: 'P', phase: ['planning'] },
      { keyword: 'tratamiento', weight: 0.8, soapCategory: 'P', phase: ['planning'] },
      { keyword: 'ejercicios', weight: 0.8, soapCategory: 'P', phase: ['planning'] }
    ];
  }

  private initializeClinicalKeywords(): void {
    this.clinicalKeywords = [
      { term: 'cervical', category: 'anatomia', relevance: 0.9 },
      { term: 'lumbar', category: 'anatomia', relevance: 0.9 },
      { term: 'hombro', category: 'anatomia', relevance: 0.8 },
      { term: 'rigidez', category: 'sintoma', relevance: 0.8 },
      { term: 'inflamacion', category: 'hallazgo', relevance: 0.7 },
      { term: 'limitacion', category: 'hallazgo', relevance: 0.8 },
      { term: 'contractura', category: 'hallazgo', relevance: 0.8 },
      { term: 'fisioterapia', category: 'tratamiento', relevance: 0.9 }
    ];
  }

  public processTranscriptionSegment(
    transcription: string, 
    audioBlob?: Blob,
    currentPhase?: MedicalPhase
  ): SemanticChunk | null {
    const now = Date.now();
    
    // Inicializar chunk si es necesario
    if (!this.currentChunk) {
      this.currentChunk = {
        id: `chunk_${now}`,
        startTime: now,
        audioBlob,
        transcription: '',
        medicalPhase: currentPhase,
        clinicalKeywords: [],
        readyForAnalysis: false
      };
    }

    // Agregar transcripción al buffer
    this.chunkBuffer += ' ' + transcription;
    this.currentChunk.transcription = this.chunkBuffer.trim();
    this.lastTranscriptionTime = now;

    // Evaluar si debe finalizar el chunk
    if (this.shouldFinalizeChunk(this.chunkBuffer, now)) {
      return this.finalizeChunk();
    }

    return null;
  }

  private shouldFinalizeChunk(text: string, currentTime: number): boolean {
    if (!this.currentChunk?.startTime) return false;

    const chunkDuration = currentTime - this.currentChunk.startTime;
    
    // Forzar si excede duración máxima
    if (chunkDuration >= this.config.maxChunkDuration) {
      return true;
    }

    // No finalizar si es muy corto
    if (chunkDuration < this.config.minChunkDuration) {
      return false;
    }

    // Detectar pausa larga
    const timeSinceLastTranscription = currentTime - this.lastTranscriptionTime;
    if (timeSinceLastTranscription >= this.config.pauseDetectionMs) {
      return true;
    }

    // Detectar trigger semántico
    if (this.detectSemanticTrigger(text)) {
      return true;
    }

    return false;
  }

  private detectSemanticTrigger(text: string): boolean {
    const lowerText = text.toLowerCase();
    
    for (const trigger of this.medicalTriggers) {
      if (lowerText.includes(trigger.keyword)) {
        const sentences = text.split(/[.!?]/);
        if (sentences.length >= 2) { // Oración completa
          return true;
        }
      }
    }
    
    return false;
  }

  private extractClinicalKeywords(text: string): string[] {
    const found: string[] = [];
    const lowerText = text.toLowerCase();
    
    for (const keyword of this.clinicalKeywords) {
      if (lowerText.includes(keyword.term.toLowerCase())) {
        found.push(keyword.term);
      }
    }
    
    return found;
  }

  private calculateCompleteness(text: string): number {
    const words = text.split(/\s+/).length;
    const sentences = text.split(/[.!?]/).length;
    const clinicalTerms = this.extractClinicalKeywords(text).length;
    
    // Scoring: palabras, oraciones completas, términos clínicos
    let score = 0;
    
    if (words >= 10) score += 0.3;
    if (sentences >= 2) score += 0.4;
    if (clinicalTerms >= 1) score += 0.3;
    
    return Math.min(score, 1.0);
  }

  private calculateClinicalRelevance(text: string, phase?: MedicalPhase): number {
    const lowerText = text.toLowerCase();
    let relevance = 0;
    let totalWeight = 0;

    // Evaluar triggers médicos
    for (const trigger of this.medicalTriggers) {
      if (lowerText.includes(trigger.keyword)) {
        const phaseMatch = !phase || trigger.phase.includes(phase);
        const weight = phaseMatch ? trigger.weight : trigger.weight * 0.5;
        relevance += weight;
        totalWeight += trigger.weight;
      }
    }

    // Evaluar keywords clínicos
    for (const keyword of this.clinicalKeywords) {
      if (lowerText.includes(keyword.term.toLowerCase())) {
        relevance += keyword.relevance * this.config.medicalKeywordWeight;
        totalWeight += keyword.relevance;
      }
    }

    return totalWeight > 0 ? Math.min(relevance / totalWeight, 1.0) : 0.3;
  }

  private finalizeChunk(): SemanticChunk {
    if (!this.currentChunk) {
      throw new Error('No hay chunk activo para finalizar');
    }

    const endTime = Date.now();
    const transcription = this.chunkBuffer.trim();
    
    const chunk: SemanticChunk = {
      ...this.currentChunk,
      id: this.currentChunk.id!,
      endTime,
      duration: endTime - (this.currentChunk.startTime || endTime),
      transcription,
      clinicalKeywords: this.extractClinicalKeywords(transcription),
      completeness: this.calculateCompleteness(transcription),
      contextRelevance: this.calculateClinicalRelevance(transcription, this.currentChunk.medicalPhase),
      soapCategory: this.determineSOAPCategory(transcription, this.currentChunk.medicalPhase),
      readyForAnalysis: true
    };

    // Resetear para siguiente chunk
    this.currentChunk = null;
    this.chunkBuffer = '';

    // Emitir evento para análisis
    this.emitChunkCompleted(chunk);

    return chunk;
  }

  private determineSOAPCategory(text: string, phase?: MedicalPhase): 'S' | 'O' | 'A' | 'P' {
    const lowerText = text.toLowerCase();
    
    // Buscar triggers específicos
    for (const trigger of this.medicalTriggers) {
      if (lowerText.includes(trigger.keyword)) {
        return trigger.soapCategory;
      }
    }

    // Fallback basado en fase médica
    switch (phase) {
      case 'anamnesis': return 'S';
      case 'exploration': return 'O';
      case 'evaluation': return 'A';
      case 'planning': return 'P';
      default: return 'S';
    }
  }

  private calculateConfidence(chunk: SemanticChunk): number {
    const durationScore = Math.min(chunk.duration / this.config.minChunkDuration, 1.0);
    const completenessScore = chunk.completeness;
    const relevanceScore = chunk.contextRelevance;
    const keywordScore = Math.min(chunk.clinicalKeywords.length / 3, 1.0);
    
    return (durationScore + completenessScore + relevanceScore + keywordScore) / 4;
  }

  private emitChunkCompleted(chunk: SemanticChunk): void {
    const confidence = this.calculateConfidence(chunk);
    
    window.dispatchEvent(new CustomEvent('chunkCompleted', {
      detail: { chunk, confidence }
    }));

    console.log('🧩 Chunk Semántico Completado:', {
      id: chunk.id,
      duration: `${chunk.duration}ms`,
      completeness: `${(chunk.completeness * 100).toFixed(0)}%`,
      relevance: `${(chunk.contextRelevance * 100).toFixed(0)}%`,
      keywords: chunk.clinicalKeywords,
      soapCategory: chunk.soapCategory,
      confidence: `${(confidence * 100).toFixed(0)}%`
    });
  }

  // Métodos públicos
  public getCurrentChunkStatus(): any {
    if (!this.currentChunk) {
      return { active: false };
    }

    const now = Date.now();
    const duration = now - (this.currentChunk.startTime || now);
    
    return {
      active: true,
      duration,
      transcription: this.chunkBuffer,
      wordCount: this.chunkBuffer.split(/\s+/).length,
      estimatedCompleteness: this.calculateCompleteness(this.chunkBuffer)
    };
  }

  public forceFinalize(): SemanticChunk | null {
    if (!this.currentChunk || this.chunkBuffer.trim().length === 0) {
      return null;
    }
    
    return this.finalizeChunk();
  }

  public updateConfig(newConfig: Partial<ChunkingConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public reset(): void {
    this.currentChunk = null;
    this.chunkBuffer = '';
    this.lastTranscriptionTime = 0;
  }
}