/**
 * Pipeline Logger Service
 * 
 * Logs audio pipeline events to Supabase:
 * - suggestion_events (for failure classification)
 * - productivity_metrics (for latency tracking)
 */

import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../core/config/env';
import type { FailureType } from './errorClassification';
import type { LatencyMetrics } from './latencyTracker';

interface SupabaseClient {
  insert: (table: string, data: any) => Promise<{ error: any }>;
}

class PipelineLogger {
  private supabase: SupabaseClient | null = null;

  constructor() {
    // Initialize Supabase client if credentials are available
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      try {
        const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        // Wrap Supabase client to match MetricsService interface
        this.supabase = {
          insert: async (table: string, data: any) => {
            const { error } = await client.from(table).insert(data);
            return { error };
          }
        };
      } catch (error) {
        console.warn('[PipelineLogger] Failed to initialize Supabase client:', error);
        this.supabase = null;
      }
    }
  }

  /**
   * Logs a failure event to suggestion_events table
   */
  async logFailure(
    failureType: FailureType,
    errorMessage: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    if (!this.supabase) {
      console.warn('[PipelineLogger] Supabase not available, skipping failure log');
      return;
    }

    try {
      const payload = {
        event_type: failureType,
        suggestion_id: `pipeline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        visit_id: metadata?.visitId || 'unknown',
        timestamp: new Date().toISOString(),
        atISO: new Date().toISOString(),
        metadata: {
          error_message: errorMessage,
          ...metadata
        }
      };

      const { error } = await this.supabase.insert('suggestion_events', payload);
      if (error) {
        console.error('[PipelineLogger] Failed to log failure event:', error);
      } else {
        console.log('[PipelineLogger] Failure event logged:', failureType);
      }
    } catch (error) {
      console.error('[PipelineLogger] Error logging failure:', error);
    }
  }

  /**
   * Logs latency metrics to productivity_metrics table
   */
  async logLatencyMetrics(
    metrics: LatencyMetrics,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    if (!this.supabase) {
      console.warn('[PipelineLogger] Supabase not available, skipping latency log');
      return;
    }

    try {
      const payload = {
        pipeline_duration_ms: metrics.total_pipeline_time || 0,
        upload_duration_ms: metrics.upload_duration_ms || 0,
        whisper_duration_ms: metrics.whisper_duration_ms || 0,
        gpt_duration_ms: metrics.gpt_duration_ms || 0,
        minutes_saved_estimate: metrics.minutes_saved_estimate || 0,
        timestamp: new Date().toISOString(),
        ...metadata
      };

      const { error } = await this.supabase.insert('productivity_metrics', payload);
      if (error) {
        console.error('[PipelineLogger] Failed to log latency metrics:', error);
      } else {
        console.log('[PipelineLogger] Latency metrics logged:', payload);
      }
    } catch (error) {
      console.error('[PipelineLogger] Error logging latency metrics:', error);
    }
  }
}

// Export singleton instance
export const pipelineLogger = new PipelineLogger();

