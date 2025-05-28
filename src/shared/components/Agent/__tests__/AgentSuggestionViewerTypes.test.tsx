import React from 'react';
import { render, screen } from '@testing-library/react';
import { AgentSuggestionType, AgentSuggestionStatus } from '../AgentSuggestionViewerTypes';

describe.skip('AgentSuggestionViewerTypes', () => {
  describe('AgentSuggestionType', () => {
    // it('debe renderizar correctamente el tipo de recomendación', () => {
    //   render(<AgentSuggestionType type="recommendation" />);
    //
    //   const type = screen.getByText('Recomendación');
    //   expect(type).toBeInTheDocument();
    //   expect(type).toHaveClass('bg-blue-100', 'text-blue-800');
    // });
    //
    // it('debe renderizar correctamente el tipo de advertencia', () => {
    //   render(<AgentSuggestionType type="warning" />);
    //
    //   const type = screen.getByText('Advertencia');
    //   expect(type).toBeInTheDocument();
    //   expect(type).toHaveClass('bg-yellow-100', 'text-yellow-800');
    // });
    //
    // it('debe renderizar correctamente el tipo de información', () => {
    //   render(<AgentSuggestionType type="info" />);
    //
    //   const type = screen.getByText('Información');
    //   expect(type).toBeInTheDocument();
    //   expect(type).toHaveClass('bg-gray-100', 'text-gray-800');
    // });
    //
    // it('debe tener atributos ARIA correctos', () => {
    //   render(<AgentSuggestionType type="recommendation" />);
    //
    //   const type = screen.getByText('Recomendación');
    //   expect(type).toHaveAttribute('role', 'status');
    //   expect(type).toHaveAttribute('aria-label', 'Tipo: Recomendación');
    // });
  });

  describe('AgentSuggestionStatus', () => {
    // it('debe renderizar correctamente el estado de integrado', () => {
    //   render(<AgentSuggestionStatus status="integrated" />);
    //
    //   const status = screen.getByText('Integrado');
    //   expect(status).toBeInTheDocument();
    //   expect(status).toHaveClass('bg-green-100', 'text-green-800');
    // });
    //
    // it('debe renderizar correctamente el estado de rechazado', () => {
    //   render(<AgentSuggestionStatus status="rejected" />);
    //
    //   const status = screen.getByText('Rechazado');
    //   expect(status).toBeInTheDocument();
    //   expect(status).toHaveClass('bg-red-100', 'text-red-800');
    // });
    //
    // it('debe renderizar correctamente el estado de pendiente', () => {
    //   render(<AgentSuggestionStatus status="pending" />);
    //
    //   const status = screen.getByText('Pendiente');
    //   expect(status).toBeInTheDocument();
    //   expect(status).toHaveClass('bg-yellow-100', 'text-yellow-800');
    // });
    //
    // it('debe renderizar correctamente el estado de error', () => {
    //   render(<AgentSuggestionStatus status="error" />);
    //
    //   const status = screen.getByText('Error');
    //   expect(status).toBeInTheDocument();
    //   expect(status).toHaveClass('bg-gray-100', 'text-gray-800');
    // });
    //
    // it('debe tener atributos ARIA correctos', () => {
    //   render(<AgentSuggestionStatus status="integrated" />);
    //
    //   const status = screen.getByText('Integrado');
    //   expect(status).toHaveAttribute('role', 'status');
    //   expect(status).toHaveAttribute('aria-label', 'Estado: Integrado');
    // });
  });
}); 