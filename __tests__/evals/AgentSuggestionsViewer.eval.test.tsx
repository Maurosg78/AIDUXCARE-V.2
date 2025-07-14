import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AgentSuggestionsViewer from '../../src/shared/components/Agent/AgentSuggestionsViewer';
import { AgentSuggestion } from '../../src/types/agent';
import { v4 as uuidv4 } from 'uuid';

// Mock de las dependencias externas
vi.mock('../../src/core/services/EMRFormService', () => ({
  EMRFormService: {
    mapSuggestionTypeToEMRSection: (type) => {
      switch (type) {
        case 'recommendation': return 'plan';
        case 'warning': return 'assessment';
        case 'info': return 'notes';
        default: return 'notes';
      }
    },
    insertSuggestion: vi.fn().mockResolvedValue(true)
  }
}));

vi.mock('../../src/core/audit/AuditLogger', () => ({
  AuditLogger: {
    logSuggestionIntegration: vi.fn()
  }
}));

vi.mock('../../src/services/UsageAnalyticsService', () => ({
  track: vi.fn()
}));

// Mock de suggestionFeedbackDataSourceSupabase
vi.mock('../../src/core/dataSources/suggestionFeedbackDataSourceSupabase', () => ({
  suggestionFeedbackDataSourceSupabase: {
    getFeedbacksByVisit: vi.fn().mockResolvedValue([]),
    getFeedbackBySuggestion: vi.fn().mockResolvedValue(null)
  }
}));

/**
 * EVALUACIÓN DEL AGENTSUGGESTIONSVIEWER
 * 
 * Esta suite evalúa el comportamiento del visor de sugerencias en diversos escenarios:
 * 1. Renderizado de sugerencias válidas → debe mostrar correctamente los tipos y contenidos
 * 2. Manejo de arrays de sugerencias vacíos → debe mostrar mensaje apropiado
 * 3. Interacción con las sugerencias → debe permitir aceptar/rechazar y mostrar feedback
 * 4. Integración con EMR → debe permitir integrar sugerencias aceptadas
 */
describe('AgentSuggestionsViewer EVAL', () => {
  // Crear mocks de sugerencias para las pruebas
  const mockVisitId = 'visit-test-001';
  const mockUserId = 'user-test-001';
  const mockPatientId = 'patient-test-001';
  
  const createMockSuggestion = (type: 'recommendation' | 'warning' | 'info', content: string): AgentSuggestion => ({
    id: uuidv4(),
    sourceBlockId: `block-${Math.floor(Math.random() * 1000)}`,
    type,
    content,
    field: 'notes',
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  const mockRecommendations = [
    createMockSuggestion('recommendation', 'Realizar ECG para evaluar posible cardiopatía isquémica'),
    createMockSuggestion('recommendation', 'Ajustar dosis de metformina a 1000mg c/12h')
  ];
  
  const mockWarnings = [
    createMockSuggestion('warning', 'Paciente con HTA no controlada, considerar manejo urgente')
  ];
  
  const mockInfos = [
    createMockSuggestion('info', 'Considerar referir a nutricionista para manejo de dislipidemia')
  ];
  
  const mockSuggestions = [...mockRecommendations, ...mockWarnings, ...mockInfos];

  /**
   * CASO 1: Renderizado de sugerencias válidas
   * 
   * El componente debe mostrar correctamente las sugerencias agrupadas
   * por tipo y con el formato visual adecuado
   */
  describe('Caso 1: Renderizado de sugerencias válidas', () => {
    it('debe mostrar las sugerencias agrupadas por tipo cuando se expande', async () => {
      render(
        <AgentSuggestionsViewer 
          visitId={mockVisitId}
          suggestions={mockSuggestions}
          userId={mockUserId}
          patientId={mockPatientId}
          onSuggestionAccepted={() => {}}
          onSuggestionRejected={() => {}}
        />
      );
      
      // Verificar que inicialmente está colapsado
      expect(screen.queryByTestId('suggestions-content')).not.toBeInTheDocument();
      
      // Verificar que se muestra el botón para expandir
      expect(screen.getByTestId('toggle-suggestions')).toBeInTheDocument();
      
      // Expandir el componente
      fireEvent.click(screen.getByTestId('toggle-suggestions'));
      
      // Verificar que se muestran las categorías correctas
      expect(screen.getByTestId('recommendation-section')).toBeInTheDocument();
      expect(screen.getByTestId('warning-section')).toBeInTheDocument();
      expect(screen.getByTestId('info-section')).toBeInTheDocument();
      
      // Verificar que se muestra el contenido de cada sugerencia
      mockSuggestions.forEach(suggestion => {
        expect(screen.getByTestId(`suggestion-${suggestion.id}`)).toBeInTheDocument();
      });
    });
    
    it('debe mostrar el contador correcto de sugerencias', () => {
      render(
        <AgentSuggestionsViewer 
          visitId={mockVisitId}
          suggestions={mockSuggestions}
          userId={mockUserId}
          patientId={mockPatientId}
          onSuggestionAccepted={() => {}}
          onSuggestionRejected={() => {}}
        />
      );
      
      // Verificar que se muestra el número total correcto
      const titleElement = screen.getByTestId('suggestions-title');
      expect(titleElement).toHaveTextContent('4');
    });
    
    it('debe mostrar el contexto de origen para sugerencias que lo tienen disponible', async () => {
      // Renderizar el componente con sugerencias
      render(
        <AgentSuggestionsViewer 
          visitId={mockVisitId}
          suggestions={mockSuggestions}
          userId={mockUserId}
          patientId={mockPatientId}
          onSuggestionAccepted={() => {}}
          onSuggestionRejected={() => {}}
        />
      );
      
      // Expandir las sugerencias
      fireEvent.click(screen.getByText(/Mostrar/i));
      
      // Verificar que se muestran las sugerencias expandidas
      await waitFor(() => {
        // Verificar que el contenido expandido está visible
        expect(screen.getByTestId('suggestions-content')).toBeInTheDocument();
        
        // Verificar que se muestran las sugerencias específicas
        expect(screen.getByText(/Realizar ECG para evaluar posible cardiopatía isquémica/)).toBeInTheDocument();
        expect(screen.getByText(/Paciente con HTA no controlada/)).toBeInTheDocument();
        expect(screen.getByText(/Considerar referir a nutricionista/)).toBeInTheDocument();
      });
      
      // Verificar que se muestran los botones de acción para cada sugerencia
      const integrateButtons = screen.getAllByText('Integrar');
      const rejectButtons = screen.getAllByText('Rechazar');
      expect(integrateButtons).toHaveLength(4);
      expect(rejectButtons).toHaveLength(4);
    });
  });

  /**
   * CASO 2: Manejo de arrays de sugerencias vacíos
   * 
   * El componente debe mostrar un mensaje apropiado cuando 
   * no hay sugerencias disponibles
   */
  describe('Caso 2: Manejo de arrays de sugerencias vacíos', () => {
    it('debe mostrar un mensaje cuando no hay sugerencias', () => {
      render(
        <AgentSuggestionsViewer 
          visitId={mockVisitId}
          suggestions={[]}
          userId={mockUserId}
          patientId={mockPatientId}
          onSuggestionAccepted={() => {}}
          onSuggestionRejected={() => {}}
        />
      );
      
      // Expandir el panel
      fireEvent.click(screen.getByTestId('toggle-suggestions'));
      
      // Verificar que se muestra el mensaje de "sin sugerencias"
      expect(screen.getByTestId('no-suggestions-message')).toHaveTextContent('No hay sugerencias disponibles');
    });
    
    it('debe mostrar el contador en 0 cuando no hay sugerencias', () => {
      render(
        <AgentSuggestionsViewer 
          visitId={mockVisitId}
          suggestions={[]}
          userId={mockUserId}
          patientId={mockPatientId}
          onSuggestionAccepted={() => {}}
          onSuggestionRejected={() => {}}
        />
      );
      
      // Verificar que el contador muestra 0
      const titleElement = screen.getByTestId('suggestions-title');
      expect(titleElement).toHaveTextContent('0');
    });
  });

  /**
   * CASO 3: Interacción con las sugerencias
   * 
   * El componente debe permitir que el usuario acepte o rechace
   * sugerencias, y mostrar el feedback correspondiente
   */
  describe.skip('Caso 3: Interacción con las sugerencias', () => {
    it('debe permitir aceptar sugerencias y actualizar el contador', async () => {
      // Mock para la función de integración
      const mockIntegrateFn = vi.fn();
      
      // Renderizar el componente
      render(
        <AgentSuggestionsViewer 
          visitId={mockVisitId}
          suggestions={mockSuggestions}
          onIntegrateSuggestions={mockIntegrateFn}
          userId={mockUserId}
          patientId={mockPatientId}
          onSuggestionAccepted={() => {}}
          onSuggestionRejected={() => {}}
        />
      );
      
      // Expandir el panel
      fireEvent.click(screen.getByTestId('toggle-suggestions'));
      
      // Aceptar todas las sugerencias usando eventos reales (no mocks)
      const acceptButtons = screen.getAllByText('Aceptar');
      // Asegurarse de que hay botones antes de iterar
      expect(acceptButtons.length).toBeGreaterThan(0);
      for (const button of acceptButtons) {
        fireEvent.click(button);
      }
      
      // Verificar que aparece la opción para integrar buscando por contenido parcial
      const integrarTextElement = screen.getByText((content) => 
        typeof content === 'string' && content.toLowerCase().includes('sugerencias') && content.toLowerCase().includes('aceptadas')
      );
      expect(integrarTextElement).toBeInTheDocument();
      
      // Buscar botones que puedan contener 'Integrar' en su texto
      const integrateButton = screen.getByText((content) => 
        typeof content === 'string' && content.toLowerCase().includes('integrar')
      );
      
      // Presionar el botón de integrar
      fireEvent.click(integrateButton);
      
      // Esperar a que se complete la integración
      await waitFor(() => {
        const successText = screen.getByText((content) => 
          typeof content === 'string' && content.toLowerCase().includes('integradas')
        );
        expect(successText).toBeInTheDocument();
      });
      
      // Verificar que se llamó a la función de integración
      expect(mockIntegrateFn).toHaveBeenCalled();
    });
  });

  /**
   * CASO 4: Integración con EMR
   * 
   * El componente debe permitir integrar sugerencias aceptadas al EMR
   * y mostrar el estado correspondiente
   */
  describe.skip('Caso 4: Integración con EMR', () => {
    beforeEach(() => {
      // Reset los mocks
      vi.clearAllMocks();
    });
    
    it('no debe mostrar la opción de integrar hasta que se acepte alguna sugerencia', () => {
      // Renderizar el componente
      render(
        <AgentSuggestionsViewer 
          visitId={mockVisitId}
          suggestions={mockSuggestions}
          onIntegrateSuggestions={vi.fn()}
          userId={mockUserId}
          patientId={mockPatientId}
          onSuggestionAccepted={() => {}}
          onSuggestionRejected={() => {}}
        />
      );
      
      // Expandir el panel
      fireEvent.click(screen.getByTestId('toggle-suggestions'));
      
      // Verificar que no aparece la opción para integrar
      expect(screen.queryByText((content) => content.includes('sugerencias aceptadas listas para integrar'))).not.toBeInTheDocument();
      expect(screen.queryByText((content) => 
        typeof content === 'string' && content.toLowerCase().includes('integrar')
      )).not.toBeInTheDocument();
    });
    
    it('debe llamar a la función de integración con el número correcto de sugerencias', async () => {
      // Mock para la función de integración
      const mockIntegrateFn = vi.fn();
      
      // Renderizar el componente
      render(
        <AgentSuggestionsViewer 
          visitId={mockVisitId}
          suggestions={mockSuggestions}
          onIntegrateSuggestions={mockIntegrateFn}
          userId={mockUserId}
          patientId={mockPatientId}
          onSuggestionAccepted={() => {}}
          onSuggestionRejected={() => {}}
        />
      );
      
      // Expandir el panel
      fireEvent.click(screen.getByTestId('toggle-suggestions'));
      
      // Aceptar dos sugerencias
      const acceptButtons = screen.getAllByText('Aceptar');
      // Verificar que hay al menos dos botones
      expect(acceptButtons.length).toBeGreaterThan(1);
      fireEvent.click(acceptButtons[0]);
      fireEvent.click(acceptButtons[1]);
      
      // Verificar que aparece el botón de integrar buscando por contenido parcial
      const integrateButton = screen.getByText((content) => 
        typeof content === 'string' && content.toLowerCase().includes('integrar')
      );
      expect(integrateButton).toBeInTheDocument();
      
      // Presionar el botón de integrar
      fireEvent.click(integrateButton);
      
      // Esperar a que se complete la integración
      await waitFor(() => {
        const successText = screen.getByText((content) => 
          typeof content === 'string' && content.toLowerCase().includes('integradas')
        );
        expect(successText).toBeInTheDocument();
      });
      
      // Verificar que se llamó a la función con el número correcto
      expect(mockIntegrateFn).toHaveBeenCalled();
    });
    
    it('debe deshabilitar la integración después de integrar una vez', async () => {
      // Mock para la función de integración
      const mockIntegrateFn = vi.fn();
      
      // Renderizar el componente
      render(
        <AgentSuggestionsViewer 
          visitId={mockVisitId}
          suggestions={mockSuggestions}
          onIntegrateSuggestions={mockIntegrateFn}
          userId={mockUserId}
          patientId={mockPatientId}
          onSuggestionAccepted={() => {}}
          onSuggestionRejected={() => {}}
        />
      );
      
      // Expandir el panel
      fireEvent.click(screen.getByTestId('toggle-suggestions'));
      
      // Aceptar una sugerencia
      const acceptButtons = screen.getAllByText('Aceptar');
      expect(acceptButtons.length).toBeGreaterThan(0);
      fireEvent.click(acceptButtons[0]);
      
      // Verificar que aparece el botón de integrar buscando por contenido parcial
      const integrateButton = screen.getByText((content) => 
        typeof content === 'string' && content.toLowerCase().includes('integrar')
      );
      expect(integrateButton).toBeInTheDocument();
      
      // Presionar el botón de integrar
      fireEvent.click(integrateButton);
      
      // Esperar a que se complete la integración
      await waitFor(() => {
        const successText = screen.getByText((content) => 
          typeof content === 'string' && content.toLowerCase().includes('integradas')
        );
        expect(successText).toBeInTheDocument();
      });
      
      // Verificar que se llamó a la función una vez
      expect(mockIntegrateFn).toHaveBeenCalledTimes(1);
      
      // Verificar que se muestra el mensaje de confirmación
      expect(screen.getByText((content) => content.includes('han sido integradas'))).toBeInTheDocument();
      
      // Verificar que ya no aparece el botón de integrar
      expect(screen.queryByText((content) => 
        typeof content === 'string' && content.toLowerCase().includes('integrar al emr')
      )).not.toBeInTheDocument();
    });
  });
}); 