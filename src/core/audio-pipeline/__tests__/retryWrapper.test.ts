/**
 * Tests for Retry Wrapper
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { withRetry, createRetryWrapper } from '../retryWrapper';

describe('retryWrapper', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('should succeed on first attempt', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    
    const result = await withRetry(fn, { maxRetries: 3 });
    
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry until success', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValue('success');
    
    const resultPromise = withRetry(fn, { 
      maxRetries: 3,
      initialDelay: 100 
    });
    
    // Fast-forward through delays
    await vi.advanceTimersByTimeAsync(100); // First retry delay
    await vi.advanceTimersByTimeAsync(300); // Second retry delay
    
    const result = await resultPromise;
    
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should fail after max retries', async () => {
    // Use real timers for this test to avoid unhandled rejection issues
    vi.useRealTimers();
    
    const error = new Error('persistent error');
    const fn = vi.fn().mockRejectedValue(error);
    
    // Await the rejection explicitly to prevent unhandled rejection
    await expect(
      withRetry(fn, { 
        maxRetries: 3,
        initialDelay: 10 // Use small delay for faster test
      })
    ).rejects.toBe(error);
    
    expect(fn).toHaveBeenCalledTimes(4); // Initial + 3 retries
    
    // Restore fake timers for other tests
    vi.useFakeTimers();
  });

  it('should use exponential backoff timing', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValue('success');
    
    const onRetry = vi.fn();
    const resultPromise = withRetry(fn, { 
      maxRetries: 3,
      initialDelay: 500,
      backoffMultiplier: 3,
      onRetry
    });
    
    // Check timing: attempt 1 → 500ms → attempt 2 → 1500ms → attempt 3
    await vi.advanceTimersByTimeAsync(500); // First retry delay (500ms)
    expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error));
    
    await vi.advanceTimersByTimeAsync(1500); // Second retry delay (500 * 3 = 1500ms)
    expect(onRetry).toHaveBeenCalledWith(2, expect.any(Error));
    
    await resultPromise;
    
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should create retry wrapper with pre-configured options', async () => {
    const retryWrapper = createRetryWrapper({
      maxRetries: 2,
      initialDelay: 200
    });
    
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('success');
    
    const resultPromise = retryWrapper(fn);
    
    await vi.advanceTimersByTimeAsync(200); // First retry delay
    
    const result = await resultPromise;
    
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

