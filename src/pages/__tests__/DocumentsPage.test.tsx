import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import DocumentsPage from '../DocumentsPage';
import PersistenceService from '@/services/PersistenceService';
import { useAuth } from '@/context/AuthContext';

// Mock dependencies
vi.mock('@/services/PersistenceService');
vi.mock('@/context/AuthContext');
vi.mock('@/components/feedback/FeedbackWidget', () => ({
  FeedbackWidget: () => <div data-testid="feedback-widget">FeedbackWidget</div>
}));

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
});

const mockNotes = [
  {
    id: 'note-1',
    patientId: 'patient-001',
    sessionId: 'session-001',
    soapData: {
      subjective: 'Patient reports lower back pain',
      objective: 'Limited range of motion',
      assessment: 'Lumbar strain',
      plan: 'Physical therapy and exercises',
      confidence: 0.95,
      timestamp: '2025-11-15T10:00:00Z'
    },
    encryptedData: { iv: 'test', encryptedData: 'test' },
    createdAt: '2025-11-15T10:00:00Z',
    updatedAt: '2025-11-15T10:00:00Z'
  },
  {
    id: 'note-2',
    patientId: 'patient-002',
    sessionId: 'session-002',
    soapData: {
      subjective: 'Patient reports shoulder pain',
      objective: 'Reduced mobility',
      assessment: 'Rotator cuff injury',
      plan: 'Rest and rehabilitation',
      confidence: 0.92,
      timestamp: '2025-11-14T14:00:00Z'
    },
    encryptedData: { iv: 'test', encryptedData: 'test' },
    createdAt: '2025-11-14T14:00:00Z',
    updatedAt: '2025-11-14T14:00:00Z'
  }
];

describe('DocumentsPage', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      user: { uid: 'user-123', email: 'test@example.com' },
      loading: false,
      logout: vi.fn()
    } as any);

    vi.mocked(PersistenceService.getAllNotes).mockResolvedValue(mockNotes as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders without errors with a list of notes', async () => {
      render(
        <BrowserRouter>
          <DocumentsPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Clinical Vault')).toBeInTheDocument();
      });

      expect(screen.getByText(/patient-001/i)).toBeInTheDocument();
        expect(screen.getByText(/patient-002/i)).toBeInTheDocument();
    });

    it('displays loading state initially', () => {
      vi.mocked(PersistenceService.getAllNotes).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(
        <BrowserRouter>
          <DocumentsPage />
        </BrowserRouter>
      );

      expect(screen.getByText('Loading documents...')).toBeInTheDocument();
    });

    it('displays empty state when no notes', async () => {
      vi.mocked(PersistenceService.getAllNotes).mockResolvedValue([]);

      render(
        <BrowserRouter>
          <DocumentsPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('No notes yet')).toBeInTheDocument();
      });
    });
  });

  describe('Sorting', () => {
    it('orders notes by date (newest first)', async () => {
      render(
        <BrowserRouter>
          <DocumentsPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        const notes = screen.getAllByText(/patient-/);
        // First note should be patient-001 (newer date: 2025-11-15)
        expect(notes[0]).toHaveTextContent('patient-001');
        // Second note should be patient-002 (older date: 2025-11-14)
        expect(notes[1]).toHaveTextContent('patient-002');
      });
    });
  });

  describe('Search Functionality', () => {
    it('filters by patientId', async () => {
      render(
        <BrowserRouter>
          <DocumentsPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/patient-001/i)).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search by patient ID, content...');
      fireEvent.change(searchInput, { target: { value: 'patient-001' } });

      await waitFor(() => {
        expect(screen.getByText(/patient-001/i)).toBeInTheDocument();
        expect(screen.queryByText(/patient-002/i)).not.toBeInTheDocument();
      });
    });

    it('filters by content within S/O/A/P sections', async () => {
      render(
        <BrowserRouter>
          <DocumentsPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/patient-001/i)).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search by patient ID, content...');
      fireEvent.change(searchInput, { target: { value: 'lower back pain' } });

      await waitFor(() => {
        expect(screen.getByText(/patient-001/i)).toBeInTheDocument();
        expect(screen.queryByText(/patient-002/i)).not.toBeInTheDocument();
      });
    });

    it('shows "No notes found" when search has no results', async () => {
      render(
        <BrowserRouter>
          <DocumentsPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/patient-001/i)).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search by patient ID, content...');
      fireEvent.change(searchInput, { target: { value: 'nonexistent-patient' } });

      await waitFor(() => {
        expect(screen.getByText('No notes found')).toBeInTheDocument();
      });
    });
  });

  describe('Copy to Clipboard', () => {
    it('calls clipboard writeText function', async () => {
      render(
        <BrowserRouter>
          <DocumentsPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/patient-001/i)).toBeInTheDocument();
      });

      const copyButtons = screen.getAllByTitle('Copy to clipboard');
      fireEvent.click(copyButtons[0]);

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalled();
      });
    });

    it('copied text includes all SOAP sections', async () => {
      render(
        <BrowserRouter>
          <DocumentsPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/patient-001/i)).toBeInTheDocument();
      });

      const copyButtons = screen.getAllByTitle('Copy to clipboard');
      fireEvent.click(copyButtons[0]);

      await waitFor(() => {
        const copiedText = vi.mocked(navigator.clipboard.writeText).mock.calls[0][0];
        expect(copiedText).toContain('SUBJECTIVE');
        expect(copiedText).toContain('OBJECTIVE');
        expect(copiedText).toContain('ASSESSMENT');
        expect(copiedText).toContain('PLAN');
        expect(copiedText).toContain('Patient reports lower back pain');
        expect(copiedText).toContain('Limited range of motion');
        expect(copiedText).toContain('Lumbar strain');
        expect(copiedText).toContain('Physical therapy and exercises');
      });
    });
  });

  describe('Preview Modal', () => {
    it('opens when clicking on a note', async () => {
      render(
        <BrowserRouter>
          <DocumentsPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/patient-001/i)).toBeInTheDocument();
      });

      const previewButtons = screen.getAllByTitle('Preview');
      fireEvent.click(previewButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('SOAP Note Preview')).toBeInTheDocument();
      });
    });

    it('closes correctly', async () => {
      render(
        <BrowserRouter>
          <DocumentsPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/patient-001/i)).toBeInTheDocument();
      });

      const previewButtons = screen.getAllByTitle('Preview');
      fireEvent.click(previewButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('SOAP Note Preview')).toBeInTheDocument();
      });

      const closeButton = screen.getByText('✕');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText('SOAP Note Preview')).not.toBeInTheDocument();
      });
    });

    it('displays all SOAP sections', async () => {
      render(
        <BrowserRouter>
          <DocumentsPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/patient-001/i)).toBeInTheDocument();
      });

      const previewButtons = screen.getAllByTitle('Preview');
      fireEvent.click(previewButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('SUBJECTIVE')).toBeInTheDocument();
        expect(screen.getByText('OBJECTIVE')).toBeInTheDocument();
        expect(screen.getByText('ASSESSMENT')).toBeInTheDocument();
        expect(screen.getByText('PLAN')).toBeInTheDocument();
        expect(screen.getByText('Patient reports lower back pain')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles error when loading notes', async () => {
      vi.mocked(PersistenceService.getAllNotes).mockRejectedValue(new Error('Failed to load'));

      render(
        <BrowserRouter>
          <DocumentsPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        // Should show empty state or error handling
        expect(screen.queryByText('Loading documents...')).not.toBeInTheDocument();
      });
    });

    it('handles empty search query', async () => {
      render(
        <BrowserRouter>
          <DocumentsPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/patient-001/i)).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search by patient ID, content...');
      fireEvent.change(searchInput, { target: { value: '' } });

      await waitFor(() => {
        expect(screen.getByText(/patient-001/i)).toBeInTheDocument();
        expect(screen.getByText(/patient-002/i)).toBeInTheDocument();
      });
    });
  });
});

