export interface SemanticChunk {
  id: string;
  audioBlob: Blob;
  transcription: string;
  startTime: number;
  endTime: number;
  duration: number;
  medicalPhase: MedicalPhase;
  clinicalKeywords: string[];
  completeness: number;
  contextRelevance: number;
  soapCategory: "S" | "O" | "A" | "P";
  readyForAnalysis: boolean;
}

export type MedicalPhase = "anamnesis" | "exploration" | "evaluation" | "planning";

export class SemanticChunkingService {
  private currentChunk: Partial<SemanticChunk> | null = null;
  private chunks: SemanticChunk[] = [];
  private lastSpeechTime: number = 0;
  private isProcessing: boolean = false;
  private listeners: Map<string, Function[]> = new Map();

  constructor() {}

  processTranscriptionSegment(text: string, audioBlob: Blob, timestamp: number): SemanticChunk | null {
    if (this.isProcessing) {
      return null;
    }

    this.isProcessing = true;

    try {
      if (!this.currentChunk) {
        this.startNewChunk(audioBlob, timestamp);
      }

      if (this.currentChunk) {
        this.currentChunk.transcription = this.currentChunk.transcription 
          ? `${this.currentChunk.transcription} ${text}`.trim()
          : text;
      }

      if (this.shouldFinalizeChunk(text, timestamp)) {
        const finalizedChunk = this.finalizeChunk(timestamp);
        this.emit("chunkCompleted", finalizedChunk);
        return finalizedChunk;
      }

      return null;
    } finally {
      this.isProcessing = false;
    }
  }

  private startNewChunk(audioBlob: Blob, timestamp: number): void {
    this.currentChunk = {
      id: `chunk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      audioBlob,
      transcription: "",
      startTime: timestamp,
      endTime: 0,
      duration: 0,
      medicalPhase: "anamnesis",
      clinicalKeywords: [],
      completeness: 0,
      contextRelevance: 0,
      soapCategory: "S",
      readyForAnalysis: false
    };
  }

  private shouldFinalizeChunk(text: string, timestamp: number): boolean {
    if (!this.currentChunk) return false;

    const duration = timestamp - this.currentChunk.startTime!;
    const timeSinceLastSpeech = timestamp - this.lastSpeechTime;

    if (duration >= 3000) {
      if (timeSinceLastSpeech > 1500) {
        return true;
      }

      if (this.detectSemanticTrigger(text)) {
        return true;
      }

      if (duration >= 8000) {
        return true;
      }

      const completeness = this.calculateCompleteness();
      if (completeness >= 0.6) {
        return true;
      }
    }

    this.lastSpeechTime = timestamp;
    return false;
  }

  private detectSemanticTrigger(text: string): boolean {
    const lowerText = text.toLowerCase();
    const triggers = [
      "el paciente presenta",
      "se observa que",
      "durante la evaluación",
      "el tratamiento consiste",
      "se recomienda"
    ];
    
    for (const trigger of triggers) {
      if (lowerText.includes(trigger.toLowerCase())) {
        if (this.currentChunk) {
          this.currentChunk.medicalPhase = "anamnesis";
        }
        return true;
      }
    }
    
    return false;
  }

  private calculateCompleteness(): number {
    if (!this.currentChunk?.transcription) return 0;

    const text = this.currentChunk.transcription;
    let score = 0;

    const wordCount = text.split(" ").length;
    if (wordCount >= 10) score += 0.3;
    else if (wordCount >= 5) score += 0.2;
    else if (wordCount >= 3) score += 0.1;

    const keywords = this.extractClinicalKeywords(text);
    if (keywords.length >= 3) score += 0.4;
    else if (keywords.length >= 2) score += 0.3;
    else if (keywords.length >= 1) score += 0.2;

    if (text.includes(".") || text.includes("?") || text.includes("!")) {
      score += 0.3;
    } else if (text.length > 50) {
      score += 0.2;
    }

    return Math.min(score, 1.0);
  }

  private extractClinicalKeywords(text: string): string[] {
    const keywords: string[] = [];
    const lowerText = text.toLowerCase();
    const medicalTerms = ["dolor", "lumbar", "cervical", "hombro", "rodilla", "palpación", "movilidad"];

    medicalTerms.forEach(term => {
      if (lowerText.includes(term.toLowerCase())) {
        keywords.push(term);
      }
    });

    return [...new Set(keywords)];
  }

  private finalizeChunk(endTime: number): SemanticChunk {
    if (!this.currentChunk) {
      throw new Error("No hay chunk activo para finalizar");
    }

    const chunk: SemanticChunk = {
      ...this.currentChunk,
      endTime,
      duration: endTime - this.currentChunk.startTime!,
      clinicalKeywords: this.extractClinicalKeywords(this.currentChunk.transcription || ""),
      completeness: this.calculateCompleteness(),
      contextRelevance: 0.8,
      soapCategory: this.determineSOAPCategory(this.currentChunk.transcription || ""),
      readyForAnalysis: true
    };

    this.chunks.push(chunk);
    this.currentChunk = null;
    this.lastSpeechTime = 0;

    return chunk;
  }

  private determineSOAPCategory(text: string): "S" | "O" | "A" | "P" {
    const lowerText = text.toLowerCase();

    if (lowerText.includes("paciente presenta") || lowerText.includes("dolor") || lowerText.includes("siente") || lowerText.includes("refiere")) {
      return "S";
    }

    if (lowerText.includes("se observa") || lowerText.includes("se palpa") || lowerText.includes("se evalúa") || lowerText.includes("test") || lowerText.includes("movilidad")) {
      return "O";
    }

    if (lowerText.includes("diagnóstico") || lowerText.includes("se concluye") || lowerText.includes("se determina") || lowerText.includes("compatible con")) {
      return "A";
    }

    if (lowerText.includes("tratamiento") || lowerText.includes("se recomienda") || lowerText.includes("se prescribe") || lowerText.includes("próxima sesión")) {
      return "P";
    }

    return "S";
  }

  forceFinalizeChunk(): SemanticChunk | null {
    if (!this.currentChunk) return null;

    const timestamp = Date.now();
    return this.finalizeChunk(timestamp);
  }

  getChunks(): SemanticChunk[] {
    return [...this.chunks];
  }

  clearChunks(): void {
    this.chunks = [];
    this.currentChunk = null;
    this.lastSpeechTime = 0;
  }

  getStatus(): {
    isProcessing: boolean;
    currentChunk: Partial<SemanticChunk> | null;
    totalChunks: number;
    averageDuration: number;
    averageCompleteness: number;
    averageRelevance: number;
  } {
    const totalChunks = this.chunks.length;
    const averageDuration = totalChunks > 0 
      ? this.chunks.reduce((sum, chunk) => sum + chunk.duration, 0) / totalChunks 
      : 0;
    const averageCompleteness = totalChunks > 0 
      ? this.chunks.reduce((sum, chunk) => sum + chunk.completeness, 0) / totalChunks 
      : 0;
    const averageRelevance = totalChunks > 0 
      ? this.chunks.reduce((sum, chunk) => sum + chunk.contextRelevance, 0) / totalChunks 
      : 0;

    return {
      isProcessing: this.isProcessing,
      currentChunk: this.currentChunk,
      totalChunks,
      averageDuration,
      averageCompleteness,
      averageRelevance
    };
  }

  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  private emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error en callback de evento ${event}:`, error);
      }
    });
  }

  destroy(): void {
    this.clearChunks();
    this.listeners.clear();
    this.isProcessing = false;
  }
}