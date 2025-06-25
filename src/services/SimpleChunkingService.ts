/**
 * TARGET: SERVICIO DE CHUNKING SIMPLE Y DIRECTO - Solución Definitiva Mauricio
 * OBJETIVO: Eliminar completamente el procesamiento "sílaba por sílaba"
 * ENFOQUE: Captura completa → Análisis semántico → Chunks contextuales
 */

import RealWorldSOAPProcessor, { ProcessingResult } from './RealWorldSOAPProcessor';

// === INTERFACES SIMPLIFICADAS ===

export interface SimpleUtterance {
  speaker: 'PATIENT' | 'THERAPIST' | 'UNKNOWN';
  text: string;
  timestamp: number;
  wordCount: number;
}

export interface SimpleChunk {
  id: string;
  utterances: SimpleUtterance[];
  startIndex: number;
  endIndex: number;
  summary: string;
  complexity: 'low' | 'medium' | 'high';
  medicalEntities: string[];
}

export interface SimpleChunkResult {
  chunk: SimpleChunk;
  soapAnalysis: ProcessingResult;
  confidence: number;
  processingTime: number;
}

export interface SimpleChunkingConfig {
  // Configuración agresiva para evitar fragmentación
  minimumSessionWords: number;      // Mínimo 50 palabras antes de procesar
  minimumPauseMs: number;          // Pausa mínima 3000ms para considerar "completo"
  chunkSize: number;               // Utterances por chunk (según Mauricio: 8)
  overlapSize: number;             // Overlap entre chunks (según Mauricio: 2)
  confidenceThreshold: number;     // Confianza mínima para procesar
}

// === CONFIGURACIONES PREDEFINIDAS ===

export const SIMPLE_CONFIGS = {
  MAURICIO_AGGRESSIVE: {
    minimumSessionWords: 50,       // VITAL: Mínimo 50 palabras por sesión
    minimumPauseMs: 3000,         // 3 segundos de pausa completa
    chunkSize: 8,                 // Especificación exacta de Mauricio
    overlapSize: 2,               // Especificación exacta de Mauricio
    confidenceThreshold: 0.7      // Alta confianza requerida
  } as SimpleChunkingConfig,
  
  DEVELOPMENT: {
    minimumSessionWords: 20,       // Más permisivo para testing
    minimumPauseMs: 2000,
    chunkSize: 6,
    overlapSize: 1,
    confidenceThreshold: 0.5
  } as SimpleChunkingConfig
};

// Exportar configuración para uso directo
export const MAURICIO_AGGRESSIVE = SIMPLE_CONFIGS.MAURICIO_AGGRESSIVE;

// === SERVICIO PRINCIPAL ===

export class SimpleChunkingService {
  private recognition: any = null;
  private isRecording = false;
  private fullTranscript = '';
  private startTime = 0;
  private lastSpeechTime = 0;
  private sessionWordCount = 0;
  private processingTimeout: NodeJS.Timeout | null = null;
  
  private config: SimpleChunkingConfig;
  private soapProcessor: RealWorldSOAPProcessor;
  
  // Callbacks
  private onSessionUpdate?: (transcript: string, wordCount: number) => void;
  private onChunkProcessed?: (result: SimpleChunkResult) => void;
  private onSessionComplete?: (results: SimpleChunkResult[]) => void;
  private onError?: (error: string) => void;

  constructor(
    config: SimpleChunkingConfig = SIMPLE_CONFIGS.MAURICIO_AGGRESSIVE,
    callbacks: {
      onSessionUpdate?: (transcript: string, wordCount: number) => void;
      onChunkProcessed?: (result: SimpleChunkResult) => void;
      onSessionComplete?: (results: SimpleChunkResult[]) => void;
      onError?: (error: string) => void;
    } = {}
  ) {
    this.config = config;
    this.soapProcessor = new RealWorldSOAPProcessor();
    this.onSessionUpdate = callbacks.onSessionUpdate;
    this.onChunkProcessed = callbacks.onChunkProcessed;
    this.onSessionComplete = callbacks.onSessionComplete;
    this.onError = callbacks.onError;

    console.log('TARGET: SimpleChunkingService inicializado');
    console.log('STATS: Config:', this.config);
  }

  /**
   * INICIAR GRABACIÓN CON CONTROL TOTAL
   */
  async startRecording(): Promise<void> {
    const windowAny = window as any;
    
    if (!windowAny.webkitSpeechRecognition && !windowAny.SpeechRecognition) {
      throw new Error('Speech recognition no soportado en este navegador');
    }

    // Limpiar estado
    this.fullTranscript = '';
    this.sessionWordCount = 0;
    this.startTime = Date.now();
    this.lastSpeechTime = Date.now();

    // Crear reconocimiento con configuración AGRESIVA
    const SpeechRecognitionClass = windowAny.SpeechRecognition || windowAny.webkitSpeechRecognition;
    this.recognition = new SpeechRecognitionClass();
    
    // CONFIGURACIÓN CLAVE PARA EVITAR FRAGMENTACIÓN
    this.recognition.continuous = true;
    this.recognition.interimResults = false;        // VITAL: Solo resultados finales
    this.recognition.maxAlternatives = 1;
    this.recognition.lang = 'es-ES';

    // Event Handlers
    this.recognition.onstart = () => {
      console.log('AUDIO: Grabación iniciada - MODO ANTI-FRAGMENTACIÓN');
      this.isRecording = true;
    };

    this.recognition.onresult = (event: any) => {
      let newText = '';
      
      // Procesar SOLO resultados finales (no intermedios)
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          newText += event.results[i][0].transcript + ' ';
          this.lastSpeechTime = Date.now();
        }
      }

      if (newText.trim()) {
        this.fullTranscript += newText;
        this.sessionWordCount = this.countWords(this.fullTranscript);
        
        console.log(`📝 Texto agregado: "${newText.trim()}"`);
        console.log(`STATS: Total palabras en sesión: ${this.sessionWordCount}`);
        
        // Callback de actualización
        if (this.onSessionUpdate) {
          this.onSessionUpdate(this.fullTranscript, this.sessionWordCount);
        }

        // Verificar si debemos procesar
        this.checkForProcessing();
      }
    };

    this.recognition.onerror = (event: any) => {
      console.error('ERROR: Error en reconocimiento:', event.error);
      if (this.onError) {
        this.onError(`Error de reconocimiento: ${event.error}`);
      }
    };

    this.recognition.onend = () => {
      console.log('🛑 Reconocimiento terminado');
      if (this.isRecording) {
        // Reiniciar automáticamente si seguimos grabando
        setTimeout(() => {
          if (this.isRecording && this.recognition) {
            this.recognition.start();
          }
        }, 100);
      }
    };

    // Iniciar
    this.recognition.start();
    console.log('TARGET: Grabación iniciada con configuración anti-fragmentación');
  }

  /**
   * VERIFICAR SI DEBEMOS PROCESAR (CONTROL INTELIGENTE)
   */
  private checkForProcessing(): void {
    const timeSinceLastSpeech = Date.now() - this.lastSpeechTime;
    const hasMinimumWords = this.sessionWordCount >= this.config.minimumSessionWords;
    const hasMinimumPause = timeSinceLastSpeech >= this.config.minimumPauseMs;

    console.log(`🔍 Verificando procesamiento:`);
    console.log(`   Palabras: ${this.sessionWordCount}/${this.config.minimumSessionWords}`);
    console.log(`   Pausa: ${timeSinceLastSpeech}ms/${this.config.minimumPauseMs}ms`);

    // Limpiar timeout anterior si existe
    if (this.processingTimeout) {
      clearTimeout(this.processingTimeout);
      this.processingTimeout = null;
    }

    if (hasMinimumWords && hasMinimumPause) {
      console.log('SUCCESS: Condiciones cumplidas - Iniciando chunking');
      this.processSession();
    } else if (hasMinimumWords) {
      // Programar procesamiento cuando se cumpla la pausa
      const remainingPause = this.config.minimumPauseMs - timeSinceLastSpeech;
      console.log(`⏰ Programando procesamiento en ${remainingPause}ms`);
      
      this.processingTimeout = setTimeout(() => {
        console.log('⏰ Timeout alcanzado - Iniciando chunking');
        this.processSession();
      }, remainingPause);
    }
  }

  /**
   * PROCESAR SESIÓN COMPLETA CON CHUNKING SEMÁNTICO
   */
  private async processSession(): Promise<void> {
    if (!this.fullTranscript.trim()) {
      console.log('WARNING: No hay transcripción para procesar');
      return;
    }

    console.log('\nTARGET: === PROCESANDO SESIÓN COMPLETA ===');
    console.log(`📄 Transcripción: ${this.fullTranscript.length} caracteres`);
    console.log(`STATS: Palabras: ${this.sessionWordCount}`);

    try {
      // PASO 1: Convertir a utterances
      const utterances = this.parseToUtterances(this.fullTranscript);
      console.log(`📝 Utterances creadas: ${utterances.length}`);

      // PASO 2: Crear chunks según especificación de Mauricio
      const chunks = this.createChunks(utterances);
      console.log(`📦 Chunks creados: ${chunks.length}`);

      // PASO 3: Procesar cada chunk con SOAP
      const results: SimpleChunkResult[] = [];
      
      for (const chunk of chunks) {
        const startTime = Date.now();
        
        // Crear texto del chunk para análisis SOAP
        const chunkText = chunk.utterances
          .map(u => `${u.speaker}: ${u.text}`)
          .join('\n');

        // Procesar con RealWorldSOAPProcessor
        const soapResult = await this.soapProcessor.processTranscription(chunkText);
        
        const result: SimpleChunkResult = {
          chunk,
          soapAnalysis: soapResult,
          confidence: this.calculateConfidence(chunk, soapResult),
          processingTime: Date.now() - startTime
        };

        results.push(result);
        
        console.log(`SUCCESS: Chunk ${chunk.id} procesado en ${result.processingTime}ms`);
        
        // Callback por chunk
        if (this.onChunkProcessed) {
          this.onChunkProcessed(result);
        }
      }

      // PASO 4: Callback de sesión completa
      if (this.onSessionComplete) {
        this.onSessionComplete(results);
      }

      // Limpiar transcripción procesada
      this.fullTranscript = '';
      this.sessionWordCount = 0;

      console.log('TARGET: Sesión procesada completamente');

    } catch (error) {
      console.error('ERROR: Error procesando sesión:', error);
      if (this.onError) {
        this.onError(`Error procesando sesión: ${error}`);
      }
    }
  }

  /**
   * CONVERTIR TRANSCRIPCIÓN A UTTERANCES (MEJORADO)
   */
  private parseToUtterances(transcript: string): SimpleUtterance[] {
    const utterances: SimpleUtterance[] = [];
    
    // Dividir por frases naturales (puntos, comas, signos de interrogación)
    const sentences = transcript
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    let currentTime = this.startTime;
    
    for (const sentence of sentences) {
      if (sentence.length < 3) continue; // Ignorar frases muy cortas

      const speaker = this.detectSpeaker(sentence);
      const wordCount = this.countWords(sentence);
      
      utterances.push({
        speaker,
        text: sentence,
        timestamp: currentTime,
        wordCount
      });

      currentTime += 3000; // 3 segundos por utterance (más realista)
    }

    console.log(`📝 Parseado: ${sentences.length} frases → ${utterances.length} utterances`);
    return utterances;
  }

  /**
   * CREAR CHUNKS SEGÚN ESPECIFICACIÓN DE MAURICIO
   */
  private createChunks(utterances: SimpleUtterance[]): SimpleChunk[] {
    const chunks: SimpleChunk[] = [];
    const chunkSize = this.config.chunkSize;
    const overlap = this.config.overlapSize;

    for (let i = 0; i < utterances.length; i += chunkSize - overlap) {
      const endIndex = Math.min(i + chunkSize, utterances.length);
      const chunkUtterances = utterances.slice(i, endIndex);
      
      if (chunkUtterances.length === 0) break;

      const chunk: SimpleChunk = {
        id: `chunk_${chunks.length}`,
        utterances: chunkUtterances,
        startIndex: i,
        endIndex: endIndex - 1,
        summary: this.generateChunkSummary(chunkUtterances),
        complexity: this.assessComplexity(chunkUtterances),
        medicalEntities: this.extractMedicalEntities(chunkUtterances)
      };

      chunks.push(chunk);
    }

    return chunks;
  }

  /**
   * DETECTAR HABLANTE POR PATRONES SEMÁNTICOS (MEJORADO)
   */
  private detectSpeaker(text: string): 'PATIENT' | 'THERAPIST' | 'UNKNOWN' {
    const lowerText = text.toLowerCase();
    
    // Patrones de PACIENTE (más específicos)
    const patientPatterns = [
      /\b(me duele|siento|tengo|me molesta|no puedo|me cuesta)\b/,
      /\b(desde hace|empezó|comenzó|hace tiempo)\b/,
      /\b(cuando|si|pero|aunque)\b.*\b(duele|molesta|duele|molesta)\b/,
      /\b(me siento|estoy|me encuentro)\b/,
      /\b(mi|mis|me)\b.*\b(dolor|problema|síntoma)\b/
    ];

    // Patrones de TERAPEUTA (más específicos)
    const therapistPatterns = [
      /\b(vamos a|recomiendo|observo|palpo|examino)\b/,
      /\b(flexione|mueva|haga|levante|gire|inclínese)\b/,
      /\b(esto indica|diagnóstico|tratamiento|terapia)\b/,
      /\b(veo que|noto que|observo que)\b/,
      /\b(recomiendo|sugiero|propongo)\b/,
      /\b(¿puede|puede usted|intente)\b/
    ];

    // Contar coincidencias
    const patientMatches = patientPatterns.filter(pattern => pattern.test(lowerText)).length;
    const therapistMatches = therapistPatterns.filter(pattern => pattern.test(lowerText)).length;

    if (patientMatches > therapistMatches && patientMatches > 0) {
      return 'PATIENT';
    }
    
    if (therapistMatches > patientMatches && therapistMatches > 0) {
      return 'THERAPIST';
    }

    // Si no hay coincidencias claras, usar heurística adicional
    if (lowerText.includes('dolor') || lowerText.includes('duele') || lowerText.includes('molesta')) {
      return 'PATIENT';
    }

    if (lowerText.includes('flexione') || lowerText.includes('mueva') || lowerText.includes('observo')) {
      return 'THERAPIST';
    }

    return 'UNKNOWN';
  }

  /**
   * UTILIDADES
   */
  private countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  private generateChunkSummary(utterances: SimpleUtterance[]): string {
    const totalWords = utterances.reduce((sum, u) => sum + u.wordCount, 0);
    const speakers = [...new Set(utterances.map(u => u.speaker))];
    return `${utterances.length} utterances, ${totalWords} palabras, hablantes: ${speakers.join(', ')}`;
  }

  private assessComplexity(utterances: SimpleUtterance[]): 'low' | 'medium' | 'high' {
    const totalWords = utterances.reduce((sum, u) => sum + u.wordCount, 0);
    const uniqueSpeakers = new Set(utterances.map(u => u.speaker)).size;
    
    if (totalWords > 50 && uniqueSpeakers > 1) return 'high';
    if (totalWords > 25 || uniqueSpeakers > 1) return 'medium';
    return 'low';
  }

  private extractMedicalEntities(utterances: SimpleUtterance[]): string[] {
    const entities: string[] = [];
    const medicalTerms = [
      'dolor', 'lumbar', 'cervical', 'hombro', 'rodilla', 'pierna',
      'movilidad', 'flexión', 'extensión', 'rotación',
      'tratamiento', 'terapia', 'ejercicio', 'medicamento',
      'espalda', 'cuello', 'brazo', 'mano', 'pie', 'tobillo'
    ];

    for (const utterance of utterances) {
      const words = utterance.text.toLowerCase().split(/\s+/);
      for (const word of words) {
        if (medicalTerms.includes(word) && !entities.includes(word)) {
          entities.push(word);
        }
      }
    }

    return entities;
  }

  private calculateConfidence(chunk: SimpleChunk, soapResult: ProcessingResult): number {
    let confidence = 0.5;
    
    // Bonus por complejidad apropiada
    if (chunk.complexity === 'medium' || chunk.complexity === 'high') {
      confidence += 0.2;
    }
    
    // Bonus por entidades médicas
    confidence += Math.min(chunk.medicalEntities.length * 0.1, 0.3);
    
    return Math.min(confidence, 1.0);
  }

  /**
   * CONTROLES PÚBLICOS
   */
  async stopRecording(): Promise<void> {
    this.isRecording = false;
    
    // Limpiar timeout si existe
    if (this.processingTimeout) {
      clearTimeout(this.processingTimeout);
      this.processingTimeout = null;
    }
    
    if (this.recognition) {
      this.recognition.stop();
      this.recognition = null;
    }

    // Procesar cualquier contenido restante
    if (this.sessionWordCount > 0) {
      await this.processSession();
    }

    console.log('🛑 Grabación detenida y procesada');
  }

  getSessionStats() {
    return {
      isRecording: this.isRecording,
      wordCount: this.sessionWordCount,
      transcript: this.fullTranscript,
      duration: this.isRecording ? Date.now() - this.startTime : 0
    };
  }

  updateConfig(newConfig: Partial<SimpleChunkingConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('STATS: Configuración actualizada:', this.config);
  }
} 