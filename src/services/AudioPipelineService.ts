/**
 * AudioPipelineService - Servicio único de audio para AiDuxCare V.2
 * Pipeline completo: Grabación → Google Cloud Speech-to-Text → Transcripción
 * Reemplaza todos los servicios de audio anteriores
 */

// Declaración para compatibilidad con navegadores
declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

export default class AudioPipelineService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private isRecording: boolean = false;
  private transcriptionCallback: ((text: string, isFinal: boolean) => void) | null = null;
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  
  constructor() {
    console.log('🎙️ AudioPipelineService inicializado - Servicio único de audio');
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
      console.log('🎤 Iniciando pipeline de grabación...');
      
      // Solicitar permisos de micrófono con configuración optimizada
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 1
        } 
      });

      console.log('✅ Permisos concedidos, configurando pipeline...');
      
      this.transcriptionCallback = callback;
      this.audioChunks = [];
      
      // Configurar MediaRecorder
      this.configureMediaRecorder();
      
      this.isRecording = true;
      
      console.log('🎙️ Pipeline de grabación activo');
      
      // Feedback inmediato
      if (this.transcriptionCallback) {
        this.transcriptionCallback('🎙️ Grabando audio médico...', false);
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
   * MÉTODO PRINCIPAL: Detener grabación
   */
  detenerGrabacion(): void {
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
  }

  /**
   * MÉTODO PRINCIPAL: Enviar audio para transcripción
   */
  private async enviarAudioParaTranscripcion(): Promise<void> {
    if (this.audioChunks.length === 0) {
      console.warn('⚠️ No hay audio para transcribir');
      if (this.transcriptionCallback) {
        this.transcriptionCallback('No se detectó audio. Intenta hablar más cerca del micrófono.', true);
      }
      return;
    }

    try {
      console.log(`🔄 Enviando audio para transcripción...`);
      
      // Crear blob con el tipo MIME correcto
      const mimeType = this.audioChunks[0].type || 'audio/webm';
      const audioBlob = new Blob(this.audioChunks, { type: mimeType });
      
      console.log(`📊 Audio preparado: ${audioBlob.size} bytes, tipo: ${mimeType}`);
      
      // Validar tamaño mínimo
      if (audioBlob.size < 1024) {
        console.warn('⚠️ Archivo de audio muy pequeño');
        if (this.transcriptionCallback) {
          this.transcriptionCallback('Audio muy corto. Intenta grabar por más tiempo.', true);
        }
        return;
      }

      // Convertir blob a Base64 para envío
      const arrayBuffer = await audioBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < uint8Array.length; i++) {
        binary += String.fromCharCode(uint8Array[i]);
      }
      const base64Audio = btoa(binary);
      
      console.log(`📤 Audio convertido a Base64: ${base64Audio.length} caracteres`);
      
      // Crear payload para Google Cloud
      const payload = {
        audioData: base64Audio,
        mimeType: mimeType,
        size: audioBlob.size,
        timestamp: Date.now()
      };
      
      const startTime = performance.now();
      
      // Enviar a Google Cloud Function
      const response = await fetch(this.getTranscribeUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      const processingTime = Math.round(performance.now() - startTime);
      console.log(`⏱️ Tiempo de transcripción: ${processingTime}ms`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Error del servidor: ${response.status} - ${errorText}`);
        if (this.transcriptionCallback) {
          this.transcriptionCallback(`Error de transcripción: ${response.status}`, true);
        }
        return;
      }

      const result = await response.json();
      console.log(`✅ Transcripción recibida:`, result);

      // Procesar respuesta
      if (result.success && result.transcription && this.transcriptionCallback) {
        // Formatear transcripción con speaker diarization si está disponible
        let formattedTranscription = result.transcription;
        
        if (result.segments && result.segments.length > 0) {
          formattedTranscription = result.segments
            .map((segment: any) => {
              const speaker = segment.speaker === 1 ? '👩‍⚕️ Terapeuta' : '👤 Paciente';
              return `${speaker}: ${segment.text}`;
            })
            .join('\n');
        }

        this.transcriptionCallback(formattedTranscription, true);
        
        console.log(`📊 Pipeline completado exitosamente:
          - Tiempo total: ${processingTime}ms
          - Tamaño audio: ${audioBlob.size} bytes
          - Confianza: ${Math.round((result.confidence || 0) * 100)}%
          - Hablantes detectados: ${result.totalSpeakers || 0}`);
          
      } else {
        console.warn('⚠️ No se obtuvo transcripción válida');
        if (this.transcriptionCallback) {
          this.transcriptionCallback(
            result.message || 'No se pudo transcribir el audio. Intenta hablar más claro.',
            true
          );
        }
      }

    } catch (error) {
      console.error('❌ Error en pipeline de transcripción:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      if (this.transcriptionCallback) {
        this.transcriptionCallback(`Error de transcripción: ${errorMessage}`, true);
      }
    }
  }

  /**
   * Obtener información del servicio
   */
  getServiceInfo(): string {
    return '🎙️ AudioPipelineService - Pipeline único de grabación y transcripción';
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
      this.detenerGrabacion();
    }
    
    this.audioChunks = [];
    this.transcriptionCallback = null;
    this.mediaRecorder = null;
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    console.log('🧹 Pipeline de audio limpiado');
  }

  /**
   * Configurar MediaRecorder con optimizaciones
   */
  private configureMediaRecorder(): void {
    if (!this.stream) return;

    // Detectar formatos soportados
    const supportedFormats = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/wav'
    ];

    let selectedFormat = 'audio/wav';
    
    for (const format of supportedFormats) {
      if (MediaRecorder.isTypeSupported(format)) {
        selectedFormat = format;
        break;
      }
    }

    console.log(`🎙️ Formato seleccionado: ${selectedFormat}`);

    const options = {
      mimeType: selectedFormat,
      audioBitsPerSecond: selectedFormat.includes('opus') ? 64000 : 128000,
      bitsPerSecond: selectedFormat.includes('opus') ? 64000 : 128000
    };

    try {
      this.mediaRecorder = new MediaRecorder(this.stream, options);
      console.log('✅ MediaRecorder configurado');
    } catch (error) {
      console.warn('⚠️ Fallback a configuración básica:', error);
      this.mediaRecorder = new MediaRecorder(this.stream);
    }

    // Configurar eventos
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0 && this.isRecording) {
        this.audioChunks.push(event.data);
        console.log(`📦 Chunk recibido: ${event.data.size} bytes`);
      }
    };

    this.mediaRecorder.onstop = async () => {
      console.log('🛑 Grabación detenida, procesando transcripción...');
      await this.enviarAudioParaTranscripcion();
    };

    this.mediaRecorder.onerror = (event) => {
      console.error('❌ Error en MediaRecorder:', event);
      if (this.transcriptionCallback) {
        this.transcriptionCallback('Error en la grabación de audio', true);
      }
    };

    // Iniciar grabación
    this.mediaRecorder.start(1000);
  }

  // MÉTODOS DE COMPATIBILIDAD (para no romper código existente)
  async startRecording(callback: (text: string, isFinal: boolean) => void): Promise<void> {
    return this.iniciarGrabacion(callback);
  }

  stopRecording(): void {
    return this.detenerGrabacion();
  }
} 