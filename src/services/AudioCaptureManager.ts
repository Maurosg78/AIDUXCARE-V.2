// AudioCaptureManager.ts - Manager híbrido para audio + semantic chunking
import { SemanticChunkingService, MedicalPhase } from './SemanticChunkingService';
import { RealTimeClinicalAnalysis } from './RealTimeClinicalAnalysis';
import { audioCaptureService, TranscriptionSegment } from '../core/audio/AudioCaptureService';

export interface AudioManagerConfig {
  enableSemanticChunking: boolean;
  enableRealTimeAnalysis: boolean;
  chunkingConfig?: {
    minChunkDuration: number;
    maxChunkDuration: number;
  };
}

export class AudioCaptureManager {
  private semanticChunker: SemanticChunkingService;
  private clinicalAnalyzer: RealTimeClinicalAnalysis;
  private isRecording: boolean = false;
  private currentPhase: MedicalPhase = 'anamnesis';
  private config: AudioManagerConfig;
  private recognition: any = null;
  private transcriptionBuffer: string = '';

  constructor(config: AudioManagerConfig = {
    enableSemanticChunking: true,
    enableRealTimeAnalysis: true
  }) {
    this.config = config;
    this.semanticChunker = new SemanticChunkingService(config.chunkingConfig);
    this.clinicalAnalyzer = new RealTimeClinicalAnalysis();
    
    this.setupSpeechRecognition();
    this.setupEventListeners();
  }

  private setupSpeechRecognition(): void {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('⚠️ Speech Recognition no disponible en este navegador');
      return;
    }

    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    this.recognition = new SpeechRecognition();
    
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'es-ES';
    
    this.recognition.onresult = this.handleTranscriptionResult.bind(this);
    this.recognition.onerror = this.handleRecognitionError.bind(this);
    this.recognition.onend = this.handleRecognitionEnd.bind(this);
  }

  private setupEventListeners(): void {
    // Escuchar cambios de fase médica
    window.addEventListener('medicalPhaseChange', ((event: CustomEvent) => {
      this.currentPhase = event.detail.phase;
    }) as EventListener);

    // Escuchar chunks completados para análisis
    window.addEventListener('chunkCompleted', this.handleChunkCompleted.bind(this) as EventListener);
  }

  private handleTranscriptionResult(event: any): void {
    let finalTranscript = '';
    let interimTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      
      if (event.results[i].isFinal) {
        finalTranscript += transcript;
      } else {
        interimTranscript += transcript;
      }
    }

    // Procesar transcripción final con semantic chunking
    if (finalTranscript && this.config.enableSemanticChunking) {
      this.processTranscriptionSegment(finalTranscript);
    }

    // Emitir transcripción en tiempo real
    this.emitLiveTranscription(finalTranscript, interimTranscript);
  }

  private processTranscriptionSegment(transcription: string): void {
    const chunk = this.semanticChunker.processTranscriptionSegment(
      transcription,
      undefined, // audioBlob - podríamos capturar esto si es necesario
      this.currentPhase
    );

    if (chunk) {
      console.log('🧩 Chunk semántico completado:', chunk.id);
      
      // El análisis clínico se activa automáticamente via eventos
      if (this.config.enableRealTimeAnalysis) {
        // El RealTimeClinicalAnalysis ya está escuchando el evento 'chunkCompleted'
      }
    }
  }

  private handleChunkCompleted(event: any): void {
    const { chunk, confidence } = event.detail;
    
    // Emitir evento para que la UI se actualice
    window.dispatchEvent(new CustomEvent('semanticChunkAnalyzed', {
      detail: { 
        chunkId: chunk.id, 
        confidence,
        phase: this.currentPhase,
        timestamp: Date.now()
      }
    }));
  }

  private emitLiveTranscription(finalText: string, interimText: string): void {
    // Actualizar el buffer de transcripción
    if (finalText) {
      this.transcriptionBuffer += finalText + ' ';
    }

    // Emitir para actualización en vivo de la UI
    window.dispatchEvent(new CustomEvent('liveTranscription', {
      detail: {
        finalText: this.transcriptionBuffer,
        interimText,
        timestamp: Date.now(),
        phase: this.currentPhase
      }
    }));

    // Actualizar el elemento de transcripción si existe
    const transcriptionElement = document.getElementById('live-transcription-content');
    if (transcriptionElement) {
      const displayText = this.transcriptionBuffer + 
        (interimText ? `<span class="text-gray-400 italic">${interimText}</span>` : '');
      transcriptionElement.innerHTML = displayText || 
        '<p class="text-gray-500 italic">Transcribiendo audio en tiempo real...</p>';
    }
  }

  private handleRecognitionError(event: any): void {
    console.error('❌ Error en reconocimiento de voz:', event.error);
    
    window.dispatchEvent(new CustomEvent('transcriptionError', {
      detail: { error: event.error, message: event.message }
    }));
  }

  private handleRecognitionEnd(): void {
    console.log('🎤 Reconocimiento de voz terminado');
    
    if (this.isRecording) {
      // Reiniciar automáticamente si seguimos grabando
      setTimeout(() => {
        if (this.isRecording && this.recognition) {
          this.recognition.start();
        }
      }, 100);
    }
  }

  // Métodos públicos
  public async startRecording(): Promise<void> {
    if (this.isRecording) {
      console.warn('⚠️ Ya está grabando');
      return;
    }

    try {
      this.isRecording = true;
      this.transcriptionBuffer = '';
      
      // Iniciar captura de audio tradicional
      audioCaptureService.startCapture();
      
      // Iniciar reconocimiento de voz
      if (this.recognition) {
        this.recognition.start();
      }

      // Reiniciar servicios
      this.semanticChunker.reset();
      this.clinicalAnalyzer.reset();

      console.log('🎤 Grabación iniciada con semantic chunking');
      
      window.dispatchEvent(new CustomEvent('recordingStarted', {
        detail: { phase: this.currentPhase, timestamp: Date.now() }
      }));

    } catch (error) {
      console.error('❌ Error al iniciar grabación:', error);
      this.isRecording = false;
      throw error;
    }
  }

  public stopRecording(): TranscriptionSegment[] {
    if (!this.isRecording) {
      console.warn('⚠️ No hay grabación activa');
      return [];
    }

    try {
      this.isRecording = false;
      
      // Detener reconocimiento de voz
      if (this.recognition) {
        this.recognition.stop();
      }

      // Finalizar chunk activo si existe
      const finalChunk = this.semanticChunker.forceFinalize();
      if (finalChunk) {
        console.log('🏁 Chunk final forzado:', finalChunk.id);
      }

      // Detener captura tradicional
      const segments = audioCaptureService.stopCapture();

      console.log('⏹️ Grabación detenida');
      
      window.dispatchEvent(new CustomEvent('recordingStopped', {
        detail: { 
          phase: this.currentPhase, 
          timestamp: Date.now(),
          totalTranscription: this.transcriptionBuffer
        }
      }));

      return segments;

    } catch (error) {
      console.error('❌ Error al detener grabación:', error);
      this.isRecording = false;
      return [];
    }
  }

  public changePhase(newPhase: MedicalPhase): void {
    const oldPhase = this.currentPhase;
    this.currentPhase = newPhase;

    console.log(`🔄 Fase médica cambiada: ${oldPhase} → ${newPhase}`);
    
    window.dispatchEvent(new CustomEvent('medicalPhaseChange', {
      detail: { 
        oldPhase, 
        newPhase, 
        timestamp: Date.now() 
      }
    }));
  }

  public isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  public getCurrentTranscription(): string {
    return this.transcriptionBuffer;
  }

  public getSemanticChunkStatus(): any {
    return this.semanticChunker.getCurrentChunkStatus();
  }

  public getClinicalAnalysisStatus(): any {
    return this.clinicalAnalyzer.getProcessingStatus();
  }

  public updateConfig(newConfig: Partial<AudioManagerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (newConfig.chunkingConfig) {
      this.semanticChunker.updateConfig(newConfig.chunkingConfig);
    }
  }

  public reset(): void {
    if (this.isRecording) {
      this.stopRecording();
    }
    
    this.transcriptionBuffer = '';
    this.semanticChunker.reset();
    this.clinicalAnalyzer.reset();
    this.currentPhase = 'anamnesis';
  }
}

// Exportar instancia singleton
export const audioManager = new AudioCaptureManager();