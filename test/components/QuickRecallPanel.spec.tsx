import { describe, it, vi, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';

vi.mock('@/flags', () => ({ isProgressNotesEnabled: () => true }));

const { mockRepo } = vi.hoisted(() => ({
  mockRepo: {
    getLastNoteByPatient: vi.fn(),
  },
}));
vi.mock('@/core/notes/notesRepo', () => ({
  notesRepo: mockRepo,
}));

async function renderWithCtx(ui: ReactNode, pid = 'pX') {
  const { CurrentPatientProvider } = await import('@/context/CurrentPatientContext');
  return render(
    <CurrentPatientProvider
      value={{
        currentPatient: pid ? { id: pid } : null,
        currentVisit: null
      }}
    >
      {ui}
    </CurrentPatientProvider>
  );
}

async function loadPanel() {
  const m = await import('@/components/notes/QuickRecallPanel');
  return m.default;
}

describe('QuickRecallPanel', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.doMock('@/flags', () => ({ isProgressNotesEnabled: () => true }));
    vi.clearAllMocks();
  });

  it('does not render when feature flag disabled', async () => {
    vi.resetModules();
    vi.doMock('@/flags', () => ({ isProgressNotesEnabled: () => false }));
    const Panel = (await import('@/components/notes/QuickRecallPanel')).default;
    const { container } = await renderWithCtx(<Panel />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows loading state while fetching', async () => {
    const Panel = await loadPanel();
    mockRepo.getLastNoteByPatient.mockReturnValue(new Promise(() => {}));
    await renderWithCtx(<Panel />);
    expect(await screen.findByRole('status')).toHaveTextContent(/loading/i);
  });

  it('displays "No previous visits" when result is null', async () => {
    const Panel = await loadPanel();
    mockRepo.getLastNoteByPatient.mockResolvedValueOnce(null);
    await renderWithCtx(<Panel />);
    await waitFor(() => expect(screen.getByText(/no previous visits/i)).toBeInTheDocument());
  });

  it('renders note summary with formatted date and truncated subjective', async () => {
    const Panel = await loadPanel();
    const longText = 'x'.repeat(300);
    mockRepo.getLastNoteByPatient.mockResolvedValueOnce({
      id: 'n1',
      status: 'draft',
      subjective: longText,
      createdAt: new Date('2025-10-08T12:00:00.000Z'),
    });
    await renderWithCtx(<Panel />);
    expect(await screen.findByText(/Last visit:/i)).toHaveTextContent(/Oct \d{1,2}, 2025/);
    const para = await screen.findByText((_, el) => el?.tagName.toLowerCase() === 'p');
    expect(para!.textContent!.length).toBeLessThanOrEqual(151);
  });

  it('shows correct status badge color for signed', async () => {
    const Panel = await loadPanel();
    mockRepo.getLastNoteByPatient.mockResolvedValueOnce({
      id: 'n2', status: 'signed', createdAt: Date.now()
    });
    await renderWithCtx(<Panel />);
    const badge = await screen.findByTestId('status-badge');
    expect(badge.className).toMatch(/green/);
  });

  it('handles fetch errors gracefully', async () => {
    const Panel = await loadPanel();
    mockRepo.getLastNoteByPatient.mockRejectedValueOnce(new Error('boom'));
    await renderWithCtx(<Panel />);
    expect(await screen.findByRole('alert')).toHaveTextContent(/could not load/i);
  });
});
