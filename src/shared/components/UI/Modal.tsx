import React from 'react';
import { cn } from '@/lib/utils';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  size?: ModalSize;
  headerTitle?: React.ReactNode;
  headerDescription?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const sizeStyles: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-full mx-4',
};

export const Modal = React.forwardRef<HTMLDivElement, ModalProps>(
  (
    {
      isOpen,
      onClose,
      size = 'md',
      headerTitle,
      headerDescription,
      children,
      className,
    },
    ref
  ) => {
    if (!isOpen) return null;

    const handleBackdropClick = (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    };

    return (
      <div
        ref={ref}
        className="fixed inset-0 z-50 flex items-center justify-center"
        role="dialog"
        aria-modal="true"
        aria-labelledby={headerTitle ? 'modal-title' : undefined}
        aria-describedby={headerDescription ? 'modal-description' : undefined}
      >
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          role="button" tabIndex={0} onClick={handleBackdropClick} onKeyDown={(e) => e.key === "Enter" && onClose()}
          aria-hidden="true"
        />

        {/* Modal */}
        <div
          className={cn(
            'relative bg-white rounded-lg shadow-xl w-full mx-4',
            sizeStyles[size],
            className
          )}
        >
          {/* Header */}
          {(headerTitle || headerDescription) && (
            <div className="px-6 py-4 border-b border-gray-200">
              {headerTitle && (
                <h2
                  id="modal-title"
                  className="text-lg font-semibold text-gray-900"
                >
                  {headerTitle}
                </h2>
              )}
              {headerDescription && (
                <p
                  id="modal-description"
                  className="mt-1 text-sm text-gray-500"
                >
                  {headerDescription}
                </p>
              )}
            </div>
          )}

          {/* Content */}
          <div className="px-6 py-4">{children}</div>

          {/* Close button */}
          <button
            type="button"
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    );
  }
);

Modal.displayName = 'Modal'; 