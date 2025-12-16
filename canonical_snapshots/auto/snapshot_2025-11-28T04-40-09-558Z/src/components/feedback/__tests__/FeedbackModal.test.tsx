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
  },
}));

describe('✅ FASE 1: FeedbackModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('✅ should render modal when isOpen is true', () => {
    render(<FeedbackModal isOpen={true} onClose={vi.fn()} />);
    
    expect(screen.getByText(/Reportar Feedback/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Tipo de feedback/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Severidad/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Descripción/i)).toBeInTheDocument();
  });

  it('✅ should not render modal when isOpen is false', () => {
    render(<FeedbackModal isOpen={false} onClose={vi.fn()} />);
    
    expect(screen.queryByText(/Reportar Feedback/i)).not.toBeInTheDocument();
  });

  it('✅ should submit feedback with correct data', async () => {
    const user = userEvent.setup();
    const mockSubmitFeedback = vi.mocked(FeedbackService.submitFeedback);
    
    render(<FeedbackModal isOpen={true} onClose={vi.fn()} />);
    
    // Fill form
    const description = screen.getByLabelText(/Descripción/i);
    await user.type(description, 'Test bug description');
    
    // Select type
    const typeSelect = screen.getByLabelText(/Tipo de feedback/i);
    await user.selectOptions(typeSelect, 'bug');
    
    // Select severity
    const severitySelect = screen.getByLabelText(/Severidad/i);
    await user.selectOptions(severitySelect, 'critical');
    
    // Submit
    const submitButton = screen.getByRole('button', { name: /Enviar Feedback/i });
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
    
    const description = screen.getByLabelText(/Descripción/i);
    await user.type(description, 'Test feedback');
    
    const submitButton = screen.getByRole('button', { name: /Enviar Feedback/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/¡Feedback enviado exitosamente!/i)).toBeInTheDocument();
    });
  });

  it('✅ should show error if description is empty', async () => {
    const user = userEvent.setup();
    
    render(<FeedbackModal isOpen={true} onClose={vi.fn()} />);
    
    const submitButton = screen.getByRole('button', { name: /Enviar Feedback/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Por favor describe el problema/i)).toBeInTheDocument();
    });
  });

  it('✅ should disable submit button when submitting', async () => {
    const user = userEvent.setup();
    const mockSubmitFeedback = vi.mocked(FeedbackService.submitFeedback);
    mockSubmitFeedback.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    render(<FeedbackModal isOpen={true} onClose={vi.fn()} />);
    
    const description = screen.getByLabelText(/Descripción/i);
    await user.type(description, 'Test feedback');
    
    const submitButton = screen.getByRole('button', { name: /Enviar Feedback/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(submitButton).toBeDisabled();
      expect(screen.getByText(/Enviando/i)).toBeInTheDocument();
    });
  });
});

