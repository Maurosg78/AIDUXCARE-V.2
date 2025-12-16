/**
 * Error Message Component
 * 
 * Sprint 2: Priority 3 - Professional UX Polish
 * 
 * Professional error messages with consistent styling
 * Market: CA · en-CA · PHIPA/PIPEDA Ready
 */

import React from 'react';
import { AlertCircle, X } from 'lucide-react';

export interface ErrorMessageProps {
  message: string;
  onDismiss?: () => void;
  onRetry?: () => void;
  className?: string;
  variant?: 'default' | 'inline' | 'banner';
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  onDismiss,
  onRetry,
  className = '',
  variant = 'default',
}) => {
  const baseClasses = 'flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4 text-red-800';

  if (variant === 'inline') {
    return (
      <div className={`${baseClasses} ${className}`}>
        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm font-apple flex-1">{message}</p>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-red-400 hover:text-red-600 transition-colors"
            aria-label="Dismiss error"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  if (variant === 'banner') {
    return (
      <div className={`${baseClasses} ${className} fixed top-0 left-0 right-0 z-50 mx-4 mt-4 max-w-7xl`}>
        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm font-apple flex-1">{message}</p>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-red-400 hover:text-red-600 transition-colors"
            aria-label="Dismiss error"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`${baseClasses} ${className}`} role="alert">
      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm font-medium font-apple mb-1">Error</p>
        <p className="text-sm font-apple mb-2">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-sm text-red-700 hover:text-red-900 underline font-medium"
            aria-label="Retry"
          >
            Retry
          </button>
        )}
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-red-400 hover:text-red-600 transition-colors"
          aria-label="Dismiss error"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

