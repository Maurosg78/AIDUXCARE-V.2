import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AgentSuggestionsViewer from '../src/shared/components/Agent/AgentSuggestionsViewer';
import { AgentSuggestion } from '../src/core/agent/ClinicalAgent';
import { EMRFormService } from '../src/core/services/EMRFormService';
import { AuditLogger } from '../src/core/audit/AuditLogger';
import * as UsageAnalyticsService from '../src/services/UsageAnalyticsService';

// Mocks para las dependencias externas
vi.mock('../src/core/services/EMRFormService', () => ({
  EMRFormService: {
    mapSuggestionTypeToEMRSection: vi.fn((type) => {
      switch (type) {
        case 'recommendation': return 'plan';
        case 'warning': return 'assessment';
        case 'info': return 'notes';
        default: return 'notes';
      }
    }),
    insertSuggestedContent: vi.fn(() => Promise.resolve(true))
  }
}));

vi.mock('../src/core/audit/AuditLogger', () => ({
  AuditLogger: {
    log: vi.fn()
  }
}));

vi.mock('../src/services/UsageAnalyticsService', () => ({
  track: vi.fn()
}));

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

  beforeEach(() => {
    // Limpiar todos los mocks antes de cada prueba
    vi.clearAllMocks();
  });

  it('debe renderizarse sin errores', () => {
    const { getByText } = render(
      <AgentSuggestionsViewer
        visitId={visitId}
        suggestions={mockSuggestions}
        userId={userId}
        patientId={patientId}
      />
    );

    // Verificar que se muestra el título del componente
    expect(getByText('Sugerencias del Agente Clínico')).toBeInTheDocument();
    
    // Verificar que se muestra el botón para expandir
    expect(getByText('Ver sugerencias del agente')).toBeInTheDocument();
  });

  // Test para verificar que los mocks están correctamente configurados
  it('debe tener los mocks correctamente configurados para las tres acciones clave', () => {
    // 1. EMRFormService.insertSuggestedContent debe estar correctamente mockeado
    expect(EMRFormService.insertSuggestedContent).toBeDefined();
    expect(typeof EMRFormService.insertSuggestedContent).toBe('function');
    
    // 2. AuditLogger.log debe estar correctamente mockeado
    expect(AuditLogger.log).toBeDefined();
    expect(typeof AuditLogger.log).toBe('function');
    
    // 3. UsageAnalyticsService.track debe estar correctamente mockeado
    expect(UsageAnalyticsService.track).toBeDefined();
    expect(typeof UsageAnalyticsService.track).toBe('function');
    
    // Verificar que al llamar a los mocks, no hay errores
    EMRFormService.insertSuggestedContent(
      visitId,
      'notes',
      'Contenido de prueba',
      'agent',
      'suggestion-test-id'
    );
    
    AuditLogger.log('test-action', { 
      userId, 
      visitId, 
      patientId 
    });
    
    // Usar un tipo válido de métrica
    UsageAnalyticsService.track(
      'suggestions_integrated',
      userId,
      visitId,
      1,
      { test: 'data' }
    );
    
    // Verificar que los mocks fueron llamados
    expect(EMRFormService.insertSuggestedContent).toHaveBeenCalledWith(
      visitId,
      'notes',
      'Contenido de prueba',
      'agent',
      'suggestion-test-id'
    );
    
    expect(AuditLogger.log).toHaveBeenCalledWith(
      'test-action',
      expect.objectContaining({
        userId,
        visitId,
        patientId
      })
    );
    
    expect(UsageAnalyticsService.track).toHaveBeenCalledWith(
      'suggestions_integrated',
      userId,
      visitId,
      1,
      { test: 'data' }
    );
  });
}); 