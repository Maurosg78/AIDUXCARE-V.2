/**
 * ⚠️ **Enterprise Error Handling System**
 * 
 * Sistema de errores enterprise con:
 * - Tipado estricto de errores
 * - Clasificación para auditoría
 * - Context preservation
 * - Logging automático
 */

import type { AuditEventType } from '../types/audit.types';

// =====================================================
// BASE ERROR TYPES
// =====================================================

export type ErrorSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ErrorCategory = 
  | 'AUTHENTICATION'
  | 'AUTHORIZATION' 
  | 'VALIDATION'
  | 'NETWORK'
  | 'BUSINESS_LOGIC'
  | 'SYSTEM'
  | 'EXTERNAL_SERVICE';

export interface ErrorContext {
  readonly timestamp: Date;
  readonly userId?: string;
  readonly sessionId?: string;
  readonly requestId?: string;
  readonly operation?: string;
  readonly metadata?: Record<string, unknown>;
}

// =====================================================
// ENTERPRISE ERROR BASE CLASS
// =====================================================

export abstract class AppError extends Error {
  public readonly code: string;
  public readonly category: ErrorCategory;
  public readonly severity: ErrorSeverity;
  public readonly context: ErrorContext;
  public readonly auditEventType?: AuditEventType;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    code: string,
    category: ErrorCategory,
    severity: ErrorSeverity,
    context: Partial<ErrorContext> = {},
    auditEventType?: AuditEventType
  ) {
    super(message);
    
    this.name = this.constructor.name;
    this.code = code;
    this.category = category;
    this.severity = severity;
    this.auditEventType = auditEventType;
    this.isOperational = true;
    
    this.context = {
      timestamp: new Date(),
      ...context
    };

    // Ensure stack trace is captured
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Convert error to plain object for logging/serialization
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      category: this.category,
      severity: this.severity,
      context: this.context,
      auditEventType: this.auditEventType,
      stack: this.stack
    };
  }

  /**
   * Check if error should trigger audit log
   */
  shouldAudit(): boolean {
    return this.auditEventType !== undefined || this.severity === 'CRITICAL';
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(): string {
    switch (this.category) {
      case 'AUTHENTICATION':
        return 'Problema de autenticación. Por favor, inicia sesión nuevamente.';
      case 'AUTHORIZATION':
        return 'No tienes permisos para realizar esta acción.';
      case 'VALIDATION':
        return 'Los datos proporcionados no son válidos.';
      case 'NETWORK':
        return 'Problema de conexión. Inténtalo de nuevo.';
      default:
        return 'Ha ocurrido un error. Por favor, contacta con soporte si persiste.';
    }
  }
}

// =====================================================
// SPECIFIC ERROR CLASSES
// =====================================================

export class AuthenticationError extends AppError {
  constructor(
    message: string,
    code: string,
    context: Partial<ErrorContext> = {}
  ) {
    super(
      message,
      code,
      'AUTHENTICATION',
      'HIGH',
      context,
      'auth.login.failure'
    );
  }
}

export class AuthorizationError extends AppError {
  constructor(
    message: string,
    code: string,
    context: Partial<ErrorContext> = {}
  ) {
    super(
      message,
      code,
      'AUTHORIZATION',
      'HIGH',
      context,
      'system.access.denied'
    );
  }
}

export class ValidationError extends AppError {
  public readonly field?: string;
  public readonly value?: unknown;

  constructor(
    message: string,
    field?: string,
    value?: unknown,
    context: Partial<ErrorContext> = {}
  ) {
    super(
      message,
      'VALIDATION_ERROR',
      'VALIDATION',
      'MEDIUM',
      { ...context, metadata: { field, value, ...context.metadata } }
    );
    
    this.field = field;
    this.value = value;
  }
}

export class NetworkError extends AppError {
  public readonly statusCode?: number;
  public readonly endpoint?: string;

  constructor(
    message: string,
    statusCode?: number,
    endpoint?: string,
    context: Partial<ErrorContext> = {}
  ) {
    super(
      message,
      'NETWORK_ERROR',
      'NETWORK',
      'MEDIUM',
      { ...context, metadata: { statusCode, endpoint, ...context.metadata } }
    );
    
    this.statusCode = statusCode;
    this.endpoint = endpoint;
  }
}

export class BusinessLogicError extends AppError {
  constructor(
    message: string,
    code: string,
    context: Partial<ErrorContext> = {}
  ) {
    super(
      message,
      code,
      'BUSINESS_LOGIC',
      'MEDIUM',
      context
    );
  }
}

export class SystemError extends AppError {
  constructor(
    message: string,
    code: string,
    context: Partial<ErrorContext> = {}
  ) {
    super(
      message,
      code,
      'SYSTEM',
      'CRITICAL',
      context,
      'system.error'
    );
  }
}

export class ExternalServiceError extends AppError {
  public readonly service: string;

  constructor(
    message: string,
    service: string,
    context: Partial<ErrorContext> = {}
  ) {
    super(
      message,
      'EXTERNAL_SERVICE_ERROR',
      'EXTERNAL_SERVICE',
      'HIGH',
      { ...context, metadata: { service, ...context.metadata } }
    );
    
    this.service = service;
  }
}

// =====================================================
// ERROR FACTORY & UTILITIES
// =====================================================

export class ErrorFactory {
  static fromFirebaseError(firebaseError: any, context: Partial<ErrorContext> = {}): AppError {
    const code = firebaseError.code || 'UNKNOWN_FIREBASE_ERROR';
    const message = firebaseError.message || 'Error de Firebase desconocido';

    switch (code) {
      case 'auth/email-already-in-use':
        return new AuthenticationError(
          'Este email ya está registrado',
          'EMAIL_ALREADY_IN_USE',
          context
        );
      
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
        return new AuthenticationError(
          'Credenciales inválidas',
          'INVALID_CREDENTIALS',
          context
        );
      
      case 'auth/weak-password':
        return new ValidationError(
          'La contraseña debe tener al menos 6 caracteres',
          'password',
          undefined,
          context
        );
      
      case 'auth/network-request-failed':
        return new NetworkError(
          'Error de red. Verifica tu conexión.',
          undefined,
          'firebase-auth',
          context
        );
      
      default:
        return new ExternalServiceError(
          message,
          'firebase',
          { ...context, metadata: { firebaseCode: code, ...context.metadata } }
        );
    }
  }

  static createValidationError(
    field: string,
    value: unknown,
    reason: string,
    context: Partial<ErrorContext> = {}
  ): ValidationError {
    return new ValidationError(
      `Campo '${field}' inválido: ${reason}`,
      field,
      value,
      context
    );
  }
}

// =====================================================
// ERROR HANDLER INTERFACE
// =====================================================

export interface IErrorHandler {
  handle(error: Error | AppError, context?: Partial<ErrorContext>): Promise<void>;
  handleAsync(error: Error | AppError, context?: Partial<ErrorContext>): void;
}