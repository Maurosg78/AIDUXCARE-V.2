/**
 * 🎤 Servicio Centralizado de Transcripción - AiDuxCare V.2
 * REFACTOR: Unifica todas las implementaciones de transcripción dispersas
 * Elimina duplicación en SimpleConsultationPage, AudioCaptureService, etc.
 */

interface TranscriptionSegment {
  id: string;
  timestamp: string;
  actor: 'profesional' | 'paciente' | 'acompañante';
  content: string;
  confidence: 'entendido' | 'poco_claro' | 'no_reconocido';
  approved?: boolean;
  edited?: boolean;
}

export interface TranscriptionState {
  isRecording: boolean;
  isProcessing: boolean;
  segments: TranscriptionSegment[];
  currentText: string;
  recordingTime: number;
  audioLevel: number;
  error: string | null;
}

export interface TranscriptionConfig {
  language: 'es' | 'en';
  enableSpeakerDetection: boolean;
  enableGoogleCloud: boolean;
  simulationMode: boolean;
  chunkSize: number;
  maxDuration: number;
}

export interface TranscriptionCallbacks {
  onStateChange?: (state: TranscriptionState) => void;
  onSegmentComplete?: (segment: TranscriptionSegment) => void;
  onError?: (error: string) => void;
  onProgress?: (progress: number) => void;
}

/**
 * Servicio Centralizado de Transcripción
 * Singleton que maneja toda la lógica de grabación y transcripción
 */
export class TranscriptionService {
  private static instance: TranscriptionService;
  private state: TranscriptionState;
  private config: TranscriptionConfig;
  private callbacks: TranscriptionCallbacks;
  private intervalRef: NodeJS.Timeout | null = null;
  private streamRef: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];

  private constructor() {
    this.state = this.getInitialState();
    this.config = this.getDefaultConfig();
    this.callbacks = {};
  }

  /**
   * Singleton pattern
   */
  public static getInstance(): TranscriptionService {
    if (!TranscriptionService.instance) {
      TranscriptionService.instance = new TranscriptionService();
    }
    return TranscriptionService.instance;
  }

  /**
   * Estado inicial limpio
   */
  private getInitialState(): TranscriptionState {
    return {
      isRecording: false,
      isProcessing: false,
      segments: [],
      currentText: '',
      recordingTime: 0,
      audioLevel: 0,
      error: null
    };
  }

  /**
   * Configuración por defecto
   */
  private getDefaultConfig(): TranscriptionConfig {
    return {
      language: 'es',
      enableSpeakerDetection: true,
      enableGoogleCloud: false,
      simulationMode: true,
      chunkSize: 1024,
      maxDuration: 3600
    };
  }

  /**
   * Configurar el servicio
   */
  public configure(config: Partial<TranscriptionConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Registrar callbacks
   */
  public setCallbacks(callbacks: TranscriptionCallbacks): void {
    this.callbacks = callbacks;
  }

  /**
   * Obtener estado actual
   */
  public getState(): TranscriptionState {
    return { ...this.state };
  }

  /**
   * Iniciar grabación y transcripción
   */
  public async startRecording(): Promise<void> {
    if (this.state.isRecording) {
      console.warn('⚠️ Ya hay una grabación en progreso');
      return;
    }

    try {
      this.updateState({ isRecording: true, error: null, segments: [] });
      
      if (this.config.simulationMode) {
        await this.startSimulatedRecording();
      } else {
        await this.startRealRecording();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      this.updateState({ isRecording: false, error: errorMessage });
      this.callbacks.onError?.(errorMessage);
    }
  }

  /**
   * Detener grabación
   */
  public async stopRecording(): Promise<TranscriptionSegment[]> {
    if (!this.state.isRecording) {
      console.warn('⚠️ No hay grabación activa');
      return this.state.segments;
    }

    try {
      this.updateState({ isRecording: false, isProcessing: true });
      
      // Limpiar intervalos
      this.cleanup();

      this.updateState({ isProcessing: false });
      return this.state.segments;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al detener grabación';
      this.updateState({ isRecording: false, isProcessing: false, error: errorMessage });
      this.callbacks.onError?.(errorMessage);
      return [];
    }
  }

  /**
   * Iniciar grabación simulada
   */
  private async startSimulatedRecording(): Promise<void> {
    const sampleTexts = [
      "Paciente refiere dolor lumbar que ha mejorado significativamente desde la última sesión.",
      "Movilidad aumentada, puede realizar actividades diarias sin limitación importante.",
      "Dolor actual 3/10, previamente era 7/10.",
      "No presenta signos de alarma neurológica.",
      "Adherencia al tratamiento domiciliario buena.",
      "Se recomienda continuar con ejercicios de fortalecimiento del core.",
      "Cita de seguimiento programada en 2 semanas."
    ];

    let currentIndex = 0;
    let recordingTime = 0;

    this.intervalRef = setInterval(() => {
      recordingTime += 1;
      this.updateState({ recordingTime });

      // Agregar texto cada 3 segundos
      if (recordingTime % 3 === 0 && currentIndex < sampleTexts.length) {
        const segment: TranscriptionSegment = {
          id: `sim_${Date.now()}_${currentIndex}`,
          timestamp: new Date().toISOString(),
          actor: currentIndex % 2 === 0 ? 'profesional' : 'paciente',
          content: sampleTexts[currentIndex],
          confidence: this.randomConfidence(),
          approved: false,
          edited: false
        };

        const newSegments = [...this.state.segments, segment];
        this.updateState({ 
          segments: newSegments,
          currentText: newSegments.map(s => s.content).join(' ')
        });

        this.callbacks.onSegmentComplete?.(segment);
        currentIndex++;
      }

      this.callbacks.onProgress?.(Math.min((currentIndex / sampleTexts.length) * 100, 100));
    }, 1000);
  }

  /**
   * Iniciar grabación real
   */
  private async startRealRecording(): Promise<void> {
    try {
      this.streamRef = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        } 
      });

      this.startRecordingTimer();
    } catch (error) {
      throw new Error(`Error accediendo al micrófono: ${error}`);
    }
  }

  /**
   * Timer para grabación
   */
  private startRecordingTimer(): void {
    let recordingTime = 0;

    this.intervalRef = setInterval(() => {
      recordingTime += 1;
      this.updateState({ recordingTime });

      // Detener automáticamente si excede el máximo
      if (recordingTime >= this.config.maxDuration) {
        this.stopRecording();
      }
    }, 1000);
  }

  /**
   * Limpiar recursos
   */
  public cleanup(): void {
    if (this.intervalRef) {
      clearInterval(this.intervalRef);
      this.intervalRef = null;
    }
    
    if (this.streamRef) {
      this.streamRef.getTracks().forEach(track => track.stop());
      this.streamRef = null;
    }

    this.audioChunks = [];
  }

  /**
   * Reiniciar transcripción
   */
  public reset(): void {
    this.cleanup();
    this.state = this.getInitialState();
    this.callbacks.onStateChange?.(this.state);
  }

  /**
   * Actualizar estado
   */
  private updateState(newState: Partial<TranscriptionState>): void {
    this.state = { ...this.state, ...newState };
    this.callbacks.onStateChange?.(this.state);
  }

  /**
   * Generar confianza aleatoria
   */
  private randomConfidence(): 'entendido' | 'poco_claro' | 'no_reconocido' {
    const rand = Math.random();
    if (rand > 0.8) return 'entendido';
    if (rand > 0.5) return 'poco_claro';
    return 'no_reconocido';
  }

  /**
   * Verificar soporte del navegador
   */
  public static isSupported(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }
}

export default TranscriptionService; 