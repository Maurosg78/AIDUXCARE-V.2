import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FeedbackWidget } from '../FeedbackWidget';

// Mock FeedbackModal
vi.mock('../FeedbackModal', () => ({
  FeedbackModal: ({ isOpen, onClose }: any) => {
    if (!isOpen) return null;
    return (
      <div data-testid="feedback-modal">
        <button onClick={onClose}>Close</button>
        <div>Feedback Modal Content</div>
      </div>
    );
  },
}));

describe('✅ FASE 1: FeedbackWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('✅ should render feedback button', () => {
    render(<FeedbackWidget />);
    
    const button = screen.getByRole('button', { name: /report feedback/i });
    expect(button).toBeInTheDocument();
  });

  it('✅ should open modal when button is clicked', async () => {
    const user = userEvent.setup();
    render(<FeedbackWidget />);
    
    const button = screen.getByRole('button', { name: /report feedback/i });
    await user.click(button);
    
    await waitFor(() => {
      expect(screen.getByTestId('feedback-modal')).toBeInTheDocument();
    });
  });

  it('✅ should close modal when close is clicked', async () => {
    const user = userEvent.setup();
    render(<FeedbackWidget />);
    
    const button = screen.getByRole('button', { name: /report feedback/i });
    await user.click(button);
    
    await waitFor(() => {
      expect(screen.getByTestId('feedback-modal')).toBeInTheDocument();
    });
    
    const closeButton = screen.getByText('Close');
    await user.click(closeButton);
    
    await waitFor(() => {
      expect(screen.queryByTestId('feedback-modal')).not.toBeInTheDocument();
    });
  });

  it('✅ should have accessible aria-label', () => {
    render(<FeedbackWidget />);
    
    const button = screen.getByRole('button', { name: /report feedback/i });
    expect(button).toHaveAttribute('aria-label', 'Report feedback');
  });
});

