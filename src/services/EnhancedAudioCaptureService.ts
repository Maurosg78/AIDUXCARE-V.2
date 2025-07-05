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
    };
    
    this.recognition.onend = () => {
      console.log('🎙️ Reconocimiento de voz finalizado');
      this.isRecording = false;
    };
    
    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('❌ Error en reconocimiento:', event.error);
      this.isRecording = false;
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
        this.currentTranscript += finalTranscript;
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
      throw new Error('Speech recognition no soportado en este navegador');
    }

    if (this.isRecording) {
      console.warn('Ya hay una grabación en progreso');
      return;
    }

    this.onTranscriptionCallback = callback;
    this.currentTranscript = '';
    
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

    this.recognition?.stop();
    this.onTranscriptionCallback = null;
    
    return this.currentTranscript;
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
}

export default EnhancedAudioCaptureService; 