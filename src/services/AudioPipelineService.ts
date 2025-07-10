/**
 * AudioPipelineService - Servicio único de audio para AiDuxCare V.2
 * Pipeline profesional: Grabación → Google Cloud Speech-to-Text → Análisis Clínico
 */

import { GoogleCloudAudioService, ClinicalAnalysisResponse } from './GoogleCloudAudioService';

export default class AudioPipelineService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private isRecording: boolean = false;
  private transcriptionCallback: ((text: string, isFinal: boolean) => void) | null = null;
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private googleCloudService: GoogleCloudAudioService;
  
  constructor() {
    console.log('🎙️ AudioPipelineService inicializado - Google Cloud Pipeline');
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
  async iniciarGrabacion(callback: (text: string, isFinal: boolean) => void): Promise<void> {
    if (this.isRecording) {
      console.warn('⚠️ Ya se está grabando audio');
      return;
    }

    try {
      console.log('🎤 Iniciando pipeline de grabación profesional...');
      
      // Solicitar permisos de micrófono con configuración optimizada para Google Cloud
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
      
      // Configurar MediaRecorder para captura de audio de alta calidad
      this.configureMediaRecorder();
      
      this.isRecording = true;
      
      console.log('🎙️ Pipeline de grabación profesional activo');
      
      // Feedback inmediato
      if (this.transcriptionCallback) {
        this.transcriptionCallback('🎙️ Grabando consulta médica...', false);
      }

    } catch (error) {
      console.error('❌ Error en pipeline de grabación:', error);
      this.isRecording = false;
      
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
          throw new Error('Permisos de micrófono denegados. Por favor, permite el acceso al micrófono.');
        } else if (error.name === 'NotFoundError') {
          throw new Error('No se encontró micrófono. Verifica que tu dispositivo tenga un micrófono conectado.');
        }
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(`Error en pipeline de grabación: ${errorMessage}`);
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

    console.log('🛑 Deteniendo pipeline de grabación...');
    
    this.isRecording = false;
    
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    // Procesar audio capturado con Google Cloud
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
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    console.log('🧹 Pipeline de audio limpiado (Google Cloud Pipeline)');
  }

  /**
   * Configurar MediaRecorder para captura de audio de alta calidad
   */
  private configureMediaRecorder(): void {
    if (!this.stream) return;

    // Detectar formatos soportados con prioridad para calidad
    const supportedFormats = [
      'audio/wav', // Prioridad 1: Mejor calidad, sin compresión
      'audio/webm;codecs=opus', // Prioridad 2: Buena calidad con compresión eficiente
      'audio/mp4', // Prioridad 3: Amplia compatibilidad
      'audio/webm', // Prioridad 4: Fallback básico
      'audio/ogg;codecs=opus' // Prioridad 5: Alternativa
    ];

    let selectedFormat = 'audio/webm';
    
    for (const format of supportedFormats) {
      if (MediaRecorder.isTypeSupported(format)) {
        selectedFormat = format;
        break;
      }
    }

    console.log(`✅ Formato seleccionado: ${selectedFormat}`);

    // Configuración específica por formato
    let optimizedOptions: MediaRecorderOptions;
    
    if (selectedFormat.includes('wav')) {
      optimizedOptions = {
        mimeType: selectedFormat,
        audioBitsPerSecond: 128000 // Alta calidad sin compresión
      };
    } else if (selectedFormat.includes('opus')) {
      optimizedOptions = {
        mimeType: selectedFormat,
        audioBitsPerSecond: 64000 // Calidad eficiente
      };
    } else if (selectedFormat.includes('mp4')) {
      optimizedOptions = {
        mimeType: selectedFormat,
        audioBitsPerSecond: 96000 // Balance calidad/compatibilidad
      };
    } else {
      optimizedOptions = {
        mimeType: selectedFormat
      };
    }

    try {
      this.mediaRecorder = new MediaRecorder(this.stream, optimizedOptions);
      console.log('✅ MediaRecorder configurado con opciones optimizadas:', optimizedOptions);
    } catch (error) {
      console.warn('⚠️ Fallback a configuración básica:', error);
      this.mediaRecorder = new MediaRecorder(this.stream);
    }

    // Configurar eventos
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0 && this.isRecording) {
        this.audioChunks.push(event.data);
        console.log(`📦 Chunk de audio capturado: ${event.data.size} bytes (total: ${this.audioChunks.length} chunks)`);
      }
    };

    this.mediaRecorder.onstop = () => {
      console.log('🛑 Grabación detenida, procesando con Google Cloud...');
    };

    this.mediaRecorder.onerror = (event) => {
      console.error('❌ Error en MediaRecorder:', event);
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
        this.transcriptionCallback('No se capturó audio. Por favor, verifica tu micrófono.', true);
      }
      return;
    }

    try {
      // Informar al usuario que estamos procesando
      if (this.transcriptionCallback) {
        this.transcriptionCallback('Procesando audio con Google Cloud...', false);
      }

      // Preparar el audio para envío
      const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
      
      // Enviar a Google Cloud para análisis
      const response = await this.googleCloudService.analyzeClinicalTranscription({
        transcription: await this.blobToBase64(audioBlob),
        specialty: 'physiotherapy',
        sessionType: 'initial'
      });

      // Procesar respuesta
      if (response.success && this.transcriptionCallback) {
        // Extraer transcripción del análisis
        const transcription = response.message || 'No se pudo obtener la transcripción';
        this.transcriptionCallback(transcription, true);
      } else if (this.transcriptionCallback) {
        this.transcriptionCallback(
          response.error || 'Error procesando audio. Por favor, intenta nuevamente.',
          true
        );
      }

    } catch (error) {
      console.error('❌ Error procesando audio con Google Cloud:', error);
      if (this.transcriptionCallback) {
        this.transcriptionCallback(
          'Error en el procesamiento de audio. Por favor, verifica tu conexión e intenta nuevamente.',
          true
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
          // Extraer solo la parte Base64 del Data URL
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        } else {
          reject(new Error('Error convirtiendo audio a Base64'));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  }

  // Método de compatibilidad
  async startRecording(callback: (text: string, isFinal: boolean) => void): Promise<void> {
    return this.iniciarGrabacion(callback);
  }
} 