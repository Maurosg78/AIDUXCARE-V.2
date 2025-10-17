import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { NoteHistoryFilters } from '../NoteHistoryFilters';
import { PatientHistoryFilters } from '@/hooks/usePatientHistory';

describe('NoteHistoryFilters', () => {
  const mockFilters: PatientHistoryFilters = {
    status: 'all',
    searchQuery: ''
  };
  const mockOnFiltersChange = jest.fn();

  beforeEach(() => {
    mockOnFiltersChange.mockClear();
  });

  it('renders filter controls', () => {
    render(
      <NoteHistoryFilters
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
        totalNotes={10}
        filteredCount={8}
      />
    );

    expect(screen.getByText('Showing 8 of 10 notes')).toBeInTheDocument();
  });

  it('handles search query change', () => {
    render(
      <NoteHistoryFilters
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
        totalNotes={10}
        filteredCount={8}
      />
    );

    fireEvent.change(screen.getByPlaceholderText(/Search in notes/), {
      target: { value: 'back pain' }
    });

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      ...mockFilters,
      searchQuery: 'back pain'
    });
  });
});
