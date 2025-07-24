/**
 * ⚠️ **Enterprise Error Boundary**
 * 
 * Error Boundary enterprise con:
 * - Manejo global de errores React
 * - Logging automático de errores
 * - UI profesional de error
 * - Recovery mechanisms
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AppError, SystemError } from '../../core/errors/AppError';
import { isDebugEnabled } from '../../core/config/environment';

// =====================================================
// TYPES & INTERFACES
// =====================================================

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

// =====================================================
// ERROR BOUNDARY COMPONENT
// =====================================================

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Generate unique error ID for tracking
    const errorId = `EB_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    
    // Log error details
    this.logError(error, errorInfo);
    
    // In production, you might want to send this to an error reporting service
    if (!isDebugEnabled()) {
      this.reportErrorToService(error, errorInfo);
    }
  }

  private logError(error: Error, errorInfo: ErrorInfo): void {
    const errorDetails = {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      errorInfo: {
        componentStack: errorInfo.componentStack
      },
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      errorId: this.state.errorId
    };

    console.error('🚨 Error Boundary caught an error:', errorDetails);
    
    // Create a SystemError for consistent error handling
    const systemError = new SystemError(
      `React Error Boundary: ${error.message}`,
      'REACT_ERROR_BOUNDARY',
      {
        metadata: errorDetails
      }
    );

    console.error('🚨 Processed as SystemError:', systemError.toJSON());
  }

  private reportErrorToService(error: Error, errorInfo: ErrorInfo): void {
    // TODO: Implement error reporting to external service (Sentry, LogRocket, etc.)
    console.log('📊 Error would be reported to monitoring service:', {
      errorId: this.state.errorId,
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });
  }

  private handleReload = (): void => {
    window.location.reload();
  };

  private handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };

  private handleGoHome = (): void => {
    window.location.href = '/';
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
            
            {/* Error Icon */}
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>

            {/* Error Title */}
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Algo salió mal
            </h1>

            {/* Error Message */}
            <p className="text-gray-600 mb-6">
              Se ha producido un error inesperado en la aplicación. 
              Nuestro equipo ha sido notificado automáticamente.
            </p>

            {/* Error ID (for support) */}
            {this.state.errorId && (
              <div className="bg-gray-50 border border-gray-200 rounded-md p-3 mb-6">
                <p className="text-xs text-gray-500 mb-1">ID de Error (para soporte):</p>
                <p className="text-xs font-mono text-gray-700 break-all">
                  {this.state.errorId}
                </p>
              </div>
            )}

            {/* Debug Information (only in development) */}
            {isDebugEnabled() && this.state.error && (
              <details className="mb-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Detalles técnicos (modo desarrollo)
                </summary>
                <div className="mt-2 p-3 bg-gray-100 rounded text-xs">
                  <p className="font-semibold text-red-600 mb-2">
                    {this.state.error.name}: {this.state.error.message}
                  </p>
                  <pre className="text-gray-600 whitespace-pre-wrap text-xs overflow-auto max-h-40">
                    {this.state.error.stack}
                  </pre>
                  {this.state.errorInfo && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <p className="font-semibold text-blue-600 mb-1">Component Stack:</p>
                      <pre className="text-gray-600 whitespace-pre-wrap text-xs">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={this.handleReset}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                Intentar de nuevo
              </button>
              
              <div className="flex space-x-3">
                <button
                  onClick={this.handleGoHome}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Ir al inicio
                </button>
                <button
                  onClick={this.handleReload}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Recargar página
                </button>
              </div>
            </div>

            {/* Support Contact */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Si el problema persiste, contacta con soporte técnico:
              </p>
              <p className="text-xs text-blue-600 mt-1">
                support@aiduxcare.com
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}