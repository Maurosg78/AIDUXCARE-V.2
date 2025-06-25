import { WebSpeechSTTService, RealtimeTranscriptionOptions } from './WebSpeechSTTService';
import { TranscriptionSegment } from '../core/audio/AudioCaptureService';

export interface AudioCaptureOptions {
  language?: 'es' | 'en';
  onTranscriptionUpdate?: (segment: TranscriptionSegment) => void;
  onError?: (error: string) => void;
  onStatusChange?: (status: CaptureStatus) => void;
}

export type CaptureStatus = 'idle' | 'requesting_permission' | 'recording' | 'stopping' | 'error';

export interface CaptureSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  segmentsCount: number;
  totalDuration?: number;
  language: 'es' | 'en';
  status: CaptureStatus;
}

/**
 * Servicio de captura de audio en tiempo real usando Web Speech API
 * Gestiona la grabación y transcripción simultánea - 100% GRATUITO
 */
export class AudioCaptureServiceReal {
  private sttService: WebSpeechSTTService;
  private segments: TranscriptionSegment[] = [];
  private isCapturing: boolean = false;
  private currentSession: CaptureSession | null = null;
  private options: AudioCaptureOptions;

  constructor(options: AudioCaptureOptions = {}) {
    this.sttService = new WebSpeechSTTService({
      language: options.language || 'es',
      continuous: true,
      interimResults: true,
      maxAlternatives: 1
    });
    
    this.options = {
      language: 'es',
      ...options
    };
  }

  /**
   * Iniciar captura de audio con transcripción en tiempo real
   */
  async startCapture(): Promise<CaptureSession> {
    if (this.isCapturing) {
      throw new Error('Ya hay una captura en curso');
    }

    this.updateStatus('requesting_permission');

    // Verificar soporte del navegador
    if (!this.isSupported()) {
      const error = 'Web Speech API no soportada en este navegador';
      this.updateStatus('error');
      this.options.onError?.(error);
      throw new Error(error);
    }

    try {
      // Crear nueva sesión
      this.currentSession = {
        id: `capture_${Date.now()}`,
        startTime: new Date(),
        segmentsCount: 0,
        language: this.options.language || 'es',
        status: 'recording'
      };

      // Limpiar segmentos anteriores
      this.segments = [];

      // Configurar opciones de transcripción
      const transcriptionOptions: RealtimeTranscriptionOptions = {
        onResult: (segment) => this.handleNewSegment(segment),
        onError: (error) => this.handleError(error),
        onStart: () => {
          console.log('SUCCESS: Captura de audio iniciada');
          this.isCapturing = true;
          this.updateStatus('recording');
        },
        onEnd: () => {
          console.log('STOP: Captura de audio finalizada');
          this.isCapturing = false;
          this.updateStatus('idle');
        },
        onSpeechStart: () => {
          console.log('SPEECH: Habla detectada');
        },
        onSpeechEnd: () => {
          console.log('🔇 Fin de habla');
        }
      };

      // Iniciar transcripción en tiempo real
      await this.sttService.startRealtimeTranscription(transcriptionOptions);

      console.log('LAUNCH: Captura de audio en tiempo real iniciada - COSTO: $0.00');
      
      return this.currentSession;

    } catch (error) {
      this.updateStatus('error');
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      console.error('Error iniciando captura:', errorMsg);
      this.options.onError?.(errorMsg);
      throw error;
    }
  }

  /**
   * Detener captura y obtener transcripción completa
   */
  async stopCapture(): Promise<TranscriptionSegment[]> {
    if (!this.isCapturing || !this.currentSession) {
      console.warn('No hay captura activa');
      return this.segments;
    }

    this.updateStatus('stopping');

    try {
      // Detener servicio STT
      await this.sttService.stopTranscription();

      // Finalizar sesión
      this.currentSession.endTime = new Date();
      this.currentSession.totalDuration = this.currentSession.endTime.getTime() - this.currentSession.startTime.getTime();
      this.currentSession.segmentsCount = this.segments.length;

      console.log('STATS: Sesión de captura finalizada:', {
        id: this.currentSession.id,
        segmentos: this.segments.length,
        duración: `${Math.round(this.currentSession.totalDuration / 1000)}s`,
        costo: '$0.00'
      });

      // Retornar solo segmentos con contenido válido
      const finalSegments = this.segments.filter(segment => 
        segment.content.trim().length > 0 && 
        segment.confidence !== 'no_reconocido'
      );

      this.updateStatus('idle');
      this.emitCaptureCompleteEvent(finalSegments);

      return finalSegments;

    } catch (error) {
      this.updateStatus('error');
      const errorMsg = error instanceof Error ? error.message : 'Error deteniendo captura';
      console.error('Error deteniendo captura:', errorMsg);
      this.options.onError?.(errorMsg);
      throw error;
    }
  }

  /**
   * Manejar nuevo segmento de transcripción
   */
  private handleNewSegment(segment: TranscriptionSegment): void {
    // Actualizar o agregar segmento
    const existingIndex = this.segments.findIndex(s => s.id.startsWith(segment.id.split('_')[0]));
    
    if (existingIndex !== -1) {
      // Actualizar segmento existente (para interim results)
      this.segments[existingIndex] = segment;
    } else {
      // Agregar nuevo segmento
      this.segments.push(segment);
    }

    // Actualizar contador en sesión
    if (this.currentSession) {
      this.currentSession.segmentsCount = this.segments.length;
    }

    // Notificar a la UI
    this.options.onTranscriptionUpdate?.(segment);
    
    // Emitir evento global para componentes que lo necesiten
    this.emitTranscriptionUpdateEvent(segment);

    console.log(`📝 Segmento ${segment.confidence === 'entendido' ? 'final' : 'temporal'}:`, {
      actor: segment.actor,
      contenido: segment.content.substring(0, 50) + (segment.content.length > 50 ? '...' : ''),
      confianza: segment.confidence
    });
  }

  /**
   * Manejar errores de transcripción
   */
  private handleError(error: string): void {
    console.error('ERROR: Error en transcripción:', error);
    this.updateStatus('error');
    this.options.onError?.(error);
  }

  /**
   * Actualizar estado de captura
   */
  private updateStatus(status: CaptureStatus): void {
    if (this.currentSession) {
      this.currentSession.status = status;
    }
    this.options.onStatusChange?.(status);
  }

  /**
   * Emitir evento de actualización de transcripción
   */
  private emitTranscriptionUpdateEvent(segment: TranscriptionSegment): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('transcription-update', {
        detail: { 
          segment, 
          allSegments: this.segments,
          sessionId: this.currentSession?.id
        }
      }));
    }
  }

  /**
   * Emitir evento de captura completada
   */
  private emitCaptureCompleteEvent(segments: TranscriptionSegment[]): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('capture-complete', {
        detail: { 
          segments,
          session: this.currentSession
        }
      }));
    }
  }

  /**
   * Obtener transcripción actual (en tiempo real)
   */
  getCurrentTranscription(): TranscriptionSegment[] {
    return [...this.segments];
  }

  /**
   * Obtener estado actual
   */
  getCurrentSession(): CaptureSession | null {
    return this.currentSession ? { ...this.currentSession } : null;
  }

  /**
   * Verificar si hay captura activa
   */
  isActive(): boolean {
    return this.isCapturing;
  }

  /**
   * Verificar soporte del navegador
   */
  isSupported(): boolean {
    return WebSpeechSTTService.isSupported();
  }

  /**
   * Obtener información de compatibilidad
   */
  getBrowserCompatibility(): {
    isSupported: boolean;
    browserName: string;
    recommendedAction: string;
  } {
    return WebSpeechSTTService.getBrowserCompatibility();
  }

  /**
   * Cambiar idioma dinámicamente
   */
  setLanguage(language: 'es' | 'en'): void {
    this.options.language = language;
    this.sttService.setLanguage(language);
    console.log(`🌐 Idioma de captura cambiado a: ${language}`);
  }

  /**
   * Obtener estadísticas de la sesión actual
   */
  getSessionStats(): {
    segmentsCount: number;
    duration: number;
    wordsTranscribed: number;
    averageConfidence: number;
    cost: number;
  } | null {
    if (!this.currentSession) return null;

    const duration = this.currentSession.endTime 
      ? this.currentSession.endTime.getTime() - this.currentSession.startTime.getTime()
      : Date.now() - this.currentSession.startTime.getTime();

    const wordsTranscribed = this.segments.reduce((total, segment) => 
      total + segment.content.split(' ').length, 0
    );

    const averageConfidence = this.segments.length > 0 
      ? this.segments.reduce((sum, segment) => {
          const confidenceValue = segment.confidence === 'entendido' ? 1 : 
                                  segment.confidence === 'poco_claro' ? 0.6 : 0.3;
          return sum + confidenceValue;
        }, 0) / this.segments.length
      : 0;

    return {
      segmentsCount: this.segments.length,
      duration: Math.round(duration / 1000), // en segundos
      wordsTranscribed,
      averageConfidence: Math.round(averageConfidence * 100) / 100,
      cost: 0 // ¡GRATIS!
    };
  }

  /**
   * Limpiar recursos y detener captura si está activa
   */
  async cleanup(): Promise<void> {
    if (this.isCapturing) {
      await this.stopCapture();
    }
    
    this.segments = [];
    this.currentSession = null;
    console.log('🧹 Recursos de captura limpiados');
  }

  /**
   * Crear mensaje de estado para la UI
   */
  getStatusMessage(): string {
    if (!this.currentSession) {
      return 'Listo para capturar audio';
    }

    switch (this.currentSession.status) {
      case 'requesting_permission':
        return 'Solicitando permisos de micrófono...';
      case 'recording': {
        const duration = Math.round((Date.now() - this.currentSession.startTime.getTime()) / 1000);
        return `Grabando... ${duration}s (${this.segments.length} segmentos)`;
      }
      case 'stopping':
        return 'Finalizando captura...';
      case 'error':
        return 'Error en la captura';
      default:
        return 'Estado desconocido';
    }
  }
} 