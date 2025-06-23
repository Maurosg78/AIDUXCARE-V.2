/**
 * Tipos para manejo de audio y transcripción
 */

export interface TranscriptionResult {
  id: string;
  text: string;
  confidence: number;
  timestamp: string;
  duration?: number;
  language?: string;
}

export interface AudioProcessingResult {
  transcription: TranscriptionResult;
  processingTime: number;
  success: boolean;
  error?: string;
}

export interface AudioConfig {
  sampleRate: number;
  channels: number;
  bitDepth: number;
}

export interface SpeakerSegment {
  speaker: string;
  startTime: number;
  endTime: number;
  text: string;
} 