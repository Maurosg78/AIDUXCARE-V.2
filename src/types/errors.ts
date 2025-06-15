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
  
  static createGoogleCloudError(
    originalError: Error,
    processingId: string,
    userId?: string,
    visitId?: string
  ): StructuredError {
    return {
      id: `google-cloud-error-${Date.now()}`,
      category: ErrorCategory.AI_SERVICE_ERROR,
      severity: ErrorSeverity.HIGH,
      message: 'Error en el servicio de Google Cloud AI',
      userMessage: 'Hubo un problema al generar las notas SOAP. Por favor, intente de nuevo.',
      technicalDetails: `Google Cloud AI service failure: ${originalError.message}`,
      timestamp: new Date().toISOString(),
      source: 'TextProcessingService',
      userId,
      visitId,
      processingId,
      originalError,
      stack: originalError.stack,
      metadata: {
        service: 'google-cloud-ai',
        endpoint: 'processTextToSOAP'
      },
      retryable: true,
      fallbackAvailable: false,
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

  static createSystemError(
    originalError: Error,
    operation: string,
    userId?: string,
    visitId?: string
  ): StructuredError {
    return {
      id: `system-error-${Date.now()}`,
      category: ErrorCategory.SYSTEM_ERROR,
      severity: ErrorSeverity.HIGH,
      message: 'Error del sistema',
      userMessage: 'Hubo un problema técnico. El equipo de soporte ha sido notificado.',
      technicalDetails: `System operation failed: ${operation} - ${originalError.message}`,
      timestamp: new Date().toISOString(),
      source: 'SystemService',
      userId,
      visitId,
      originalError,
      stack: originalError.stack,
      metadata: {
        operation,
        service: 'system'
      },
      retryable: false,
      fallbackAvailable: true,
      logLevel: 'error'
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

/**
 * 🚨 Error Types - AiDuxCare V.2
 * Tipos para manejo estructurado de errores
 */

export interface StructuredError extends Error {
  userMessage: string;
  technicalDetails?: string;
  retryable: boolean;
  fallbackAvailable?: boolean;
  timestamp?: string;
  context?: Record<string, unknown>;
  errorCode?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

export interface ValidationError extends StructuredError {
  field: string;
  value: unknown;
  constraint: string;
}

export interface NetworkError extends StructuredError {
  status?: number;
  endpoint?: string;
  method?: string;
}

export interface ServiceError extends StructuredError {
  service: string;
  operation: string;
  dependencies?: string[];
}

export interface AudioProcessingError extends StructuredError {
  audioSize?: number;
  audioDuration?: number;
  audioFormat?: string;
  processingStep?: 'transcription' | 'analysis' | 'soap-generation';
}

/**
 * Factory para crear errores estructurados
 */
export class ErrorFactory {
  static createValidationError(
    field: string,
    value: unknown,
    constraint: string,
    userMessage?: string
  ): ValidationError {
    return {
      name: 'ValidationError',
      message: `Validation failed for field ${field}`,
      userMessage: userMessage || `El campo ${field} no es válido`,
      technicalDetails: `Field: ${field}, Value: ${value}, Constraint: ${constraint}`,
      retryable: false,
      field,
      value,
      constraint,
      timestamp: new Date().toISOString(),
      severity: 'medium'
    };
  }

  static createNetworkError(
    endpoint: string,
    status?: number,
    userMessage?: string
  ): NetworkError {
    return {
      name: 'NetworkError',
      message: `Network request failed to ${endpoint}`,
      userMessage: userMessage || 'Error de conexión. Verifica tu conexión a internet.',
      technicalDetails: `Endpoint: ${endpoint}, Status: ${status}`,
      retryable: true,
      endpoint,
      status,
      timestamp: new Date().toISOString(),
      severity: status && status >= 500 ? 'high' : 'medium'
    };
  }

  static createServiceError(
    service: string,
    operation: string,
    originalError?: Error,
    userMessage?: string
  ): ServiceError {
    return {
      name: 'ServiceError',
      message: `Service ${service} failed during ${operation}`,
      userMessage: userMessage || 'Error en el servicio. Intenta de nuevo más tarde.',
      technicalDetails: originalError?.message || 'Unknown service error',
      retryable: true,
      service,
      operation,
      timestamp: new Date().toISOString(),
      severity: 'medium'
    };
  }

  static createAudioProcessingError(
    processingStep: AudioProcessingError['processingStep'],
    originalError?: Error,
    audioInfo?: {
      size?: number;
      duration?: number;
      format?: string;
    }
  ): AudioProcessingError {
    const stepMessages = {
      transcription: 'Error al transcribir el audio',
      analysis: 'Error al analizar el contenido médico',
      'soap-generation': 'Error al generar las notas SOAP'
    };

    return {
      name: 'AudioProcessingError',
      message: `Audio processing failed at ${processingStep}`,
      userMessage: stepMessages[processingStep] || 'Error procesando el audio',
      technicalDetails: originalError?.message || 'Unknown audio processing error',
      retryable: true,
      fallbackAvailable: true,
      processingStep,
      audioSize: audioInfo?.size,
      audioDuration: audioInfo?.duration,
      audioFormat: audioInfo?.format,
      timestamp: new Date().toISOString(),
      severity: 'medium'
    };
  }
}

/**
 * Utilidades para manejo de errores
 */
export class ErrorUtils {
  /**
   * Determinar si un error es recuperable
   */
  static isRetryable(error: unknown): boolean {
    if (error && typeof error === 'object' && 'retryable' in error) {
      return (error as StructuredError).retryable;
    }
    return false;
  }

  /**
   * Obtener mensaje amigable para el usuario
   */
  static getUserMessage(error: unknown): string {
    if (error && typeof error === 'object' && 'userMessage' in error) {
      return (error as StructuredError).userMessage;
    }
    
    if (error instanceof Error) {
      return 'Ha ocurrido un error inesperado. Intenta de nuevo.';
    }
    
    return 'Error desconocido. Contacta al soporte técnico.';
  }

  /**
   * Obtener detalles técnicos del error
   */
  static getTechnicalDetails(error: unknown): string {
    if (error && typeof error === 'object' && 'technicalDetails' in error) {
      return (error as StructuredError).technicalDetails || '';
    }
    
    if (error instanceof Error) {
      return error.message;
    }
    
    return String(error);
  }

  /**
   * Verificar si hay fallback disponible
   */
  static hasFallback(error: unknown): boolean {
    if (error && typeof error === 'object' && 'fallbackAvailable' in error) {
      return (error as StructuredError).fallbackAvailable || false;
    }
    return false;
  }

  /**
   * Formatear error para logging
   */
  static formatForLogging(error: unknown): Record<string, unknown> {
    const baseInfo = {
      timestamp: new Date().toISOString(),
      type: 'unknown'
    };

    if (error && typeof error === 'object') {
      const structuredError = error as StructuredError;
      return {
        ...baseInfo,
        type: structuredError.name || 'StructuredError',
        message: structuredError.message,
        userMessage: structuredError.userMessage,
        technicalDetails: structuredError.technicalDetails,
        retryable: structuredError.retryable,
        fallbackAvailable: structuredError.fallbackAvailable,
        severity: structuredError.severity,
        context: structuredError.context
      };
    }

    if (error instanceof Error) {
      return {
        ...baseInfo,
        type: error.name,
        message: error.message,
        stack: error.stack
      };
    }

    return {
      ...baseInfo,
      message: String(error)
    };
  }
}
