/**
 * Tests for Latency Tracker
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LatencyTracker } from '../latencyTracker';

describe('LatencyTracker', () => {
  let tracker: LatencyTracker;

  beforeEach(() => {
    tracker = new LatencyTracker();
    vi.clearAllMocks();
  });

  it('should initialize with upload_start timestamp', () => {
    const metrics = tracker.getMetrics();
    
    expect(metrics.upload_start).toBeGreaterThan(0);
  });

  it('should record upload_end and calculate upload duration', () => {
    // Simulate some time passing
    const startTime = Date.now();
    tracker = new LatencyTracker();
    
    // Wait a bit (simulated)
    const endTime = startTime + 100;
    vi.spyOn(Date, 'now').mockReturnValueOnce(endTime);
    
    tracker.recordStage('upload_end');
    const metrics = tracker.getMetrics();
    
    expect(metrics.upload_end).toBe(endTime);
    expect(metrics.upload_duration_ms).toBeGreaterThanOrEqual(0);
  });

  it('should record whisper stages and calculate duration', () => {
    tracker.recordStage('whisper_start');
    
    // Simulate time passing
    const endTime = Date.now() + 500;
    vi.spyOn(Date, 'now').mockReturnValueOnce(endTime);
    
    tracker.recordStage('whisper_end');
    const metrics = tracker.getMetrics();
    
    expect(metrics.whisper_start).toBeGreaterThan(0);
    expect(metrics.whisper_end).toBe(endTime);
    expect(metrics.whisper_duration_ms).toBeGreaterThanOrEqual(0);
  });

  it('should record GPT stages and calculate duration', () => {
    tracker.recordStage('gpt_start');
    
    // Simulate time passing
    const endTime = Date.now() + 1000;
    vi.spyOn(Date, 'now').mockReturnValueOnce(endTime);
    
    tracker.recordStage('gpt_end');
    const metrics = tracker.getMetrics();
    
    expect(metrics.gpt_start).toBeGreaterThan(0);
    expect(metrics.gpt_end).toBe(endTime);
    expect(metrics.gpt_duration_ms).toBeGreaterThanOrEqual(0);
  });

  it('should calculate total pipeline time on gpt_end', () => {
    const startTime = Date.now();
    tracker = new LatencyTracker();
    
    tracker.recordStage('upload_end');
    tracker.recordStage('whisper_start');
    tracker.recordStage('whisper_end');
    tracker.recordStage('gpt_start');
    
    const endTime = startTime + 2000;
    vi.spyOn(Date, 'now').mockReturnValueOnce(endTime);
    
    tracker.recordStage('gpt_end');
    const metrics = tracker.getMetrics();
    
    expect(metrics.total_pipeline_time).toBeGreaterThan(0);
  });

  it('should calculate minutes saved estimate', () => {
    tracker.recordStage('upload_end');
    tracker.recordStage('whisper_start');
    tracker.recordStage('whisper_end');
    tracker.recordStage('gpt_start');
    
    // Simulate 30 second pipeline (0.5 minutes)
    const endTime = Date.now() + 30000;
    vi.spyOn(Date, 'now').mockReturnValueOnce(endTime);
    
    tracker.recordStage('gpt_end');
    const metrics = tracker.getMetrics();
    
    // Manual time is 10 minutes, pipeline took 0.5 minutes
    // Saved: ~9.5 minutes
    expect(metrics.minutes_saved_estimate).toBeGreaterThan(9);
    expect(metrics.minutes_saved_estimate).toBeLessThan(10);
  });

  it('should reset tracker', () => {
    tracker.recordStage('upload_end');
    tracker.recordStage('whisper_start');
    
    tracker.reset();
    const metrics = tracker.getMetrics();
    
    expect(metrics.upload_start).toBeGreaterThan(0);
    expect(metrics.upload_end).toBeUndefined();
    expect(metrics.whisper_start).toBeUndefined();
  });

  it('should return all metrics', () => {
    tracker.recordStage('upload_end');
    tracker.recordStage('whisper_start');
    tracker.recordStage('whisper_end');
    tracker.recordStage('gpt_start');
    
    const endTime = Date.now() + 1000;
    vi.spyOn(Date, 'now').mockReturnValueOnce(endTime);
    
    tracker.recordStage('gpt_end');
    const metrics = tracker.getMetrics();
    
    expect(metrics).toHaveProperty('upload_start');
    expect(metrics).toHaveProperty('upload_end');
    expect(metrics).toHaveProperty('whisper_start');
    expect(metrics).toHaveProperty('whisper_end');
    expect(metrics).toHaveProperty('gpt_start');
    expect(metrics).toHaveProperty('gpt_end');
    expect(metrics).toHaveProperty('total_pipeline_time');
    expect(metrics).toHaveProperty('minutes_saved_estimate');
  });
});

