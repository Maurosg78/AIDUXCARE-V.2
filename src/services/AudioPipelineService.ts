/**
 * AudioPipelineService - Servicio único de audio para AiDuxCare V.2
 * Pipeline profesional: MediaRecorder → Google Cloud Speech-to-Text → Análisis Clínico
 */

import { GoogleCloudAudioService, ClinicalAnalysisResponse } from './GoogleCloudAudioService';

interface TranscriptionCallback {
  (text: string, isFinal: boolean, metadata?: { 
    status?: 'recording' | 'processing' | 'completed' | 'error';
    progress?: number;
    error?: string;
  }): void;
}

interface ExtendedClinicalAnalysisResponse extends ClinicalAnalysisResponse {
  transcription?: string;
}

interface AudioProcessingError extends Error {
  name: string;
  message: string;
  code?: string;
}

export default class AudioPipelineService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private isRecording: boolean = false;
  private transcriptionCallback: TranscriptionCallback | null = null;
  private stream: MediaStream | null = null;
  private googleCloudService: GoogleCloudAudioService;
  private recordingStartTime: number = 0;
  
  constructor() {
    console.log('🎙️ AudioPipelineService inicializado - Pipeline Profesional Google Cloud');
    this.googleCloudService = new GoogleCloudAudioService();
  }

  /**
   * Verificar si el servicio está soportado
   */
  isServiceSupported(): boolean {
    return !!(
      navigator.mediaDevices && 
      'getUserMedia' in navigator.mediaDevices && 
      typeof MediaRecorder !== 'undefined'
    );
  }

  /**
   * MÉTODO PRINCIPAL: Iniciar grabación de audio
   */
  async iniciarGrabacion(callback: TranscriptionCallback): Promise<void> {
    if (this.isRecording) {
      console.warn('⚠️ Ya se está grabando audio');
      return;
    }

    try {
      console.log('🎙️ Iniciando grabación de consulta médica...');
      
      // Solicitar permisos de micrófono con configuración optimizada
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000, // Calidad profesional
          channelCount: 1 // Mono para mejor reconocimiento
        } 
      });

      console.log('✅ Permisos concedidos, configurando pipeline profesional...');
      
      this.transcriptionCallback = callback;
      this.audioChunks = [];
      this.recordingStartTime = Date.now();
      
      // Configurar MediaRecorder para captura de audio de alta calidad
      this.configureMediaRecorder();
      
      this.isRecording = true;
      
      // Notificar estado inicial
      if (this.transcriptionCallback) {
        this.transcriptionCallback(
          'Grabando audio... El análisis aparecerá al finalizar.',
          false,
          { status: 'recording', progress: 0 }
        );
      }

      console.log('🎙️ Pipeline de grabación profesional activo');

    } catch (error) {
      console.error('❌ Error al iniciar grabación:', error);
      this.isRecording = false;
      
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
          throw new Error('Permisos de micrófono denegados');
        } else if (error.name === 'NotFoundError') {
          throw new Error('No se encontró micrófono');
        }
      }
      
      throw error;
    }
  }

  /**
   * MÉTODO PRINCIPAL: Detener grabación y procesar con Google Cloud
   */
  async detenerGrabacion(): Promise<void> {
    if (!this.isRecording) {
      console.warn('⚠️ No se está grabando audio');
      return;
    }

    console.log('🛑 Deteniendo grabación de consulta médica...');
    
    this.isRecording = false;
    
    // Detener MediaRecorder
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    
    // Detener stream
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    // Procesar audio capturado
    await this.processAudioWithGoogleCloud();
  }

  /**
   * Obtener información del servicio
   */
  getServiceInfo(): string {
    const mediaSupport = !!(navigator.mediaDevices && 'getUserMedia' in navigator.mediaDevices);
    return `AudioPipelineService: MediaRecorder ${mediaSupport ? '✅' : '❌'}, Google Cloud Pipeline Activo ✅`;
  }

  /**
   * Limpiar recursos
   */
  cleanup(): void {
    if (this.isRecording) {
      this.detenerGrabacion();
    }
    
    this.audioChunks = [];
    this.transcriptionCallback = null;
    this.mediaRecorder = null;
    
    console.log('🧹 Pipeline de audio limpiado (Google Cloud Pipeline)');
  }

  /**
   * Configurar MediaRecorder para captura de audio de alta calidad
   */
  private configureMediaRecorder(): void {
    if (!this.stream) return;

    // Configuración optimizada para Google Cloud Speech-to-Text
    const options: MediaRecorderOptions = {
      mimeType: 'audio/webm;codecs=opus',
      audioBitsPerSecond: 128000 // 128kbps para calidad profesional
    };

    try {
      this.mediaRecorder = new MediaRecorder(this.stream, options);
      console.log('✅ MediaRecorder configurado con opciones optimizadas:', options);
    } catch (error) {
      console.warn('⚠️ Error al configurar MediaRecorder con opciones optimizadas:', error);
      this.mediaRecorder = new MediaRecorder(this.stream);
    }

    // Configurar eventos
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0 && this.isRecording) {
        this.audioChunks.push(event.data);
        
        // Calcular progreso aproximado
        const elapsedTime = Date.now() - this.recordingStartTime;
        const progress = Math.min(100, Math.round((elapsedTime / 1000) * 5)); // 5% por segundo
        
        console.log(`📦 Chunk de audio capturado: ${event.data.size} bytes (total: ${this.audioChunks.length} chunks)`);
        
        // Actualizar progreso
        if (this.transcriptionCallback) {
          this.transcriptionCallback(
            'Grabando audio... El análisis aparecerá al finalizar.',
            false,
            { status: 'recording', progress }
          );
        }
      }
    };

    this.mediaRecorder.onstop = () => {
      console.log('🛑 Grabación detenida, procesando con Google Cloud...');
    };

    this.mediaRecorder.onerror = (event) => {
      console.error('❌ Error en MediaRecorder:', event);
      if (this.transcriptionCallback) {
        this.transcriptionCallback(
          'Error en la grabación. Por favor, intenta de nuevo.',
          true,
          { status: 'error', error: 'mediarecorder_error' }
        );
      }
    };

    // Iniciar grabación con chunks cada 1 segundo
    this.mediaRecorder.start(1000);
  }

  /**
   * Procesar audio capturado con Google Cloud
   */
  private async processAudioWithGoogleCloud(): Promise<void> {
    if (this.audioChunks.length === 0) {
      console.warn('⚠️ No hay audio para procesar');
      if (this.transcriptionCallback) {
        this.transcriptionCallback(
          'No se capturó audio. Por favor, verifica tu micrófono.',
          true,
          { status: 'error', error: 'no_audio' }
        );
      }
      return;
    }

    try {
      // Notificar inicio del procesamiento
      if (this.transcriptionCallback) {
        this.transcriptionCallback(
          'Procesando audio con Google Cloud...',
          false,
          { status: 'processing', progress: 0 }
        );
      }

      console.log('🧠 Enviando audio al Cerebro Clínico...');

      // Preparar el audio para envío
      const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm;codecs=opus' });
      
      // Debug info
      console.log('🔍 BLOB DEBUG:', {
        size: audioBlob.size,
        type: audioBlob.type,
        chunks: this.audioChunks.length,
        duration: `${Math.round((Date.now() - this.recordingStartTime) / 1000)}s`,
        bitrate: `${Math.round(audioBlob.size * 8 / ((Date.now() - this.recordingStartTime) / 1000))}bps`
      });

      const base64Audio = await this.blobToBase64(audioBlob);
      
      // Actualizar progreso
      if (this.transcriptionCallback) {
        this.transcriptionCallback(
          'Enviando audio al servidor...',
          false,
          { status: 'processing', progress: 50 }
        );
      }

      const response = await this.googleCloudService.analyzeClinicalTranscription({
        transcription: base64Audio,
        specialty: 'physiotherapy',
        sessionType: 'initial'
      }) as ExtendedClinicalAnalysisResponse;

      // Validar respuesta
      if (!response || !response.success || !response.transcription) {
        throw new Error('Respuesta inválida del Cerebro Clínico');
      }

      console.log('✅ Análisis recibido del Cerebro Clínico:', {
        success: true,
        transcriptionLength: response.transcription.length,
        processingTime: `${Math.round((Date.now() - this.recordingStartTime) / 1000)}s`
      });

      // Notificar éxito
      if (this.transcriptionCallback) {
        this.transcriptionCallback(
          response.transcription,
          true,
          { status: 'completed', progress: 100 }
        );
      }

    } catch (error) {
      console.error('❌ Error al procesar audio:', error);
      
      if (this.transcriptionCallback) {
        this.transcriptionCallback(
          'Error al procesar audio. Por favor, intenta de nuevo.',
          true,
          { 
            status: 'error',
            error: error instanceof Error ? error.message : 'unknown_error'
          }
        );
      }
    }
  }

  /**
   * Convertir Blob a Base64
   */
  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          // Remover el prefijo "data:audio/webm;base64,"
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        } else {
          reject(new Error('Error al convertir audio a base64'));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  }

  // Método de compatibilidad
  async startRecording(callback: TranscriptionCallback): Promise<void> {
    return this.iniciarGrabacion(callback);
  }
} 