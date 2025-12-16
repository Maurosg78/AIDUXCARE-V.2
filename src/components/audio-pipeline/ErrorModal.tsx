/**
 * User-Facing Error Modal Component
 * 
 * Displays a visible modal with clear error message and "Try again" button
 * for audio pipeline failures.
 */

import React from 'react';
import type { ClassifiedError } from '../../core/audio-pipeline/errorClassification';
import { getUserFriendlyMessage } from '../../core/audio-pipeline/errorClassification';

interface ErrorModalProps {
  error: ClassifiedError | null;
  onRetry: () => void;
  onClose: () => void;
}

export const ErrorModal: React.FC<ErrorModalProps> = ({ error, onRetry, onClose }) => {
  if (!error) return null;

  const friendlyMessage = getUserFriendlyMessage(error);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="error-modal-title"
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start mb-4">
          <div className="flex-shrink-0">
            <svg 
              className="h-6 w-6 text-red-600" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
              />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 
              id="error-modal-title"
              className="text-lg font-medium text-gray-900"
            >
              Processing Error
            </h3>
          </div>
          <button
            onClick={onClose}
            className="ml-4 text-gray-400 hover:text-gray-500 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-6">
          <p className="text-sm text-gray-600">
            {friendlyMessage}
          </p>
          {import.meta.env.DEV && (
            <details className="mt-3">
              <summary className="text-xs text-gray-500 cursor-pointer">
                Technical details
              </summary>
              <pre className="mt-2 text-xs text-gray-400 bg-gray-50 p-2 rounded overflow-auto max-h-32">
                {JSON.stringify({ type: error.type, message: error.message }, null, 2)}
              </pre>
            </details>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-3 min-h-[48px] text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-blue"
          >
            Close
          </button>
          <button
            onClick={onRetry}
            className="px-5 py-3 min-h-[48px] text-sm font-medium text-white bg-gradient-to-r from-primary-blue to-primary-purple rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-blue shadow-md"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
};

