/**
 * Tipo para el actor en la transcripción
 */
export type TranscriptionActor = 'profesional' | 'paciente' | 'acompañante';

/**
 * Estado de confianza en la transcripción
 */
export type TranscriptionConfidence = 'entendido' | 'poco_claro' | 'no_reconocido';

/**
 * Interfaz para un segmento de transcripción
 */
export interface TranscriptionSegment {
  id: string;
  timestamp: string;
  actor: TranscriptionActor;
  content: string;
  confidence: TranscriptionConfidence;
  approved?: boolean;
  edited?: boolean;
}

/**
 * Servicio para la captura y procesamiento de audio en consultas médicas
 */
export class AudioCaptureService {
  private isCapturing: boolean = false;
  private transcriptionSegments: TranscriptionSegment[] = [];
  private captureStartTime: number | null = null;

  /**
   * Inicia la captura de audio (simulado)
   */
  public startCapture(): void {
    if (this.isCapturing) {
      return;
    }
    
    this.isCapturing = true;
    this.captureStartTime = Date.now();
    this.transcriptionSegments = [];
    
    console.log('AudioCaptureService: Captura de audio iniciada');
  }

  /**
   * Detiene la captura de audio y retorna la transcripción simulada
   */
  public stopCapture(): TranscriptionSegment[] {
    if (!this.isCapturing) {
      return [];
    }
    
    this.isCapturing = false;
    this.captureStartTime = null;
    console.log('AudioCaptureService: Captura de audio detenida');
    
    // Simular una demora para imitar el procesamiento de audio
    // En una implementación real, esto sería asíncrono con una API real
    
    // Devolver los datos de transcripción simulados
    return [...mockTranscriptions];
  }

  /**
   * Obtiene el estado actual de captura
   */
  public isCurrentlyCapturing(): boolean {
    return this.isCapturing;
  }

  /**
   * Genera contenido clínico estructurado a partir de transcripciones aprobadas
   * @param approvedSegments Segmentos de transcripción aprobados
   * @returns Contenido estructurado para EMR
   */
  public generateClinicalContent(approvedSegments: TranscriptionSegment[]): string {
    if (approvedSegments.length === 0) {
      return '';
    }

    const profesionalSegments = approvedSegments.filter(s => s.actor === 'profesional');
    const pacienteSegments = approvedSegments.filter(s => s.actor === 'paciente');
    const acompañanteSegments = approvedSegments.filter(s => s.actor === 'acompañante');

    let content = '🔊 **Resumen de consulta (transcripción asistida)**\n\n';

    if (profesionalSegments.length > 0) {
      content += '**Profesional sanitario:**\n';
      profesionalSegments.forEach(s => {
        content += `- ${s.content}\n`;
      });
      content += '\n';
    }

    if (pacienteSegments.length > 0) {
      content += '**Paciente:**\n';
      pacienteSegments.forEach(s => {
        content += `- ${s.content}\n`;
      });
      content += '\n';
    }

    if (acompañanteSegments.length > 0) {
      content += '**Acompañante:**\n';
      acompañanteSegments.forEach(s => {
        content += `- ${s.content}\n`;
      });
    }

    return content;
  }
}

// Exportar una instancia singleton para uso en toda la aplicación
export const audioCaptureService = new AudioCaptureService(); 