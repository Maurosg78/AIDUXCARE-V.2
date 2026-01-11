import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { FeedbackWidget } from '../FeedbackWidget';
import { FeedbackService } from '@/services/feedbackService';

// Mock logger FIRST (before any imports that use it)
vi.mock('@/shared/utils/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

// Mock useAuth
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { uid: 'test-user-123' },
  }),
}));

// Mock FeedbackService
vi.mock('@/services/feedbackService', () => ({
  FeedbackService: {
    submitFeedback: vi.fn(),
    getAutoContext: vi.fn().mockReturnValue({
      url: 'http://localhost:5173/workflow',
      userAgent: 'test-agent',
      context: {
        currentPage: '/workflow',
      },
    }),
    getEnrichedContext: vi.fn().mockReturnValue({
      url: 'http://localhost:5173/workflow',
      userAgent: 'test-agent',
      context: {
        currentPage: '/workflow',
      },
      timestamp: new Date().toISOString(),
    }),
  }
}));

describe('FeedbackWidget Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders correctly', () => {
      render(
        <BrowserRouter>
          <FeedbackWidget />
        </BrowserRouter>
      );

      const button = screen.getByLabelText('Report feedback');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Submission Flow', () => {
    it('calls FeedbackService on submit', async () => {
      vi.mocked(FeedbackService.submitFeedback).mockResolvedValue({ success: true });

      render(
        <BrowserRouter>
          <FeedbackWidget />
        </BrowserRouter>
      );

      // Open modal
      const button = screen.getByLabelText('Report feedback');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /report feedback/i })).toBeInTheDocument();
      });

      // Fill form and submit
      const descriptionInput = screen.getByLabelText(/description/i);
      fireEvent.change(descriptionInput, { target: { value: 'Test feedback message' } });

      const submitButton = screen.getByRole('button', { name: /submit|enviar/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(FeedbackService.submitFeedback).toHaveBeenCalledWith(
          expect.objectContaining({
            description: 'Test feedback message'
          })
        );
      });
    });

    it('handles loading state during submission', async () => {
      vi.mocked(FeedbackService.submitFeedback).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      render(
        <BrowserRouter>
          <FeedbackWidget />
        </BrowserRouter>
      );

      const button = screen.getByLabelText('Report feedback');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /report feedback/i })).toBeInTheDocument();
      });

      const descriptionInput = screen.getByLabelText(/description/i);
      fireEvent.change(descriptionInput, { target: { value: 'Test' } });

      const submitButton = screen.getByRole('button', { name: /submit|enviar/i });
      fireEvent.click(submitButton);

      // Should show loading state
      expect(submitButton).toBeDisabled();
    });

    it('handles submission success', async () => {
      vi.mocked(FeedbackService.submitFeedback).mockResolvedValue({ success: true });

      render(
        <BrowserRouter>
          <FeedbackWidget />
        </BrowserRouter>
      );

      const button = screen.getByLabelText('Report feedback');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /report feedback/i })).toBeInTheDocument();
      });

      const descriptionInput = screen.getByLabelText(/description/i);
      fireEvent.change(descriptionInput, { target: { value: 'Test feedback' } });

      const submitButton = screen.getByRole('button', { name: /submit|enviar/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/thank you/i)).toBeInTheDocument();
      });
    });

    it('handles submission failure', async () => {
      vi.mocked(FeedbackService.submitFeedback).mockRejectedValue(new Error('Submission failed'));

      render(
        <BrowserRouter>
          <FeedbackWidget />
        </BrowserRouter>
      );

      const button = screen.getByLabelText('Report feedback');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /report feedback/i })).toBeInTheDocument();
      });

      const descriptionInput = screen.getByLabelText(/description/i);
      fireEvent.change(descriptionInput, { target: { value: 'Test feedback' } });

      const submitButton = screen.getByRole('button', { name: /submit|enviar/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error message when submission fails', async () => {
      vi.mocked(FeedbackService.submitFeedback).mockRejectedValue(
        new Error('Network error')
      );

      render(
        <BrowserRouter>
          <FeedbackWidget />
        </BrowserRouter>
      );

      const button = screen.getByLabelText('Report feedback');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /report feedback/i })).toBeInTheDocument();
      });

      const descriptionInput = screen.getByLabelText(/description/i);
      fireEvent.change(descriptionInput, { target: { value: 'Test' } });

      const submitButton = screen.getByRole('button', { name: /submit|enviar/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });
  });
});

