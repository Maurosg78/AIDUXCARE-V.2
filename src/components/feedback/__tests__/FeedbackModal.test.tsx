import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FeedbackModal } from '../FeedbackModal';
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
    submitFeedback: vi.fn().mockResolvedValue(undefined),
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
  },
}));

describe('✅ FASE 1: FeedbackModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('✅ should render modal when isOpen is true', () => {
    render(<FeedbackModal isOpen={true} onClose={vi.fn()} />);
    
    expect(screen.getByText(/Report Feedback/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Feedback Type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Severity/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
  });

  it('✅ should not render modal when isOpen is false', () => {
    render(<FeedbackModal isOpen={false} onClose={vi.fn()} />);
    
    expect(screen.queryByText(/Report Feedback/i)).not.toBeInTheDocument();
  });

  it('✅ should submit feedback with correct data', async () => {
    const user = userEvent.setup();
    const mockSubmitFeedback = vi.mocked(FeedbackService.submitFeedback);
    
    render(<FeedbackModal isOpen={true} onClose={vi.fn()} />);
    
    // Fill form
    const description = screen.getByLabelText(/Description/i);
    await user.type(description, 'Test bug description');
    
    // Select type
    const typeSelect = screen.getByLabelText(/Feedback Type/i);
    await user.selectOptions(typeSelect, 'bug');
    
    // Select severity
    const severitySelect = screen.getByLabelText(/Severity/i);
    await user.selectOptions(severitySelect, 'critical');
    
    // Submit
    const submitButton = screen.getByRole('button', { name: /Submit Feedback/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockSubmitFeedback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'bug',
          severity: 'critical',
          description: 'Test bug description',
          userId: 'test-user-123',
        })
      );
    });
  });

  it('✅ should show success message after submission', async () => {
    const user = userEvent.setup();
    
    render(<FeedbackModal isOpen={true} onClose={vi.fn()} />);
    
    const description = screen.getByLabelText(/Description/i);
    await user.type(description, 'Test feedback');
    
    const submitButton = screen.getByRole('button', { name: /Submit Feedback/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Feedback submitted successfully/i)).toBeInTheDocument();
    });
  });

  it('✅ should disable submit button if description is empty', () => {
    render(<FeedbackModal isOpen={true} onClose={vi.fn()} />);
    
    const submitButton = screen.getByRole('button', { name: /Submit Feedback/i });
    expect(submitButton).toBeDisabled();
  });

  it('✅ should disable submit button when submitting', async () => {
    const user = userEvent.setup();
    const mockSubmitFeedback = vi.mocked(FeedbackService.submitFeedback);
    mockSubmitFeedback.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    render(<FeedbackModal isOpen={true} onClose={vi.fn()} />);
    
    const description = screen.getByLabelText(/Description/i);
    await user.type(description, 'Test feedback');
    
    const submitButton = screen.getByRole('button', { name: /Submit Feedback/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(submitButton).toBeDisabled();
      expect(screen.getByText(/Submitting/i)).toBeInTheDocument();
    });
  });
});

