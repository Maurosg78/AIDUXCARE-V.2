/**
 * Error Classification System
 * 
 * Classifies all pipeline failures into one of 5 categories:
 * - network_error
 * - storage_error
 * - whisper_error
 * - gpt_error
 * - timeout
 */

export type FailureType = 
  | 'network_error'
  | 'storage_error'
  | 'whisper_error'
  | 'gpt_error'
  | 'timeout';

export interface ClassifiedError {
  type: FailureType;
  originalError: unknown;
  message: string;
  metadata?: Record<string, unknown>;
}

/**
 * Classifies an error into one of the 5 failure types
 */
export function classifyError(error: unknown): ClassifiedError {
  const errorObj = error as any;
  const errorMessage = errorObj?.message || String(error);
  const errorCode = errorObj?.code || errorObj?.status || errorObj?.statusCode;

  // Timeout errors
  if (
    errorMessage.toLowerCase().includes('timeout') ||
    errorMessage.toLowerCase().includes('timed out') ||
    errorCode === 'TIMEOUT' ||
    errorCode === 408 ||
    errorObj?.name === 'TimeoutError' ||
    errorObj?.name === 'AbortError'
  ) {
    return {
      type: 'timeout',
      originalError: error,
      message: errorMessage,
      metadata: { code: errorCode }
    };
  }

  // Network errors
  if (
    errorMessage.toLowerCase().includes('network') ||
    errorMessage.toLowerCase().includes('fetch') ||
    errorMessage.toLowerCase().includes('connection') ||
    errorMessage.toLowerCase().includes('failed to fetch') ||
    errorCode === 'ECONNREFUSED' ||
    errorCode === 'ENOTFOUND' ||
    errorCode === 'ETIMEDOUT' ||
    (typeof errorCode === 'number' && errorCode >= 500 && errorCode < 600)
  ) {
    return {
      type: 'network_error',
      originalError: error,
      message: errorMessage,
      metadata: { code: errorCode }
    };
  }

  // Storage errors (Firebase Storage)
  if (
    errorMessage.toLowerCase().includes('storage') ||
    errorMessage.toLowerCase().includes('bucket') ||
    errorMessage.toLowerCase().includes('upload') ||
    errorMessage.toLowerCase().includes('firebase storage') ||
    errorCode === 'storage/unauthorized' ||
    errorCode === 'storage/object-not-found' ||
    errorCode === 'storage/quota-exceeded'
  ) {
    return {
      type: 'storage_error',
      originalError: error,
      message: errorMessage,
      metadata: { code: errorCode }
    };
  }

  // Whisper errors (OpenAI API)
  if (
    errorMessage.toLowerCase().includes('whisper') ||
    errorMessage.toLowerCase().includes('transcription') ||
    errorMessage.toLowerCase().includes('openai') ||
    errorCode === 'whisper_error' ||
    errorCode === 'transcription_error' ||
    (errorObj?.response?.status >= 400 && errorObj?.response?.status < 500 && 
     errorMessage.toLowerCase().includes('audio'))
  ) {
    return {
      type: 'whisper_error',
      originalError: error,
      message: errorMessage,
      metadata: { code: errorCode }
    };
  }

  // GPT errors (Vertex AI / OpenAI GPT)
  if (
    errorMessage.toLowerCase().includes('vertex') ||
    errorMessage.toLowerCase().includes('gpt') ||
    errorMessage.toLowerCase().includes('gemini') ||
    errorMessage.toLowerCase().includes('generation') ||
    errorMessage.toLowerCase().includes('soap') ||
    errorCode === 'gpt_error' ||
    errorCode === 'vertex_error' ||
    errorCode === 'RESOURCE_EXHAUSTED' ||
    errorCode === 'VERTEX_RATE_LIMIT'
  ) {
    return {
      type: 'gpt_error',
      originalError: error,
      message: errorMessage,
      metadata: { code: errorCode }
    };
  }

  // Default to network_error if classification is unclear
  return {
    type: 'network_error',
    originalError: error,
    message: errorMessage,
    metadata: { code: errorCode, unclassified: true }
  };
}

/**
 * Gets a user-friendly error message based on failure type
 */
export function getUserFriendlyMessage(classifiedError: ClassifiedError): string {
  switch (classifiedError.type) {
    case 'timeout':
      return 'The request took too long. Please check your connection and try again.';
    case 'network_error':
      return 'Network connection error. Please check your internet and try again.';
    case 'storage_error':
      return 'File upload error. Please try again or contact support if the problem persists.';
    case 'whisper_error':
      return 'Audio transcription error. Please try recording again.';
    case 'gpt_error':
      return 'AI processing error. Please try again in a moment.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
}

