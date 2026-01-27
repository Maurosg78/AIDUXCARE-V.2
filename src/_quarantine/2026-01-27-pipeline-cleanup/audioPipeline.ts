/**
 * Audio Pipeline Wrapper
 * 
 * Integrates retry, error classification, latency tracking, and logging
 * for the complete audio-to-SOAP pipeline.
 */

import { withRetry } from './retryWrapper';
import { classifyError, type ClassifiedError } from './errorClassification';
import { LatencyTracker, type LatencyMetrics } from './latencyTracker';
import { pipelineLogger } from './pipelineLogger';
import { OpenAIWhisperService, type WhisperTranscriptionResult } from '../../services/OpenAIWhisperService';
import { VertexAIServiceViaFirebase } from '../../services/vertex-ai-service-firebase';
import type { SOAPNote } from '../../types/vertex-ai';
import type { ClinicalAnalysis } from '../../utils/cleanVertexResponse';
import type { PhysicalExamResult } from '../../types/vertex-ai';

export interface AudioPipelineResult {
  transcription: WhisperTranscriptionResult;
  analysis: ClinicalAnalysis;
  soapNote: SOAPNote;
  metrics: LatencyMetrics;
}

export interface AudioPipelineError {
  classifiedError: ClassifiedError;
  metrics: LatencyMetrics;
}

/**
 * Complete audio pipeline with retry, error handling, and metrics
 */
export class AudioPipeline {
  private latencyTracker: LatencyTracker;

  constructor() {
    this.latencyTracker = new LatencyTracker();
  }

  /**
   * Processes audio blob through complete pipeline:
   * 1. Upload (if needed)
   * 2. Whisper transcription
   * 3. GPT analysis
   * 4. SOAP generation
   */
  async processAudio(
    audioBlob: Blob,
    options: {
      languageHint?: 'auto' | 'en' | 'es' | 'fr';
      mode?: 'live' | 'dictation';
      selectedEntityIds?: string[];
      physicalExamResults?: PhysicalExamResult[];
      onProgress?: (stage: string) => void;
    } = {}
  ): Promise<AudioPipelineResult> {
    // Reset tracker for new pipeline run
    this.latencyTracker.reset();
    this.latencyTracker.recordStage('upload_start');

    try {
      // Step 1: Transcribe audio with Whisper (with retry)
      this.latencyTracker.recordStage('whisper_start');
      options.onProgress?.('Transcribing audio...');

      const transcription = await withRetry(
        () => OpenAIWhisperService.transcribe(audioBlob, {
          languageHint: options.languageHint,
          mode: options.mode
        }),
        {
          maxRetries: 3,
          initialDelay: 500,
          backoffMultiplier: 3,
          onRetry: (attempt, error) => {
            const classified = classifyError(error);
            console.warn(`[AudioPipeline] Whisper retry ${attempt}:`, classified.type);
          }
        }
      );

      this.latencyTracker.recordStage('whisper_end');
      options.onProgress?.('Analyzing transcript...');

      // Step 2: Analyze with GPT (with retry)
      this.latencyTracker.recordStage('gpt_start');

      const analysis = await withRetry(
        () => VertexAIServiceViaFirebase.processWithNiagara({
          text: transcription.text,
          lang: transcription.detectedLanguage || options.languageHint || null,
          mode: options.mode || 'live',
          timestamp: Date.now()
        }),
        {
          maxRetries: 3,
          initialDelay: 500,
          backoffMultiplier: 3,
          onRetry: (attempt, error) => {
            const classified = classifyError(error);
            console.warn(`[AudioPipeline] GPT retry ${attempt}:`, classified.type);
          }
        }
      );

      // Normalize analysis response
      const normalizedAnalysis = this.normalizeAnalysis(analysis);
      this.latencyTracker.recordStage('gpt_end');
      options.onProgress?.('Generating SOAP note...');

      // Step 3: Generate SOAP note (with retry)
      const soapNote = await withRetry(
        () => VertexAIServiceViaFirebase.generateSOAP({
          transcript: transcription.text,
          selectedEntityIds: options.selectedEntityIds || [],
          physicalExamResults: options.physicalExamResults || [],
          analysis: normalizedAnalysis
        }),
        {
          maxRetries: 3,
          initialDelay: 500,
          backoffMultiplier: 3,
          onRetry: (attempt, error) => {
            const classified = classifyError(error);
            console.warn(`[AudioPipeline] SOAP retry ${attempt}:`, classified.type);
          }
        }
      );

      // Get final metrics
      const metrics = this.latencyTracker.getMetrics();

      // Log success metrics
      await pipelineLogger.logLatencyMetrics(metrics, {
        success: true,
        transcription_length: transcription.text.length
      });

      return {
        transcription,
        analysis: normalizedAnalysis,
        soapNote,
        metrics
      };
    } catch (error) {
      // Classify error
      const classifiedError = classifyError(error);
      const metrics = this.latencyTracker.getMetrics();

      // Log failure
      await pipelineLogger.logFailure(
        classifiedError.type,
        classifiedError.message,
        {
          metrics,
          transcription_length: 0
        }
      );

      // Throw structured error
      const pipelineError: AudioPipelineError = {
        classifiedError,
        metrics
      };
      throw pipelineError;
    }
  }

  /**
   * Normalizes analysis response from Vertex AI
   */
  private normalizeAnalysis(response: any): ClinicalAnalysis {
    // Import normalizeVertexResponse if available
    try {
      const { normalizeVertexResponse } = require('../../utils/cleanVertexResponse');
      return normalizeVertexResponse(response);
    } catch {
      // Fallback normalization
      return {
        motivo_consulta: response.motivo_consulta || '',
        hallazgos_clinicos: response.hallazgos_clinicos || [],
        red_flags: response.red_flags || [],
        medicamentos: response.medicamentos || [],
        recomendaciones: response.recomendaciones || []
      };
    }
  }

  /**
   * Gets current latency metrics
   */
  getMetrics(): LatencyMetrics {
    return this.latencyTracker.getMetrics();
  }
}

