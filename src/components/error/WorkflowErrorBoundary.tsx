import React, { Component, ErrorInfo, ReactNode } from 'react';
import { FeedbackService } from '../../services/feedbackService';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * WorkflowErrorBoundary
 * 
 * Error boundary for ProfessionalWorkflowPage.
 * Automatically captures errors and allows users to report feedback.
 */
export class WorkflowErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[WorkflowErrorBoundary] Caught error:', error, errorInfo);
    
    // Update state with error info
    this.setState({
      error,
      errorInfo,
    });

    // Automatically submit error feedback
    FeedbackService.submitErrorFeedback(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: 'WorkflowErrorBoundary',
    }).catch((err) => {
      console.error('[WorkflowErrorBoundary] Failed to submit error feedback:', err);
    });
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <svg
                  className="w-12 h-12 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Algo salió mal
                </h2>
                <p className="text-gray-600 mb-4">
                  Ha ocurrido un error inesperado en el workflow. El error ha sido reportado
                  automáticamente al equipo técnico.
                </p>
                {this.state.error && (
                  <details className="mb-4">
                    <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                      Detalles técnicos (click para expandir)
                    </summary>
                    <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto max-h-40">
                      {this.state.error.toString()}
                      {this.state.errorInfo?.componentStack && (
                        <div className="mt-2 text-gray-600">
                          {this.state.errorInfo.componentStack}
                        </div>
                      )}
                    </pre>
                  </details>
                )}
                <div className="flex items-center gap-3">
                  <button
                    onClick={this.handleRetry}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Reintentar
                  </button>
                  <a
                    href="/workflow"
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Volver al inicio
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

