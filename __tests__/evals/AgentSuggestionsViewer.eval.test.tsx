import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AgentSuggestionsViewer from '../../src/shared/components/Agent/AgentSuggestionsViewer';
import { AgentSuggestion } from '../../src/core/agent/ClinicalAgent';
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
    content
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
      // Renderizar el componente con sugerencias
      render(
        <AgentSuggestionsViewer 
          visitId={mockVisitId}
          suggestions={mockSuggestions}
          userId={mockUserId}
          patientId={mockPatientId}
        />
      );
      
      // Verificar que inicialmente está colapsado
      expect(screen.queryByText(/Recomendaciones/)).not.toBeInTheDocument();
      
      // Expandir las sugerencias
      fireEvent.click(screen.getByText('Ver sugerencias del agente'));
      
      // Verificar que se muestran las categorías correctas
      expect(screen.getByText(/Recomendaciones \(2\)/)).toBeInTheDocument();
      expect(screen.getByText(/Advertencias \(1\)/)).toBeInTheDocument();
      expect(screen.getByText(/Información \(1\)/)).toBeInTheDocument();
      
      // Verificar que se muestra el contenido de cada sugerencia
      expect(screen.getByText('Realizar ECG para evaluar posible cardiopatía isquémica')).toBeInTheDocument();
      expect(screen.getByText('Paciente con HTA no controlada, considerar manejo urgente')).toBeInTheDocument();
      expect(screen.getByText('Considerar referir a nutricionista para manejo de dislipidemia')).toBeInTheDocument();
    });
    
    it('debe mostrar el contador correcto de sugerencias', () => {
      // Renderizar el componente con sugerencias
      render(
        <AgentSuggestionsViewer 
          visitId={mockVisitId}
          suggestions={mockSuggestions}
          userId={mockUserId}
          patientId={mockPatientId}
        />
      );
      
      // Verificar que se muestra el número total correcto
      expect(screen.getByText('4')).toBeInTheDocument();
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
      // Renderizar el componente sin sugerencias
      render(
        <AgentSuggestionsViewer 
          visitId={mockVisitId}
          suggestions={[]}
          userId={mockUserId}
          patientId={mockPatientId}
        />
      );
      
      // Expandir el panel
      fireEvent.click(screen.getByText('Ver sugerencias del agente'));
      
      // Verificar que se muestra el mensaje de "sin sugerencias"
      expect(screen.getByText('Este agente no tiene sugerencias para esta visita.')).toBeInTheDocument();
    });
    
    it('debe mostrar el contador en 0 cuando no hay sugerencias', () => {
      // Renderizar el componente sin sugerencias
      render(
        <AgentSuggestionsViewer 
          visitId={mockVisitId}
          suggestions={[]}
          userId={mockUserId}
          patientId={mockPatientId}
        />
      );
      
      // Verificar que el contador muestra 0
      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });

  /**
   * CASO 3: Interacción con las sugerencias
   * 
   * El componente debe permitir que el usuario acepte o rechace
   * sugerencias, y mostrar el feedback correspondiente
   */
  describe('Caso 3: Interacción con las sugerencias', () => {
    it('debe permitir aceptar sugerencias y actualizar el contador', async () => {
      // Mock para la función de integración
      const mockIntegrateFn = vi.fn();
      
      // Renderizar el componente
      const { container } = render(
        <AgentSuggestionsViewer 
          visitId={mockVisitId}
          suggestions={mockSuggestions}
          onIntegrateSuggestions={mockIntegrateFn}
          userId={mockUserId}
          patientId={mockPatientId}
        />
      );
      
      // Expandir el panel
      fireEvent.click(screen.getByText('Ver sugerencias del agente'));
      
      // Aceptar todas las sugerencias usando eventos reales (no mocks)
      const acceptButtons = screen.getAllByText('Aceptar');
      for (const button of acceptButtons) {
        fireEvent.click(button);
      }
      
      // Verificar que aparece la opción para integrar
      expect(screen.getByText(/sugerencias aceptadas listas para integrar/)).toBeInTheDocument();
      
      // Presionar el botón de integrar
      fireEvent.click(screen.getByText('Integrar al EMR'));
      
      // Esperar a que se complete la integración
      await waitFor(() => {
        expect(screen.getByText(/sugerencias han sido integradas en el registro clínico/)).toBeInTheDocument();
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
  describe('Caso 4: Integración con EMR', () => {
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
        />
      );
      
      // Expandir el panel
      fireEvent.click(screen.getByText('Ver sugerencias del agente'));
      
      // Verificar que no aparece la opción para integrar
      expect(screen.queryByText(/sugerencias aceptadas listas para integrar/)).not.toBeInTheDocument();
      expect(screen.queryByText('Integrar al EMR')).not.toBeInTheDocument();
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
        />
      );
      
      // Expandir el panel
      fireEvent.click(screen.getByText('Ver sugerencias del agente'));
      
      // Aceptar dos sugerencias
      const acceptButtons = screen.getAllByText('Aceptar');
      fireEvent.click(acceptButtons[0]);
      fireEvent.click(acceptButtons[1]);
      
      // Verificar que aparece el botón de integrar
      const integrateButton = screen.getByText('Integrar al EMR');
      expect(integrateButton).toBeInTheDocument();
      
      // Presionar el botón de integrar
      fireEvent.click(integrateButton);
      
      // Esperar a que se complete la integración
      await waitFor(() => {
        expect(screen.getByText(/sugerencias han sido integradas/)).toBeInTheDocument();
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
        />
      );
      
      // Expandir el panel
      fireEvent.click(screen.getByText('Ver sugerencias del agente'));
      
      // Aceptar una sugerencia
      const acceptButtons = screen.getAllByText('Aceptar');
      fireEvent.click(acceptButtons[0]);
      
      // Verificar que aparece el botón de integrar
      const integrateButton = screen.getByText('Integrar al EMR');
      expect(integrateButton).toBeInTheDocument();
      
      // Presionar el botón de integrar
      fireEvent.click(integrateButton);
      
      // Esperar a que se complete la integración
      await waitFor(() => {
        expect(screen.getByText(/sugerencias han sido integradas/)).toBeInTheDocument();
      });
      
      // Verificar que se llamó a la función una vez
      expect(mockIntegrateFn).toHaveBeenCalledTimes(1);
      
      // Verificar que se muestra el mensaje de confirmación
      expect(screen.getByText(/sugerencias han sido integradas/)).toBeInTheDocument();
      
      // Verificar que ya no aparece el botón de integrar
      expect(screen.queryByText('Integrar al EMR')).not.toBeInTheDocument();
    });
  });
}); 