import { TranscriptionSegment, TranscriptionActor, TranscriptionConfidence } from '../core/audio/AudioCaptureService';

// Extender Window para TypeScript con Web Speech API (usando any para evitar conflictos)
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    SpeechRecognition: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    webkitSpeechRecognition: any;
  }
}

// Definir tipos de Web Speech API que faltan
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  
  start(): void;
  stop(): void;
  abort(): void;
  
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onspeechstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onspeechend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onnomatch: ((this: SpeechRecognition, ev: Event) => void) | null;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

export interface SpeechRecognitionConfig {
  language: 'es' | 'en';
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
}

export interface RealtimeTranscriptionOptions {
  onResult: (segment: TranscriptionSegment) => void;
  onError?: (error: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
}

/**
 * Servicio de Speech-to-Text usando Web Speech API (GRATUITO)
 * Compatible con Chrome, Edge y Firefox (limitado)
 */
export class WebSpeechSTTService {
  private recognition: SpeechRecognition | null = null;
  private isSupported: boolean = false;
  private currentStream: MediaStream | null = null;
  private isListening: boolean = false;
  private config: SpeechRecognitionConfig;
  private sessionId: string = '';

  constructor(config: Partial<SpeechRecognitionConfig> = {}) {
    // Verificar soporte del navegador
    const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.isSupported = !!SpeechRecognitionConstructor;
    
    // Configuración por defecto optimizada para español médico
    this.config = {
      language: 'es',
      continuous: true,
      interimResults: true,
      maxAlternatives: 1,
      ...config
    };
    
    if (this.isSupported && SpeechRecognitionConstructor) {
      this.recognition = new SpeechRecognitionConstructor();
      this.setupRecognition();
    }
  }

  /**
   * Configurar el reconocimiento de voz con parámetros optimizados
   */
  private setupRecognition(): void {
    if (!this.recognition) return;
    
    // Configuración optimizada para contexto médico
    this.recognition.continuous = this.config.continuous;
    this.recognition.interimResults = this.config.interimResults;
    this.recognition.lang = this.config.language === 'es' ? 'es-ES' : 'en-US';
    this.recognition.maxAlternatives = this.config.maxAlternatives;
    
    // Eventos básicos de logging
    this.recognition.onstart = () => {
      console.log('🎙️ Reconocimiento de voz iniciado');
      this.isListening = true;
      this.logSimple('stt.webspeech.started', { 
        provider: 'browser_native',
        language: this.config.language,
        sessionId: this.sessionId
      });
    };
    
    this.recognition.onend = () => {
      console.log('🎙️ Reconocimiento de voz finalizado');
      this.isListening = false;
      this.logSimple('stt.webspeech.ended', { 
        provider: 'browser_native',
        sessionId: this.sessionId
      });
    };
    
    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('❌ Error en reconocimiento:', event.error);
      this.isListening = false;
      this.logSimple('stt.webspeech.error', { 
        error: event.error,
        provider: 'browser_native',
        sessionId: this.sessionId
      });
    };
  }

  /**
   * Logger simple para evitar dependencias complejas
   */
  private logSimple(action: string, data: Record<string, unknown>): void {
    console.log(`[WebSpeechSTT] ${action}:`, data);
    // TODO: Integrar con AuditLogger cuando esté disponible el contexto completo
  }

  /**
   * Iniciar transcripción en tiempo real
   */
  async startRealtimeTranscription(
    options: RealtimeTranscriptionOptions
  ): Promise<void> {
    
    if (!this.isSupported || !this.recognition) {
      const error = 'Web Speech API no soportada en este navegador';
      options.onError?.(error);
      throw new Error(error);
    }

    if (this.isListening) {
      console.warn('Ya hay una sesión de reconocimiento activa');
      return;
    }

    // Generar ID de sesión único
    this.sessionId = `webspeech_${Date.now()}`;
    
    try {
      // Solicitar permisos de micrófono antes de empezar
      await this.requestMicrophoneAccess();
      
      // Configurar handlers de eventos
      this.setupEventHandlers(options);
      
      // Iniciar reconocimiento
      this.recognition.start();
      
      console.log('🚀 Transcripción en tiempo real iniciada - GRATIS con Web Speech API');
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      console.error('Error iniciando transcripción:', errorMsg);
      options.onError?.(errorMsg);
      throw error;
    }
  }

  /**
   * Configurar todos los event handlers para transcripción en tiempo real
   */
  private setupEventHandlers(options: RealtimeTranscriptionOptions): void {
    if (!this.recognition) return;

    // Handler principal de resultados
    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      try {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript.trim();
          const confidence = result[0].confidence || 0.8;
          
          if (transcript.length === 0) continue;
          
          const segment: TranscriptionSegment = {
            id: `${this.sessionId}_${i}_${Date.now()}`,
            timestamp: new Date().toISOString(),
            content: transcript,
            confidence: this.mapConfidenceLevel(confidence),
            actor: this.detectActor(transcript),
            approved: false,
            edited: false
          };
          
          // Callback con el segmento
          options.onResult(segment);
          
          // Log solo resultados finales para no spamear
          if (result.isFinal) {
            this.logSimple('stt.webspeech.segment', {
              sessionId: this.sessionId,
              actor: segment.actor,
              confidence: segment.confidence,
              length: transcript.length,
              is_final: result.isFinal
            });
          }
        }
      } catch (error) {
        console.error('Error procesando resultado STT:', error);
        options.onError?.('Error procesando transcripción');
      }
    };

    // Otros event handlers
    this.recognition.onstart = () => {
      options.onStart?.();
      this.setupRecognition(); // Asegurar configuración
    };

    this.recognition.onend = () => {
      options.onEnd?.();
    };

    this.recognition.onspeechstart = () => {
      console.log('🗣️ Habla detectada');
      options.onSpeechStart?.();
    };

    this.recognition.onspeechend = () => {
      console.log('🔇 Fin de habla detectado');
      options.onSpeechEnd?.();
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const errorMsg = `Error STT: ${event.error}`;
      console.error(errorMsg);
      options.onError?.(errorMsg);
    };

    this.recognition.onnomatch = () => {
      console.warn('No se pudo reconocer el habla');
      options.onError?.('No se pudo reconocer el habla claramente');
    };
  }

  /**
   * Detener transcripción
   */
  async stopTranscription(): Promise<void> {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
    
    if (this.currentStream) {
      this.currentStream.getTracks().forEach(track => track.stop());
      this.currentStream = null;
    }

    console.log('⏹️ Transcripción detenida');
    
    this.logSimple('stt.webspeech.stopped', {
      sessionId: this.sessionId,
      provider: 'browser_native'
    });
  }

  /**
   * Solicitar acceso al micrófono con configuración optimizada
   */
  private async requestMicrophoneAccess(): Promise<void> {
    try {
      this.currentStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
          channelCount: 1
        }
      });
      
      console.log('✅ Acceso al micrófono concedido');
      
    } catch (error) {
      const errorMsg = 'Acceso al micrófono denegado. Por favor, permite el acceso para usar la transcripción.';
      console.error(errorMsg, error);
      throw new Error(errorMsg);
    }
  }

  /**
   * Detectar si el hablante es paciente o profesional basado en el contenido
   */
  private detectActor(text: string): TranscriptionActor {
    const lowerText = text.toLowerCase().trim();
    
    // Palabras clave para profesional de la salud
    const professionalKeywords = [
      'vamos a', 'observe', 'evalúo', 'recomiendo', 'aplicamos', 
      'necesita', 'veo que', 'trataremos', 'diagnosis', 'procedimiento',
      'examinemos', 'palpemos', 'flexione', 'extienda', 'presión',
      'tratamiento', 'terapia', 'ejercicio', 'rehabilitación',
      'seguimiento', 'control', 'mejora', 'evolución', 'protocolo'
    ];
    
    // Palabras clave para paciente
    const patientKeywords = [
      'me duele', 'siento', 'tengo', 'no puedo', 'cuando',
      'desde hace', 'me pasa', 'me molesta', 'dolor', 'molestia',
      'incómodo', 'difícil', 'mejor', 'peor', 'antes', 'ahora',
      'trabajo', 'casa', 'dormir', 'caminar', 'subir', 'bajar'
    ];
    
    // Calcular puntuaciones
    const profScore = professionalKeywords.reduce((score, keyword) => 
      lowerText.includes(keyword) ? score + 1 : score, 0
    );
    
    const patientScore = patientKeywords.reduce((score, keyword) => 
      lowerText.includes(keyword) ? score + 1 : score, 0
    );
    
    // Decisión con sesgo hacia paciente en caso de empate
    return profScore > patientScore ? 'profesional' : 'paciente';
  }

  /**
   * Mapear confidence numérico a enum
   */
  private mapConfidenceLevel(confidence: number): TranscriptionConfidence {
    if (confidence >= 0.8) return 'entendido';
    if (confidence >= 0.5) return 'poco_claro';
    return 'no_reconocido';
  }

  /**
   * Verificar si el navegador soporta Web Speech API
   */
  static isSupported(): boolean {
    const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;
    return !!SpeechRecognitionConstructor;
  }

  /**
   * Obtener información de compatibilidad del navegador
   */
  static getBrowserCompatibility(): {
    isSupported: boolean;
    browserName: string;
    recommendedAction: string;
  } {
    const userAgent = navigator.userAgent;
    
    if (userAgent.includes('Chrome')) {
      return {
        isSupported: true,
        browserName: 'Google Chrome',
        recommendedAction: 'Perfecto, Chrome es totalmente compatible'
      };
    }
    
    if (userAgent.includes('Edg')) {
      return {
        isSupported: true,
        browserName: 'Microsoft Edge',
        recommendedAction: 'Excelente, Edge es totalmente compatible'
      };
    }
    
    if (userAgent.includes('Firefox')) {
      return {
        isSupported: this.isSupported(),
        browserName: 'Mozilla Firefox',
        recommendedAction: 'Firefox tiene soporte limitado, recomendamos Chrome o Edge'
      };
    }
    
    if (userAgent.includes('Safari')) {
      return {
        isSupported: false,
        browserName: 'Safari',
        recommendedAction: 'Safari no soporta Web Speech API, usa Chrome o Edge'
      };
    }
    
    return {
      isSupported: this.isSupported(),
      browserName: 'Navegador desconocido',
      recommendedAction: 'Recomendamos usar Chrome o Edge para mejor compatibilidad'
    };
  }

  /**
   * Crear mensaje de fallback para navegadores no soportados
   */
  static createFallbackMessage(): string {
    const compatibility = this.getBrowserCompatibility();
    
    return `
⚠️ Tu navegador (${compatibility.browserName}) ${compatibility.isSupported ? 'tiene soporte limitado' : 'no soporta'} Web Speech API.

🔧 Para usar transcripción en tiempo real GRATUITA:

✅ Navegadores Recomendados:
• Google Chrome (mejor opción)
• Microsoft Edge
• Firefox (funcionalidad limitada)

❌ No Compatible:
• Safari
• Navegadores móviles antiguos

💡 Alternativa: Puedes cargar archivos de audio para procesamiento.

${compatibility.recommendedAction}
    `.trim();
  }

  /**
   * Estado actual del servicio
   */
  getStatus(): {
    isSupported: boolean;
    isListening: boolean;
    sessionId: string;
    language: string;
  } {
    return {
      isSupported: this.isSupported,
      isListening: this.isListening,
      sessionId: this.sessionId,
      language: this.config.language
    };
  }

  /**
   * Cambiar idioma dinámicamente
   */
  setLanguage(language: 'es' | 'en'): void {
    this.config.language = language;
    if (this.recognition) {
      this.recognition.lang = language === 'es' ? 'es-ES' : 'en-US';
    }
    console.log(`🌐 Idioma cambiado a: ${language}`);
  }
} 