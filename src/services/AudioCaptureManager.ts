import { AudioCaptureServiceReal, AudioCaptureOptions, CaptureSession } from './AudioCaptureServiceReal';
import { SemanticChunkingService, SemanticChunk, ChunkingConfig } from './SemanticChunkingService';
import { TranscriptionSegment } from '../core/audio/AudioCaptureService';

export interface AudioCaptureConfig {
  language?: 'es' | 'en';
  enableSemanticChunking?: boolean;
  chunkingConfig?: Partial<ChunkingConfig>;
  onTranscriptionUpdate?: (segment: TranscriptionSegment) => void;
  onSemanticChunkCompleted?: (chunk: SemanticChunk) => void;
  onError?: (error: string) => void;
  onStatusChange?: (status: string) => void;
}

export interface AudioCaptureCallbacks {
  onTranscriptionUpdate?: (segment: TranscriptionSegment) => void;
  onSemanticChunkCompleted?: (chunk: SemanticChunk) => void;
  onError?: (error: string) => void;
  onStatusChange?: (status: string) => void;
}

// Configuración médica optimizada
const MEDICAL_AUDIO_CONFIG: AudioCaptureConfig = {
  language: 'es',
  enableSemanticChunking: true,
  chunkingConfig: {
    minDuration: 3000, // 3s mínimo para contexto médico
    maxDuration: 8000, // 8s óptimo para Vertex AI Flash
    pauseThreshold: 1500, // 1.5s pausa = boundary semántico
    medicalContextWeight: 0.8, // Prioridad a contexto médico
    completenessThreshold: 0.6 // 60% completeness mínimo
  }
};

/**
 * AudioCaptureManager - Gestor unificado de captura de audio con chunking semántico
 * Integra AudioCaptureServiceReal con SemanticChunkingService para análisis médico optimizado
 */
export class AudioCaptureManager {
  private config: AudioCaptureConfig;
  private callbacks: AudioCaptureCallbacks;
  private audioService: AudioCaptureServiceReal;
  private semanticChunker: SemanticChunkingService;
  private isActive: boolean = false;

  constructor(config: Partial<AudioCaptureConfig> = {}, callbacks: AudioCaptureCallbacks = {}) {
    this.config = { ...MEDICAL_AUDIO_CONFIG, ...config };
    this.callbacks = callbacks;
    
    // Inicializar servicios
    this.audioService = new AudioCaptureServiceReal({
      language: this.config.language,
      onTranscriptionUpdate: this.handleTranscriptionSegment.bind(this),
      onError: this.handleError.bind(this),
      onStatusChange: this.handleStatusChange.bind(this)
    });

    this.semanticChunker = new SemanticChunkingService(this.config.chunkingConfig);

    // Configurar listeners para chunking semántico
    if (this.config.enableSemanticChunking) {
      this.semanticChunker.on('chunkCompleted', (chunk: SemanticChunk) => {
        this.callbacks.onSemanticChunkCompleted?.(chunk);
      });
    }
  }

  /**
   * Iniciar captura de audio con procesamiento semántico
   */
  async startCapture(): Promise<CaptureSession> {
    if (this.isActive) {
      throw new Error('Ya hay una captura activa');
    }

    try {
      // Limpiar chunks anteriores
      this.semanticChunker.clearChunks();

      // Iniciar captura de audio
      const session = await this.audioService.startCapture();
      this.isActive = true;

      console.log('🎯 AudioCaptureManager iniciado con chunking semántico');
      return session;
    } catch (error) {
      this.handleError(error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Detener captura y finalizar chunks pendientes
   */
  async stopCapture(): Promise<{
    transcription: TranscriptionSegment[];
    semanticChunks: SemanticChunk[];
    session: CaptureSession;
  }> {
    if (!this.isActive) {
      throw new Error('No hay captura activa');
    }

    try {
      // Finalizar chunk actual si existe
      const finalChunk = this.semanticChunker.forceFinalizeChunk();
      if (finalChunk) {
        this.callbacks.onSemanticChunkCompleted?.(finalChunk);
      }

      // Detener captura de audio
      const transcription = await this.audioService.stopCapture();
      this.isActive = false;

      // Obtener todos los chunks procesados
      const semanticChunks = this.semanticChunker.getChunks();

      console.log(`🎯 AudioCaptureManager detenido - ${semanticChunks.length} chunks semánticos procesados`);

      return {
        transcription,
        semanticChunks,
        session: this.audioService.getCurrentSession()!
      };
    } catch (error) {
      this.handleError(error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Manejar segmentos de transcripción y procesarlos con chunking semántico
   */
  private handleTranscriptionSegment(segment: TranscriptionSegment): void {
    // Aplicar correcciones médicas si es necesario
    const correctedSegment = this.applyMedicalCorrections(segment);

    // Notificar actualización de transcripción
    this.callbacks.onTranscriptionUpdate?.(correctedSegment);

    // Procesar con chunking semántico si está habilitado
    if (this.config.enableSemanticChunking && this.semanticChunker) {
      // Crear un Blob temporal para el chunk (simulado)
      const audioBlob = new Blob([], { type: 'audio/webm' });
      const timestamp = Date.now();

      const semanticChunk = this.semanticChunker.processTranscriptionSegment(
        correctedSegment.content,
        audioBlob,
        timestamp
      );

      if (semanticChunk) {
        console.log(`🧬 Chunk semántico completado: ${semanticChunk.medicalPhase} - ${semanticChunk.duration}ms`);
      }
    }
  }

  /**
   * Aplicar correcciones médicas a la transcripción
   */
  private applyMedicalCorrections(segment: TranscriptionSegment): TranscriptionSegment {
    let correctedContent = segment.content;

    // Correcciones médicas específicas
    const medicalCorrections: Record<string, string> = {
      'dolor de espalda': 'dolor lumbar',
      'dolor de cuello': 'dolor cervical',
      'dolor de hombro': 'dolor de hombro',
      'dolor de rodilla': 'dolor de rodilla',
      'test de lasegue': 'test de Lasègue',
      'test de lasegue': 'test de Lasègue',
      'contractura muscular': 'contractura',
      'limitación de movimiento': 'limitación de movilidad',
      'rigidez matutina': 'rigidez matutina',
      'dolor irradiado': 'dolor irradiado'
    };

    // Aplicar correcciones
    Object.entries(medicalCorrections).forEach(([incorrect, correct]) => {
      const regex = new RegExp(incorrect, 'gi');
      correctedContent = correctedContent.replace(regex, correct);
    });

    return {
      ...segment,
      content: correctedContent
    };
  }

  /**
   * Manejar errores del sistema
   */
  private handleError(error: string): void {
    console.error('❌ Error en AudioCaptureManager:', error);
    this.callbacks.onError?.(error);
  }

  /**
   * Manejar cambios de estado
   */
  private handleStatusChange(status: string): void {
    console.log(`📊 Estado AudioCaptureManager: ${status}`);
    this.callbacks.onStatusChange?.(status);
  }

  /**
   * Obtener estado actual del sistema
   */
  getStatus(): {
    isActive: boolean;
    audioStatus: string;
    semanticChunks: number;
    currentPhase: string;
    averageChunkDuration: number;
    averageCompleteness: number;
    averageRelevance: number;
  } {
    const semanticStatus = this.semanticChunker.getStatus();
    const audioSession = this.audioService.getCurrentSession();

    return {
      isActive: this.isActive,
      audioStatus: audioSession?.status || 'idle',
      semanticChunks: semanticStatus.totalChunks,
      currentPhase: semanticStatus.currentChunk?.medicalPhase || 'none',
      averageChunkDuration: semanticStatus.averageDuration,
      averageCompleteness: semanticStatus.averageCompleteness,
      averageRelevance: semanticStatus.averageRelevance
    };
  }

  /**
   * Obtener estadísticas de la sesión actual
   */
  getSessionStats(): {
    transcriptionSegments: number;
    semanticChunks: number;
    totalDuration: number;
    averageChunkDuration: number;
    medicalPhases: Record<string, number>;
    soapCategories: Record<string, number>;
  } | null {
    if (!this.isActive) return null;

    const semanticStatus = this.semanticChunker.getStatus();
    const chunks = this.semanticChunker.getChunks();
    const audioSession = this.audioService.getCurrentSession();

    // Contar fases médicas
    const medicalPhases: Record<string, number> = {};
    chunks.forEach(chunk => {
      medicalPhases[chunk.medicalPhase] = (medicalPhases[chunk.medicalPhase] || 0) + 1;
    });

    // Contar categorías SOAP
    const soapCategories: Record<string, number> = {};
    chunks.forEach(chunk => {
      soapCategories[chunk.soapCategory] = (soapCategories[chunk.soapCategory] || 0) + 1;
    });

    return {
      transcriptionSegments: audioSession?.segmentsCount || 0,
      semanticChunks: semanticStatus.totalChunks,
      totalDuration: audioSession?.totalDuration || 0,
      averageChunkDuration: semanticStatus.averageDuration,
      medicalPhases,
      soapCategories
    };
  }

  /**
   * Obtener chunks semánticos procesados
   */
  getSemanticChunks(): SemanticChunk[] {
    return this.semanticChunker.getChunks();
  }

  /**
   * Obtener transcripción completa
   */
  getTranscription(): TranscriptionSegment[] {
    return this.audioService.getCurrentTranscription();
  }

  /**
   * Verificar si el sistema está activo
   */
  isCapturing(): boolean {
    return this.isActive && this.audioService.isActive();
  }

  /**
   * Verificar compatibilidad del navegador
   */
  isSupported(): boolean {
    return this.audioService.isSupported();
  }

  /**
   * Obtener información de compatibilidad
   */
  getBrowserCompatibility(): {
    isSupported: boolean;
    browserName: string;
    recommendedAction: string;
  } {
    return this.audioService.getBrowserCompatibility();
  }

  /**
   * Cambiar idioma de transcripción
   */
  setLanguage(language: 'es' | 'en'): void {
    this.audioService.setLanguage(language);
  }

  /**
   * Limpiar recursos del sistema
   */
  async cleanup(): Promise<void> {
    try {
      if (this.isActive) {
        await this.stopCapture();
      }
      
      await this.audioService.cleanup();
      this.semanticChunker.destroy();
      
      console.log('🧹 AudioCaptureManager limpiado');
    } catch (error) {
      console.error('Error durante limpieza:', error);
    }
  }

  /**
   * Obtener mensaje de estado detallado
   */
  getStatusMessage(): string {
    const status = this.getStatus();
    
    if (!status.isActive) {
      return 'Sistema inactivo';
    }

    return `Capturando - ${status.semanticChunks} chunks, Fase: ${status.currentPhase}, Duración promedio: ${Math.round(status.averageChunkDuration)}ms`;
  }
} 