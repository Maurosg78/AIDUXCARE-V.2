import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AgentSuggestionsViewer from '../src/shared/components/Agent/AgentSuggestionsViewer';
import { AgentSuggestion } from '../src/core/agent/ClinicalAgent';

describe('AgentSuggestionsViewer', () => {
  // Datos de prueba
  const visitId = 'test-visit-id';
  const userId = 'test-user-id';
  const patientId = 'test-patient-id';
  
  const mockSuggestions: AgentSuggestion[] = [
    {
      id: 'suggestion-1',
      sourceBlockId: 'block-1',
      type: 'recommendation',
      content: 'Considerar radiografía de tórax'
    },
    {
      id: 'suggestion-2',
      sourceBlockId: 'block-2',
      type: 'warning',
      content: 'Paciente con alergias a medicamentos'
    },
    {
      id: 'suggestion-3',
      sourceBlockId: 'block-3',
      type: 'info',
      content: 'Antecedentes familiares relevantes'
    }
  ];

  it('debe renderizarse sin errores', () => {
    render(
      <AgentSuggestionsViewer
        visitId={visitId}
        suggestions={mockSuggestions}
        userId={userId}
        patientId={patientId}
      />
    );

    // Verificar que se muestra el título del componente
    expect(screen.getByText('Sugerencias del Agente Clínico')).toBeInTheDocument();
    
    // Verificar que se muestra el botón para expandir
    expect(screen.getByText('Ver sugerencias del agente')).toBeInTheDocument();
  });
}); 