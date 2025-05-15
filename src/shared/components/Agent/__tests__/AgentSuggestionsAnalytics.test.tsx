import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import '@testing-library/jest-dom';
import AgentSuggestionsAnalytics from '../AgentSuggestionsAnalytics';

describe('AgentSuggestionsAnalytics', () => {
  // Mock de sugerencias para las pruebas
  const mockSuggestions = [
    {
      id: '1',
      type: 'recommendation' as const,
      content: 'Considerar evaluación de escala de dolor',
      sourceBlockId: 'block-1',
      feedback: 'accept' as const
    },
    {
      id: '2',
      type: 'warning' as const,
      content: 'Monitorizar tensión arterial',
      sourceBlockId: 'block-2',
      feedback: 'reject' as const
    },
    {
      id: '3',
      type: 'info' as const,
      content: 'Paciente con historial de diabetes',
      sourceBlockId: 'block-3',
      feedback: 'defer' as const
    },
    {
      id: '4',
      type: 'warning' as const,
      content: 'Verificar posibles interacciones medicamentosas',
      sourceBlockId: 'block-4'
      // Sin feedback (pendiente)
    }
  ];

  test('se renderiza correctamente con sugerencias', () => {
    render(<AgentSuggestionsAnalytics visitId="visit-123" suggestions={mockSuggestions} />);
    
    // Verificar que se muestra el título y contador
    expect(screen.getByText('Análisis de Sugerencias')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument(); // Total de sugerencias
    
    // Verificar que se muestran las scorecards
    expect(screen.getByText('Adherencia')).toBeInTheDocument();
    expect(screen.getByText('Riesgo Clínico')).toBeInTheDocument();
    
    // Verificar texto del botón
    expect(screen.getByText('Ver detalles')).toBeInTheDocument();
  });

  test('no se renderiza si no hay sugerencias', () => {
    const { container } = render(<AgentSuggestionsAnalytics visitId="visit-123" suggestions={[]} />);
    expect(container.firstChild).toBeNull();
  });

  test('muestra un mensaje amigable cuando no hay feedback', () => {
    // Sugerencias sin feedback
    const suggestionsWithoutFeedback = [
      {
        id: '1',
        type: 'recommendation' as const,
        content: 'Considerar evaluación de escala de dolor',
        sourceBlockId: 'block-1'
      }
    ];
    
    render(<AgentSuggestionsAnalytics visitId="visit-123" suggestions={suggestionsWithoutFeedback} />);
    
    // Verificar que muestra que hay sugerencias pendientes
    expect(screen.getByText('Pendientes')).toBeInTheDocument();
    expect(screen.getByText('1 de 1')).toBeInTheDocument();
  });

  test('expande y colapsa la vista detallada al hacer clic en el botón', () => {
    render(<AgentSuggestionsAnalytics visitId="visit-123" suggestions={mockSuggestions} />);
    
    // Verificar que inicialmente los detalles no están visibles
    expect(screen.queryByText('Distribución por Tipo')).not.toBeInTheDocument();
    
    // Hacer clic en el botón para expandir
    fireEvent.click(screen.getByText('Ver detalles'));
    
    // Verificar que ahora los detalles son visibles
    expect(screen.getByText('Distribución por Tipo')).toBeInTheDocument();
    expect(screen.getByText('Respuesta del Clínico')).toBeInTheDocument();
    
    // Hacer clic para colapsar
    fireEvent.click(screen.getByText('Ocultar detalles'));
    
    // Verificar que los detalles ya no son visibles
    expect(screen.queryByText('Distribución por Tipo')).not.toBeInTheDocument();
  });

  test('calcula y muestra las estadísticas correctamente', () => {
    render(<AgentSuggestionsAnalytics visitId="visit-123" suggestions={mockSuggestions} />);
    
    // Verificar la tasa de adherencia (1 aceptada de 4 = 25%)
    expect(screen.getByText('25%')).toBeInTheDocument();
    
    // Expandir los detalles
    fireEvent.click(screen.getByText('Ver detalles'));
    
    // Verificar el conteo por tipo
    expect(screen.getByText('Recomendaciones')).toBeInTheDocument();
    expect(screen.getByText('Advertencias')).toBeInTheDocument();
    expect(screen.getByText('Informativas')).toBeInTheDocument();
    
    // Verificar el conteo por feedback
    expect(screen.getByText('Aceptadas')).toBeInTheDocument();
    expect(screen.getByText('1 de 4')).toBeInTheDocument(); // 1 aceptada de 4
    
    // Verificar el texto del resumen
    const resumenText = screen.getByText(/Resumen:/);
    expect(resumenText).toBeInTheDocument();
    expect(resumenText.textContent).toContain('1 recomendaciones');
    expect(resumenText.textContent).toContain('2 advertencias');
    expect(resumenText.textContent).toContain('1 informativas');
  });

  test('muestra el nivel de riesgo correctamente con advertencias ignoradas', () => {
    render(<AgentSuggestionsAnalytics visitId="visit-123" suggestions={mockSuggestions} />);
    
    // Hay 1 advertencia rechazada y 1 advertencia pendiente = 2 ignoradas en total
    // Según la lógica del componente, 2 o más advertencias ignoradas = riesgo alto
    
    // Expandir los detalles
    fireEvent.click(screen.getByText('Ver detalles'));
    
    // Verificar que se muestra el riesgo alto
    const impactoText = screen.getByText(/Impacto clínico:/);
    expect(impactoText).toBeInTheDocument();
    expect(impactoText.textContent).toContain('riesgo clínico alto');
  });
}); 