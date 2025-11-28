/**
 * Loading Spinner Component
 * 
 * Sprint 2: Priority 3 - Professional UX Polish
 * 
 * Standardized loading spinner with consistent styling
 * Market: CA · en-CA · PHIPA/PIPEDA Ready
 */

import React from 'react';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-2',
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className = '',
  text,
}) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="flex flex-col items-center gap-3">
        <div
          className={`animate-spin rounded-full border-primary-blue border-t-transparent ${sizeClasses[size]}`}
          role="status"
          aria-label="Loading"
        >
          <span className="sr-only">Loading...</span>
        </div>
        {text && (
          <p className="text-sm text-gray-600 font-apple">{text}</p>
        )}
      </div>
    </div>
  );
};

export const LoadingOverlay: React.FC<{ message?: string }> = ({ message }) => {
  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-xl p-8 max-w-sm mx-4">
        <LoadingSpinner size="lg" text={message || 'Loading...'} />
      </div>
    </div>
  );
};

export const InlineLoading: React.FC<{ text?: string }> = ({ text }) => {
  return (
    <div className="flex items-center gap-2 text-gray-600">
      <LoadingSpinner size="sm" />
      {text && <span className="text-sm font-apple">{text}</span>}
    </div>
  );
};

