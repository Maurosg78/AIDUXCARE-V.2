/**
 * Servicio de Audio con Google Cloud Speech-to-Text
 * Reemplaza Web Speech API con transcripción profesional
 */
export default class GoogleCloudAudioService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private isRecording: boolean = false;
  private transcriptionCallback: ((text: string, isFinal: boolean) => void) | null = null;
  private stream: MediaStream | null = null;
  
  constructor() {
    console.log('🎙️ GoogleCloudAudioService inicializado');
  }

  // URLs desde variables de entorno
  private getTranscribeUrl(): string {
    const url = import.meta.env.VITE_GOOGLE_CLOUD_TRANSCRIBE_URL;
    if (!url) {
      throw new Error('VITE_GOOGLE_CLOUD_TRANSCRIBE_URL no está configurada');
    }
    return url;
  }

  private getHealthUrl(): string {
    const url = import.meta.env.VITE_GOOGLE_CLOUD_HEALTH_URL;
    if (!url) {
      throw new Error('VITE_GOOGLE_CLOUD_HEALTH_URL no está configurada');
    }
    return url;
  }

  /**
   * Verificar si el servicio está soportado
   */
  isServiceSupported(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
  }

  /**
   * Iniciar grabación de audio
   */
  async startRecording(callback: (text: string, isFinal: boolean) => void): Promise<void> {
    if (this.isRecording) {
      console.warn('⚠️ Ya se está grabando audio');
      return;
    }

    try {
      console.log('🎤 Solicitando permisos de micrófono...');
      
      // Solicitar permisos de micrófono
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 1
        } 
      });

      console.log('✅ Permisos concedidos, iniciando grabación...');
      
      this.transcriptionCallback = callback;
      this.audioChunks = [];
      
      // Configurar MediaRecorder
      const options = {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000
      };

      this.mediaRecorder = new MediaRecorder(this.stream, options);
      
      // Configurar eventos
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
          console.log(`📦 Chunk de audio capturado: ${event.data.size} bytes`);
        }
      };

      this.mediaRecorder.onstop = async () => {
        console.log('🔄 Grabación finalizada, procesando audio...');
        await this.processAudioChunks();
      };

      this.mediaRecorder.onerror = (event) => {
        console.error('❌ Error en MediaRecorder:', event);
        this.stopRecording();
      };

      // Iniciar grabación
      this.mediaRecorder.start(1000); // Capturar cada segundo
      this.isRecording = true;
      
      console.log('🎙️ Grabación iniciada exitosamente');
      
      // Feedback inmediato al usuario
      if (this.transcriptionCallback) {
        this.transcriptionCallback('🎙️ Grabando audio...', false);
      }

    } catch (error) {
      console.error('❌ Error al iniciar grabación:', error);
      this.isRecording = false;
      
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
          throw new Error('Permisos de micrófono denegados. Por favor, permite el acceso al micrófono.');
        } else if (error.name === 'NotFoundError') {
          throw new Error('No se encontró micrófono. Verifica que tu dispositivo tenga un micrófono conectado.');
        }
      }
      
      throw new Error(`Error al acceder al micrófono: ${error.message}`);
    }
  }

  /**
   * Detener grabación
   */
  stopRecording(): void {
    if (!this.isRecording) {
      console.warn('⚠️ No se está grabando audio');
      return;
    }

    console.log('🛑 Deteniendo grabación...');
    
    this.isRecording = false;
    
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }

  /**
   * Procesar chunks de audio y enviar a Google Cloud
   */
  private async processAudioChunks(): Promise<void> {
    if (this.audioChunks.length === 0) {
      console.warn('⚠️ No hay chunks de audio para procesar');
      if (this.transcriptionCallback) {
        this.transcriptionCallback('No se detectó audio para transcribir', true);
      }
      return;
    }

    try {
      console.log(`🔄 Procesando ${this.audioChunks.length} chunks de audio...`);
      
      // Combinar chunks en un solo blob
      const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm;codecs=opus' });
      console.log(`📁 Audio combinado: ${audioBlob.size} bytes`);

      // Mostrar progreso al usuario
      if (this.transcriptionCallback) {
        this.transcriptionCallback('🔄 Transcribiendo audio con Google Cloud...', false);
      }

      // Crear FormData para enviar archivo
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      console.log('🚀 Enviando audio a Google Cloud Speech-to-Text...');
      
      // Enviar a Cloud Function
      const response = await fetch(this.getTranscribeUrl(), {
        method: 'POST',
        body: formData,
        headers: {
          // No establecer Content-Type, el navegador lo hará automáticamente con boundary
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error en respuesta de Cloud Function:', response.status, errorText);
        throw new Error(`Error del servidor: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Respuesta de Google Cloud:', result);

      if (result.success && result.transcription) {
        console.log(`📝 Transcripción recibida: ${result.transcription}`);
        
        // Procesar información de hablantes si está disponible
        let formattedTranscription = result.transcription;
        
        if (result.segments && result.segments.length > 0) {
          console.log(`👥 Detectados ${result.totalSpeakers} hablantes`);
          
          // Formatear transcripción con información de hablantes
          formattedTranscription = result.segments.map((segment: any) => {
            const speakerLabel = segment.speaker === 1 ? '👩‍⚕️ Terapeuta' : '👤 Paciente';
            return `${speakerLabel}: ${segment.text}`;
          }).join('\n');
        }

        // Enviar transcripción final al callback
        if (this.transcriptionCallback) {
          this.transcriptionCallback(formattedTranscription, true);
        }

        // Información adicional en consola
        if (result.confidence) {
          console.log(`🎯 Confianza: ${(result.confidence * 100).toFixed(1)}%`);
        }
        
      } else {
        console.warn('⚠️ No se pudo transcribir el audio');
        if (this.transcriptionCallback) {
          this.transcriptionCallback(result.message || 'No se pudo transcribir el audio', true);
        }
      }

    } catch (error) {
      console.error('❌ Error al procesar audio:', error);
      
      if (this.transcriptionCallback) {
        this.transcriptionCallback(`Error al transcribir: ${error.message}`, true);
      }
    }
  }

  /**
   * Obtener información del servicio
   */
  getServiceInfo(): string {
    return '🎙️ Google Cloud Speech-to-Text (Transcripción Profesional)';
  }

  /**
   * Verificar si está grabando
   */
  getIsRecording(): boolean {
    return this.isRecording;
  }

  /**
   * Limpiar recursos
   */
  cleanup(): void {
    if (this.isRecording) {
      this.stopRecording();
    }
    
    this.audioChunks = [];
    this.transcriptionCallback = null;
    this.mediaRecorder = null;
    
    console.log('🧹 Recursos de audio limpiados');
  }
} 