/**
 * Retry Wrapper with Exponential Backoff
 * 
 * Implements retry mechanism with exponential backoff for audio pipeline operations.
 * Retry schedule: attempt 1 → 500ms → attempt 2 → 1500ms → attempt 3
 */

export type RetryOptions = {
  maxRetries?: number;
  initialDelay?: number;
  backoffMultiplier?: number;
  onRetry?: (attempt: number, error: unknown) => void;
};

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 500,
  backoffMultiplier: 3,
  onRetry: () => {}
};

/**
 * Calculates delay for exponential backoff
 * attempt 1: 500ms
 * attempt 2: 1500ms (500 * 3)
 * attempt 3: 4500ms (1500 * 3) - but won't be used if maxRetries is 3
 */
function calculateDelay(attempt: number, initialDelay: number, multiplier: number): number {
  if (attempt === 0) return 0;
  return initialDelay * Math.pow(multiplier, attempt - 1);
}

/**
 * Wraps an async function with retry logic and exponential backoff
 * 
 * @param fn - Function to retry
 * @param options - Retry configuration
 * @returns Promise that resolves with the function result or rejects after all retries fail
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const config = { ...DEFAULT_OPTIONS, ...options };
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      // Wait before retry (skip delay on first attempt)
      if (attempt > 0) {
        const delay = calculateDelay(attempt, config.initialDelay, config.backoffMultiplier);
        await new Promise(resolve => setTimeout(resolve, delay));
        config.onRetry(attempt, lastError);
      }

      // Execute function
      return await fn();
    } catch (error) {
      lastError = error;
      
      // If this was the last attempt, throw the error
      if (attempt === config.maxRetries) {
        throw error;
      }
    }
  }

  // This should never be reached, but TypeScript requires it
  throw lastError ?? new Error('Retry failed with unknown error');
}

/**
 * Creates a retry wrapper function with pre-configured options
 */
export function createRetryWrapper(options: RetryOptions = {}) {
  return <T>(fn: () => Promise<T>) => withRetry(fn, options);
}

