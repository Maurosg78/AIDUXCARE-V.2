/**
 * AudioPipelineService - Servicio único de audio para AiDuxCare V.2
 * Pipeline completo: Grabación → Web Speech API → Transcripción
 * CORREGIDO: Eliminado Google Cloud, usando solo Web Speech API
 */

// Declaración para compatibilidad con navegadores
declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
    SpeechRecognition?: {
      new (): SpeechRecognition;
    };
    webkitSpeechRecognition?: {
      new (): SpeechRecognition;
    };
  }
}

// Tipos para Web Speech API
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  
  start(): void;
  stop(): void;
  abort(): void;
  
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
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
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

export default class AudioPipelineService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private isRecording: boolean = false;
  private transcriptionCallback: ((text: string, isFinal: boolean) => void) | null = null;
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  
  // ✅ WEB SPEECH API REAL
  private recognition: SpeechRecognition | null = null;
  private isTranscriptionActive: boolean = false;
  private accumulatedTranscription: string = '';
  private lastInterimResult: string = '';
  
  // ANTIGUOS: Variables para Google Cloud (ya no usadas)
  private realtimeTimer: NodeJS.Timeout | null = null;
  private chunkCounter: number = 0;
  private isProcessingChunk: boolean = false;
  private processedChunkCount: number = 0;
  
  constructor() {
    console.log('🎙️ AudioPipelineService inicializado - Web Speech API + MediaRecorder');
    this.initializeSpeechRecognition();
  }

  /**
   * Verificar si el servicio está soportado
   */
  isServiceSupported(): boolean {
    const hasMediaDevices = !!(
      navigator.mediaDevices && 
      'getUserMedia' in navigator.mediaDevices && 
      typeof MediaRecorder !== 'undefined'
    );
    
    const hasSpeechRecognition = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    
    return hasMediaDevices && hasSpeechRecognition;
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
      
      // ✅ RESETEAR VARIABLES WEB SPEECH API
      this.accumulatedTranscription = '';
      this.lastInterimResult = '';
      this.isTranscriptionActive = false;
      
      // Configurar MediaRecorder para captura de audio
      this.configureMediaRecorder();
      
      this.isRecording = true;
      
      console.log('🎙️ Pipeline de grabación activo');
      
      // ✅ INICIAR WEB SPEECH API PARA TRANSCRIPCIÓN
      this.startWebSpeechTranscription();
      
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
    
    // ✅ DETENER WEB SPEECH API
    this.stopWebSpeechTranscription();
    
    this.isRecording = false;
    
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    // ✅ ENVIAR TRANSCRIPCIÓN FINAL DE WEB SPEECH API
    setTimeout(() => {
      this.processFinalWebSpeechTranscription();
    }, 1000);
  }

  /**
   * Obtener información del servicio
   */
  getServiceInfo(): string {
    const mediaSupport = !!(navigator.mediaDevices && 'getUserMedia' in navigator.mediaDevices);
    const speechSupport = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    
    return `AudioPipelineService: MediaRecorder ${mediaSupport ? '✅' : '❌'}, Web Speech API ${speechSupport ? '✅' : '❌'}`;
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
    
    // ✅ LIMPIAR WEB SPEECH API
    this.stopWebSpeechTranscription();
    this.accumulatedTranscription = '';
    this.lastInterimResult = '';
    this.isTranscriptionActive = false;
    
    // Limpiar recursos de audio
    this.audioChunks = [];
    this.transcriptionCallback = null;
    this.mediaRecorder = null;
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    console.log('🧹 Pipeline de audio limpiado (Web Speech API + MediaRecorder)');
  }

  /**
   * SIMPLIFICADO: Configurar MediaRecorder solo para captura de audio
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
        break;
      }
    }

    console.log(`✅ PASO 2: Formato seleccionado: ${selectedFormat}`);

    // Configuración específica por formato
    let optimizedOptions: MediaRecorderOptions;
    
    if (selectedFormat.includes('wav')) {
      console.log('🎵 PASO 2: Configuración WAV - Calidad máxima');
      optimizedOptions = {
        mimeType: selectedFormat,
        audioBitsPerSecond: 128000 // Alta calidad sin compresión
      };
    } else if (selectedFormat.includes('opus')) {
      console.log('🎵 PASO 2: Configuración OPUS - Calidad eficiente');
      optimizedOptions = {
        mimeType: selectedFormat,
        audioBitsPerSecond: 64000 // Calidad eficiente
      };
    } else if (selectedFormat.includes('mp4')) {
      console.log('🎵 PASO 2: Configuración MP4 - Compatibilidad amplia');
      optimizedOptions = {
        mimeType: selectedFormat,
        audioBitsPerSecond: 96000 // Balance calidad/compatibilidad
      };
    } else {
      console.log('🎵 PASO 2: Configuración WebM - Fallback básico');
      optimizedOptions = {
        mimeType: selectedFormat
      };
    }

    try {
      this.mediaRecorder = new MediaRecorder(this.stream, optimizedOptions);
      console.log('✅ PASO 2: MediaRecorder configurado con opciones optimizadas:', optimizedOptions);
    } catch (error) {
      console.warn('⚠️ PASO 2: Fallback a configuración básica:', error);
      // Fallback simple sin opciones avanzadas
      this.mediaRecorder = new MediaRecorder(this.stream);
    }

    // Configurar eventos solo para diagnóstico
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0 && this.isRecording) {
        this.audioChunks.push(event.data);
        console.log(`📦 Chunk recibido: ${event.data.size} bytes (total: ${this.audioChunks.length} chunks)`);
        
        // 🔍 DEBUG: Mostrar información del blob crudo mejorada
        console.log(`🔍 BLOB DEBUG:`, {
          size: event.data.size,
          type: event.data.type,
          chunkIndex: this.audioChunks.length - 1,
          totalChunks: this.audioChunks.length,
          // 🔧 PASO 2: Métricas de calidad añadidas
          bytesPerSecond: event.data.size, // Chunk de ~1 segundo
          qualityIndicator: event.data.size > 8000 ? 'GOOD' : event.data.size > 4000 ? 'FAIR' : 'POOR'
        });
      }
    };

    this.mediaRecorder.onstop = async () => {
      console.log('🛑 Grabación detenida, audio capturado para diagnóstico');
      // Audio solo para diagnóstico, transcripción viene de Web Speech API
    };

    this.mediaRecorder.onerror = (event) => {
      console.error('❌ Error en MediaRecorder:', event);
    };

    // Iniciar grabación con chunks cada 1 segundo
    this.mediaRecorder.start(1000);
  }

  // MÉTODOS DE COMPATIBILIDAD (para no romper código existente)
  async startRecording(callback: (text: string, isFinal: boolean) => void): Promise<void> {
    return this.iniciarGrabacion(callback);
  }

  stopRecording(): void {
    return this.detenerGrabacion();
  }

  // ✅ WEB SPEECH API REAL
  private initializeSpeechRecognition(): void {
    console.log('🎤 Iniciando Web Speech API...');
    
    // Detectar soporte de Web Speech API
    const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognitionConstructor) {
      console.warn('⚠️ Web Speech API no soportado en este navegador');
      return;
    }
    
    try {
      this.recognition = new SpeechRecognitionConstructor();
      
      // Configuración optimizada para consulta médica
      this.recognition.continuous = true; // CRÍTICO: Continua para grabaciones largas
      this.recognition.interimResults = true; // Para transcripción en tiempo real
      this.recognition.lang = 'es-ES'; // Español para términos médicos
      this.recognition.maxAlternatives = 1;
      
      // Eventos de control
      this.recognition.onstart = () => {
        console.log('✅ Web Speech API iniciado - Transcripción activa');
        this.isTranscriptionActive = true;
      };
      
      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimText = '';
        let finalText = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalText += result[0].transcript;
          } else {
            interimText += result[0].transcript;
          }
        }
        
        if (interimText.trim()) {
          this.lastInterimResult = interimText.trim();
          console.log(`🎤 Interim: "${this.lastInterimResult}"`);
        }
        
        if (finalText.trim()) {
          this.accumulatedTranscription += finalText.trim() + ' ';
          console.log(`✅ Final: "${finalText.trim()}"`);
        }
        
        // Enviar transcripción actualizada al callback
        if (this.transcriptionCallback) {
          const currentTranscription = this.accumulatedTranscription + interimText;
          this.transcriptionCallback(currentTranscription.trim(), false);
        }
      };
      
      this.recognition.onend = () => {
        console.log('⏹️ Web Speech API detenido');
        this.isTranscriptionActive = false;
        
        // CRÍTICO: Reiniciar automáticamente si aún estamos grabando
        if (this.isRecording) {
          console.log('🔄 Reiniciando Web Speech API para continuar grabación...');
          setTimeout(() => {
            if (this.recognition && this.isRecording) {
              this.recognition.start();
            }
          }, 100);
        }
      };
      
      this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('❌ Error en Web Speech API:', event.error);
        
        // Manejar errores específicos
        if (event.error === 'no-speech') {
          console.log('⏳ No se detectó habla, continuando...');
        } else if (event.error === 'not-allowed') {
          if (this.transcriptionCallback) {
            this.transcriptionCallback('Error: Permisos de micrófono denegados', true);
          }
        } else if (this.transcriptionCallback) {
          this.transcriptionCallback(`Error de transcripción: ${event.error}`, true);
        }
      };
      
      console.log('✅ Web Speech API configurado correctamente');
      
    } catch (error) {
      console.error('❌ Error inicializando Web Speech API:', error);
    }
  }

  // ✅ NUEVO: Iniciar Web Speech API para transcripción
  private startWebSpeechTranscription(): void {
    if (!this.recognition) {
      console.warn('⚠️ Web Speech API no disponible');
      return;
    }
    
    try {
      console.log('🎤 Iniciando transcripción con Web Speech API...');
      this.recognition.start();
    } catch (error) {
      console.error('❌ Error iniciando Web Speech API:', error);
    }
  }

  // ✅ NUEVO: Detener Web Speech API
  private stopWebSpeechTranscription(): void {
    if (this.recognition && this.isTranscriptionActive) {
      console.log('⏹️ Deteniendo Web Speech API...');
      this.recognition.stop();
    }
  }

  // ✅ NUEVO: Procesar transcripción final de Web Speech API
  private processFinalWebSpeechTranscription(): void {
    if (this.transcriptionCallback && this.accumulatedTranscription.trim()) {
      const finalTranscription = this.accumulatedTranscription.trim();
      console.log(`✅ Transcripción final de Web Speech API: "${finalTranscription.substring(0, 100)}${finalTranscription.length > 100 ? '...' : ''}"`);
      this.transcriptionCallback(finalTranscription, true);
    } else {
      console.warn('⚠️ No hay transcripción disponible de Web Speech API');
      if (this.transcriptionCallback) {
        this.transcriptionCallback('No se pudo obtener transcripción. Verifica tu micrófono e intenta hablar más claramente.', true);
      }
    }
  }
} 