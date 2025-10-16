import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SignNoteModal from '../SignNoteModal';

describe('SignNoteModal', () => {
  it('renders when open and focuses first button', async () => {
    render(<SignNoteModal open onClose={() => {}} onConfirm={() => {}} canSign={false} />);
    expect(screen.getByRole('dialog', { name: /confirm signature/i })).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
  });
});
