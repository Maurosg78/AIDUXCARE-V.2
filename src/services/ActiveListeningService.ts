/**
 * AUDIO: ACTIVE LISTENING SERVICE - ESCUCHA ACTIVA COMPLETA
 * Servicio que integra Frontend (Web Speech API) + Backend (Google Speech-to-Text)
 * Implementa las 3 prioridades estratégicas de la funcionalidad MVP
 */

import { WebSpeechSTTService } from './WebSpeechSTTService';

// === TIPOS Y INTERFACES ===
export interface ActiveListeningSegment {
  id: string;
  content: string;
  timestamp: string;
  confidence: number;
  speaker: 'MEDICO' | 'PACIENTE' | 'DESCONOCIDO';
  isFinal: boolean;
  source: 'local' | 'backend';
}

export interface ActiveListeningOptions {
  onResult: (segment: ActiveListeningSegment) => void;
  onError?: (error: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
  language?: 'es' | 'en';
  enableBackendSync?: boolean;
  sessionId: string;
  patientId: string;
}

export interface SessionMetrics {
  totalSegments: number;
  averageConfidence: number;
  totalDuration: number;
  wordsTranscribed: number;
  backendSyncSuccess: number;
  backendSyncFailed: number;
}

// === CONFIGURACIÓN ===
const BACKEND_API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api-zalv4ryzjq-uc.a.run.app'
  : 'http://localhost:5001/aiduxcare/us-central1/api';

const AUDIO_CHUNK_DURATION = 5000; // 5 segundos por chunk
const MAX_RETRIES = 3;

/**
 * Servicio principal de Escucha Activa
 * Combina transcripción local (Web Speech API) con procesamiento backend (Google Speech-to-Text)
 */
export class ActiveListeningService {
  private webSpeechService: WebSpeechSTTService;
  private isListening: boolean = false;
  private sessionId: string = '';
  private patientId: string = '';
  private options: ActiveListeningOptions = {} as ActiveListeningOptions;
  private audioChunks: Blob[] = [];
  private mediaRecorder: MediaRecorder | null = null;
  private mediaStream: MediaStream | null = null;
  private chunkTimer: NodeJS.Timeout | null = null;
  
  // Métricas de sesión
  private sessionMetrics: SessionMetrics = {
    totalSegments: 0,
    averageConfidence: 0,
    totalDuration: 0,
    wordsTranscribed: 0,
    backendSyncSuccess: 0,
    backendSyncFailed: 0
  };

  constructor() {
    this.webSpeechService = new WebSpeechSTTService({
      language: 'es',
      continuous: true,
      interimResults: true,
      maxAlternatives: 1
    });
  }

  /**
   * ✨ PRIORIDAD #1: INICIAR ESCUCHA ACTIVA
   * Inicia tanto la transcripción local como la grabación para backend
   */
  public async startActiveListening(options: ActiveListeningOptions): Promise<void> {
    if (this.isListening) {
      throw new Error('La escucha activa ya está en curso');
    }

    this.options = options;
    this.sessionId = options.sessionId;
    this.patientId = options.patientId;
    this.isListening = true;

    try {
      console.log('AUDIO: Iniciando Escucha Activa completa...');
      console.log(`NOTES: Sesión: ${this.sessionId}, Paciente: ${this.patientId}`);

      // Inicializar métricas
      this.resetSessionMetrics();

      // ✨ PRIORIDAD #2: CAPTURA DE AUDIO (Frontend)
      await this.initializeAudioCapture();

      // ✨ PRIORIDAD #1: TRANSCRIPCIÓN LOCAL (Web Speech API)
      await this.startLocalTranscription();

      // Callback de inicio
      if (this.options.onStart) {
        this.options.onStart();
      }

      console.log('SUCCESS: Escucha Activa iniciada correctamente');

    } catch (error) {
      this.isListening = false;
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('ERROR: Error iniciando Escucha Activa:', errorMessage);
      
      if (this.options.onError) {
        this.options.onError(errorMessage);
      }
      throw error;
    }
  }

  /**
   * 🛑 DETENER ESCUCHA ACTIVA
   * Finaliza todas las capturas y procesa los datos pendientes
   */
  public async stopActiveListening(): Promise<SessionMetrics> {
    if (!this.isListening) {
      return this.sessionMetrics;
    }

    console.log('🛑 Deteniendo Escucha Activa...');

    try {
      // Detener transcripción local
      this.webSpeechService.stopTranscription();

      // Detener captura de audio
      await this.stopAudioCapture();

      // Procesar chunk final si existe
      if (this.audioChunks.length > 0) {
        await this.processAudioChunkWithBackend();
      }

      this.isListening = false;

      // Callback de finalización
      if (this.options.onEnd) {
        this.options.onEnd();
      }

      console.log('SUCCESS: Escucha Activa detenida correctamente');
      console.log('STATS: Métricas finales:', this.sessionMetrics);

      return this.sessionMetrics;

    } catch (error) {
      console.error('ERROR: Error deteniendo Escucha Activa:', error);
      this.isListening = false;
      return this.sessionMetrics;
    }
  }

  /**
   * ✨ PRIORIDAD #2: INICIALIZAR CAPTURA DE AUDIO
   * Configura MediaRecorder para capturar audio en chunks
   */
  private async initializeAudioCapture(): Promise<void> {
    try {
      console.log('🎧 Inicializando captura de audio...');

      // Solicitar permisos de micrófono
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000
        }
      });

      // Configurar MediaRecorder
      const options = {
        mimeType: 'audio/webm;codecs=opus',
        bitsPerSecond: 128000
      };

      this.mediaRecorder = new MediaRecorder(this.mediaStream, options);

      // Eventos del MediaRecorder
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
          console.log(`📦 Chunk de audio capturado: ${event.data.size} bytes`);
        }
      };

      this.mediaRecorder.onstop = () => {
        console.log('🎧 Captura de audio detenida');
      };

      // Iniciar grabación
      this.mediaRecorder.start();

      // Configurar timer para procesar chunks periódicamente
      this.chunkTimer = setInterval(() => {
        this.processAudioChunkWithBackend();
      }, AUDIO_CHUNK_DURATION);

      console.log('SUCCESS: Captura de audio inicializada');

    } catch (error) {
      console.error('ERROR: Error en captura de audio:', error);
      throw new Error(`Error de captura de audio: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * ✨ PRIORIDAD #1: INICIAR TRANSCRIPCIÓN LOCAL
   * Configura Web Speech API para transcripción en tiempo real
   */
  private async startLocalTranscription(): Promise<void> {
    console.log('SPEECH: Iniciando transcripción local...');

    await this.webSpeechService.startRealtimeTranscription({
      onResult: (segment) => {
        // Convertir al formato de ActiveListening
        const activeSegment: ActiveListeningSegment = {
          id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          content: segment.content,
          timestamp: new Date().toLocaleTimeString('es-ES'),
          confidence: (typeof segment.confidence === 'number' ? segment.confidence : 0.8),
          speaker: this.determineSpeaker(segment.content),
          isFinal: true,
          source: 'local'
        };

        // Actualizar métricas
        this.updateSessionMetrics(activeSegment);

        // Callback al componente
        if (this.options.onResult) {
          this.options.onResult(activeSegment);
        }

        console.log(`📝 Transcripción local: "${activeSegment.content}" (${Math.round(activeSegment.confidence * 100)}%)`);
      },

      onError: (error) => {
        console.error('ERROR: Error en transcripción local:', error);
        if (this.options.onError) {
          this.options.onError(`Error de transcripción local: ${error}`);
        }
      },

      onStart: () => {
        console.log('SUCCESS: Transcripción local iniciada');
      },

      onEnd: () => {
        console.log('🔚 Transcripción local finalizada');
      }
    });
  }

  /**
   * ✨ PRIORIDAD #3: PROCESAR CHUNK CON BACKEND
   * Envía audio al backend para procesamiento con Google Speech-to-Text
   */
  private async processAudioChunkWithBackend(): Promise<void> {
    if (!this.options.enableBackendSync || this.audioChunks.length === 0) {
      return;
    }

    try {
      console.log('CLOUD: Procesando chunk con backend...');

      // Combinar chunks en un solo blob
      const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
      this.audioChunks = []; // Limpiar chunks procesados

      // Convertir a Base64
      const audioBase64 = await this.blobToBase64(audioBlob);

      // Preparar request para backend
      const requestData = {
        audioData: audioBase64,
        sessionId: this.sessionId,
        patientId: this.patientId,
        language: this.options.language === 'en' ? 'en-US' : 'es-ES',
        config: {
          enableSpeakerDiarization: true,
          enablePunctuation: true,
          model: 'medical_dictation'
        }
      };

      // Enviar al backend con reintentos
      const response = await this.sendToBackendWithRetry(requestData);

      if (response.success && response.segments) {
        // Procesar segmentos del backend
        for (const backendSegment of response.segments) {
          const activeSegment: ActiveListeningSegment = {
            id: backendSegment.id,
            content: backendSegment.content,
            timestamp: backendSegment.timestamp,
            confidence: backendSegment.confidence,
            speaker: backendSegment.speaker,
            isFinal: true,
            source: 'backend'
          };

          // Actualizar métricas
          this.updateSessionMetrics(activeSegment);

          // Callback al componente
          if (this.options.onResult) {
            this.options.onResult(activeSegment);
          }

          console.log(`CLOUD: Transcripción backend: "${activeSegment.content}" (${Math.round(activeSegment.confidence * 100)}%)`);
        }

        this.sessionMetrics.backendSyncSuccess++;
      }

    } catch (error) {
      console.error('ERROR: Error procesando con backend:', error);
      this.sessionMetrics.backendSyncFailed++;
      
      if (this.options.onError) {
        this.options.onError(`Error de sincronización backend: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      }
    }
  }

  /**
   * Envía datos al backend con reintentos
   */
  private async sendToBackendWithRetry(data: any, retries: number = 0): Promise<any> {
    try {
      const response = await fetch(`${BACKEND_API_URL}/transcription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();

    } catch (error) {
      if (retries < MAX_RETRIES) {
        console.warn(`WARNING: Reintento ${retries + 1}/${MAX_RETRIES} para backend...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retries + 1))); // Backoff exponencial
        return this.sendToBackendWithRetry(data, retries + 1);
      }
      throw error;
    }
  }

  /**
   * Detiene la captura de audio
   */
  private async stopAudioCapture(): Promise<void> {
    if (this.chunkTimer) {
      clearInterval(this.chunkTimer);
      this.chunkTimer = null;
    }

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
  }

  /**
   * Convierte Blob a Base64
   */
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1]; // Remover "data:audio/webm;base64,"
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Determina el hablante basado en el contenido
   */
  private determineSpeaker(content: string): 'MEDICO' | 'PACIENTE' | 'DESCONOCIDO' {
    const lowerContent = content.toLowerCase();

    // Palabras indicativas de médico
    const medicoKeywords = ['diagnóstico', 'prescrib', 'recomiendo', 'vamos a', 'exploración'];
    if (medicoKeywords.some(keyword => lowerContent.includes(keyword))) {
      return 'MEDICO';
    }

    // Palabras indicativas de paciente
    const pacienteKeywords = ['me duele', 'siento', 'tengo', 'no puedo', 'me molesta'];
    if (pacienteKeywords.some(keyword => lowerContent.includes(keyword))) {
      return 'PACIENTE';
    }

    return 'DESCONOCIDO';
  }

  /**
   * Actualiza las métricas de sesión
   */
  private updateSessionMetrics(segment: ActiveListeningSegment): void {
    this.sessionMetrics.totalSegments++;
    this.sessionMetrics.wordsTranscribed += segment.content.split(' ').length;
    
    // Actualizar confianza promedio
    const totalConfidence = this.sessionMetrics.averageConfidence * (this.sessionMetrics.totalSegments - 1) + segment.confidence;
    this.sessionMetrics.averageConfidence = totalConfidence / this.sessionMetrics.totalSegments;
  }

  /**
   * Reinicia las métricas de sesión
   */
  private resetSessionMetrics(): void {
    this.sessionMetrics = {
      totalSegments: 0,
      averageConfidence: 0,
      totalDuration: 0,
      wordsTranscribed: 0,
      backendSyncSuccess: 0,
      backendSyncFailed: 0
    };
  }

  /**
   * Obtiene las métricas actuales de la sesión
   */
  public getSessionMetrics(): SessionMetrics {
    return { ...this.sessionMetrics };
  }

  /**
   * Verifica si el servicio está escuchando
   */
  public isActiveListening(): boolean {
    return this.isListening;
  }

  /**
   * Obtiene el ID de sesión actual
   */
  public getCurrentSessionId(): string {
    return this.sessionId;
  }
} 