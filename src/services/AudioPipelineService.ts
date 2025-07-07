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
  
  // NUEVOS: Variables para transcripción en tiempo real
  private realtimeTimer: NodeJS.Timeout | null = null;
  private chunkCounter: number = 0;
  private accumulatedTranscription: string = '';
  private isProcessingChunk: boolean = false;
  private processedChunkCount: number = 0; // NUEVO: Contador de chunks ya procesados
  
  constructor() {
    console.log('🎙️ AudioPipelineService inicializado - Servicio único de audio con transcripción en tiempo real');
  }

  // URLs desde variables de entorno con fallback
  private getTranscribeUrl(): string {
    const url = import.meta.env.VITE_GOOGLE_CLOUD_TRANSCRIBE_URL;
    if (!url) {
      // Fallback para desarrollo
      console.warn('⚠️ VITE_GOOGLE_CLOUD_TRANSCRIBE_URL no configurada, usando fallback de desarrollo');
      return 'https://us-east1-aiduxcare-stt-20250706.cloudfunctions.net/transcribeAudio';
    }
    return url;
  }

  private getHealthUrl(): string {
    const url = import.meta.env.VITE_GOOGLE_CLOUD_HEALTH_URL;
    if (!url) {
      // Fallback para desarrollo
      console.warn('⚠️ VITE_GOOGLE_CLOUD_HEALTH_URL no configurada, usando fallback de desarrollo');
      return 'https://us-east1-aiduxcare-stt-20250706.cloudfunctions.net/health';
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
      
      // 🔧 CORRECCIÓN: Resetear contador de chunks procesados
      this.processedChunkCount = 0;
      this.chunkCounter = 0;
      this.accumulatedTranscription = '';
      
      // Configurar MediaRecorder
      this.configureMediaRecorder();
      
      this.isRecording = true;
      
      console.log('🎙️ Pipeline de grabación activo');
      
      // NUEVO: Iniciar transcripción en tiempo real
      this.startRealtimeTranscription();
      
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
    
    // NUEVO: Detener transcripción en tiempo real
    this.stopRealtimeTranscription();
    
    this.isRecording = false;
    
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    // NUEVO: Procesar transcripción final
    setTimeout(() => {
      this.processFinalTranscription();
    }, 1000);
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
    
    // NUEVO: Limpiar transcripción en tiempo real
    this.stopRealtimeTranscription();
    this.chunkCounter = 0;
    this.accumulatedTranscription = '';
    this.isProcessingChunk = false;
    this.processedChunkCount = 0; // 🔧 CORRECCIÓN: Resetear contador
    
    this.audioChunks = [];
    this.transcriptionCallback = null;
    this.mediaRecorder = null;
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    console.log('🧹 Pipeline de audio limpiado (incluyendo transcripción en tiempo real)');
  }

  /**
   * Configurar MediaRecorder con optimizaciones
   */
  private configureMediaRecorder(): void {
    if (!this.stream) return;

    // 🔧 PASO 2: CONFIGURACIÓN REFINADA DEL MEDIARECORDER
    // Detectar formatos soportados con prioridad mejorada para calidad
    const supportedFormats = [
      'audio/wav', // Prioridad 1: Mejor calidad, sin compresión
      'audio/webm;codecs=opus', // Prioridad 2: Buena calidad con compresión eficiente
      'audio/mp4', // Prioridad 3: Amplia compatibilidad
      'audio/webm', // Prioridad 4: Fallback básico
      'audio/ogg;codecs=opus' // Prioridad 5: Alternativa para algunos navegadores
    ];

    let selectedFormat = 'audio/webm'; // Fallback por defecto
    
    for (const format of supportedFormats) {
      if (MediaRecorder.isTypeSupported(format)) {
        selectedFormat = format;
        console.log(`✅ PASO 2: Formato seleccionado: ${selectedFormat}`);
        break;
      }
    }

    // 🎵 CONFIGURACIÓN OPTIMIZADA POR FORMATO
    let optimizedOptions: MediaRecorderOptions;
    
    if (selectedFormat.includes('wav')) {
      // WAV: Sin compresión, máxima calidad
      optimizedOptions = {
        mimeType: selectedFormat,
        audioBitsPerSecond: 128000, // 128 kbps para calidad óptima
        bitsPerSecond: 128000
      };
      console.log('🎵 PASO 2: Configuración WAV - Máxima calidad sin compresión');
    } else if (selectedFormat.includes('opus')) {
      // OPUS: Codec eficiente, buena calidad con menos bytes
      optimizedOptions = {
        mimeType: selectedFormat,
        audioBitsPerSecond: 64000, // 64 kbps suficiente para OPUS de alta calidad
        bitsPerSecond: 64000
      };
      console.log('🎵 PASO 2: Configuración OPUS - Calidad eficiente');
    } else if (selectedFormat.includes('mp4')) {
      // MP4: Compatibilidad amplia
      optimizedOptions = {
        mimeType: selectedFormat,
        audioBitsPerSecond: 96000, // 96 kbps para MP4
        bitsPerSecond: 96000
      };
      console.log('🎵 PASO 2: Configuración MP4 - Compatibilidad amplia');
    } else {
      // WebM genérico u otros: Configuración conservadora
      optimizedOptions = {
        mimeType: selectedFormat,
        audioBitsPerSecond: 80000, // 80 kbps como compromiso
        bitsPerSecond: 80000
      };
      console.log('🎵 PASO 2: Configuración genérica - Compromiso calidad/tamaño');
    }

    try {
      this.mediaRecorder = new MediaRecorder(this.stream, optimizedOptions);
      console.log('✅ PASO 2: MediaRecorder configurado con opciones optimizadas:', optimizedOptions);
    } catch (error) {
      console.warn('⚠️ PASO 2: Fallback a configuración básica:', error);
      // Fallback simple sin opciones avanzadas
      this.mediaRecorder = new MediaRecorder(this.stream);
    }

    // Configurar eventos
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0 && this.isRecording) {
        this.audioChunks.push(event.data);
        console.log(`📦 Chunk recibido: ${event.data.size} bytes (total: ${this.audioChunks.length} chunks, procesados: ${this.processedChunkCount})`);
        
        // 🔍 DEBUG: Mostrar información del blob crudo mejorada
        console.log(`🔍 BLOB DEBUG:`, {
          size: event.data.size,
          type: event.data.type,
          chunkIndex: this.audioChunks.length - 1,
          totalChunks: this.audioChunks.length,
          processedChunks: this.processedChunkCount,
          // 🔧 PASO 2: Métricas de calidad añadidas
          bytesPerSecond: event.data.size, // Chunk de ~1 segundo
          qualityIndicator: event.data.size > 8000 ? 'GOOD' : event.data.size > 4000 ? 'FAIR' : 'POOR'
        });
      }
    };

    this.mediaRecorder.onstop = async () => {
      console.log('🛑 Grabación detenida, procesando transcripción final...');
      // La transcripción final se maneja en processFinalTranscription()
    };

    this.mediaRecorder.onerror = (event) => {
      console.error('❌ Error en MediaRecorder:', event);
      if (this.transcriptionCallback) {
        this.transcriptionCallback('Error en la grabación de audio', true);
      }
    };

    // OPTIMIZADO: Iniciar grabación con chunks más pequeños para tiempo real
    this.mediaRecorder.start(1000); // Chunks cada 1 segundo para mejor tiempo real
  }

  // MÉTODOS DE COMPATIBILIDAD (para no romper código existente)
  async startRecording(callback: (text: string, isFinal: boolean) => void): Promise<void> {
    return this.iniciarGrabacion(callback);
  }

  stopRecording(): void {
    return this.detenerGrabacion();
  }

  /**
   * NUEVO: Iniciar transcripción en tiempo real
   */
  private startRealtimeTranscription(): void {
    console.log('⏱️ Iniciando transcripción en tiempo real (chunks cada 3 segundos)');
    
    this.realtimeTimer = setInterval(() => {
      this.processRealtimeChunk();
    }, 3000); // Procesar cada 3 segundos
  }

  /**
   * NUEVO: Procesar chunk en tiempo real - CORREGIDO
   */
  private async processRealtimeChunk(): Promise<void> {
    if (!this.isRecording || this.isProcessingChunk || this.audioChunks.length === 0) {
      return;
    }

    // Verificar si hay chunks nuevos para procesar
    if (this.processedChunkCount >= this.audioChunks.length) {
      console.log(`⏳ No hay chunks nuevos para procesar (procesados: ${this.processedChunkCount}, disponibles: ${this.audioChunks.length})`);
      return;
    }

    this.isProcessingChunk = true;
    this.chunkCounter++;
    
    console.log(`🔄 Procesando chunk #${this.chunkCounter} en tiempo real...`);

    try {
      // 🔧 CORRECCIÓN: Procesar solo los chunks NUEVOS desde la última procesamiento
      const newChunks = this.audioChunks.slice(this.processedChunkCount);
      
      if (newChunks.length === 0) {
        console.log(`⏳ No hay chunks nuevos para procesar`);
        this.isProcessingChunk = false;
        return;
      }

      // Crear blob SOLO con los chunks nuevos
      const mimeType = newChunks[0].type || 'audio/webm';
      const audioBlob = new Blob(newChunks, { type: mimeType });
      
      console.log(`📦 Procesando ${newChunks.length} chunk(s) nuevos: ${audioBlob.size} bytes`);
      
      // Validar tamaño mínimo
      if (audioBlob.size < 1024) {
        console.log(`⏳ Chunk #${this.chunkCounter} muy pequeño (${audioBlob.size} bytes), esperando más audio...`);
        this.isProcessingChunk = false;
        return;
      }

      // Procesar transcripción
      const transcriptionResult = await this.processAudioChunk(audioBlob, false);
      
      if (transcriptionResult && transcriptionResult.trim()) {
        // Acumular transcripción
        this.accumulatedTranscription += transcriptionResult + ' ';
        
        // Enviar transcripción parcial
        if (this.transcriptionCallback) {
          this.transcriptionCallback(this.accumulatedTranscription.trim(), false);
        }
        
        console.log(`✅ Chunk #${this.chunkCounter} procesado: "${transcriptionResult.substring(0, 50)}${transcriptionResult.length > 50 ? '...' : ''}"`);
      }

      // 🔧 CORRECCIÓN: Actualizar contador de chunks procesados
      this.processedChunkCount = this.audioChunks.length;

    } catch (error) {
      console.error(`❌ Error procesando chunk #${this.chunkCounter}:`, error);
    } finally {
      this.isProcessingChunk = false;
    }
  }

  /**
   * NUEVO: Detener transcripción en tiempo real
   */
  private stopRealtimeTranscription(): void {
    if (this.realtimeTimer) {
      clearInterval(this.realtimeTimer);
      this.realtimeTimer = null;
      console.log('⏹️ Transcripción en tiempo real detenida');
    }
  }

  /**
   * NUEVO: Procesar chunk de audio individual
   */
  private async processAudioChunk(audioBlob: Blob, isFinal: boolean): Promise<string | null> {
    try {
      // Convertir blob a Base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < uint8Array.length; i++) {
        binary += String.fromCharCode(uint8Array[i]);
      }
      const base64Audio = btoa(binary);
      
      // Crear payload
      const payload = {
        audioData: base64Audio,
        mimeType: audioBlob.type || 'audio/webm',
        size: audioBlob.size,
        timestamp: Date.now(),
        isRealtime: !isFinal,
        chunkNumber: this.chunkCounter
      };
      
      // Enviar a Google Cloud
      const response = await fetch(this.getTranscribeUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        console.error(`❌ Error del servidor: ${response.status}`);
        return null;
      }

      const result = await response.json();
      
      if (result.success && result.transcription) {
        return result.transcription;
      }
      
      return null;

    } catch (error) {
      console.error('❌ Error procesando chunk:', error);
      return null;
    }
  }

  /**
   * NUEVO: Procesar transcripción final
   */
  private async processFinalTranscription(): Promise<void> {
    if (this.audioChunks.length === 0) {
      console.log('✅ Transcripción final: usando transcripción acumulada');
      if (this.transcriptionCallback && this.accumulatedTranscription) {
        this.transcriptionCallback(this.accumulatedTranscription.trim(), true);
      }
      return;
    }

    console.log('🔄 Procesando transcripción final completa...');
    
    try {
      // Crear blob final con todos los chunks
      const mimeType = this.audioChunks[0].type || 'audio/webm';
      const finalBlob = new Blob(this.audioChunks, { type: mimeType });
      
      // 🔍 PASO 1: DIAGNÓSTICO DE CALIDAD DEL AUDIO
      // Calcular duración estimada basada en el número de chunks (cada chunk es ~1 segundo)
      const estimatedDurationSeconds = this.audioChunks.length;
      const actualBlobSizeBytes = finalBlob.size;
      const averageBytesPerSecond = actualBlobSizeBytes / estimatedDurationSeconds;
      
      console.log('🎵 DIAGNÓSTICO CALIDAD AUDIO - Blob Final:', {
        totalChunks: this.audioChunks.length,
        estimatedDurationSeconds: estimatedDurationSeconds,
        actualBlobSizeBytes: actualBlobSizeBytes,
        averageBytesPerSecond: Math.round(averageBytesPerSecond),
        mimeType: mimeType,
        expectedBytesPerSecond: mimeType.includes('webm') ? 8000 : 16000, // Estimación típica
        qualityRatio: Math.round((averageBytesPerSecond / 8000) * 100) / 100,
        timestamp: new Date().toISOString()
      });
      
      // Validación de calidad básica
      if (actualBlobSizeBytes < 1024) {
        console.warn('⚠️ DIAGNÓSTICO: Blob muy pequeño, posible audio de baja calidad');
      }
      
      if (averageBytesPerSecond < 4000) {
        console.warn('⚠️ DIAGNÓSTICO: Tasa de bytes baja, posible audio comprimido o con ruido');
      }
      
      // Procesar transcripción final
      const finalTranscription = await this.processAudioChunk(finalBlob, true);
      
      if (finalTranscription && this.transcriptionCallback) {
        // Combinar transcripción en tiempo real con final
        const combinedTranscription = this.accumulatedTranscription + ' ' + finalTranscription;
        this.transcriptionCallback(combinedTranscription.trim(), true);
        
        console.log('✅ Transcripción final completada');
      } else if (this.transcriptionCallback && this.accumulatedTranscription) {
        // Usar solo transcripción acumulada si no hay final
        this.transcriptionCallback(this.accumulatedTranscription.trim(), true);
      }
      
    } catch (error) {
      console.error('❌ Error en transcripción final:', error);
      if (this.transcriptionCallback && this.accumulatedTranscription) {
        this.transcriptionCallback(this.accumulatedTranscription.trim(), true);
      }
    }
  }
} 