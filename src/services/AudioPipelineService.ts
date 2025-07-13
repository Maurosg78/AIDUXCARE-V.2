/**
 * AudioPipelineService - Servicio único de audio para AiDuxCare V.2
 * Pipeline profesional: MediaRecorder → Google Cloud Speech-to-Text → Análisis Clínico
 */

import { GoogleCloudAudioService } from './GoogleCloudAudioService';

interface TranscriptionResult {
  text: string;
  isFinal: boolean;
  confidence?: number;
  timestamp?: number;
}

interface TranscriptionError {
  code: string;
  message: string;
  details?: unknown;
}

interface AudioPipelineCallbacks {
  onTranscriptionStart: () => void;
  onTranscriptionEnd: () => void;
  onTranscriptionResult: (result: TranscriptionResult) => void;
  onTranscriptionError: (error: TranscriptionError) => void;
}

export class AudioPipelineService {
  private mediaRecorder: MediaRecorder | null = null;
  private mediaStream: MediaStream | null = null;
  private googleCloudService: GoogleCloudAudioService;
  private recordingStartTime: number = 0;
  private callbacks: AudioPipelineCallbacks;
  private isRecording: boolean = false;

  constructor(callbacks: AudioPipelineCallbacks) {
    this.callbacks = callbacks;
    console.log('🎙️ AudioPipelineService inicializado - Pipeline Profesional Google Cloud');
    this.googleCloudService = new GoogleCloudAudioService();
  }

  public async startRecording(): Promise<void> {
    if (this.isRecording) {
      console.warn('Ya hay una grabación en curso');
      return;
    }

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(this.mediaStream);
      this.recordingStartTime = Date.now();
      this.isRecording = true;
      this.callbacks.onTranscriptionStart();

      this.mediaRecorder.ondataavailable = async (event: BlobEvent) => {
        const audioBlob = event.data;
        await this.processAudioChunk(audioBlob);
      };

      this.mediaRecorder.start(1000); // Chunk cada 1 segundo
    } catch (error) {
      const transcriptionError: TranscriptionError = {
        code: 'RECORDING_ERROR',
        message: error instanceof Error ? error.message : 'Error desconocido al iniciar grabación',
        details: error
      };
      this.callbacks.onTranscriptionError(transcriptionError);
    }
  }

  private async processAudioChunk(audioBlob: Blob): Promise<void> {
    try {
      const result = await this.googleCloudService.processAudio(audioBlob);
      const transcriptionResult: TranscriptionResult = {
        text: result.text,
        isFinal: result.isFinal,
        confidence: result.confidence,
        timestamp: Date.now() - this.recordingStartTime
      };
      this.callbacks.onTranscriptionResult(transcriptionResult);
    } catch (error) {
      const transcriptionError: TranscriptionError = {
        code: 'PROCESSING_ERROR',
        message: error instanceof Error ? error.message : 'Error al procesar audio',
        details: error
      };
      this.callbacks.onTranscriptionError(transcriptionError);
    }
  }

  public stopRecording(): void {
    if (!this.isRecording) {
      console.warn('No hay grabación activa para detener');
      return;
    }

    if (this.mediaRecorder) {
      this.mediaRecorder.stop();
      this.mediaRecorder = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    this.isRecording = false;
    this.callbacks.onTranscriptionEnd();
  }
} 