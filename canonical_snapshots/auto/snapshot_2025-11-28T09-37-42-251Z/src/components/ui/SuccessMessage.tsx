/**
 * Success Message Component
 * 
 * Sprint 2: Priority 3 - Professional UX Polish
 * 
 * Professional success messages with consistent styling
 * Market: CA · en-CA · PHIPA/PIPEDA Ready
 */

import React, { useEffect } from 'react';
import { CheckCircle, X } from 'lucide-react';

export interface SuccessMessageProps {
  message: string;
  onDismiss?: () => void;
  autoDismiss?: number; // milliseconds
  className?: string;
  variant?: 'default' | 'inline' | 'banner' | 'toast';
}

export const SuccessMessage: React.FC<SuccessMessageProps> = ({
  message,
  onDismiss,
  autoDismiss,
  className = '',
  variant = 'default',
}) => {
  useEffect(() => {
    if (autoDismiss && onDismiss) {
      const timer = setTimeout(() => {
        onDismiss();
      }, autoDismiss);
      return () => clearTimeout(timer);
    }
  }, [autoDismiss, onDismiss]);

  const baseClasses = 'flex items-start gap-3 bg-green-50 border border-green-200 rounded-lg p-4 text-green-800';

  if (variant === 'toast') {
    return (
      <div className={`${baseClasses} ${className} fixed bottom-4 right-4 z-50 max-w-sm shadow-lg animate-slide-up`}>
        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm font-apple flex-1">{message}</p>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-green-400 hover:text-green-600 transition-colors"
            aria-label="Dismiss success message"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={`${baseClasses} ${className}`}>
        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm font-apple flex-1">{message}</p>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-green-400 hover:text-green-600 transition-colors"
            aria-label="Dismiss success message"
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
        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm font-apple flex-1">{message}</p>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-green-400 hover:text-green-600 transition-colors"
            aria-label="Dismiss success message"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`${baseClasses} ${className}`} role="status">
      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm font-medium font-apple mb-1">Success</p>
        <p className="text-sm font-apple">{message}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-green-400 hover:text-green-600 transition-colors"
          aria-label="Dismiss success message"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

