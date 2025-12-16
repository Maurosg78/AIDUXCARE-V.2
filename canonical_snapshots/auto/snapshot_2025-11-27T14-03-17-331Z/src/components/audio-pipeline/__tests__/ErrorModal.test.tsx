/**
 * Tests for Error Modal Component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorModal } from '../ErrorModal';
import type { ClassifiedError } from '../../../core/audio-pipeline/errorClassification';

describe('ErrorModal', () => {
  it('should not render when error is null', () => {
    const { container } = render(
      <ErrorModal error={null} onRetry={vi.fn()} onClose={vi.fn()} />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('should render modal with error message', () => {
    const error: ClassifiedError = {
      type: 'network_error',
      originalError: new Error('Connection failed'),
      message: 'Connection failed'
    };

    render(
      <ErrorModal error={error} onRetry={vi.fn()} onClose={vi.fn()} />
    );

    expect(screen.getByText('Processing Error')).toBeInTheDocument();
    expect(screen.getByText(/connection/i)).toBeInTheDocument();
  });

  it('should call onRetry when Try Again button is clicked', () => {
    const onRetry = vi.fn();
    const error: ClassifiedError = {
      type: 'timeout',
      originalError: new Error('Timeout'),
      message: 'Timeout'
    };

    render(
      <ErrorModal error={error} onRetry={onRetry} onClose={vi.fn()} />
    );

    const tryAgainButton = screen.getByText('Try Again');
    fireEvent.click(tryAgainButton);

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when Close button is clicked', () => {
    const onClose = vi.fn();
    const error: ClassifiedError = {
      type: 'whisper_error',
      originalError: new Error('Transcription failed'),
      message: 'Transcription failed'
    };

    render(
      <ErrorModal error={error} onRetry={vi.fn()} onClose={onClose} />
    );

    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    const error: ClassifiedError = {
      type: 'gpt_error',
      originalError: new Error('AI error'),
      message: 'AI error'
    };

    render(
      <ErrorModal error={error} onRetry={vi.fn()} onClose={onClose} />
    );

    const backdrop = screen.getByRole('dialog');
    fireEvent.click(backdrop);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should not close when modal content is clicked', () => {
    const onClose = vi.fn();
    const error: ClassifiedError = {
      type: 'storage_error',
      originalError: new Error('Storage error'),
      message: 'Storage error'
    };

    render(
      <ErrorModal error={error} onRetry={vi.fn()} onClose={onClose} />
    );

    const modalContent = screen.getByText('Processing Error').closest('div');
    if (modalContent) {
      fireEvent.click(modalContent);
    }

    // Should not call onClose when clicking modal content
    expect(onClose).not.toHaveBeenCalled();
  });
});

