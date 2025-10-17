import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { NoteHistoryCard } from '../NoteHistoryCard';
import { ClinicalNote } from '@/types/notes';
import { Timestamp } from 'firebase/firestore';

const mockNote: ClinicalNote = {
  id: 'test-note-1',
  patientId: 'patient-1',
  clinicianUid: 'clinician-1',
  status: 'signed',
  subjective: 'Patient reports back pain',
  objective: 'Limited range of motion observed',
  assessment: 'Lumbar strain diagnosed',
  plan: 'Physical therapy recommended',
  createdAt: Timestamp.fromDate(new Date('2024-10-15')),
  updatedAt: Timestamp.fromDate(new Date('2024-10-15'))
};

describe('NoteHistoryCard', () => {
  const mockOnClick = jest.fn();

  beforeEach(() => {
    mockOnClick.mockClear();
  });

  it('renders note information correctly', () => {
    render(
      <NoteHistoryCard 
        note={mockNote} 
        isSelected={false} 
        onClick={mockOnClick} 
      />
    );

    expect(screen.getByText('Oct 15, 2024')).toBeInTheDocument();
    expect(screen.getByText(/Patient reports back pain/)).toBeInTheDocument();
    expect(screen.getByText(/Limited range of motion/)).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    render(
      <NoteHistoryCard 
        note={mockNote} 
        isSelected={false} 
        onClick={mockOnClick} 
      />
    );

    fireEvent.click(screen.getByRole('button'));
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });
});
