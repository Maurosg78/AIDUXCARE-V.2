import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import AgentSuggestionExplainer from '../AgentSuggestionExplainer';
import { AgentSuggestion } from '../../../../core/agent/ClinicalAgent';
import * as AgentExplainer from '../../../../core/agent/AgentExplainer';

// Mock de la función explainSuggestion
vi.mock('../../../../core/agent/AgentExplainer', () => ({
  explainSuggestion: vi.fn().mockImplementation((suggestion) => {
    return Promise.resolve('Explicación simulada para pruebas: ' + suggestion.content);
  })
}));

describe('AgentSuggestionExplainer', () => {
  // Restablecer los mocks antes de cada prueba
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Datos de prueba: sugerencias ficticias para probar el componente
  const mockRecommendation: AgentSuggestion = {
    id: 'sugg-1',
    sourceBlockId: 'block-1',
    type: 'recommendation',
    content: 'Considerar evaluación de escala de dolor.'
  };

  const mockWarning: AgentSuggestion = {
    id: 'sugg-2',
    sourceBlockId: 'block-2',
    type: 'warning',
    content: 'Monitorizar tensión arterial cada 4 horas.'
  };

  const mockInfo: AgentSuggestion = {
    id: 'sugg-3',
    sourceBlockId: 'block-3',
    type: 'info',
    content: 'Paciente con historial de diabetes.'
  };

  it('renderiza el botón de explicación para sugerencias de tipo recommendation', () => {
    render(<AgentSuggestionExplainer suggestion={mockRecommendation} />);
    expect(screen.getByText('Ver explicación')).toBeInTheDocument();
  });

  it('renderiza el botón de explicación para sugerencias de tipo warning', () => {
    render(<AgentSuggestionExplainer suggestion={mockWarning} />);
    expect(screen.getByText('Ver explicación')).toBeInTheDocument();
  });

  it('no renderiza nada para sugerencias de tipo info', () => {
    const { container } = render(<AgentSuggestionExplainer suggestion={mockInfo} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('muestra la explicación expandida después de hacer clic en el botón', async () => {
    render(<AgentSuggestionExplainer suggestion={mockRecommendation} />);
    
    // Verificar que la explicación no está visible inicialmente
    expect(screen.queryByText(/Explicación simulada/)).not.toBeInTheDocument();
    
    // Hacer clic en el botón de explicación
    fireEvent.click(screen.getByText('Ver explicación'));
    
    // Verificar que aparece el mensaje de carga
    expect(screen.getByText('Generando explicación...')).toBeInTheDocument();
    
    // Verificar que la explicación se muestra después de cargar
    await waitFor(() => {
      expect(screen.getByText('Explicación simulada para pruebas: Considerar evaluación de escala de dolor.')).toBeInTheDocument();
    });
    
    // Verificar que el botón cambió a "Ocultar explicación"
    expect(screen.getByText('Ocultar explicación')).toBeInTheDocument();
  });

  it('oculta la explicación al hacer clic en Ocultar explicación', async () => {
    render(<AgentSuggestionExplainer suggestion={mockRecommendation} />);
    
    // Mostrar la explicación
    fireEvent.click(screen.getByText('Ver explicación'));
    
    // Esperar a que se cargue la explicación
    await waitFor(() => {
      expect(screen.getByText(/Explicación simulada/)).toBeInTheDocument();
    });
    
    // Ocultar la explicación
    fireEvent.click(screen.getByText('Ocultar explicación'));
    
    // Verificar que la explicación ya no está visible
    expect(screen.queryByText(/Explicación simulada/)).not.toBeInTheDocument();
  });

  it('no vuelve a llamar a explainSuggestion si ya se generó una explicación', async () => {
    render(<AgentSuggestionExplainer suggestion={mockRecommendation} />);
    
    // Primera vez que se hace clic para mostrar la explicación
    fireEvent.click(screen.getByText('Ver explicación'));
    
    // Esperar a que se cargue la explicación
    await waitFor(() => {
      expect(screen.getByText(/Explicación simulada/)).toBeInTheDocument();
    });
    
    // Ocultar la explicación
    fireEvent.click(screen.getByText('Ocultar explicación'));
    
    // Volver a mostrar la explicación
    fireEvent.click(screen.getByText('Ver explicación'));
    
    // Verificar que explainSuggestion solo se llamó una vez
    expect(AgentExplainer.explainSuggestion).toHaveBeenCalledTimes(1);
  });

  it('maneja los errores cuando falla la generación de explicación', async () => {
    // Configurar el mock para simular un error
    vi.mocked(AgentExplainer.explainSuggestion).mockRejectedValueOnce(new Error('Error simulado'));
    
    render(<AgentSuggestionExplainer suggestion={mockWarning} />);
    
    // Hacer clic en el botón de explicación
    fireEvent.click(screen.getByText('Ver explicación'));
    
    // Verificar que se muestra un mensaje de error genérico
    await waitFor(() => {
      expect(screen.getByText('No se pudo generar una explicación para esta sugerencia.')).toBeInTheDocument();
    });
  });
}); 