/**
 * Servicio de captura de audio real del ambiente
 * Utiliza Web Speech API para transcripción en tiempo real
 */
export default class RealAudioCaptureService {
  private recognition: SpeechRecognition | null = null;
  private isRecording: boolean = false;
  private callback: ((text: string, isFinal: boolean) => void) | null = null;
  private currentTranscript: string = '';

  constructor() {
    // Verificar soporte del navegador
    if (this.isServiceSupported()) {
      this.initializeRecognition();
    }
  }

  private initializeRecognition(): void {
    try {
      // Crear instancia de SpeechRecognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();

      // Configuración para captura médica profesional
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'es-ES'; // Español
      this.recognition.maxAlternatives = 1;

      // Event handlers
      this.recognition.onstart = () => {
        console.log('🎙️ Reconocimiento de voz iniciado');
      };

      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = '';
        let finalTranscript = '';

        // Procesar todos los resultados
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        // Actualizar transcripción actual
        if (finalTranscript) {
          this.currentTranscript += finalTranscript;
          if (this.callback) {
            this.callback(this.currentTranscript.trim(), true);
          }
        } else if (interimTranscript && this.callback) {
          // Mostrar transcripción temporal
          const tempTranscript = this.currentTranscript + interimTranscript;
          this.callback(tempTranscript.trim(), false);
        }
      };

      this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Error en reconocimiento de voz:', event.error);
        
        // Manejar diferentes tipos de errores de forma más silenciosa
        switch (event.error) {
          case 'network':
            console.warn('⚠️ Error de red - el servicio continuará funcionando');
            // No reintentar automáticamente para evitar spam de errores
            break;
          case 'not-allowed':
            console.error('❌ Permisos de micrófono denegados');
            this.isRecording = false;
            break;
          case 'no-speech':
            console.log('🔇 No se detectó habla - esperando...');
            break;
          case 'audio-capture':
            console.error('❌ Error de captura de audio');
            this.isRecording = false;
            break;
          default:
            console.warn('⚠️ Error en reconocimiento:', event.error);
        }
      };

      this.recognition.onend = () => {
        console.log('🎙️ Reconocimiento de voz finalizado');
        
        // Solo reiniciar si aún estamos grabando y no hay errores críticos
        if (this.isRecording && this.recognition) {
          console.log('🔄 Reiniciando reconocimiento automáticamente...');
          setTimeout(() => {
            if (this.isRecording && this.recognition) {
              try {
                this.recognition.start();
              } catch (error) {
                console.warn('Error al reiniciar reconocimiento:', error);
                // Si falla 3 veces, parar automáticamente
                this.isRecording = false;
              }
            }
          }, 500); // Aumentar delay para evitar spam
        }
      };

    } catch (error) {
      console.error('Error inicializando reconocimiento de voz:', error);
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
      stream.getTracks().forEach(track => track.stop()); // Liberar el stream inmediatamente
    } catch (error) {
      throw new Error('No se pudo acceder al micrófono. Verifica los permisos.');
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