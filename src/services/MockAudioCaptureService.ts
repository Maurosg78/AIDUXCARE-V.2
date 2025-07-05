/**
 * Servicio de Captura de Audio Simulado para AiDuxCare V.2
 * Proporciona transcripción simulada para demostración cuando Web Speech API no funciona
 */

interface TranscriptionCallback {
  (text: string, isFinal: boolean): void;
}

export class MockAudioCaptureService {
  private isRecording: boolean = false;
  private currentTranscript: string = '';
  private onTranscriptionCallback: TranscriptionCallback | null = null;
  private simulationTimer: NodeJS.Timeout | null = null;
  private simulationStep: number = 0;

  // Transcripciones médicas simuladas para demostración
  private readonly sampleTranscriptions = [
    "El paciente presenta dolor en el hombro derecho desde hace una semana.",
    "Refiere molestias que aumentan con el movimiento y mejoran con el reposo.",
    "No hay antecedentes de trauma previo.",
    "Examen físico muestra limitación en la abducción del brazo.",
    "Se observa dolor a la palpación en el área del tendón supraespinoso.",
    "Recomiendo radiografía de hombro y tratamiento con antiinflamatorios.",
    "Control en una semana para evaluar evolución."
  ];

  constructor() {
    console.log('🎭 MockAudioCaptureService inicializado - Modo demostración');
  }

  async startRecording(callback: TranscriptionCallback): Promise<void> {
    if (this.isRecording) {
      console.warn('Ya hay una grabación simulada en progreso');
      return;
    }

    this.onTranscriptionCallback = callback;
    this.currentTranscript = '';
    this.simulationStep = 0;
    this.isRecording = true;

    console.log('🎭 Iniciando grabación simulada...');
    
    // Simular transcripción en tiempo real
    this.startSimulation();
  }

  private startSimulation(): void {
    this.simulationTimer = setInterval(() => {
      if (!this.isRecording || this.simulationStep >= this.sampleTranscriptions.length) {
        return;
      }

      const currentSentence = this.sampleTranscriptions[this.simulationStep];
      const words = currentSentence.split(' ');
      
      // Simular palabras apareciendo gradualmente
      let wordIndex = 0;
      const wordTimer = setInterval(() => {
        if (!this.isRecording || wordIndex >= words.length) {
          clearInterval(wordTimer);
          
          // Marcar la frase como final
          if (this.isRecording && this.onTranscriptionCallback) {
            this.currentTranscript += currentSentence + ' ';
            this.onTranscriptionCallback(this.currentTranscript, true);
          }
          
          this.simulationStep++;
          return;
        }

        // Agregar palabra intermedia
        const partialSentence = words.slice(0, wordIndex + 1).join(' ');
        if (this.onTranscriptionCallback) {
          this.onTranscriptionCallback(this.currentTranscript + partialSentence, false);
        }
        
        wordIndex++;
      }, 300); // 300ms entre palabras

    }, 3000); // 3 segundos entre frases
  }

  stopRecording(): string {
    if (!this.isRecording) {
      console.warn('No hay grabación simulada en progreso');
      return this.currentTranscript;
    }

    this.isRecording = false;
    
    if (this.simulationTimer) {
      clearInterval(this.simulationTimer);
      this.simulationTimer = null;
    }

    this.onTranscriptionCallback = null;
    
    console.log('🎭 Grabación simulada detenida. Transcripción final:', this.currentTranscript);
    return this.currentTranscript.trim();
  }

  isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  getCurrentTranscript(): string {
    return this.currentTranscript;
  }

  isServiceSupported(): boolean {
    return true; // Siempre soportado
  }

  getDiagnosticInfo(): {
    isSupported: boolean;
    isRecording: boolean;
    currentTranscript: string;
    simulationStep: number;
    userAgent: string;
    isHTTPS: boolean;
  } {
    return {
      isSupported: true,
      isRecording: this.isRecording,
      currentTranscript: this.currentTranscript,
      simulationStep: this.simulationStep,
      userAgent: navigator.userAgent,
      isHTTPS: window.location.protocol === 'https:'
    };
  }
}

export default MockAudioCaptureService; 