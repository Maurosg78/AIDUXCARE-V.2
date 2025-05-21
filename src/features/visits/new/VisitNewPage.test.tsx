import React from 'react';
import { render, screen } from '@testing-library/react';
import { VisitNewPage } from './VisitNewPage';

describe('VisitNewPage', () => {
  it('debe renderizar el formulario de nueva visita', () => {
    render(<VisitNewPage />);
    expect(screen.getByRole('heading', { name: /nueva visita/i })).toBeInTheDocument();
  });
});