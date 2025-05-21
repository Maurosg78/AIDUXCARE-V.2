import { vi } from "vitest";
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import AgentSuggestionExplainer from '../AgentSuggestionExplainer';
import { AgentSuggestion, SuggestionType, SuggestionField } from '../../../../types/agent';
import * as AgentExplainer from '../../../../core/agent/AgentExplainer';

// Mock de la función explainSuggestion
vi.mock('../../../../core/agent/AgentExplainer', () => ({
  explainSuggestion: vi.fn()
}));

describe('AgentSuggestionExplainer', () => {
  // Resetear todos los mocks después de cada prueba
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  beforeEach(() => {
    // Configuración por defecto del mock
    vi.mocked(AgentExplainer.explainSuggestion).mockResolvedValue(
      'Explicación simulada para pruebas'
    );
  });
  
  // Datos de prueba con tipos correctos
  const mockRecommendation: AgentSuggestion = {
    id: 'sugg-1',
    sourceBlockId: 'block-1',
    type: 'recommendation',
    field: 'diagnosis',
    content: 'Considerar evaluación de escala de dolor.',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockWarning: AgentSuggestion = {
    id: 'sugg-2',
    sourceBlockId: 'block-2',
    type: 'warning',
    field: 'medication',
    content: 'Monitorizar tensión arterial cada 4 horas.',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockInfo: AgentSuggestion = {
    id: 'sugg-3',
    sourceBlockId: 'block-3',
    type: 'info',
    field: 'history',
    content: 'Paciente con historial de diabetes.',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  it('renderiza el botón de explicación para sugerencias de tipo recommendation', () => {
    render(<AgentSuggestionExplainer suggestion={mockRecommendation} />);
    
    // Verificar que el botón está en el documento
    const button = screen.getByRole('button', { name: /Ver explicación/i });
    expect(button).toBeInTheDocument();
  });

  it('renderiza el botón de explicación para sugerencias de tipo warning', () => {
    render(<AgentSuggestionExplainer suggestion={mockWarning} />);
    
    // Verificar que el botón está en el documento
    const button = screen.getByRole('button', { name: /Ver explicación/i });
    expect(button).toBeInTheDocument();
  });

  it('no renderiza nada para sugerencias de tipo info', () => {
    const { container } = render(<AgentSuggestionExplainer suggestion={mockInfo} />);
    
    // Verificar que el contenedor está vacío
    expect(container).toBeEmptyDOMElement();
  });

  it('muestra indicador de carga al solicitar una explicación', async () => {
    // Configurar el mock para que tarde en resolver
    vi.mocked(AgentExplainer.explainSuggestion).mockImplementation(() => {
      return new Promise<string>((resolve) => {
        setTimeout(() => {
          resolve('Explicación simulada retrasada');
        }, 100);
      });
    });
    
    render(<AgentSuggestionExplainer suggestion={mockRecommendation} />);
    
    // Hacer clic en el botón de explicación
    fireEvent.click(screen.getByRole('button', { name: /Ver explicación/i }));
    
    // Verificar que se muestra el indicador de carga
    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
    
    // Esperar a que se complete la carga
    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
    });
  });

  it('muestra la explicación después de hacer clic en el botón', async () => {
    // Configurar respuesta específica para este test
    const explicacionEsperada = 'Esta es una explicación detallada de la recomendación';
    vi.mocked(AgentExplainer.explainSuggestion).mockResolvedValueOnce(explicacionEsperada);
    
    render(<AgentSuggestionExplainer suggestion={mockRecommendation} />);
    
    // Verificar que la explicación no está visible inicialmente
    expect(screen.queryByTestId('explanation-text')).not.toBeInTheDocument();
    
    // Hacer clic en el botón de explicación
    fireEvent.click(screen.getByRole('button', { name: /Ver explicación/i }));
    
    // Verificar que la explicación se muestra después de cargar
    await waitFor(() => {
      expect(screen.getByTestId('explanation-text')).toBeInTheDocument();
      expect(screen.getByText(explicacionEsperada)).toBeInTheDocument();
    });
    
    // Verificar que el botón cambió a "Ocultar explicación"
    expect(screen.getByRole('button', { name: /Ocultar explicación/i })).toBeInTheDocument();
  });

  it('oculta la explicación al hacer clic en Ocultar explicación', async () => {
    render(<AgentSuggestionExplainer suggestion={mockRecommendation} />);
    
    // Mostrar la explicación
    fireEvent.click(screen.getByRole('button', { name: /Ver explicación/i }));
    
    // Esperar a que se cargue la explicación
    await waitFor(() => {
      expect(screen.getByTestId('explanation-text')).toBeInTheDocument();
    });
    
    // Ocultar la explicación
    fireEvent.click(screen.getByRole('button', { name: /Ocultar explicación/i }));
    
    // Verificar que la explicación ya no está visible
    expect(screen.queryByTestId('explanation-text')).not.toBeInTheDocument();
  });

  it('no vuelve a llamar a explainSuggestion si ya se generó una explicación', async () => {
    render(<AgentSuggestionExplainer suggestion={mockRecommendation} />);
    
    // Primera vez que se hace clic para mostrar la explicación
    fireEvent.click(screen.getByRole('button', { name: /Ver explicación/i }));
    
    // Esperar a que se cargue la explicación
    await waitFor(() => {
      expect(screen.getByTestId('explanation-text')).toBeInTheDocument();
    });
    
    // Ocultar la explicación
    fireEvent.click(screen.getByRole('button', { name: /Ocultar explicación/i }));
    
    // Volver a mostrar la explicación
    fireEvent.click(screen.getByRole('button', { name: /Ver explicación/i }));
    
    // Verificar que explainSuggestion solo se llamó una vez
    expect(AgentExplainer.explainSuggestion).toHaveBeenCalledTimes(1);
  });

  it('maneja los errores cuando falla la generación de explicación', async () => {
    // Configurar el mock para simular un error
    vi.mocked(AgentExplainer.explainSuggestion).mockRejectedValueOnce(new Error('Error simulado'));
    
    render(<AgentSuggestionExplainer suggestion={mockWarning} />);
    
    // Hacer clic en el botón de explicación
    fireEvent.click(screen.getByRole('button', { name: /Ver explicación/i }));
    
    // Esperar a que aparezca el mensaje de error
    await waitFor(() => {
      const errorElement = screen.getByTestId('explanation-text');
      expect(errorElement).toBeInTheDocument();
      expect(errorElement).toHaveTextContent('No se pudo generar una explicación para esta sugerencia.');
      expect(errorElement).toHaveClass('text-red-600');
      expect(errorElement).toHaveClass('bg-red-50');
    });
  });

  it('pasa la sugerencia correcta al servicio explainSuggestion', async () => {
    render(<AgentSuggestionExplainer suggestion={mockRecommendation} />);
    
    // Hacer clic en el botón de explicación
    fireEvent.click(screen.getByRole('button', { name: /Ver explicación/i }));
    
    // Verificar que se llamó al servicio con la sugerencia correcta
    expect(AgentExplainer.explainSuggestion).toHaveBeenCalledWith(mockRecommendation);
  });
}); 