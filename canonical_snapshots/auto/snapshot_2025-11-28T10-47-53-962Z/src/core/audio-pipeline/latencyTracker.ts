/**
 * Latency Tracking System
 * 
 * Tracks timestamps at each stage of the audio pipeline:
 * - upload_start
 * - upload_end
 * - whisper_start
 * - whisper_end
 * - gpt_start
 * - gpt_end
 * - total_pipeline_time
 */

export type PipelineStage = 
  | 'upload_start'
  | 'upload_end'
  | 'whisper_start'
  | 'whisper_end'
  | 'gpt_start'
  | 'gpt_end';

export interface LatencyMetrics {
  upload_start: number;
  upload_end?: number;
  whisper_start?: number;
  whisper_end?: number;
  gpt_start?: number;
  gpt_end?: number;
  total_pipeline_time?: number;
  upload_duration_ms?: number;
  whisper_duration_ms?: number;
  gpt_duration_ms?: number;
  minutes_saved_estimate?: number;
}

export class LatencyTracker {
  private metrics: LatencyMetrics;
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
    this.metrics = {
      upload_start: this.startTime
    };
  }

  /**
   * Records a timestamp for a pipeline stage
   */
  recordStage(stage: PipelineStage): void {
    const timestamp = Date.now();
    
    switch (stage) {
      case 'upload_start':
        this.metrics.upload_start = timestamp;
        break;
      case 'upload_end':
        this.metrics.upload_end = timestamp;
        if (this.metrics.upload_start) {
          this.metrics.upload_duration_ms = timestamp - this.metrics.upload_start;
        }
        break;
      case 'whisper_start':
        this.metrics.whisper_start = timestamp;
        break;
      case 'whisper_end':
        this.metrics.whisper_end = timestamp;
        if (this.metrics.whisper_start) {
          this.metrics.whisper_duration_ms = timestamp - this.metrics.whisper_start;
        }
        break;
      case 'gpt_start':
        this.metrics.gpt_start = timestamp;
        break;
      case 'gpt_end':
        this.metrics.gpt_end = timestamp;
        if (this.metrics.gpt_start) {
          this.metrics.gpt_duration_ms = timestamp - this.metrics.gpt_start;
        }
        // Calculate total pipeline time
        if (this.metrics.upload_start) {
          this.metrics.total_pipeline_time = timestamp - this.metrics.upload_start;
        }
        break;
    }
  }

  /**
   * Calculates minutes saved estimate based on manual documentation time
   * Assumes manual SOAP note takes ~10 minutes on average
   */
  calculateMinutesSaved(): number {
    if (!this.metrics.total_pipeline_time) {
      return 0;
    }
    
    const manualTimeMinutes = 10; // Average manual SOAP note time
    const pipelineTimeMinutes = this.metrics.total_pipeline_time / 60000; // Convert ms to minutes
    const savedMinutes = Math.max(0, manualTimeMinutes - pipelineTimeMinutes);
    
    this.metrics.minutes_saved_estimate = Math.round(savedMinutes * 10) / 10; // Round to 1 decimal
    return this.metrics.minutes_saved_estimate;
  }

  /**
   * Gets the current metrics
   */
  getMetrics(): LatencyMetrics {
    // Calculate minutes saved if not already calculated
    if (this.metrics.total_pipeline_time && !this.metrics.minutes_saved_estimate) {
      this.calculateMinutesSaved();
    }
    
    return { ...this.metrics };
  }

  /**
   * Resets the tracker for a new pipeline run
   */
  reset(): void {
    this.startTime = Date.now();
    this.metrics = {
      upload_start: this.startTime
    };
  }
}

