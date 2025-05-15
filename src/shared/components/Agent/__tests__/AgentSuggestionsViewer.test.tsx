import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';
import AgentSuggestionsViewer from '../AgentSuggestionsViewer';
import { AgentSuggestion } from '../../../../core/agent/ClinicalAgent';

describe('AgentSuggestionsViewer', () => {
  // Datos de prueba: sugerencias ficticias para probar el componente
  const mockSuggestions: AgentSuggestion[] = [
    {
      id: 'sugg-1',
      sourceBlockId: 'block-1',
      type: 'recommendation',
      content: 'Considerar evaluación de escala de dolor y administrar analgésicos según protocolo.'
    },
    {
      id: 'sugg-2',
      sourceBlockId: 'block-2',
      type: 'warning',
      content: 'Monitorizar tensión arterial cada 4 horas. Valores fuera de rango requieren atención.'
    },
    {
      id: 'sugg-3',
      sourceBlockId: 'block-3',
      type: 'info',
      content: 'Paciente con historial de diabetes. Considerar monitorización de glucemia.'
    }
  ];

  it('renderiza el componente con sugerencias correctamente', () => {
    render(<AgentSuggestionsViewer visitId="visit-123" suggestions={mockSuggestions} />);
    
    // Verificar que el título y el contador de sugerencias se muestran
    expect(screen.getByText('Sugerencias del Agente Clínico')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    
    // Verificar que el botón para expandir está presente
    expect(screen.getByText('Ver sugerencias del agente')).toBeInTheDocument();
  });

  it('renderiza un mensaje cuando no hay sugerencias', () => {
    render(<AgentSuggestionsViewer visitId="visit-123" suggestions={[]} />);
    
    // Expandir el visor primero
    fireEvent.click(screen.getByText('Ver sugerencias del agente'));
    
    // Verificar que se muestra el mensaje de no sugerencias
    expect(screen.getByText('Este agente no tiene sugerencias para esta visita.')).toBeInTheDocument();
  });

  it('expande y colapsa el contenido correctamente', () => {
    render(<AgentSuggestionsViewer visitId="visit-123" suggestions={mockSuggestions} />);
    
    // Inicialmente el contenido está colapsado
    expect(screen.queryByText(/Recomendaciones/)).not.toBeInTheDocument();
    
    // Expandir el visor
    fireEvent.click(screen.getByText('Ver sugerencias del agente'));
    
    // Verificar que ahora se muestra el contenido
    expect(screen.getByText(/Recomendaciones \(1\)/)).toBeInTheDocument();
    expect(screen.getByText(/Advertencias \(1\)/)).toBeInTheDocument();
    expect(screen.getByText(/Información \(1\)/)).toBeInTheDocument();
    
    // Colapsar el visor de nuevo
    fireEvent.click(screen.getByText('Ocultar sugerencias'));
    
    // Verificar que el contenido ya no se muestra
    expect(screen.queryByText(/Recomendaciones/)).not.toBeInTheDocument();
  });

  it('agrupa las sugerencias por tipo correctamente', () => {
    // Crear sugerencias con múltiples elementos del mismo tipo
    const mixedSuggestions: AgentSuggestion[] = [
      ...mockSuggestions,
      {
        id: 'sugg-4',
        sourceBlockId: 'block-4',
        type: 'recommendation',
        content: 'Segunda recomendación de prueba.'
      }
    ];
    
    render(<AgentSuggestionsViewer visitId="visit-123" suggestions={mixedSuggestions} />);
    
    // Expandir el visor
    fireEvent.click(screen.getByText('Ver sugerencias del agente'));
    
    // Verificar que las recomendaciones se agrupan (ahora son 2)
    expect(screen.getByText(/Recomendaciones \(2\)/)).toBeInTheDocument();
    
    // Verificar que se muestran todos los elementos esperados
    expect(screen.getByText('Considerar evaluación de escala de dolor y administrar analgésicos según protocolo.')).toBeInTheDocument();
    expect(screen.getByText('Segunda recomendación de prueba.')).toBeInTheDocument();
  });

  it('muestra los identificadores de bloque de origen', () => {
    render(<AgentSuggestionsViewer visitId="visit-123" suggestions={mockSuggestions} />);
    
    // Expandir el visor
    fireEvent.click(screen.getByText('Ver sugerencias del agente'));
    
    // Verificar que se muestran los identificadores de bloque
    expect(screen.getByText('Fuente: block-1')).toBeInTheDocument();
    expect(screen.getByText('Fuente: block-2')).toBeInTheDocument();
    expect(screen.getByText('Fuente: block-3')).toBeInTheDocument();
  });
}); 