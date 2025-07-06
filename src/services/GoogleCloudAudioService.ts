/**
 * Servicio de Audio con Google Cloud Speech-to-Text
 * Reemplaza Web Speech API con transcripción profesional
 */

// Declaración para compatibilidad con navegadores
declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

export default class GoogleCloudAudioService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private isRecording: boolean = false;
  private transcriptionCallback: ((text: string, isFinal: boolean) => void) | null = null;
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  
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
   * Convertir WebM a WAV usando Web Audio API
   */
  private async convertWebMToWAV(webmBlob: Blob): Promise<Blob> {
    try {
      console.log('🔄 Convirtiendo WebM a WAV...');
      
      // Crear AudioContext si no existe
      if (!this.audioContext) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        this.audioContext = new AudioContextClass();
      }

      // Convertir blob a ArrayBuffer
      const arrayBuffer = await webmBlob.arrayBuffer();
      
      // Decodificar audio
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      // Configuración WAV
      const sampleRate = audioBuffer.sampleRate;
      const numberOfChannels = audioBuffer.numberOfChannels;
      const length = audioBuffer.length;
      
      // Crear buffer WAV
      const wavBuffer = this.createWAVBuffer(audioBuffer, sampleRate, numberOfChannels, length);
      
      // Crear blob WAV
      const wavBlob = new Blob([wavBuffer], { type: 'audio/wav' });
      
      console.log(`✅ Conversión completada: ${webmBlob.size} bytes (WebM) → ${wavBlob.size} bytes (WAV)`);
      
      return wavBlob;
      
    } catch (error) {
      console.error('❌ Error en conversión WebM → WAV:', error);
      
      // Fallback: intentar enviar WebM directamente
      console.log('🔄 Fallback: enviando WebM directamente');
      return webmBlob;
    }
  }

  /**
   * Crear buffer WAV a partir de AudioBuffer
   */
  private createWAVBuffer(audioBuffer: AudioBuffer, sampleRate: number, numberOfChannels: number, length: number): ArrayBuffer {
    const bytesPerSample = 2; // 16-bit
    const blockAlign = numberOfChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = length * blockAlign;
    const bufferSize = 44 + dataSize; // 44 bytes header + data
    
    const buffer = new ArrayBuffer(bufferSize);
    const view = new DataView(buffer);
    
    // WAV Header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, bufferSize - 8, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // PCM format
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, 16, true); // 16-bit
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);
    
    // Convertir datos de audio
    let offset = 44;
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        const sample = Math.max(-1, Math.min(1, channelData[i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        offset += 2;
      }
    }
    
    return buffer;
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
   * Iniciar grabación de audio
   */
  async startRecording(callback: (text: string, isFinal: boolean) => void): Promise<void> {
    if (this.isRecording) {
      console.warn('⚠️ Ya se está grabando audio');
      return;
    }

    try {
      console.log('🎤 Solicitando permisos de micrófono...');
      
      // Solicitar permisos de micrófono con configuración optimizada para Google Cloud
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000, // Google Cloud soporta hasta 48kHz
          channelCount: 1 // Mono para mejor compatibilidad
        } 
      });

      console.log('✅ Permisos concedidos, iniciando grabación...');
      
      this.transcriptionCallback = callback;
      this.audioChunks = [];
      
      // Configurar MediaRecorder con optimizaciones de rendimiento
      this.configureMediaRecorder();
      
      this.isRecording = true;
      
      console.log('🎙️ Grabación Google Cloud iniciada exitosamente');
      
      // Feedback inmediato
      if (this.transcriptionCallback) {
        this.transcriptionCallback('🎙️ Grabando audio médico con Google Cloud...', false);
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
      
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(`Error al acceder al micrófono: ${errorMessage}`);
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

    console.log('🛑 Deteniendo grabación Google Cloud...');
    
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
   * Procesar chunks de audio con optimizaciones de rendimiento
   */
  private async processAudioChunks(): Promise<void> {
    if (this.audioChunks.length === 0) {
      console.warn('⚠️ No hay chunks de audio para procesar');
      if (this.transcriptionCallback) {
        this.transcriptionCallback('No se detectó audio. Intenta hablar más cerca del micrófono.', true);
      }
      return;
    }

    try {
      console.log(`🔄 Procesando ${this.audioChunks.length} chunks de audio...`);
      
      // Crear blob con el tipo MIME correcto
      const mimeType = this.audioChunks[0].type || 'audio/webm';
      const audioBlob = new Blob(this.audioChunks, { type: mimeType });
      
      console.log(`📊 Audio creado: ${audioBlob.size} bytes, tipo: ${mimeType}`);
      
      // Validar tamaño mínimo (evitar archivos muy pequeños)
      if (audioBlob.size < 1024) { // <1KB
        console.warn('⚠️ Archivo de audio muy pequeño, puede no contener speech');
        if (this.transcriptionCallback) {
          this.transcriptionCallback('Audio muy corto. Intenta grabar por más tiempo.', true);
        }
        return;
      }

      // Optimización: Convertir a WAV solo si es necesario
      let finalBlob = audioBlob;
      let finalMimeType = mimeType;
      
      // Si no es un formato compatible con Google Cloud, convertir a WAV
      if (!mimeType.includes('wav') && !mimeType.includes('flac') && !mimeType.includes('mp3')) {
        console.log('🔄 Convirtiendo a formato WAV para compatibilidad...');
        try {
                     const wavBlob = await this.convertWebMToWAV(audioBlob);
          finalBlob = wavBlob;
          finalMimeType = 'audio/wav';
          console.log(`✅ Conversión exitosa: ${finalBlob.size} bytes WAV`);
        } catch (conversionError) {
          console.warn('⚠️ Error en conversión, usando formato original:', conversionError);
          // Continuar con formato original
        }
      }

      // Crear FormData optimizado
      const formData = new FormData();
      formData.append('audio', finalBlob, `recording.${finalMimeType.split('/')[1]}`);
      
      console.log(`📤 Enviando audio a Google Cloud (${finalBlob.size} bytes)...`);
      
      // Enviar con timeout optimizado
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
      
      const startTime = performance.now();
      
      const response = await fetch(this.getTranscribeUrl(), {
        method: 'POST',
        body: formData,
        signal: controller.signal,
        headers: {
          // No establecer Content-Type manualmente para FormData
        }
      });

      clearTimeout(timeoutId);
      const processingTime = Math.round(performance.now() - startTime);
      
      console.log(`⏱️ Tiempo de procesamiento: ${processingTime}ms`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error del servidor:', response.status, errorText);
        throw new Error(`Error del servidor: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Respuesta recibida:', result);

      // Procesar respuesta optimizada
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
        
        // Log métricas de rendimiento
        console.log(`📊 Métricas de rendimiento:
          - Tiempo total: ${processingTime}ms
          - Tamaño audio: ${finalBlob.size} bytes
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
      console.error('❌ Error al procesar audio:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al procesar audio';
      if (this.transcriptionCallback) {
        this.transcriptionCallback(`Error al transcribir: ${errorMessage}`, true);
      }
    }
  }

  /**
   * Obtener información del servicio
   */
  getServiceInfo(): string {
    return '🎙️ Google Cloud Speech-to-Text (Transcripción Profesional con Conversión WAV)';
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
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    console.log('🧹 Recursos de audio limpiados');
  }

  /**
   * Configurar MediaRecorder con optimizaciones de rendimiento
   */
  private configureMediaRecorder(): void {
    if (!this.stream) return;

    // Detectar formatos soportados con prioridad por rendimiento
    const supportedFormats = [
      'audio/webm;codecs=opus',  // Mejor compresión
      'audio/webm',              // Fallback WebM
      'audio/mp4',               // Compatibilidad móvil
      'audio/wav'                // Fallback universal
    ];

    let selectedFormat = 'audio/wav'; // Fallback por defecto
    
    for (const format of supportedFormats) {
      if (MediaRecorder.isTypeSupported(format)) {
        selectedFormat = format;
        break;
      }
    }

    console.log(`🎙️ Formato seleccionado: ${selectedFormat}`);

    // Configuración optimizada para rendimiento
    const options = {
      mimeType: selectedFormat,
      audioBitsPerSecond: selectedFormat.includes('opus') ? 64000 : 128000, // Menor bitrate para Opus
      bitsPerSecond: selectedFormat.includes('opus') ? 64000 : 128000
    };

    try {
      this.mediaRecorder = new MediaRecorder(this.stream, options);
      console.log('✅ MediaRecorder configurado con optimizaciones');
    } catch (error) {
      console.warn('⚠️ Fallback a configuración básica:', error);
      this.mediaRecorder = new MediaRecorder(this.stream);
    }

    // Configurar eventos con optimizaciones
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        this.audioChunks.push(event.data);
        console.log(`📦 Chunk recibido: ${event.data.size} bytes`);
      }
    };

    this.mediaRecorder.onstop = async () => {
      console.log('🛑 Grabación detenida, procesando audio...');
      await this.processAudioChunks();
    };

    this.mediaRecorder.onerror = (event) => {
      console.error('❌ Error en MediaRecorder:', event);
      if (this.transcriptionCallback) {
        this.transcriptionCallback('Error en la grabación de audio', true);
      }
    };

    // Iniciar grabación con chunks optimizados (1 segundo para mejor rendimiento)
    this.mediaRecorder.start(1000);
  }
} 