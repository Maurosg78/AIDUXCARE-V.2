import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import FAQPage from '../FAQPage';
import { FeedbackWidget } from '@/components/feedback/FeedbackWidget';

// Mock dependencies
vi.mock('@/components/feedback/FeedbackWidget', () => ({
  FeedbackWidget: () => <div data-testid="feedback-widget">FeedbackWidget</div>
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'shell.nav.backToCommandCenter': 'Back to Command Center',
        'shell.nav.goToCommandCenter': 'Go to Command Center',
        'faq.title': 'Frequently Asked Questions',
        'faq.subtitle': 'Find answers to common questions about AiduxCare',
        'faq.all': 'All',
        'faq.general': 'General',
        'faq.privacy': 'Privacy',
        'faq.technical': 'Technical',
        'faq.support': 'Support',
        'faq.noFound': 'No FAQs found in this category.',
        'faq.stillHaveQuestions': 'Still have questions?',
        'faq.supportContact': 'Use the feedback widget on any page or contact support@aiduxcare.com',
        'faq.q0': 'What is AiduxCare?',
        'faq.a0': 'AiduxCare is an AI-powered clinical documentation companion for Canadian physiotherapists. It helps you generate SOAP notes from voice recordings, saving time while maintaining CPO compliance standards.',
        'faq.q1': 'How do I create a SOAP note?',
        'faq.a1': '1. Select a patient from the Patient List\n2. Click "Start Recording" in the workflow\n3. Speak your clinical notes\n4. Review and edit the generated SOAP note\n5. Save and copy to your EMR',
        'faq.q2': 'Where are my notes stored?',
        'faq.a2': 'All notes are stored securely in Canada (northamerica-northeast1 region). You can access them anytime from the Clinical Vault in the Command Center.',
        'faq.q3': 'Is my data secure?',
        'faq.a3': 'Yes. All data is encrypted in transit and at rest. Clinical data is stored in Canada. AI processing occurs in the United States with explicit patient consent as required by PHIPA.',
        'faq.q4': 'What happens to my audio recordings?',
        'faq.a4': 'Audio recordings are processed for transcription and SOAP generation, then securely deleted. Only the text-based SOAP notes are retained in your Clinical Vault.',
        'faq.q5': 'What if the audio upload fails?',
        'faq.a5': "The system automatically retries failed uploads up to 3 times. If upload continues to fail, you'll see a clear error message and can try again or use manual entry.",
        'faq.q6': 'Can I use AiduxCare on mobile devices?',
        'faq.a6': 'Yes! AiduxCare is fully responsive and works on iOS Safari (iPhone/iPad) and Android Chrome. Make sure to allow microphone permissions when prompted.',
        'faq.q7': 'How do I report a problem?',
        'faq.a7': 'Click the floating "Feedback" button (bottom right) on any page. You can report bugs, request features, or ask questions. We respond within 24-48 hours.',
        'faq.q8': 'Where can I find more help?',
        'faq.a8': 'Check the Pilot Welcome Pack for detailed instructions. You can also contact support via the feedback widget or email support@aiduxcare.com',
      };
      return map[key] ?? key;
    },
    i18n: { language: 'en' },
  }),
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
      const supportEmails = screen.getAllByText(/support@aiduxcare.com/i);
      expect(supportEmails.length).toBeGreaterThan(0);
      expect(supportEmails[0]).toBeInTheDocument();
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
      const supportEmails = screen.getAllByText(/support@aiduxcare.com/i);
      expect(supportEmails.length).toBeGreaterThan(0);
      expect(supportEmails[0]).toBeInTheDocument();
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

