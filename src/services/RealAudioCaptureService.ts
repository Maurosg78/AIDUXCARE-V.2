/**
 * Servicio de captura de audio real del ambiente
 * Utiliza Web Speech API para transcripción en tiempo real
 */
export default class RealAudioCaptureService {
  private recognition: SpeechRecognition | null = null;
  private isRecording: boolean = false;
  private callback: ((text: string, isFinal: boolean) => void) | null = null;
  private currentTranscript: string = '';
  private isInitialized: boolean = false;

  constructor() {
    // NO inicializar automáticamente para evitar errores
    console.log('🎙️ RealAudioCaptureService creado (sin inicializar)');
  }

  private initializeRecognition(): void {
    if (this.isInitialized || this.recognition) {
      return; // Ya está inicializado
    }

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        throw new Error('Web Speech API no soportado');
      }

      this.recognition = new SpeechRecognition();
      
      // Configuración médica optimizada
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'es-ES';
      this.recognition.maxAlternatives = 1;

      this.recognition.onstart = () => {
        console.log('🎙️ Reconocimiento de voz iniciado');
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

        if (finalTranscript && this.callback) {
          this.currentTranscript += finalTranscript;
          this.callback(this.currentTranscript.trim(), true);
        } else if (interimTranscript && this.callback) {
          const tempTranscript = this.currentTranscript + interimTranscript;
          this.callback(tempTranscript.trim(), false);
        }
      };

      this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        // Solo log mínimo de errores
        console.warn('⚠️ Error reconocimiento:', event.error);
        
        switch (event.error) {
          case 'not-allowed':
          case 'audio-capture':
            this.isRecording = false;
            break;
        }
      };

      this.recognition.onend = () => {
        console.log('🎙️ Reconocimiento finalizado');
        
        // Solo reiniciar si explícitamente estamos grabando
        if (this.isRecording && this.recognition) {
          setTimeout(() => {
            if (this.isRecording && this.recognition) {
              try {
                this.recognition.start();
              } catch (error) {
                console.warn('Error reiniciando:', error);
                this.isRecording = false;
              }
            }
          }, 1000);
        }
      };

      this.isInitialized = true;
      console.log('✅ Reconocimiento de voz inicializado correctamente');

    } catch (error) {
      console.error('❌ Error inicializando reconocimiento:', error);
      throw new Error('No se pudo inicializar el reconocimiento de voz');
    }
  }

  private handleNetworkError(): void {
    // Método simplificado - ya no se usa automáticamente
    console.log('🔧 Método handleNetworkError disponible para reintentos manuales');
  }

  async startRecording(callback: (text: string, isFinal: boolean) => void): Promise<void> {
    if (!this.isServiceSupported()) {
      throw new Error('Reconocimiento de voz no soportado en este navegador');
    }

    if (this.isRecording) {
      console.warn('Ya se está grabando');
      return;
    }

    // Verificar permisos de micrófono
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      throw new Error('No se pudo acceder al micrófono. Verifica los permisos.');
    }

    // Inicializar solo cuando se va a usar
    if (!this.isInitialized) {
      this.initializeRecognition();
    }

    this.isRecording = true;
    this.callback = callback;
    this.currentTranscript = '';

    if (this.recognition) {
      try {
        this.recognition.start();
        console.log('🎙️ Grabación de audio real iniciada');
      } catch (error) {
        this.isRecording = false;
        this.callback = null;
        throw new Error(`Error al iniciar grabación: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      }
    } else {
      this.isRecording = false;
      this.callback = null;
      throw new Error('Servicio de reconocimiento no inicializado');
    }
  }

  stopRecording(): string {
    if (!this.isRecording) {
      console.warn('No se está grabando actualmente');
      return this.currentTranscript;
    }

    this.isRecording = false;
    
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (error) {
        console.warn('Error al detener reconocimiento:', error);
      }
    }

    this.callback = null;
    console.log('🎙️ Grabación de audio real detenida');
    
    return this.currentTranscript.trim();
  }

  isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  isServiceSupported(): boolean {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  // Método para diagnosticar el estado del servicio
  getDiagnosticInfo(): any {
    return {
      supported: this.isServiceSupported(),
      recording: this.isRecording,
      recognition: !!this.recognition,
      currentTranscript: this.currentTranscript,
      userAgent: navigator.userAgent,
      language: 'es-ES'
    };
  }
}

// Declaraciones para TypeScript
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
} 