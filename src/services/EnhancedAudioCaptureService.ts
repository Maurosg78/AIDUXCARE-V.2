/**
 * Servicio de Captura de Audio Mejorado para AiDuxCare V.2
 * Proporciona transcripción en tiempo real usando Web Speech API
 */

// Declaraciones de tipos para Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface TranscriptionCallback {
  (text: string, isFinal: boolean): void;
}

interface AudioCaptureConfig {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
}

export class EnhancedAudioCaptureService {
  private recognition: any = null;
  private isSupported: boolean = false;
  private isRecording: boolean = false;
  private currentTranscript: string = '';
  private onTranscriptionCallback: TranscriptionCallback | null = null;
  private restartAttempts: number = 0;
  private maxRestartAttempts: number = 3;

  constructor() {
    // Verificar soporte del navegador
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.isSupported = !!SpeechRecognition;
    
    if (this.isSupported) {
      this.recognition = new SpeechRecognition();
      this.setupRecognition();
    }
  }

  private setupRecognition(): void {
    if (!this.recognition) return;
    
    // Configuración optimizada para español médico
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'es-ES';
    this.recognition.maxAlternatives = 1;
    
    // Eventos principales
    this.recognition.onstart = () => {
      console.log('🎙️ Reconocimiento de voz iniciado');
      this.isRecording = true;
      this.restartAttempts = 0;
    };
    
    this.recognition.onend = () => {
      console.log('🎙️ Reconocimiento de voz finalizado');
      
      // Si estamos grabando pero se detuvo inesperadamente, intentar reiniciar
      if (this.isRecording && this.restartAttempts < this.maxRestartAttempts) {
        console.log('🔄 Intentando reiniciar reconocimiento...');
        this.restartAttempts++;
        setTimeout(() => {
          if (this.isRecording) {
            try {
              this.recognition?.start();
            } catch (error) {
              console.error('Error al reiniciar reconocimiento:', error);
              this.isRecording = false;
            }
          }
        }, 100);
      } else {
        this.isRecording = false;
      }
    };
    
    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('❌ Error en reconocimiento:', event.error);
      
      // Manejar diferentes tipos de errores
      switch (event.error) {
        case 'network':
          console.warn('Error de red - Verificar conexión a internet');
          break;
        case 'not-allowed':
          console.warn('Permisos de micrófono denegados');
          break;
        case 'no-speech':
          console.warn('No se detectó voz - Continuar escuchando');
          return; // No detener por falta de voz
        case 'audio-capture':
          console.warn('Error de captura de audio - Verificar micrófono');
          break;
        default:
          console.warn('Error desconocido:', event.error);
      }
      
      // Para errores críticos, detener la grabación
      if (['not-allowed', 'audio-capture'].includes(event.error)) {
        this.isRecording = false;
      }
    };

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        this.currentTranscript += finalTranscript + ' ';
        if (this.onTranscriptionCallback) {
          this.onTranscriptionCallback(this.currentTranscript, true);
        }
      } else if (interimTranscript && this.onTranscriptionCallback) {
        this.onTranscriptionCallback(this.currentTranscript + interimTranscript, false);
      }
    };
  }

  async startRecording(callback: TranscriptionCallback): Promise<void> {
    if (!this.isSupported) {
      throw new Error('Speech recognition no soportado en este navegador. Usa Chrome, Edge o Safari.');
    }

    if (this.isRecording) {
      console.warn('Ya hay una grabación en progreso');
      return;
    }

    // Verificar permisos de micrófono
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop()); // Liberar el stream
    } catch (error) {
      throw new Error('Permisos de micrófono denegados. Permite el acceso al micrófono e intenta nuevamente.');
    }

    this.onTranscriptionCallback = callback;
    this.currentTranscript = '';
    this.restartAttempts = 0;
    
    try {
      this.recognition?.start();
    } catch (error) {
      console.error('Error al iniciar grabación:', error);
      throw error;
    }
  }

  stopRecording(): string {
    if (!this.isRecording) {
      console.warn('No hay grabación en progreso');
      return this.currentTranscript;
    }

    this.isRecording = false;
    this.recognition?.stop();
    this.onTranscriptionCallback = null;
    
    return this.currentTranscript.trim();
  }

  isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  getCurrentTranscript(): string {
    return this.currentTranscript;
  }

  isServiceSupported(): boolean {
    return this.isSupported;
  }

  /**
   * Obtiene información de diagnóstico del servicio
   */
  getDiagnosticInfo(): {
    isSupported: boolean;
    isRecording: boolean;
    currentTranscript: string;
    restartAttempts: number;
    userAgent: string;
    isHTTPS: boolean;
  } {
    return {
      isSupported: this.isSupported,
      isRecording: this.isRecording,
      currentTranscript: this.currentTranscript,
      restartAttempts: this.restartAttempts,
      userAgent: navigator.userAgent,
      isHTTPS: window.location.protocol === 'https:'
    };
  }
}

export default EnhancedAudioCaptureService; 