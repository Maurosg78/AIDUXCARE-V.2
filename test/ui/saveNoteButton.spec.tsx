import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import { SaveNoteButton } from '@/components/notes/SaveNoteButton';

vi.mock('@/repositories/notesRepo', () => ({
  createNote: vi.fn(async () => 'note-1'),
  updateNote: vi.fn(async () => {}),
  getLastNoteByPatient: vi.fn(async () => null),
}));

describe('SaveNoteButton', () => {
  it('saves note and shows success', async () => {
    render(<SaveNoteButton
      patientId="p1"
      clinicianUid="c1"
      subjective="s"
      objective="o"
      assessment="a"
      plan="p"
    />);
    const btn = screen.getByRole('button', { name: /save note/i });
    await fireEvent.click(btn);
    expect(await screen.findByRole('status')).toHaveTextContent('Saved');
  });
});
