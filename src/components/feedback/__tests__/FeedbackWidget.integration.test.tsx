import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { FeedbackWidget } from '../FeedbackWidget';
import { FeedbackService } from '@/services/feedbackService';

// Mock FeedbackService (service externo - permitido para tests)
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
    getEnrichedContext: vi.fn().mockReturnValue({}),
  }
}));

// Mock useAuth (UI test - no requiere Firebase Auth real)
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { uid: 'test-user-123', email: 'test@example.com' },
    loading: false,
    error: null,
  }),
}));

// Test wrapper mínimo (solo BrowserRouter - no AuthProvider real)
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

describe('FeedbackWidget Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders correctly', () => {
      render(
        <TestWrapper>
          <FeedbackWidget />
        </TestWrapper>
      );

      const button = screen.getByLabelText('Report feedback');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Submission Flow', () => {
    it('calls FeedbackService on submit', async () => {
      vi.mocked(FeedbackService.submitFeedback).mockResolvedValue({ success: true });

      render(
        <TestWrapper>
          <FeedbackWidget />
        </TestWrapper>
      );

      // Open modal
      const button = screen.getByLabelText('Report feedback');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /report feedback/i })).toBeInTheDocument();
      });

      // Fill form and submit
      const messageInput = screen.getByPlaceholderText(/describe/i);
      fireEvent.change(messageInput, { target: { value: 'Test feedback message' } });

      // Wait for submit button to be enabled (state observable)
      const submitButton = screen.getByRole('button', { name: /submit/i });
      await waitFor(() => {
        expect(submitButton).toBeEnabled();
      });

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
        <TestWrapper>
          <FeedbackWidget />
        </TestWrapper>
      );

      const button = screen.getByLabelText('Report feedback');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /report feedback/i })).toBeInTheDocument();
      });

      const messageInput = screen.getByPlaceholderText(/describe/i);
      fireEvent.change(messageInput, { target: { value: 'Test' } });

      const submitButton = screen.getByRole('button', { name: /submit/i });
      fireEvent.click(submitButton);

      // Should show loading state
      expect(submitButton).toBeDisabled();
    });

    it('handles submission success', async () => {
      vi.mocked(FeedbackService.submitFeedback).mockResolvedValue({ success: true });

      render(
        <TestWrapper>
          <FeedbackWidget />
        </TestWrapper>
      );

      const button = screen.getByLabelText('Report feedback');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /report feedback/i })).toBeInTheDocument();
      });

      const messageInput = screen.getByPlaceholderText(/describe/i);
      fireEvent.change(messageInput, { target: { value: 'Test feedback' } });

      const submitButton = screen.getByRole('button', { name: /submit/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/thank you/i)).toBeInTheDocument();
      });
    });

    it('handles submission failure', async () => {
      vi.mocked(FeedbackService.submitFeedback).mockRejectedValue(new Error('Submission failed'));

      render(
        <TestWrapper>
          <FeedbackWidget />
        </TestWrapper>
      );

      const button = screen.getByLabelText('Report feedback');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /report feedback/i })).toBeInTheDocument();
      });

      const messageInput = screen.getByPlaceholderText(/describe/i);
      fireEvent.change(messageInput, { target: { value: 'Test feedback' } });

      const submitButton = screen.getByRole('button', { name: /submit/i });
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
        <TestWrapper>
          <FeedbackWidget />
        </TestWrapper>
      );

      const button = screen.getByLabelText('Report feedback');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /report feedback/i })).toBeInTheDocument();
      });

      const messageInput = screen.getByPlaceholderText(/describe/i);
      fireEvent.change(messageInput, { target: { value: 'Test' } });

      const submitButton = screen.getByRole('button', { name: /submit/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });
  });
});

