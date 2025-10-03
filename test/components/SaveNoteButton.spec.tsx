import { describe, it, vi, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import type { ReactNode } from 'react';

// Flag ON por defecto (se reinyecta en beforeEach)
vi.mock('@/flags', () => ({ isProgressNotesEnabled: () => true }));

// Repo mockeado y hoisted
const { mockRepo } = vi.hoisted(() => ({
  mockRepo: {
    createNote: vi.fn(),
    updateNote: vi.fn(),
    getLastNoteByPatient: vi.fn(),
  },
}));
vi.mock('@/core/notes/notesRepo', () => ({
  notesRepo: mockRepo,
  NoteError: {
    NOT_FOUND: 'NOT_FOUND',
    IMMUTABLE: 'IMMUTABLE',
    INVALID_STATUS: 'INVALID_STATUS',
    UNAUTHORIZED: 'UNAUTHORIZED',
  },
}));

async function renderWithCtx(ui: ReactNode, pid = 'p1', vid = 'v1') {
  const { CurrentPatientProvider } = await import('@/context/CurrentPatientContext');
  return render(
    <CurrentPatientProvider
      value={{
        currentPatient: pid ? { id: pid } : null,
        currentVisit:   vid ? { id: vid } : null
      }}
    >
      {ui}
    </CurrentPatientProvider>
  );
}

async function loadButton() {
  const m = await import('@/components/notes/SaveNoteButton');
  return m.SaveNoteButton;
}

describe('SaveNoteButton', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.doMock('@/flags', () => ({ isProgressNotesEnabled: () => true }));
    vi.clearAllMocks();
  });

  it('does not render when flag disabled', async () => {
    vi.resetModules();
    vi.doMock('@/flags', () => ({ isProgressNotesEnabled: () => false }));
    const { SaveNoteButton } = await import('@/components/notes/SaveNoteButton');
    const { container } = await renderWithCtx(<SaveNoteButton subjective="s" objective="o" assessment="a" plan="p" />);
    expect(within(container).queryByRole('button', { name: /save note/i })).toBeNull();
  });

  it('renders save button when flag enabled', async () => {
    const SaveNoteButton = await loadButton();
    const { container } = await renderWithCtx(<SaveNoteButton subjective="s" objective="o" assessment="a" plan="p" />);
    expect(within(container).getByRole('button', { name: /save note/i })).toBeInTheDocument();
  });

  it('calls createNote on first save with correct data and stores noteId', async () => {
    const SaveNoteButton = await loadButton();
    mockRepo.createNote.mockResolvedValueOnce({ id: 'abc123' });

    const { container } = await renderWithCtx(
      <SaveNoteButton subjective="s" objective="o" assessment="a" plan="p" clinicianUid="clin1" />
    );

    // 1º click (create) y esperar fin
    await fireEvent.click(within(container).getByRole('button', { name: /save note/i }));
    await screen.findByRole('status');

    expect(mockRepo.createNote).toHaveBeenCalledOnce();
    const payload = mockRepo.createNote.mock.calls[0][0];
    expect(payload).toMatchObject({ patientId: 'p1', visitId: 'v1', clinicianUid: 'clin1', status: 'draft' });

    // 2º click (update)
    await fireEvent.click(within(container).getByRole('button', { name: /save note/i }));
    expect(mockRepo.updateNote).toHaveBeenCalledOnce();
    expect(mockRepo.updateNote).toHaveBeenCalledWith('abc123', expect.any(Object));
  });

  it('disables button and shows spinner during save', async () => {
    const SaveNoteButton = await loadButton();
    let resolveFn!: (v:any)=>void;
    const p = new Promise(res => { resolveFn = res; });
    mockRepo.createNote.mockReturnValueOnce(p as any);

    const { container } = await renderWithCtx(<SaveNoteButton subjective="s" objective="o" assessment="a" plan="p" />);
    const btn = within(container).getByRole('button', { name: /save note/i });
    await fireEvent.click(btn);
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-busy', 'true');

    resolveFn({ id: 'n1' });
  });

  it('shows success message after save completes', async () => {
    const SaveNoteButton = await loadButton();
    mockRepo.createNote.mockResolvedValueOnce({ id: 'ok1' });
    const { container } = await renderWithCtx(<SaveNoteButton subjective="s" objective="o" assessment="a" plan="p" />);
    await fireEvent.click(within(container).getByRole('button', { name: /save note/i }));
    expect(await screen.findByRole('status')).toHaveTextContent(/note saved successfully/i);
  });

  it('shows error message when save fails', async () => {
    const SaveNoteButton = await loadButton();
    mockRepo.createNote.mockRejectedValueOnce(new Error('BOOM'));
    const { container } = await renderWithCtx(<SaveNoteButton subjective="s" objective="o" assessment="a" plan="p" />);
    await fireEvent.click(within(container).getByRole('button', { name: /save note/i }));
    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });

  it('handles IMMUTABLE error with specific message', async () => {
    const SaveNoteButton = await loadButton();
    mockRepo.createNote.mockRejectedValueOnce(new Error('IMMUTABLE'));
    const { container } = await renderWithCtx(<SaveNoteButton subjective="s" objective="o" assessment="a" plan="p" />);
    await fireEvent.click(within(container).getByRole('button', { name: /save note/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/cannot be edited/i);
  });

  it('disables button when missing required fields', async () => {
    const SaveNoteButton = await loadButton();
    const { container } = await renderWithCtx(<SaveNoteButton subjective="" objective="o" assessment="a" plan="p" />);
    expect(within(container).getByRole('button', { name: /save note/i })).toBeDisabled();
  });
});
