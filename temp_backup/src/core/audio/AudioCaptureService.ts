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
 * Simula una transcripción completa de una consulta médica
 */
const mockTranscriptions: TranscriptionSegment[] = [
  {
    id: 'ts-001',
    timestamp: new Date().toISOString(),
    actor: 'profesional',
    content: 'Buenos días, ¿cómo se ha sentido desde la última consulta?',
    confidence: 'entendido'
  },
  {
    id: 'ts-002',
    timestamp: new Date().toISOString(),
    actor: 'paciente',
    content: 'La presión arterial ha estado más controlada pero sigo con dolor en las articulaciones, sobre todo por las mañanas.',
    confidence: 'entendido'
  },
  {
    id: 'ts-003',
    timestamp: new Date().toISOString(),
    actor: 'profesional',
    content: 'Vamos a revisar su medicación actual. ¿Está tomando los antihipertensivos según lo prescrito?',
    confidence: 'entendido'
  },
  {
    id: 'ts-004',
    timestamp: new Date().toISOString(),
    actor: 'paciente',
    content: 'Sí, todos los días. El enalapril por la mañana y el amlodipino por la noche.',
    confidence: 'entendido'
  },
  {
    id: 'ts-005',
    timestamp: new Date().toISOString(),
    actor: 'acompañante',
    content: 'A veces se le olvida tomar la dosis de la noche, especialmente cuando está cansado.',
    confidence: 'entendido'
  },
  {
    id: 'ts-006',
    timestamp: new Date().toISOString(),
    actor: 'paciente',
    content: 'También he notado cierta hinchazón en los tobillos, sobre todo al final del día.',
    confidence: 'entendido'
  },
  {
    id: 'ts-007',
    timestamp: new Date().toISOString(),
    actor: 'profesional',
    content: 'Vamos a examinar esos edemas. ¿Ha modificado su dieta o ingesta de sal?',
    confidence: 'entendido'
  },
  {
    id: 'ts-008',
    timestamp: new Date().toISOString(),
    actor: 'paciente',
    content: 'He intentado reducir la sal, pero es difícil en las comidas fuera de casa.',
    confidence: 'entendido'
  },
  {
    id: 'ts-009',
    timestamp: new Date().toISOString(),
    actor: 'profesional',
    content: 'Considerando sus síntomas, vamos a ajustar la dosis del amlodipino y añadir un diurético suave.',
    confidence: 'entendido'
  },
  {
    id: 'ts-010',
    timestamp: new Date().toISOString(),
    actor: 'paciente',
    content: 'Tengo algunas dudas sobre los efectos secundarios de los diuréticos.',
    confidence: 'poco_claro'
  },
  {
    id: 'ts-011',
    timestamp: new Date().toISOString(),
    actor: 'profesional',
    content: 'El principal efecto es que aumentará la frecuencia de micción. También debe vigilar su nivel de potasio.',
    confidence: 'entendido'
  },
  {
    id: 'ts-012',
    timestamp: new Date().toISOString(),
    actor: 'paciente',
    content: 'Mmm entiendo. ¿Y respecto al dolor en las articulaciones?',
    confidence: 'entendido'
  },
  {
    id: 'ts-013',
    timestamp: new Date().toISOString(),
    actor: 'profesional',
    content: 'Vamos a solicitar pruebas complementarias para evaluar ese dolor articular y descartar problemas reumatológicos.',
    confidence: 'entendido'
  },
  {
    id: 'ts-014',
    timestamp: new Date().toISOString(),
    actor: 'acompañante',
    content: 'Últimamente también ha comentado que le cuesta dormir por las molestias.',
    confidence: 'poco_claro'
  },
  {
    id: 'ts-015',
    timestamp: new Date().toISOString(),
    actor: 'paciente',
    content: '(inaudible) insomnio y cansancio durante el día.',
    confidence: 'no_reconocido'
  }
];

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