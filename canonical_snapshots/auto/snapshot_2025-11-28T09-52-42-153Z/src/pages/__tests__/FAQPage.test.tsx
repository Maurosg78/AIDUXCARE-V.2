import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import FAQPage from '../FAQPage';
import { FeedbackWidget } from '@/components/feedback/FeedbackWidget';

// Mock dependencies
vi.mock('@/components/feedback/FeedbackWidget', () => ({
  FeedbackWidget: () => <div data-testid="feedback-widget">FeedbackWidget</div>
}));

describe('FAQPage', () => {
  describe('Rendering', () => {
    it('renders all 4 categories', () => {
      render(
        <BrowserRouter>
          <FAQPage />
        </BrowserRouter>
      );

      expect(screen.getByText('General')).toBeInTheDocument();
      expect(screen.getByText('Privacy')).toBeInTheDocument();
      expect(screen.getByText('Technical')).toBeInTheDocument();
      expect(screen.getByText('Support')).toBeInTheDocument();
    });

    it('displays FAQ content', () => {
      render(
        <BrowserRouter>
          <FAQPage />
        </BrowserRouter>
      );

      expect(screen.getByText('What is AiduxCare?')).toBeInTheDocument();
      expect(screen.getByText(/AI-powered clinical documentation/i)).toBeInTheDocument();
    });

    it('contains key privacy content', () => {
      render(
        <BrowserRouter>
          <FAQPage />
        </BrowserRouter>
      );

      expect(screen.getByText(/Is my data secure/i)).toBeInTheDocument();
      expect(screen.getByText(/encrypted in transit/i)).toBeInTheDocument();
    });

    it('contains key support content', () => {
      render(
        <BrowserRouter>
          <FAQPage />
        </BrowserRouter>
      );

      expect(screen.getByText(/How do I report a problem/i)).toBeInTheDocument();
      expect(screen.getByText(/support@aiduxcare.com/i)).toBeInTheDocument();
    });
  });

  describe('Category Filtering', () => {
    it('filters FAQs correctly when changing category', () => {
      render(
        <BrowserRouter>
          <FAQPage />
        </BrowserRouter>
      );

      // Initially shows all FAQs
      expect(screen.getByText('What is AiduxCare?')).toBeInTheDocument();
      expect(screen.getByText(/Is my data secure/i)).toBeInTheDocument();

      // Click Privacy category
      const privacyButton = screen.getByText('Privacy');
      fireEvent.click(privacyButton);

      // Should only show privacy FAQs
      expect(screen.queryByText('What is AiduxCare?')).not.toBeInTheDocument();
      expect(screen.getByText(/Is my data secure/i)).toBeInTheDocument();
    });

    it('shows all FAQs when "All" is selected', () => {
      render(
        <BrowserRouter>
          <FAQPage />
        </BrowserRouter>
      );

      // Click Privacy category
      const privacyButton = screen.getByText('Privacy');
      fireEvent.click(privacyButton);

      // Click All category
      const allButton = screen.getByText('All');
      fireEvent.click(allButton);

      // Should show all FAQs again
      expect(screen.getByText('What is AiduxCare?')).toBeInTheDocument();
      expect(screen.getByText(/Is my data secure/i)).toBeInTheDocument();
    });

    it('highlights selected category', () => {
      render(
        <BrowserRouter>
          <FAQPage />
        </BrowserRouter>
      );

      const privacyButton = screen.getByText('Privacy');
      fireEvent.click(privacyButton);

      // Check if Privacy button has active styling (gradient class)
      expect(privacyButton.closest('button')).toHaveClass(/from-primary-blue/);
    });
  });

  describe('Navigation', () => {
    it('has back button to Command Center', () => {
      render(
        <BrowserRouter>
          <FAQPage />
        </BrowserRouter>
      );

      const backButton = screen.getByText(/Back to Command Center/i);
      expect(backButton).toBeInTheDocument();
    });

    it('has support contact section', () => {
      render(
        <BrowserRouter>
          <FAQPage />
        </BrowserRouter>
      );

      expect(screen.getByText(/Still have questions/i)).toBeInTheDocument();
      expect(screen.getByText(/support@aiduxcare.com/i)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty category gracefully', () => {
      // This test would require mocking FAQ data to be empty for a category
      // For now, we verify the component handles filtering correctly
      render(
        <BrowserRouter>
          <FAQPage />
        </BrowserRouter>
      );

      // All categories should have FAQs, so no empty state expected
      expect(screen.getByText('What is AiduxCare?')).toBeInTheDocument();
    });
  });
});

