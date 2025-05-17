import { vi } from "vitest";
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
    const result = render(<AgentSuggestionsAnalytics visitId="visit-123" suggestions={mockSuggestions} />);
    
    // Verificar que se muestra el título
    expect(screen.getByText('Análisis de Sugerencias')).toBeInTheDocument();
    
    // Usar una función para detectar el contador '4' en un span clase específica
    const badgeElement = result.container.querySelector('.ml-2.text-sm.bg-blue-100.text-blue-800');
    expect(badgeElement).toBeInTheDocument();
    expect(badgeElement?.textContent).toBe('4');
    
    // Verificar que se muestran las scorecards usando text contenido dentro del uppercase
    const scorecards = screen.getAllByText(/Advertencias|Adherencia|Sugerencias|Tiempo Ahorrado/i);
    expect(scorecards.length).toBeGreaterThanOrEqual(3);
    
    // Verificar texto del botón
    expect(screen.getByText('Ver detalles')).toBeInTheDocument();
  });

  test('no se renderiza si no hay sugerencias', () => {
    const result = render(<AgentSuggestionsAnalytics visitId="visit-123" suggestions={[]} />);
    expect(result.container.firstChild).toBeNull();
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
    
    // Expandir la vista detallada
    fireEvent.click(screen.getByText('Ver detalles'));
    
    // Verificar que la información de pendientes existe dentro de los detalles expandidos
    // Usar una función de comparación para encontrar el texto
    const pendientesText = screen.getAllByText((content) => {
      return content.includes('Pendientes');
    });
    
    expect(pendientesText.length).toBeGreaterThan(0);
    
    // También verificar el formato "1 de 1"
    const ratioTexts = screen.getAllByText((content) => {
      return content.includes('1 de 1');
    });
    
    expect(ratioTexts.length).toBeGreaterThan(0);
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
    const { container } = render(<AgentSuggestionsAnalytics visitId="visit-123" suggestions={mockSuggestions} />);
    
    // Verificar la tasa de adherencia (1 aceptada de 4 = 25%)
    expect(screen.getByText('25%')).toBeInTheDocument();
    
    // Expandir los detalles
    fireEvent.click(screen.getByText('Ver detalles'));
    
    // Verificar las etiquetas de tipo usando función de coincidencia personalizada
    const typeLabels = screen.getAllByText((content) => {
      return ['Recomendaciones', 'Advertencias', 'Informativas'].some(
        label => content.includes(label)
      );
    });
    
    expect(typeLabels.length).toBeGreaterThanOrEqual(3);
    
    // Verificar el texto del resumen usando getAllByText para manejar múltiples coincidencias
    // y buscar por el texto "Resumen:" específicamente
    const resumenLabel = screen.getByText(/^Resumen:$/);
    expect(resumenLabel).toBeInTheDocument();
    
    // Buscar el párrafo específico que contiene el resumen completo
    const resumenParagraph = resumenLabel.closest('p');
    expect(resumenParagraph).toBeInTheDocument();
    expect(resumenParagraph?.textContent).toContain('recomendaciones');
    expect(resumenParagraph?.textContent).toContain('advertencias');
    expect(resumenParagraph?.textContent).toContain('informativas');
    
    // Opcionalmente, verificar el patrón específico de texto en la sección de resumen
    const resumenSection = container.querySelector('.mt-6.p-3.bg-gray-50.border.border-gray-200');
    expect(resumenSection).toBeInTheDocument();
    expect(resumenSection?.textContent).toContain('Resumen:');
    expect(resumenSection?.textContent).toContain('recomendaciones');
    expect(resumenSection?.textContent).toContain('advertencias');
    expect(resumenSection?.textContent).toContain('informativas');
  });

  test('muestra el nivel de riesgo correctamente con advertencias ignoradas', () => {
    render(<AgentSuggestionsAnalytics visitId="visit-123" suggestions={mockSuggestions} />);
    
    // Hay 1 advertencia rechazada y 1 advertencia pendiente = 2 ignoradas en total
    // Según la lógica del componente, 2 o más advertencias ignoradas = riesgo alto
    
    // Expandir los detalles
    fireEvent.click(screen.getByText('Ver detalles'));
    
    // Verificar que se muestra el texto de impacto clínico
    const impactoText = screen.getByText((content) => {
      return content.includes('Impacto clínico:');
    });
    
    expect(impactoText).toBeInTheDocument();
    
    // Verificar que se muestra el riesgo alto
    const riesgoText = screen.getByText((content) => {
      return content.includes('riesgo clínico alto');
    });
    
    expect(riesgoText).toBeInTheDocument();
  });
}); 