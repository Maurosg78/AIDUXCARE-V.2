/**
 * Tests for Pipeline Logger
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pipelineLogger } from '../pipelineLogger';
import type { FailureType } from '../errorClassification';
import type { LatencyMetrics } from '../latencyTracker';

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ error: null })
    }))
  }))
}));

// Mock env config
vi.mock('../../core/config/env', () => ({
  SUPABASE_URL: 'https://test.supabase.co',
  SUPABASE_ANON_KEY: 'test-key'
}));

describe('pipelineLogger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should log failure event', async () => {
    await pipelineLogger.logFailure('network_error', 'Connection failed', {
      visitId: 'test-visit-123'
    });

    // Should not throw
    expect(true).toBe(true);
  });

  it('should log latency metrics', async () => {
    const metrics: LatencyMetrics = {
      upload_start: Date.now(),
      upload_end: Date.now() + 100,
      whisper_start: Date.now() + 100,
      whisper_end: Date.now() + 600,
      gpt_start: Date.now() + 600,
      gpt_end: Date.now() + 1600,
      total_pipeline_time: 1600,
      upload_duration_ms: 100,
      whisper_duration_ms: 500,
      gpt_duration_ms: 1000,
      minutes_saved_estimate: 9.7
    };

    await pipelineLogger.logLatencyMetrics(metrics, {
      visitId: 'test-visit-123'
    });

    // Should not throw
    expect(true).toBe(true);
  });

  it('should handle missing Supabase gracefully', async () => {
    // Mock missing Supabase
    vi.mock('../../core/config/env', () => ({
      SUPABASE_URL: '',
      SUPABASE_ANON_KEY: ''
    }));

    await pipelineLogger.logFailure('timeout', 'Timeout error');
    await pipelineLogger.logLatencyMetrics({
      upload_start: Date.now()
    });

    // Should not throw
    expect(true).toBe(true);
  });
});

