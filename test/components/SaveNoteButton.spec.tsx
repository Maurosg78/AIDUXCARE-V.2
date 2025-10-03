import { describe, it, vi, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { CurrentPatientProvider } from '@/context/CurrentPatientContext';
import { SaveNoteButton } from '@/components/notes/SaveNoteButton';

// el flag ya va stubbeado por alias, pero lo mockeamos por si acaso
vi.mock('@/featureFlags/notes', () => ({ isProgressNotesEnabled: () => true }));

// evita problemas de hoisting con vi.mock
const { mockRepo } = vi.hoisted(() => ({
  mockRepo: { createNote: vi.fn(), updateNote: vi.fn() },
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

function wrap(ui: ReactNode) {
  return (
    <CurrentPatientProvider value={{ currentPatient: { id: 'p1' }, currentVisit: { id: 'v1' } }}>
      {ui}
    </CurrentPatientProvider>
  );
}

describe('SaveNoteButton', () => {
  beforeEach(() => {
    mockRepo.createNote.mockReset();
    mockRepo.updateNote.mockReset();
  });

  it('renders only when flag enabled', () => {
    const { container } = render(wrap(<SaveNoteButton subjective="s" objective="o" assessment="a" plan="p" />));
    expect(within(container).getByRole('button', { name: /save note/i })).toBeInTheDocument();
  });

  it('calls createNote on first save', async () => {
    const { container } = render(wrap(<SaveNoteButton subjective="s" objective="o" assessment="a" plan="p" />));
    await fireEvent.click(within(container).getByRole('button', { name: /save note/i }));
    expect(mockRepo.createNote).toHaveBeenCalledOnce();
    expect(mockRepo.updateNote).not.toHaveBeenCalled();
  });

  it('calls updateNote on subsequent save', async () => {
    const { container } = render(wrap(<SaveNoteButton subjective="s" objective="o" assessment="a" plan="p" existingNoteId="n1" />));
    await fireEvent.click(within(container).getByRole('button', { name: /save note/i }));
    expect(mockRepo.updateNote).toHaveBeenCalledOnce();
    expect(mockRepo.createNote).not.toHaveBeenCalled();
  });

  it('disables button when missing required fields', () => {
    const { container } = render(wrap(<SaveNoteButton subjective="" objective="o" assessment="a" plan="p" />));
    expect(within(container).getByRole('button', { name: /save note/i })).toBeDisabled();
  });

  it('shows error message on failure', async () => {
    mockRepo.createNote.mockRejectedValueOnce(new Error('IMMUTABLE'));
    const { container } = render(wrap(<SaveNoteButton subjective="s" objective="o" assessment="a" plan="p" />));
    await fireEvent.click(within(container).getByRole('button', { name: /save note/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/cannot edit signed note/i);
  });
});
