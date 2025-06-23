/**
 * 🎤 AiDuxCare - Servicio de Transcripción con Buffer Inteligente
 * Acumula transcripción en tiempo real hasta formar párrafos coherentes
 * antes de enviar al análisis SOAP, evitando procesamiento sílaba por sílaba
 */

export interface BufferedSegment {
  id: string;
  text: string;
  speaker: 'PATIENT' | 'THERAPIST' | 'UNKNOWN';
  confidence: number;
  timestamp: number;
  isComplete: boolean;
  wordCount: number;
  pauseDuration: number;
}

export interface BufferConfig {
  minWordCount: number;          // Mínimo de palabras para considerar completo
  maxWaitTime: number;           // Tiempo máximo de espera en ms
  pauseThreshold: number;        // Tiempo de pausa para completar segmento (ms)
  confidenceThreshold: number;   // Confianza mínima para procesar
  enableRealTimeDisplay: boolean; // Mostrar transcripción mientras se acumula
}

export interface TranscriptionCallbacks {
  onRealTimeUpdate: (text: string, speaker: string) => void;
  onBufferedSegment: (segment: BufferedSegment) => void;
  onSOAPProcessing: (segments: BufferedSegment[]) => void;
  onError: (error: string) => void;
}

export class BufferedTranscriptionService {
  private recognition: SpeechRecognition | null = null;
  private isRecording = false;
  private currentBuffer = '';
  private currentSpeaker: 'PATIENT' | 'THERAPIST' | 'UNKNOWN' = 'UNKNOWN';
  private lastResultTime = 0;
  private lastConfidence = 0;
  private bufferedSegments: BufferedSegment[] = [];
  private bufferTimeout: NodeJS.Timeout | null = null;
  private wordCount = 0;
  
  private config: BufferConfig = {
    minWordCount: 8,              // Al menos 8 palabras
    maxWaitTime: 4000,            // Máximo 4 segundos
    pauseThreshold: 1500,         // 1.5 segundos de pausa
    confidenceThreshold: 0.6,     // Confianza mínima 60%
    enableRealTimeDisplay: true
  };

  constructor(
    private callbacks: TranscriptionCallbacks,
    customConfig?: Partial<BufferConfig>
  ) {
    this.config = { ...this.config, ...customConfig };
    this.initializeSpeechRecognition();
  }

  /**
   * Inicializar Web Speech API con configuración optimizada
   */
  private initializeSpeechRecognition(): void {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      this.callbacks.onError('Web Speech API no soportada');
      return;
    }

    this.recognition = new SpeechRecognition();
    
    // CONFIGURACIÓN OPTIMIZADA PARA BUFFER
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'es-ES';
    this.recognition.maxAlternatives = 1;

    this.setupEventHandlers();
  }

  /**
   * Configurar event handlers con lógica de buffer
   */
  private setupEventHandlers(): void {
    if (!this.recognition) return;

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      const currentTime = Date.now();
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript.trim();
        const confidence = result[0].confidence || 0.8;
        
        if (transcript.length === 0) continue;

        // Actualizar estado del buffer
        this.lastResultTime = currentTime;
        this.lastConfidence = confidence;
        
        if (result.isFinal) {
          // Resultado FINAL - agregar al buffer
          this.appendToBuffer(transcript, confidence);
        } else {
          // Resultado INTERMEDIO - solo mostrar en tiempo real
          if (this.config.enableRealTimeDisplay) {
            const displayText = this.currentBuffer + (this.currentBuffer ? ' ' : '') + transcript;
            this.callbacks.onRealTimeUpdate(displayText, this.currentSpeaker);
          }
        }
      }
    };

    this.recognition.onstart = () => {
      console.log('🎤 Transcripción con buffer iniciada');
      this.isRecording = true;
    };

    this.recognition.onend = () => {
      if (this.isRecording) {
        // Reiniciar automáticamente
        setTimeout(() => {
          if (this.recognition && this.isRecording) {
            try {
              this.recognition.start();
            } catch (error) {
              console.warn('Error reiniciando reconocimiento:', error);
            }
          }
        }, 100);
      }
    };

    this.recognition.onerror = (event) => {
      console.error('Error en reconocimiento:', event.error);
      this.callbacks.onError(`Error de reconocimiento: ${event.error}`);
    };
  }

  /**
   * Agregar texto al buffer con lógica inteligente
   */
  private appendToBuffer(text: string, confidence: number): void {
    // Detectar cambio de hablante
    const detectedSpeaker = this.detectSpeaker(text);
    
    // Si cambió el hablante, completar buffer actual
    if (this.currentSpeaker !== 'UNKNOWN' && 
        detectedSpeaker !== this.currentSpeaker && 
        this.currentBuffer.length > 0) {
      this.flushBuffer('speaker_change');
    }

    // Actualizar hablante y buffer
    this.currentSpeaker = detectedSpeaker;
    this.currentBuffer += (this.currentBuffer ? ' ' : '') + text;
    this.wordCount = this.currentBuffer.split(' ').length;

    console.log(`📝 Buffer: ${this.wordCount} palabras | Hablante: ${this.currentSpeaker} | "${text}"`);

    // Verificar si el buffer debe completarse
    this.checkBufferCompletion();

    // Mostrar transcripción en tiempo real
    if (this.config.enableRealTimeDisplay) {
      this.callbacks.onRealTimeUpdate(this.currentBuffer, this.currentSpeaker);
    }
  }

  /**
   * Verificar si el buffer debe completarse
   */
  private checkBufferCompletion(): void {
    const shouldComplete = 
      this.wordCount >= this.config.minWordCount ||
      this.endsWithPunctuation(this.currentBuffer) ||
      this.containsCompleteSentence(this.currentBuffer);

    if (shouldComplete) {
      // Configurar timeout para pausa
      this.resetBufferTimeout();
      this.bufferTimeout = setTimeout(() => {
        this.flushBuffer('pause_timeout');
      }, this.config.pauseThreshold);
    } else {
      // Configurar timeout máximo
      this.resetBufferTimeout();
      this.bufferTimeout = setTimeout(() => {
        this.flushBuffer('max_wait_timeout');
      }, this.config.maxWaitTime);
    }
  }

  /**
   * Detectar hablante basado en patrones semánticos
   */
  private detectSpeaker(text: string): 'PATIENT' | 'THERAPIST' | 'UNKNOWN' {
    const lowerText = text.toLowerCase();
    
    // Patrones TERAPEUTA
    const therapistPatterns = [
      /vamos a (evaluar|examinar|revisar|trabajar|hacer)/,
      /necesito que (flexione|extienda|gire|levante|mueva)/,
      /observe (como|que|si|donde)/,
      /recomiendo (que|hacer|continuar|evitar)/,
      /el tratamiento (consiste|incluye|será|requiere)/,
      /aplicaremos|realizaremos|trabajaremos|haremos/,
      /flexione|extienda|gire|presione|relaje|respire/,
      /voy a (evaluar|examinar|palpar|revisar)/,
      /esto indica|esto sugiere|por eso/
    ];
    
    // Patrones PACIENTE
    const patientPatterns = [
      /me duele (cuando|si|desde|mucho|aquí|ahí)/,
      /siento (que|como|dolor|molestia|presión)/,
      /no puedo (hacer|mover|dormir|trabajar|caminar)/,
      /desde hace (días|semanas|meses|años)/,
      /es difícil|me cuesta|me molesta|me preocupa/,
      /está mejor|está peor|sigue igual|ha mejorado/,
      /por las (mañanas|noches|tardes)/,
      /cuando (me levanto|me acuesto|camino|trabajo)/
    ];
    
    const therapistScore = therapistPatterns.reduce((score, pattern) => 
      pattern.test(lowerText) ? score + 1 : score, 0
    );
    
    const patientScore = patientPatterns.reduce((score, pattern) => 
      pattern.test(lowerText) ? score + 1 : score, 0
    );
    
    if (therapistScore > patientScore && therapistScore > 0) return 'THERAPIST';
    if (patientScore > therapistScore && patientScore > 0) return 'PATIENT';
    
    // Mantener hablante actual si no hay cambio claro
    return this.currentSpeaker !== 'UNKNOWN' ? this.currentSpeaker : 'PATIENT';
  }

  /**
   * Verificar si termina con puntuación
   */
  private endsWithPunctuation(text: string): boolean {
    return /[.!?;:]$/.test(text.trim());
  }

  /**
   * Verificar si contiene oración completa
   */
  private containsCompleteSentence(text: string): boolean {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    return sentences.length > 1 || (sentences.length === 1 && this.endsWithPunctuation(text));
  }

  /**
   * Vaciar buffer y crear segmento completo
   */
  private flushBuffer(reason: string): void {
    if (this.currentBuffer.length === 0) return;

    // Verificar confianza mínima
    if (this.lastConfidence < this.config.confidenceThreshold) {
      console.log(`⚠️ Buffer descartado por baja confianza: ${this.lastConfidence}`);
      this.resetBuffer();
      return;
    }

    const segment: BufferedSegment = {
      id: `buffered_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      text: this.currentBuffer.trim(),
      speaker: this.currentSpeaker,
      confidence: this.lastConfidence,
      timestamp: Date.now(),
      isComplete: true,
      wordCount: this.wordCount,
      pauseDuration: Date.now() - this.lastResultTime
    };

    this.bufferedSegments.push(segment);

    console.log(`✅ Buffer completado (${reason}): "${segment.text}" | ${segment.wordCount} palabras | ${segment.speaker}`);

    // Callback con segmento completo
    this.callbacks.onBufferedSegment(segment);

    // Verificar si enviar a procesamiento SOAP
    this.checkSOAPProcessing();

    // Reset buffer
    this.resetBuffer();
  }

  /**
   * Verificar si enviar segmentos a procesamiento SOAP
   */
  private checkSOAPProcessing(): void {
    const completeSegments = this.bufferedSegments.filter(s => s.isComplete);
    
    // Procesar SOAP cada 3-4 segmentos completos
    if (completeSegments.length >= 3) {
      console.log(`🧠 Enviando ${completeSegments.length} segmentos a procesamiento SOAP`);
      this.callbacks.onSOAPProcessing([...completeSegments]);
      // Mantener últimos 2 segmentos para contexto
      this.bufferedSegments = completeSegments.slice(-2);
    }
  }

  /**
   * Reset buffer timeout
   */
  private resetBufferTimeout(): void {
    if (this.bufferTimeout) {
      clearTimeout(this.bufferTimeout);
      this.bufferTimeout = null;
    }
  }

  /**
   * Reset buffer state
   */
  private resetBuffer(): void {
    this.currentBuffer = '';
    this.wordCount = 0;
    this.resetBufferTimeout();
  }

  /**
   * Iniciar transcripción con buffer
   */
  async startRecording(): Promise<void> {
    if (!this.recognition) {
      this.callbacks.onError('Servicio de reconocimiento no disponible');
      return;
    }

    try {
      this.resetBuffer();
      this.bufferedSegments = [];
      this.currentSpeaker = 'UNKNOWN';
      this.recognition.start();
    } catch (error) {
      this.callbacks.onError('Error iniciando transcripción');
    }
  }

  /**
   * Detener transcripción
   */
  async stopRecording(): Promise<BufferedSegment[]> {
    this.isRecording = false;
    
    if (this.recognition) {
      this.recognition.stop();
    }

    // Flush buffer final si tiene contenido
    if (this.currentBuffer.length > 0) {
      this.flushBuffer('recording_stopped');
    }

    // Procesar segmentos restantes
    if (this.bufferedSegments.length > 0) {
      this.callbacks.onSOAPProcessing([...this.bufferedSegments]);
    }

    this.resetBufferTimeout();
    return this.bufferedSegments;
  }

  /**
   * Obtener configuración actual
   */
  getConfig(): BufferConfig {
    return { ...this.config };
  }

  /**
   * Actualizar configuración
   */
  updateConfig(newConfig: Partial<BufferConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('📊 Configuración de buffer actualizada:', this.config);
  }

  /**
   * Obtener estadísticas del buffer
   */
  getStats() {
    return {
      bufferedSegments: this.bufferedSegments.length,
      currentBufferWords: this.wordCount,
      currentSpeaker: this.currentSpeaker,
      isRecording: this.isRecording,
      lastConfidence: this.lastConfidence
    };
  }
}

// === TIPOS PARA WEB SPEECH API ===

declare global {
  interface Window {
    SpeechRecognition: new() => SpeechRecognition;
    webkitSpeechRecognition: new() => SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  onstart: ((ev: Event) => void) | null;
  onend: ((ev: Event) => void) | null;
  onerror: ((ev: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((ev: SpeechRecognitionEvent) => void) | null;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
} 