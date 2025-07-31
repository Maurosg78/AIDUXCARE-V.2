// SemanticChunkingService.ts - Sistema de Chunking Semántico Médico para Vertex AI Flash
// Optimizado para análisis clínico con chunks de 3-8 segundos

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
  soapCategory: 'S' | 'O' | 'A' | 'P';
  readyForAnalysis: boolean;
}

export type MedicalPhase = 'anamnesis' | 'exploration' | 'evaluation' | 'planning';

export interface ChunkingConfig {
  minDuration: number; // 3 segundos mínimo
  maxDuration: number; // 8 segundos máximo
  pauseThreshold: number; // 1.5s pausa = boundary semántico
  medicalContextWeight: number; // Prioridad a contexto médico
  completenessThreshold: number; // 60% completeness mínimo
}

export interface SemanticTrigger {
  pattern: string;
  weight: number;
  phase: MedicalPhase;
}

export interface ClinicalKeyword {
  term: string;
  category: 'anatomy' | 'symptoms' | 'treatments' | 'tests';
  relevance: number;
}

// Configuración médica especializada
const MEDICAL_TRIGGERS: SemanticTrigger[] = [
  { pattern: 'el paciente presenta', weight: 0.9, phase: 'anamnesis' },
  { pattern: 'se observa que', weight: 0.8, phase: 'exploration' },
  { pattern: 'durante la evaluación', weight: 0.8, phase: 'evaluation' },
  { pattern: 'el tratamiento consiste', weight: 0.9, phase: 'planning' },
  { pattern: 'se recomienda', weight: 0.8, phase: 'planning' },
  { pattern: 'dolor localizado', weight: 0.7, phase: 'anamnesis' },
  { pattern: 'movilidad reducida', weight: 0.7, phase: 'exploration' },
  { pattern: 'próxima sesión', weight: 0.9, phase: 'planning' },
  { pattern: 'se palpa', weight: 0.8, phase: 'exploration' },
  { pattern: 'se evalúa', weight: 0.8, phase: 'evaluation' },
  { pattern: 'se diagnostica', weight: 0.9, phase: 'evaluation' },
  { pattern: 'se prescribe', weight: 0.9, phase: 'planning' },
  { pattern: 'se observa', weight: 0.7, phase: 'exploration' },
  { pattern: 'se detecta', weight: 0.8, phase: 'exploration' },
  { pattern: 'se confirma', weight: 0.8, phase: 'evaluation' },
  { pattern: 'se indica', weight: 0.8, phase: 'planning' },
  { pattern: 'se sugiere', weight: 0.7, phase: 'planning' },
  { pattern: 'se propone', weight: 0.7, phase: 'planning' },
  { pattern: 'se establece', weight: 0.8, phase: 'planning' },
  { pattern: 'se determina', weight: 0.8, phase: 'evaluation' },
  { pattern: 'se concluye', weight: 0.9, phase: 'evaluation' }
];

const CLINICAL_KEYWORDS: Record<string, ClinicalKeyword[]> = {
  anatomy: [
    { term: 'lumbar', category: 'anatomy', relevance: 0.9 },
    { term: 'cervical', category: 'anatomy', relevance: 0.9 },
    { term: 'dorsal', category: 'anatomy', relevance: 0.9 },
    { term: 'hombro', category: 'anatomy', relevance: 0.9 },
    { term: 'rodilla', category: 'anatomy', relevance: 0.9 },
    { term: 'tobillo', category: 'anatomy', relevance: 0.9 },
    { term: 'columna', category: 'anatomy', relevance: 0.9 },
    { term: 'pelvis', category: 'anatomy', relevance: 0.9 },
    { term: 'cabeza', category: 'anatomy', relevance: 0.8 },
    { term: 'cuello', category: 'anatomy', relevance: 0.8 }
  ],
  symptoms: [
    { term: 'dolor', category: 'symptoms', relevance: 0.9 },
    { term: 'rigidez', category: 'symptoms', relevance: 0.8 },
    { term: 'inflamación', category: 'symptoms', relevance: 0.8 },
    { term: 'debilidad', category: 'symptoms', relevance: 0.8 },
    { term: 'hormigueo', category: 'symptoms', relevance: 0.7 },
    { term: 'entumecimiento', category: 'symptoms', relevance: 0.7 },
    { term: 'espasmo', category: 'symptoms', relevance: 0.8 },
    { term: 'contractura', category: 'symptoms', relevance: 0.8 },
    { term: 'limitación', category: 'symptoms', relevance: 0.8 },
    { term: 'inestabilidad', category: 'symptoms', relevance: 0.7 }
  ],
  treatments: [
    { term: 'masaje', category: 'treatments', relevance: 0.8 },
    { term: 'movilización', category: 'treatments', relevance: 0.9 },
    { term: 'ejercicio', category: 'treatments', relevance: 0.8 },
    { term: 'estiramiento', category: 'treatments', relevance: 0.8 },
    { term: 'terapia', category: 'treatments', relevance: 0.8 },
    { term: 'rehabilitación', category: 'treatments', relevance: 0.9 },
    { term: 'fortalecimiento', category: 'treatments', relevance: 0.8 },
    { term: 'manipulación', category: 'treatments', relevance: 0.8 },
    { term: 'técnica', category: 'treatments', relevance: 0.7 },
    { term: 'protocolo', category: 'treatments', relevance: 0.7 }
  ],
  tests: [
    { term: 'flexión', category: 'tests', relevance: 0.8 },
    { term: 'extensión', category: 'tests', relevance: 0.8 },
    { term: 'rotación', category: 'tests', relevance: 0.8 },
    { term: 'palpación', category: 'tests', relevance: 0.9 },
    { term: 'resistencia', category: 'tests', relevance: 0.8 },
    { term: 'Lasègue', category: 'tests', relevance: 0.9 },
    { term: 'Lasegue', category: 'tests', relevance: 0.9 },
    { term: 'test', category: 'tests', relevance: 0.7 },
    { term: 'evaluación', category: 'tests', relevance: 0.8 },
    { term: 'examen', category: 'tests', relevance: 0.8 }
  ]
};

const DEFAULT_CHUNKING_CONFIG: ChunkingConfig = {
  minDuration: 3000, // 3s mínimo para contexto médico
  maxDuration: 8000, // 8s óptimo para Vertex AI Flash
  pauseThreshold: 1500, // 1.5s pausa = boundary semántico
  medicalContextWeight: 0.8, // Prioridad a contexto médico
  completenessThreshold: 0.6 // 60% completeness mínimo
};

export class SemanticChunkingService {
  private config: ChunkingConfig;
  private currentChunk: Partial<SemanticChunk> | null = null;
  private chunks: SemanticChunk[] = [];
  private lastSpeechTime: number = 0;
  private isProcessing: boolean = false;
  private listeners: Map<string, Function[]> = new Map();

  constructor(config: Partial<ChunkingConfig> = {}) {
    this.config = { ...DEFAULT_CHUNKING_CONFIG, ...config };
  }

  /**
   * Procesa un segmento de transcripción y determina si debe finalizar el chunk actual
   */
  processTranscriptionSegment(text: string, audioBlob: Blob, timestamp: number): SemanticChunk | null {
    if (this.isProcessing) {
      return null;
    }

    this.isProcessing = true;

    try {
      // Iniciar nuevo chunk si no existe
      if (!this.currentChunk) {
        this.startNewChunk(audioBlob, timestamp);
      }

      // Actualizar transcripción acumulada
      if (this.currentChunk) {
        this.currentChunk.transcription = this.currentChunk.transcription 
          ? `${this.currentChunk.transcription} ${text}`.trim()
          : text;
      }

      // Verificar si debe finalizar el chunk
      if (this.shouldFinalizeChunk(text, timestamp)) {
        const finalizedChunk = this.finalizeChunk(timestamp);
        this.emit('chunkCompleted', finalizedChunk);
        return finalizedChunk;
      }

      return null;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Inicia un nuevo chunk semántico
   */
  private startNewChunk(audioBlob: Blob, timestamp: number): void {
    this.currentChunk = {
      id: `chunk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      audioBlob,
      transcription: '',
      startTime: timestamp,
      endTime: 0,
      duration: 0,
      medicalPhase: 'anamnesis',
      clinicalKeywords: [],
      completeness: 0,
      contextRelevance: 0,
      soapCategory: 'S',
      readyForAnalysis: false
    };
  }

  /**
   * Determina si el chunk actual debe finalizarse
   */
  private shouldFinalizeChunk(text: string, timestamp: number): boolean {
    if (!this.currentChunk) return false;

    const duration = timestamp - this.currentChunk.startTime!;
    const timeSinceLastSpeech = timestamp - this.lastSpeechTime;

    // 1. Duración mínima alcanzada
    if (duration >= this.config.minDuration) {
      // 2. Pausa significativa detectada
      if (timeSinceLastSpeech > this.config.pauseThreshold) {
        return true;
      }

      // 3. Trigger semántico detectado
      if (this.detectSemanticTrigger(text)) {
        return true;
      }

      // 4. Duración máxima alcanzada
      if (duration >= this.config.maxDuration) {
        return true;
      }

      // 5. Completeness suficiente
      const completeness = this.calculateCompleteness();
      if (completeness >= this.config.completenessThreshold) {
        return true;
      }
    }

    this.lastSpeechTime = timestamp;
    return false;
  }

  /**
   * Detecta triggers semánticos médicos
   */
  private detectSemanticTrigger(text: string): boolean {
    const lowerText = text.toLowerCase();
    
    for (const trigger of MEDICAL_TRIGGERS) {
      if (lowerText.includes(trigger.pattern.toLowerCase())) {
        if (this.currentChunk) {
          this.currentChunk.medicalPhase = trigger.phase;
        }
        return true;
      }
    }
    
    return false;
  }

  /**
   * Extrae keywords clínicos del texto
   */
  private extractClinicalKeywords(text: string): string[] {
    const keywords: string[] = [];
    const lowerText = text.toLowerCase();

    Object.values(CLINICAL_KEYWORDS).flat().forEach(keyword => {
      if (lowerText.includes(keyword.term.toLowerCase())) {
        keywords.push(keyword.term);
      }
    });

    return [...new Set(keywords)]; // Eliminar duplicados
  }

  /**
   * Calcula la completitud semántica del chunk
   */
  private calculateCompleteness(): number {
    if (!this.currentChunk?.transcription) return 0;

    const text = this.currentChunk.transcription;
    let score = 0;

    // 1. Longitud del texto (30%)
    const wordCount = text.split(' ').length;
    if (wordCount >= 10) score += 0.3;
    else if (wordCount >= 5) score += 0.2;
    else if (wordCount >= 3) score += 0.1;

    // 2. Presencia de keywords clínicos (40%)
    const keywords = this.extractClinicalKeywords(text);
    if (keywords.length >= 3) score += 0.4;
    else if (keywords.length >= 2) score += 0.3;
    else if (keywords.length >= 1) score += 0.2;

    // 3. Estructura gramatical (30%)
    if (text.includes('.') || text.includes('?') || text.includes('!')) {
      score += 0.3;
    } else if (text.length > 50) {
      score += 0.2;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Calcula la relevancia clínica del chunk
   */
  private calculateClinicalRelevance(): number {
    if (!this.currentChunk?.transcription) return 0;

    const text = this.currentChunk.transcription;
    let relevance = 0;

    // 1. Densidad de keywords clínicos (50%)
    const keywords = this.extractClinicalKeywords(text);
    const wordCount = text.split(' ').length;
    const keywordDensity = keywords.length / Math.max(wordCount, 1);
    relevance += Math.min(keywordDensity * 2, 0.5);

    // 2. Presencia de triggers semánticos (30%)
    const hasTrigger = MEDICAL_TRIGGERS.some(trigger => 
      text.toLowerCase().includes(trigger.pattern.toLowerCase())
    );
    if (hasTrigger) relevance += 0.3;

    // 3. Contexto médico (20%)
    const medicalTerms = ['paciente', 'dolor', 'tratamiento', 'evaluación', 'diagnóstico'];
    const medicalTermCount = medicalTerms.filter(term => 
      text.toLowerCase().includes(term)
    ).length;
    relevance += Math.min(medicalTermCount * 0.1, 0.2);

    return Math.min(relevance, 1.0);
  }

  /**
   * Finaliza el chunk actual y lo prepara para análisis
   */
  private finalizeChunk(endTime: number): SemanticChunk {
    if (!this.currentChunk) {
      throw new Error('No hay chunk activo para finalizar');
    }

    const chunk: SemanticChunk = {
      ...this.currentChunk,
      endTime,
      duration: endTime - this.currentChunk.startTime!,
      clinicalKeywords: this.extractClinicalKeywords(this.currentChunk.transcription || ''),
      completeness: this.calculateCompleteness(),
      contextRelevance: this.calculateClinicalRelevance(),
      soapCategory: this.determineSOAPCategory(this.currentChunk.transcription || ''),
      readyForAnalysis: true
    };

    this.chunks.push(chunk);
    this.currentChunk = null;
    this.lastSpeechTime = 0;

    return chunk;
  }

  /**
   * Determina la categoría SOAP basada en el contenido
   */
  private determineSOAPCategory(text: string): 'S' | 'O' | 'A' | 'P' {
    const lowerText = text.toLowerCase();

    // Subjective (S) - Síntomas del paciente
    if (lowerText.includes('paciente presenta') || 
        lowerText.includes('dolor') || 
        lowerText.includes('siente') ||
        lowerText.includes('refiere')) {
      return 'S';
    }

    // Objective (O) - Hallazgos del examen
    if (lowerText.includes('se observa') || 
        lowerText.includes('se palpa') || 
        lowerText.includes('se evalúa') ||
        lowerText.includes('test') ||
        lowerText.includes('movilidad')) {
      return 'O';
    }

    // Assessment (A) - Diagnóstico/evaluación
    if (lowerText.includes('diagnóstico') || 
        lowerText.includes('se concluye') || 
        lowerText.includes('se determina') ||
        lowerText.includes('compatible con')) {
      return 'A';
    }

    // Plan (P) - Tratamiento/plan
    if (lowerText.includes('tratamiento') || 
        lowerText.includes('se recomienda') || 
        lowerText.includes('se prescribe') ||
        lowerText.includes('próxima sesión')) {
      return 'P';
    }

    // Default basado en fase médica
    switch (this.currentChunk?.medicalPhase) {
      case 'anamnesis': return 'S';
      case 'exploration': return 'O';
      case 'evaluation': return 'A';
      case 'planning': return 'P';
      default: return 'S';
    }
  }

  /**
   * Fuerza la finalización del chunk actual
   */
  forceFinalizeChunk(): SemanticChunk | null {
    if (!this.currentChunk) return null;

    const timestamp = Date.now();
    return this.finalizeChunk(timestamp);
  }

  /**
   * Obtiene todos los chunks procesados
   */
  getChunks(): SemanticChunk[] {
    return [...this.chunks];
  }

  /**
   * Limpia todos los chunks
   */
  clearChunks(): void {
    this.chunks = [];
    this.currentChunk = null;
    this.lastSpeechTime = 0;
  }

  /**
   * Obtiene el estado actual del servicio
   */
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

  /**
   * Sistema de eventos para notificar cambios
   */
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

  /**
   * Limpia recursos del servicio
   */
  destroy(): void {
    this.clearChunks();
    this.listeners.clear();
    this.isProcessing = false;
  }
} 