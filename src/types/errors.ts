/**
 * 🚨 AiDuxCare Error Types - Sistema de errores estructurados
 * Definición de tipos de error para manejo robusto y logging
 * 
 * @version 1.0.0
 * @author Error Handling Team
 */

export enum ErrorCategory {
  // Errores de servicios externos
  AI_SERVICE_ERROR = 'AI_SERVICE_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  
  // Errores de validación y entrada
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INPUT_ERROR = 'INPUT_ERROR',
  
  // Errores de procesamiento
  AUDIO_PROCESSING_ERROR = 'AUDIO_PROCESSING_ERROR',
  TRANSCRIPTION_ERROR = 'TRANSCRIPTION_ERROR',
  
  // Errores de sistema
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  
  // Errores de autorización
  AUTH_ERROR = 'AUTH_ERROR',
  PERMISSION_ERROR = 'PERMISSION_ERROR'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface StructuredError {
  // Identificación del error
  id: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  
  // Información del error
  message: string;
  userMessage: string;
  technicalDetails: string;
  
  // Contexto
  timestamp: string;
  source: string;
  userId?: string;
  visitId?: string;
  processingId?: string;
  
  // Error original
  originalError?: Error;
  stack?: string;
  
  // Metadata adicional
  metadata?: Record<string, unknown>;
  
  // Estrategias de recuperación
  retryable: boolean;
  fallbackAvailable: boolean;
  
  // Información de logging
  logLevel: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
}

export interface ErrorRecoveryStrategy {
  canRecover: boolean;
  fallbackFunction?: () => Promise<unknown>;
  retryConfig?: {
    maxRetries: number;
    delayMs: number;
    exponentialBackoff: boolean;
  };
  userActions?: string[];
}

/**
 * Factory para crear errores estructurados
 */
export class StructuredErrorFactory {
  
  static createOllamaError(
    originalError: Error,
    processingId: string,
    userId?: string,
    visitId?: string
  ): StructuredError {
    return {
      id: `ollama-error-${Date.now()}`,
      category: ErrorCategory.AI_SERVICE_ERROR,
      severity: ErrorSeverity.HIGH,
      message: 'Error en el servicio de procesamiento de lenguaje natural',
      userMessage: 'Hubo un problema al generar las notas SOAP. Por favor, intente de nuevo.',
      technicalDetails: `Ollama service failure: ${originalError.message}`,
      timestamp: new Date().toISOString(),
      source: 'AudioProcessingServiceProfessional',
      userId,
      visitId,
      processingId,
      originalError,
      stack: originalError.stack,
      metadata: {
        service: 'ollama',
        endpoint: 'processTranscript'
      },
      retryable: true,
      fallbackAvailable: true,
      logLevel: 'error'
    };
  }
  
  static createTranscriptionError(
    originalError: Error,
    processingId: string,
    audioFileSize: number,
    userId?: string,
    visitId?: string
  ): StructuredError {
    return {
      id: `transcription-error-${Date.now()}`,
      category: ErrorCategory.TRANSCRIPTION_ERROR,
      severity: ErrorSeverity.MEDIUM,
      message: 'Error en la transcripción de audio',
      userMessage: 'No pudimos procesar el audio. Verifique la calidad de la grabación.',
      technicalDetails: `Speech-to-text failure: ${originalError.message}`,
      timestamp: new Date().toISOString(),
      source: 'AudioProcessingServiceProfessional',
      userId,
      visitId,
      processingId,
      originalError,
      stack: originalError.stack,
      metadata: {
        service: 'speech-to-text',
        audioFileSize
      },
      retryable: true,
      fallbackAvailable: false,
      logLevel: 'warn'
    };
  }
  
  static createDatabaseError(
    originalError: Error,
    operation: string,
    userId?: string,
    visitId?: string
  ): StructuredError {
    return {
      id: `db-error-${Date.now()}`,
      category: ErrorCategory.DATABASE_ERROR,
      severity: ErrorSeverity.HIGH,
      message: 'Error en la base de datos',
      userMessage: 'Hubo un problema al guardar la información. Los datos se mantendrán localmente.',
      technicalDetails: `Database operation failed: ${operation} - ${originalError.message}`,
      timestamp: new Date().toISOString(),
      source: 'DatabaseService',
      userId,
      visitId,
      originalError,
      stack: originalError.stack,
      metadata: {
        operation,
        service: 'supabase'
      },
      retryable: true,
      fallbackAvailable: true,
      logLevel: 'error'
    };
  }
  
  static createValidationError(
    field: string,
    value: unknown,
    expectedType: string,
    userId?: string
  ): StructuredError {
    return {
      id: `validation-error-${Date.now()}`,
      category: ErrorCategory.VALIDATION_ERROR,
      severity: ErrorSeverity.LOW,
      message: `Error de validación en el campo: ${field}`,
      userMessage: `El valor ingresado para ${field} no es válido. Por favor, verifique.`,
      technicalDetails: `Validation failed for field '${field}': expected ${expectedType}, got ${typeof value}`,
      timestamp: new Date().toISOString(),
      source: 'ValidationService',
      userId,
      originalError: new Error(`Validation failed: ${field}`),
      metadata: {
        field,
        value,
        expectedType,
        actualType: typeof value
      },
      retryable: false,
      fallbackAvailable: false,
      logLevel: 'warn'
    };
  }
}

/**
 * Logger especializado para errores estructurados
 */
export class ErrorLogger {
  
  static logStructuredError(error: StructuredError): void {
    const logData = {
      errorId: error.id,
      category: error.category,
      severity: error.severity,
      message: error.message,
      source: error.source,
      timestamp: error.timestamp,
      userId: error.userId,
      visitId: error.visitId,
      processingId: error.processingId,
      technicalDetails: error.technicalDetails,
      metadata: error.metadata,
      retryable: error.retryable,
      fallbackAvailable: error.fallbackAvailable
    };
    
    switch (error.logLevel) {
      case 'debug':
        console.debug('🔍 DEBUG ERROR:', logData);
        break;
      case 'info':
        console.info('ℹ️ INFO ERROR:', logData);
        break;
      case 'warn':
        console.warn('⚠️ WARNING ERROR:', logData, error.originalError);
        break;
      case 'error':
        console.error('❌ ERROR:', logData, error.originalError);
        break;
      case 'fatal':
        console.error('💀 FATAL ERROR:', logData, error.originalError);
        break;
    }
  }
  
  static createUserErrorMessage(error: StructuredError): string {
    let message = error.userMessage;
    
    if (error.retryable) {
      message += ' Puede intentar nuevamente.';
    }
    
    if (error.fallbackAvailable) {
      message += ' Se activarán funciones de respaldo automáticamente.';
    }
    
    return message;
  }
} 